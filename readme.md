# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./docs/readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./docs/readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./docs/readme.zh-CN.md)

A concise yet powerful Continuous Integration (CI) tool, designed specifically for [fount](https://github.com/steve02081504/fount) role developers to automate testing and ensure your roles run stably.

It helps you catch code-level errors such as syntax issues, failed API calls, and exceptions in tool functions, thereby guaranteeing the basic usability of your role before release and preventing trivial mistakes from affecting the user experience.

## ✨ Features

This CI tool focuses on testing the programmatic robustness of your role, primarily covering the following areas:

- ✅ **Structured Testing**: Organise your test cases using Jest-like `test` blocks, with support for any level of nesting, making your test scripts clear and easy to read.
- ✅ **Concurrent & Sequential Testing**: Support for running tests in parallel to increase speed, or ensuring sequential execution with `await`.
- ✅ **Test Hooks**: Provides `beforeAll`, `afterAll`, `beforeEach`, and `afterEach` hook functions for setting up and tearing down the environment at different stages of the test lifecycle.
- ✅ **Isolated Test Environments**: Each test has its own independent, automatically cleaned-up workspace (for file operations) and HTTP router, preventing interference between tests.
- ✅ **Assertion-Driven**: Verify test results with the `assert` function, which reports clear error messages upon failure.
- ✅ **Multi-step Interaction Simulation**: Precisely simulate the complete "think -> use tool -> respond" flow of the AI, testing complex `replyHandler` logic.
- ✅ **System Log & Prompt Inspection**: Capable of inspecting system-level information returned to the AI after tool execution, and even retrieving the final prompt sent to the AI, ensuring logic and data processing are as expected.
- ✅ **Detailed Test Reports**: Automatically generates beautiful, interactive test summary reports in GitHub Actions, including the duration, logs, and error details for each test.

> Given the non-deterministic nature of LLM-generated content, this tool **cannot** evaluate the quality of a prompt or the merit of AI-generated content. Its core value lies in guaranteeing the correctness of the role's programmatic parts.

## 🚀 Quick Start

Set up automated testing for your fount role project in just three steps.

### Step 1: Create the Workflow File

In the root directory of your role project, create the CI configuration file: `.github/workflows/CI.yml`.

### Step 2: Populate with the Template

Paste the following content into the `CI.yml` file. It will automatically run tests upon code pushes.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Required for updating cache

on:
  # Allow manual triggering
  workflow_dispatch:
  # Trigger automatically when .mjs files are changed
  push:
    paths:
      - '**.mjs'
    # Ignore tag pushes to avoid triggering on version releases
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
          # (Optional) Specify a username for the CI, defaults to "CI-user"
          # CI-username: my-ci-user
```

### Step 3: Create the CI Test Script

In the root directory of your role project, create the CI entry file: `.github/workflows/CI.mjs`. Below is a modern, basic test template:

```javascript
// fountCharCI is automatically injected into the global scope and can be used directly
const CI = fountCharCI;

// --- Test Case 1: Fallback handling without an AI source ---
await CI.test('noAI Fallback', async () => {
	// Remove the AI source to test the fallback handler
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput without arguments simulates an empty or default request
	await CI.runOutput();
	// If no error is thrown, the test passes
});

// --- Test Case 2: Basic AI conversation ---
await CI.test('Basic AI Response', async () => {
	// Ensure an AI source is set
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Simulate user input "Hello" and check the final content returned by the role
	const { reply } = await CI.runInput('Hello');

	// Assert that the role's final output matches what the AI source returned
	// The CI mock AI source defaults to returning "If I never see you again, good morning, good afternoon, and good night."
	CI.assert(reply.content.includes('good morning'), 'Character failed to return the AI content correctly.');
});
```

Once these steps are complete, the test workflow will run automatically every time you push an update to an `.mjs` file in your GitHub repository.

## 📖 CI API Reference

`fount-charCI` provides a concise yet powerful API for building your tests.

### Defining Tests

#### `CI.test(name, asyncFn, options)`

Defines a test block. It can be a top-level test or nested within other `test` blocks to form sub-tests.

- `name` (String): A description of the test.
- `asyncFn` (Function): An asynchronous function containing the test logic.
- `options` (Object, Optional): Configuration options for the test's behaviour.
  - `start_emoji` (String): Emoji displayed when the test starts. Defaults to `🧪`.
  - `success_emoji` (String): Emoji displayed when the test succeeds. Defaults to `✅`.
  - `fail_emoji` (String): Emoji displayed when the test fails. Defaults to `❌`.

#### Concurrent & Sequential Testing

`CI.test` returns a Promise-like object, which makes controlling the execution flow very simple.

- **Sequential Execution**: Use `await` when calling `CI.test` if you want tests to run one after another in order.
- **Concurrent Execution**: You can call multiple independent tests without `await` to have them run in parallel.

### Test Hooks

These functions allow you to execute code at different points in the test lifecycle, ideal for setting up and tearing down shared test environments.

- `CI.beforeAll(asyncFn)`: Runs once before all tests in the current scope (within a `test` block).
- `CI.afterAll(asyncFn)`: Runs once after all tests in the current scope have finished.
- `CI.beforeEach(asyncFn)`: Runs before each test in the current scope.
- `CI.afterEach(asyncFn)`: Runs after each test in the current scope has finished.

```javascript
// Example: Using hooks and context data to manage a mock database
CI.test('Tests with a shared database', async () => {
	CI.beforeAll(() => {
		console.log('Initialising mock database...');
		// Use the context.data object to store shared resources within the scope
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Database tests complete. Final visits: ${finalCount}`);
	});

	CI.test('User visit increments counter', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Visits should be greater than 0');
	});
});
```

### Test Context

#### `CI.context`

A magical object that provides access to the isolated environment of the **current test**.

- `CI.context.workSpace`:
  - `path` (String): The absolute path to the current test's unique working directory.
- `CI.context.http`:
  - `router` (Express Router): An Express router instance exclusive to this test.
  - `url` (String): The full URL to access this test's dedicated router.
- `CI.context.data` (Object): An empty object used to pass data between a test's hooks and its body.

### Simulating Interaction

#### `CI.runInput(input, request)`

Simulates a **user sending a message** to the role.

- `input` (String | Object): The user's input.
- `request` (Object, Optional): A partial request object to override default request parameters.
- **Returns** (Object): An object containing detailed debugging information:
  - `reply` (Object): The final result returned by the role's `GetReply`.
  - `prompt_struct` (Object): The structured prompt sent to the AI.
  - `prompt_single` (String): The prompt sent to the AI, converted into a single string.

#### `CI.runOutput(output, request)`

Simulates the **AI's output** to test the role's `replyHandler`.

- `output` (String | Array | Function): The simulated content returned by the AI.
  - **String**: Simulates the AI returning this string directly.
  - **Array**: Simulates a multi-step interaction. Each element in the array, which can be a string or a function, is used sequentially as the AI's return value.
  - **Function**: Dynamically generates the AI's output.
    - **Async**: The function can be `async`.
    - **Parameters**: The function receives a `result` object containing `prompt_single` and `prompt_struct` as its argument.
    - **Return Value**: The function's return value becomes the AI's **next** output in the sequence.
    - **Use Case**: This is extremely useful for making assertions or executing complex logic in the middle of a multi-step interaction.

- `request` (Object, Optional): Same as `CI.runInput`.
- **Returns** (Object): The final result from the role's `GetReply`.

#### The `result` Object

The return value of interaction functions (or their `reply` property) originates from the role's `GetReply` return value and typically includes:

- **`content`** (String): The final text content presented to the user.
- **`logContextBefore`** (Array|Undefined): An array of message logs recording all history before the final `content` was generated, including messages with the `tool` role (tool execution results), `user` role, and `char` role.

### Utility Tools

- `CI.assert(condition, message)`: Performs an assertion.
- `CI.char`: A shortcut to access the currently loaded role instance object.
- `CI.sleep(ms)`: Pauses execution for the specified number of milliseconds.
- `CI.wait(fn, timeout)`: Polls the `fn` function until it returns a truthy value or times out.

## 💡 Advanced Usage

### Testing File Operation Functions

You can safely test functions that read and write files using `CI.context.workSpace`.

**Example:** Testing the `<run-bash>` function.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <run-bash>', async () => {
	// Use the isolated workspace path
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> failed to create directory.');
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### Testing Web Browsing (with intermediate step assertions)

You can construct complex network interaction tests using `CI.context.http` and the function argument of `runOutput`.

**Example:** Testing the `<web-browse>` function and validating its prompt content.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>This is a test paragraph.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. The AI decides to browse the page
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Use a function to validate the intermediate step and provide the AI's next reply
		async (midResult) => {
			// Assertion: Check if the prompt sent to the AI includes the web page content
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('This is a test paragraph'), 'Web content was not in prompt.');

			// Return the AI's final reply
			return 'The paragraph says: This is a test paragraph.';
		}
	]);

	// Assertion: Check if the final content given to the user is correct
	CI.assert(result.content.includes('The paragraph says'), 'Final reply is incorrect.');
});
```

## Still feeling lost?

Take a look at how the world's first fount role, [`Gentian`, does it](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)!
