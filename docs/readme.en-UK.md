# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)

A concise yet powerful Continuous Integration (CI) tool designed for [fount](https://github.com/steve02081504/fount) character developers to automate testing and ensure your character runs stably.

It helps you catch code-level errors such as syntax issues, API call failures, and tool execution exceptions. This guarantees the basic usability of your character before release, preventing low-level errors from impacting the user experience.

## ✨ Features

This CI tool focuses on testing the programmatic robustness of your character, covering the following areas:

- ✅ **Structured Testing**: Organise your test cases using Jest-like `test` and `subtest` blocks, making your test scripts clear and easy to read.
- ✅ **Assertion-Driven**: Verify test results with the `assert` function, which reports clear error messages upon failure.
- ✅ **AI Source & Fallback Testing**: Validate that the character handles requests correctly, both with and without a configured AI source.
- ✅ **Multi-step Interaction Simulation**: Accurately simulate the complete "think -> use tool -> respond" flow to test complex `replyHandler` logic.
- ✅ **Environment Interaction Testing**: Supports integration with Node.js modules like `fs` (file system) and `http` (network) to test real-world functionalities such as file I/O, code execution, and web browsing.
- ✅ **System Log Inspection**: Check system-level information returned to the AI after a tool is executed (e.g., file contents, search results) to ensure the tool's output is as expected.

> Considering the non-deterministic nature of LLM-generated content, this tool **cannot** evaluate the quality of prompts or AI-generated responses. Its core value lies in guaranteeing the correctness of the character's programmatic parts.

## 🚀 Quick Start

Set up automated testing for your fount character project in just three steps.

### Step 1: Create the Workflow File

In your character's project root, create the CI configuration file: `.github/workflows/CI.yml`.

### Step 2: Fill in the Template Content

Paste the following content into your `CI.yml` file. It will automatically run tests on every push.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # for update caches

on:
  # Allow manual triggering
  workflow_dispatch:
  # Trigger automatically on changes to .mjs files
  push:
    paths:
      - '**.mjs'
    # Ignore pushes to tags to avoid triggering on releases
    tags-ignore:
      - '*'
    # Allow pushes from any branch
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Specify the path to your CI test script
          CI-filepath: .github/workflows/CI.mjs
```

### Step 3: Create the CI Test Script

In your character's project root, create the CI entry point file: `.github/workflows/CI.mjs`. Here is a modern, basic test template:

```javascript
// fountCharCI is automatically injected into the global scope and can be used directly
const CI = fountCharCI;

// --- Test Case 1: Fallback handling without an AI source ---
await CI.test('Fallback without AI source', async () => {
	// Remove the AI source to test the fallback handler. We assume your char loads the AI source via the AIsource field in its data.
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput() without arguments simulates an empty or default request
	await CI.runOutput();
	// If no error is thrown, the test passes.
});

// --- Test Case 2: Basic AI Response ---
await CI.test('Basic AI Response', async () => {
	// Ensure an AI source is set. We assume your char loads the AI source via the AIsource field in its data.
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simulate the AI source returning "Test!"
	const result = await CI.runOutput('Test!');
	
	// Assert that the character's final output matches what the AI source returned
	CI.assert(result.content === 'Test!', 'Character failed to return the AI content correctly.');
});
```

Once you've completed these steps, the test workflow will run automatically every time you push changes to `.mjs` files to your GitHub repository.

## 📖 CI API Reference

`fount-charCI` provides a simple API for building your tests.

### `CI.test(name, asyncFn)`
Defines a top-level test suite. `name` is a description of the test, and `asyncFn` is an asynchronous function containing the test logic. Tests are executed sequentially.

### `CI.subtest(name, asyncFn)`
Defines a nested sub-test, used to break down a large test block into smaller, related units. Its usage is identical to `CI.test`.

### `CI.runOutput(input)`
This is the core function of the CI, used to simulate a complete user-AI interaction and return the final result.

- **`input` (String):** When `input` is a string, it simulates the AI directly returning that string as the final answer.
  ```javascript
  // Simulate the AI directly responding with "Hello"
  const result = await CI.runOutput('Hello');
  CI.assert(result.content === 'Hello');
  ```
- **`input` (Array):** When `input` is an array of strings, it simulates a multi-step interaction flow. Each element in the array represents a response from the AI. This is crucial for testing tool calls (`replyHandler`).
  ```javascript
  // Simulate the AI first calling a tool, then providing a final answer
  await CI.runOutput([
  	'<tool>do_something</tool>', // Step 1: AI returns a tool call
  	'I have done something.'      // Step 2: AI returns the final message
  ]);
  ```

### `CI.assert(condition, message)`
Performs an assertion. If `condition` is `false`, the test will fail immediately and throw an error with the given `message`.

### The `result` Object
`CI.runOutput` returns a `result` object, which contains the result from the character's `GetReply`. For a standard fount character, it includes the following properties:
- **`result.content` (String):** The final text content presented to the user.
- **`result.logContextBefore` (Array|Undefined):** An array of log messages recording the entire conversation history **before** the final `content` was generated. This includes messages with `system` (e.g., tool execution results), `user`, and `assistant` roles. It is very useful for inspecting tool outputs.

### `CI.char`
Allows you to easily access the character object itself.
```javascript
// Set or change the AI source
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});
```

## 💡 Advanced Usage

### Testing Function Tools (Tools / Reply Handler)

The key to testing function tools is to use the array form of `runOutput` to simulate the "tool call -> final reply" flow and to check for side effects and system logs.

**Example:** Test a `<run-bash>` function that creates a directory on the server.

```javascript
import fs from 'node:fs';
import path from 'node:path';

const CI = fountCharCI;
const testWorkspace = './ci-test-workspace';
fs.mkdirSync(testWorkspace, { recursive: true });
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

await CI.test('Function: <run-bash>', async () => {
	const testDir = path.join(testWorkspace, 'bash_test_dir');

	// Simulate the AI first calling <run-bash>, then giving a confirmation message
	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	// Assertion 1: Check for side effects -> Was the directory actually created?
	CI.assert(fs.existsSync(testDir), '<run-bash> failed to execute command.');

	// Assertion 2: Check the final output -> Did the AI regenerate the message?
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### Inspecting a Tool's System Output

Some functions (like file reading or web browsing) don't produce direct side effects but instead return their results to the AI as a `system` message. You can verify this by inspecting `result.logContextBefore`.

**Example:** Test a `<view-file>` function.

```javascript
import fs from 'node:fs';
import path from 'node:path';

const CI = fountCharCI;
const testWorkspace = './ci-test-workspace';
const testFilePath = path.join(testWorkspace, 'test_file.txt');
const fileContent = 'Hello from the file!';
fs.writeFileSync(testFilePath, fileContent, 'utf-8');
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

await CI.test('Function: <view-file>', async () => {
	const result = await CI.runOutput([
		`<view-file>${testFilePath}</view-file>`,
		`File content is: ${fileContent}`
	]);

	// Find the system log returned after the tool execution
	const systemLog = result.logContextBefore.find(log => log.role === 'system');

	// Assertion: Check if the system log contains the correct file content
	CI.assert(systemLog && systemLog.content.includes(fileContent), '<view-file> failed to read file content.');
});
```

### Debugging: Outputting Prompt Content

When debugging, you might want to see the full `prompt` structure sent to the AI. You can enable logging for this as follows:

```javascript
// Place this line at the top of your test script
CI.echo_prompt_struct = true;
// Subsequent CI.runOutput() calls will print the detailed prompt object in the GitHub Actions log
await CI.runOutput('Hello');
```
