# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./docs/readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./docs/readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./docs/readme.zh-CN.md)

A concise and powerful continuous integration tool designed specifically for [fount](https://github.com/steve02081504/fount) char developers to automate testing and ensure your chars run reliably.

It helps you catch code-level errors, such as syntax issues and failed API calls, ensuring your char's fundamental functionality before release and preventing low-level errors from impacting the user experience.

## ✨ Features

This CI tool focuses on testing the programmatic robustness of your char, primarily covering the following areas:

- ✅ **Basic Loading Test**: Ensures the char file has no significant syntax errors and can be correctly loaded by the fount core.
- ✅ **AI Source Integration Test**: Verifies that the char can handle chat requests correctly, both with and without an AI source configured.
- ✅ **Core Interface Test**: Ensures that fount core interfaces like `SetData` are called and responded to correctly by the char.
- ✅ **Reply Handler Behavior Test**: Tests whether your built-in `replyHandler` executes as expected by simulating specific commands returned by the AI.

> Due to the non-deterministic nature of LLM-generated content, this tool **cannot** evaluate the quality of your prompt or the AI's generated content. Its core value lies in ensuring the correctness of the char's programmatic parts.

## 🚀 Quick Start

Set up automated testing for your fount char project in just three simple steps.

### Step 1: Create the Workflow File

In the root directory of your char project, create the CI configuration file: `.github/workflows/CI.yml`.

### Step 2: Fill in the Template Content

Paste the following content into your `CI.yml` file. It will automatically run the tests when you push code.

```yaml
name: Test Running

on:
  # Allow manual triggers
  workflow_dispatch:
  # Trigger automatically on changes to .mjs files
  push:
    paths:
      - '**.mjs'
    # Ignore tag pushes to avoid triggering on releases
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

In your project root, create the CI entry file `.github/workflows/CI.mjs` and write your test cases based on your char's logic.

Here is a basic test template:

```javascript
// fountCharCI is automatically injected into the global scope and can be used directly.
const CI = fountCharCI;

// --- Test Case 1: No AI Source ---
// Simulate a scenario without a configured AI source to check if the char responds correctly.
// This is useful for testing the char's default behavior or built-in commands.
await CI.runOutput();

// --- Test Case 2: Basic AI Conversation ---
// 1. Configure a mock AI source named 'CI'.
//    We assume your char uses the data.AIsource field to load the AI source.
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});

// 2. Simulate the AI source returning "Test!"
await CI.runOutput('Test!').then((result) => {
	// 3. Assert that the char's final output matches the AI's response.
	CI.assert(result.content === 'Test!', 'Char failed to return content correctly with an AI source');
});

console.log('✅ All basic tests passed!');
```

After completing these steps, the test workflow will run automatically every time you push changes to `.mjs` files to your GitHub repository.

## 💡 Advanced Usage

### Testing the Reply Handler

`replyHandler` is one of the core features of a fount char. You can test if it correctly parses and executes commands by using `runOutput` to simulate an AI response containing special instructions.

**Example:** Test a `<run>` command that creates a directory on the server.

```javascript
import fs from 'node:fs';

// runOutput accepts an array to simulate scenarios where the AI source is called multiple times.
// The first call returns a <run> command, and the second returns plain text.
await CI.runOutput([
	// First AI response, containing a shell command to execute.
	`<run>\nmkdir test_dir\n</run>\nThis is a supplementary note after the command execution.`,
	// Second AI response.
	`The directory has been created.`
]).then((result) => {
	// Assertion 1: Check if the 'test_dir' directory was actually created.
	CI.assert(fs.existsSync('test_dir'), 'replyHandler failed to execute the <run> command to create the directory');
	
	// Assertion 2: Check if the char requested the second AI call and returned the final content.
	CI.assert(result.content === 'The directory has been created.', 'replyHandler did not request the AI source again as expected after execution');
});

console.log('✅ Reply handler test passed!');
```

### Debugging: Outputting Prompt Content

When debugging, you might want to see the complete `prompt` structure sent to the AI. You can enable logging for this as follows:

```javascript
// Place this line at the top of your test script.
CI.echo_prompt_struct = true;

// Subsequent calls to CI.runOutput() will print the detailed prompt object in the logs.
await CI.runOutput('Hello');
```
