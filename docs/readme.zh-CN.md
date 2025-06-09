# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)

一个简洁而强大的持续集成（CI）工具，专为 [fount](https://github.com/steve02081504/fount) 角色开发者设计，用于自动化测试，确保你的角色能够稳定运行。

它能帮助你捕捉到代码层面的错误，如语法问题、接口调用失败、功能函数（tools）执行异常等，从而在发布前保证角色的基本可用性，避免低级错误影响用户体验。

## ✨ 功能特性

本 CI 工具专注于测试角色的程序健壮性，主要覆盖以下范围：

- ✅ **结构化测试**：使用类似 Jest 的 `test` 和 `subtest` 块来组织你的测试用例，使测试脚本清晰易读。
- ✅ **并发与顺序测试**：支持按需并行执行测试以提高速度，或通过 `await` 保证测试按顺序执行。
- ✅ **断言驱动**：通过 `assert` 函数验证测试结果，失败时会明确报告错误信息。
- ✅ **AI 源与Fallback测试**：验证角色在有或没有配置 AI 源的情况下，都能正常处理请求。
- ✅ **多步交互模拟**：精准模拟 AI “思考 -> 使用工具 -> 回答” 的完整流程，测试复杂的 `replyHandler` 逻辑。
- ✅ **环境交互测试**：支持与文件系统（`fs`）、网络（`http`）等 Node.js 模块集成，测试如文件读写、代码执行、网页浏览等真实世界的功能。
- ✅ **系统日志与Prompt审查**：能够检查工具执行后返回给 AI 的系统级信息，甚至能获取发送给 AI 的最终 Prompt，确保逻辑和数据处理符合预期。

> 考虑到LLM生成内容的不确定性，本工具**无法**对 Prompt 的质量或 AI 生成内容的优劣进行评估。它的核心价值在于保障角色的程序部分的正确性。

## 🚀 快速上手

只需三步，即可为你的 fount 角色项目配置好自动化测试。

### 第 1 步：创建 Workflow 文件

在你的角色项目根目录下，创建 CI 配置文件：`.github/workflows/CI.yml`。

### 第 2 步：填入模板内容

将以下内容粘贴到 `CI.yml` 文件中。它会在代码推送时自动运行测试。

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # 用于更新缓存

on:
  # 允许手动触发
  workflow_dispatch:
  # 当 .mjs 文件发生变更时自动触发
  push:
    paths:
      - '**.mjs'
    # 忽略 tags 推送，避免发布版本时触发
    tags-ignore:
      - '*'
    # 允许从任何分支推送
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # 指定 CI 测试脚本的路径
          CI-filepath: .github/workflows/CI.mjs
```

### 第 3 步：创建 CI 测试脚本

在你的角色项目根目录下，创建 CI 的入口文件 `.github/workflows/CI.mjs`。以下是一个现代化的基础测试模板：

```javascript
// fountCharCI 会被自动注入到全局，可以直接使用
const CI = fountCharCI;

// --- 测试用例 1: 无 AI 源的后备处理 ---
await CI.test('Fallback without AI source', async () => {
	// 移除 AI 源来测试后备处理器，我们假设你的char通过data的AIsource字段加载AI源
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput 不带参数，模拟一个空的或默认的请求
	await CI.runOutput();
	// 如果没有抛出错误，则测试通过
});

// --- 测试用例 2: 基础 AI 对话 ---
await CI.test('Basic AI Response', async () => {
	// 确保 AI 源已设置，我们假设你的char通过data的AIsource字段加载AI源
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// 模拟用户输入 "你好"，并检查角色返回的最终内容
	const { reply } = await CI.runInput('你好');

	// 断言角色的最终输出是否与 AI 源返回的一致
	// CI 模拟 AI 源默认会返回 "If I never see you again, good morning, good afternoon, and good night."
	CI.assert(reply.content.includes('good morning'), 'Character failed to return the AI content correctly.');
});
```

完成以上步骤后，每次当你推送 `.mjs` 文件更新到 GitHub 仓库时，测试流程就会自动运行。

## 📖 CI API 详解

`fount-charCI` 提供了一套简洁而强大的 API 来构建你的测试。

### 测试套件 (Test Suites)

#### `CI.test(name, asyncFn, options)`

定义一个顶层测试套件。

- `name` (String): 测试的描述。
- `asyncFn` (Function): 包含测试逻辑的异步函数。
- `options` (Object, 可选): 测试行为的配置项。
  - `start_emoji` (String): 测试开始时显示的表情符号，默认为 `🧪`。
  - `success_emoji` (String): 测试成功时显示的表情符号，默认为 `✅`。
  - `fail_emoji` (String): 测试失败时显示的表情符号，默认为 `❌`。
  - `clean_chat_log` (Boolean): 是否在测试开始前清空上下文的聊天记录，默认为 `true`。
  - `group_output` (Boolean): 是否在 GitHub Actions 日志中将此测试的输出折叠成分组，默认为 `true`。

#### `CI.subtest(name, asyncFn, options)`

定义一个嵌套的子测试。它在功能上与 `CI.test` 完全相同，但 `group_output` 默认为 `false`，避免github actions日志不支持group嵌套导致的UI混乱。

#### 并发与顺序测试

`CI.test` 和 `CI.subtest` 都是异步的，并返回一个 Promise。

- **顺序执行**：如果你希望测试按顺序一个个执行，请在调用时使用 `await`。这是保证测试之间依赖关系（如前一个测试设置环境，后一个测试使用）的常用方式。

  ```javascript
  await CI.test('第一步：设置环境', async () => { /* ... */ });
  await CI.test('第二步：验证结果', async () => { /* ... */ });
  ```

- **并发执行**：如果你有多个独立的测试，可以不使用 `await` 来调用它们，使其并发执行以缩短总测试时间。CI 运行器会自动等待所有被调用的测试完成后再结束。

  ```javascript
  // 这两个测试会同时开始执行
  CI.test('独立测试 A', async () => { /* ... */ });
  CI.test('独立测试 B', async () => { /* ... */ });
  ```

### 模拟交互 (Simulating Interaction)

#### `CI.runInput(input, request)`

模拟**用户发送一条消息**给角色。这是测试角色对输入响应的最直接方式。

- `input` (String | Object): 用户输入。
  - 如果是字符串，则模拟用户发送纯文本消息。
  - 如果是对象，则可以构建更复杂的消息，如 `{ role: 'user', content: 'hello', files: [] }`。
- `request` (Object, 可选): 一个部分请求对象，用于覆盖默认的请求参数（如 `username`, `chat_id` 等）。
- **返回值** (Object): 返回一个包含详细调试信息的对象：
  - `reply` (Object): 角色 `GetReply` 返回的最终结果，与 `CI.runOutput` 的返回值相同。
  - `prompt_struct` (Object): 发送给 AI 的结构化 Prompt。对于调试 Prompt Engineering 至关重要。
  - `prompt_single` (String): 发送给 AI 的、被转换成单个字符串的 Prompt。

#### `CI.runOutput(output, request)`

模拟 **AI 的输出**。此函数非常适合测试角色的 `replyHandler`，即处理 AI 返回的工具调用或特殊指令的逻辑。

- `output` (String | Array<String>): 模拟 AI 的返回内容。
  - 如果是字符串，模拟 AI 直接返回该字符串作为最终答案。
  - 如果是字符串数组，模拟多步骤交互。数组的第一个元素是 AI 的第一次返回（通常是工具调用），第二个元素是第二次，以此类推。
- `request` (Object, 可选): 同 `CI.runInput`。
- **返回值** (Object): 返回角色 `GetReply` 的最终结果，通常包含 `content` 和 `logContextBefore` 等属性。

#### `result` 对象

`CI.runInput` 和 `CI.runOutput` 的返回结果（或 `reply` 属性）源自角色 `GetReply` 的返回值。对于一个标准的 fount 角色，它通常包含：

- **`content`** (String): 最终呈现给用户的文本内容。
- **`logContextBefore`** (Array|Undefined): 一个消息日志数组，记录了在生成最终 `content` **之前**的所有对话历史，包括 `system` 角色（如工具执行结果）、`user` 角色和 `assistant` 角色的消息。这对于检查工具的输出非常有用。

### 辅助工具 (Utility Tools)

#### `CI.assert(condition, message)`

进行断言。如果 `condition` 为 `false`，测试将立即失败，并抛出包含 `message` 的错误。

#### `CI.char`

一个快捷方式，允许你直接访问当前加载的角色实例对象。你可以用它来调用角色的内部方法或修改其配置。

```javascript
// 设置或更改 AI 源
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
```

#### `CI.clearChatLog()`

清空当前测试上下文中的聊天记录 (`test_chat_log`)。

#### `CI.sleep(ms)`

暂停当前异步函数的执行指定的毫秒数。等同于 `new Promise(resolve => setTimeout(resolve, ms))`。

#### `CI.wait(fn, timeout)`

一个轮询工具，会反复执行 `fn` 函数，直到它返回一个真值（truthy value）或超时（默认为10000ms）。这对于等待某些异步的后台操作完成非常有用。

## 💡 进阶用法

### 测试功能函数 (Tools / Reply Handler)

测试功能函数的关键是使用 `runOutput` 的数组形式来模拟“工具调用 -> 最终回复”的流程，并检查其副作用和系统日志。

**示例：** 测试一个 `<run-bash>` 功能，它可以在服务器上创建一个目录。

```javascript
import fs from 'node:fs';
import path from 'node:path';

const CI = fountCharCI;
const testWorkspace = './ci-test-workspace';
fs.mkdirSync(testWorkspace, { recursive: true });
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

CI.test('Function: <run-bash>', async () => {
	const testDir = path.join(testWorkspace, 'bash_test_dir');

	// 模拟 AI 先调用 <run-bash>，然后给出确认信息
	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	// 断言 1: 检查副作用 -> 目录是否真的被创建了？
	CI.assert(fs.existsSync(testDir), '<run-bash> failed to execute command.');

	// 断言 2: 检查最终输出 -> AI是否重新生成信息？
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### 检查工具的系统输出

有些功能（如文件读取、网页浏览）不会直接产生副作用，而是将结果作为 `system` 消息返回给 AI。你可以通过检查 `result.logContextBefore` 来验证这一点。

**示例：** 测试 `<view-file>` 功能。

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

	// 找到工具执行后返回的 system 日志
	const systemLog = result.logContextBefore.find(log => log.role === 'system');

	// 断言: 检查 system 日志是否包含了正确的文件内容
	CI.assert(systemLog && systemLog.content.includes(fileContent), '<view-file> failed to read file content.');
});
```

## 仍然感到迷茫？

来看看世界上第一个fount角色[`龙胆`是怎么做的](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)！
