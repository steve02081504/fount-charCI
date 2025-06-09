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
- ✅ **Concurrent & Sequential Testing**: Run tests in parallel to increase speed or use `await` to enforce sequential execution for dependent tests.
- ✅ **Assertion-Driven**: Verify test results with the `assert` function, which reports clear error messages upon failure.
- ✅ **AI Source & Fallback Testing**: Validate that the character handles requests correctly, both with and without a configured AI source.
- ✅ **Multi-step Interaction Simulation**: Accurately simulate the complete "think -> use tool -> respond" flow to test complex `replyHandler` logic.
- ✅ **Environment Interaction Testing**: Supports integration with Node.js modules like `fs` (file system) and `http` (network) to test real-world functionalities such as file I/O, code execution, and web browsing.
- ✅ **System Log & Prompt Inspection**: Check system-level information returned to the AI after a tool is executed and even inspect the final prompt sent to the AI, ensuring logic and data processing are correct.

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

	// Simulate a user sending "Hello" and check the character's final reply.
	const { reply } = await CI.runInput('Hello');

	// Assert that the character's final output matches what the AI source returned.
	// The mock AI source in CI defaults to returning "If I never see you again, good morning, good afternoon, and good night."
	CI.assert(reply.content.includes('good morning'), 'Character failed to return the AI content correctly.');
});
```

Once you've completed these steps, the test workflow will run automatically every time you push changes to `.mjs` files to your GitHub repository.

## 📖 CI API Reference

`fount-charCI` provides a simple yet powerful API for building your tests.

### Test Suites

#### `CI.test(name, asyncFn, options)`

Defines a top-level test suite.

- `name` (String): A description of the test.
- `asyncFn` (Function): An asynchronous function containing the test logic.
- `options` (Object, optional): Configuration for the test's behavior.
  - `start_emoji` (String): Emoji displayed at the start of the test. Default: `🧪`.
  - `success_emoji` (String): Emoji displayed on success. Default: `✅`.
  - `fail_emoji` (String): Emoji displayed on failure. Default: `❌`.
  - `clean_chat_log` (Boolean): Clears the context's chat log before the test runs. Default: `true`.
  - `group_output` (Boolean): Collapses the test's output into a group in GitHub Actions logs. Default: `true`.

#### `CI.subtest(name, asyncFn, options)`

Defines a nested sub-test. It is functionally identical to `CI.test`, but `group_output` defaults to `false` to avoid UI clutter from nested groups in GitHub Actions logs.

#### Concurrent & Sequential Testing

`CI.test` and `CI.subtest` are asynchronous and return a Promise.

- **Sequential Execution**: Use `await` when calling a test to ensure it completes before the next one starts. This is essential for tests that have dependencies on each other.

  ```javascript
  await CI.test('Step 1: Set up environment', async () => { /* ... */ });
  await CI.test('Step 2: Validate results', async () => { /* ... */ });
  ```

- **Concurrent Execution**: If you have multiple independent tests, you can call them without `await` to run them concurrently, which can reduce the total test time. The CI runner will automatically wait for all invoked tests to complete before exiting.

  ```javascript
  // These two tests will start at the same time
  CI.test('Independent Test A', async () => { /* ... */ });
  CI.test('Independent Test B', async () => { /* ... */ });
  ```

### Simulating Interaction

#### `CI.runInput(input, request)`

Simulates a **user sending a message** to the character. This is the most direct way to test a character's response to input.

- `input` (String | Object): The user input.
  - If a string, it simulates a plain text message from the user.
  - If an object, you can construct a more complex message, e.g., `{ role: 'user', content: 'hello', files: [] }`.
- `request` (Object, optional): A partial request object to override default parameters (like `username`, `chat_id`, etc.).
- **Returns** (Object): An object containing detailed debug information:
  - `reply` (Object): The final result object returned by the character's `GetReply`, which is the same as the return value of `CI.runOutput`.
  - `prompt_struct` (Object): The structured prompt sent to the AI. Crucial for debugging prompt engineering.
  - `prompt_single` (String): The single-string version of the prompt sent to the AI.

#### `CI.runOutput(output, request)`

Simulates the **AI's output**. This function is ideal for testing the character's `replyHandler`—the logic that processes tool calls or special instructions from the AI.

- `output` (String | Array<String>): The simulated AI response.
  - If a string, it simulates the AI directly returning that string as the final answer.
  - If an array of strings, it simulates a multi-step interaction. The first element is the AI's first response (often a tool call), the second is its next response, and so on.
- `request` (Object, optional): Same as in `CI.runInput`.
- **Returns** (Object): The final result from the character's `GetReply`, typically including properties like `content` and `logContextBefore`.

#### The `result` Object

The return value from `CI.runOutput` (or the `reply` property from `CI.runInput`) originates from the character's `GetReply`. For a standard fount character, it usually includes:

- **`content`** (String): The final text content presented to the user.
- **`logContextBefore`** (Array|Undefined): An array of log messages recording the entire conversation history **before** the final `content` was generated. This includes messages with `system` (e.g., tool execution results), `user`, and `assistant` roles. It is very useful for inspecting tool outputs.

### Utility Tools

#### `CI.assert(condition, message)`

Performs an assertion. If `condition` is `false`, the test will fail immediately and throw an error with the given `message`.

#### `CI.char`

A shortcut that gives you direct access to the currently loaded character instance object. You can use it to call the character's internal methods or modify its configuration.

```javascript
// Set or change the AI source
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
```

#### `CI.clearChatLog()`

Clears the chat history (`test_chat_log`) in the current test context.

#### `CI.sleep(ms)`

Pauses the execution of the current async function for the specified number of milliseconds. Equivalent to `new Promise(resolve => setTimeout(resolve, ms))`.

#### `CI.wait(fn, timeout)`

A polling utility that repeatedly executes the `fn` function until it returns a truthy value or a timeout (default: 10000ms) is reached. Useful for waiting for asynchronous background operations to complete.

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

CI.test('Function: <run-bash>', async () => {
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

CI.test('Function: <view-file>', async () => {
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

## Still confused?

Check out how the world's first fount character, [`GentianAphrodite`, does it](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)!
