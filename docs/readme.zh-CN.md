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
- ✅ **断言驱动**：通过 `assert` 函数验证测试结果，失败时会明确报告错误信息。
- ✅ **AI 源与Fallback测试**：验证角色在有或没有配置 AI 源的情况下，都能正常处理请求。
- ✅ **多步交互模拟**：精准模拟 AI “思考 -> 使用工具 -> 回答” 的完整流程，测试复杂的 `replyHandler` 逻辑。
- ✅ **环境交互测试**：支持与文件系统（`fs`）、网络（`http`）等 Node.js 模块集成，测试如文件读写、代码执行、网页浏览等真实世界的功能。
- ✅ **系统日志审查**：能够检查工具执行后返回给 AI 的系统级信息（如文件内容、搜索结果），确保工具的输出符合预期。

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

	// 模拟 AI 源返回 "测试！"
	const result = await CI.runOutput('测试！');
	
	// 断言角色的最终输出是否与 AI 源返回的一致
	CI.assert(result.content === '测试！', 'Character failed to return the AI content correctly.');
});
```

完成以上步骤后，每次当你推送 `.mjs` 文件更新到 GitHub 仓库时，测试流程就会自动运行。

## 📖 CI API 详解

`fount-charCI` 提供了一套简洁的 API 来构建测试。

### `CI.test(name, asyncFn)`
定义一个顶层测试套件。`name` 是测试的描述，`asyncFn` 是包含测试逻辑的异步函数。测试会按顺序执行。

### `CI.subtest(name, asyncFn)`
定义一个嵌套的子测试，用于将一个大测试块分解为更小的、相关的单元。用法与 `CI.test` 相同。

### `CI.runOutput(input)`
这是 CI 的核心函数，用于模拟一次完整的用户-AI交互，并返回最终结果。

- **`input` (String):** 当 `input` 是一个字符串时，它模拟 AI 直接返回该字符串作为最终答案。
  ```javascript
  // 模拟 AI 直接回答 "Hello"
  const result = await CI.runOutput('Hello');
  CI.assert(result.content === 'Hello');
  ```
- **`input` (Array):** 当 `input` 是一个字符串数组时，它模拟一个多步骤的交互流程。数组中的每个元素代表 AI 的一次返回。这对于测试工具（`replyHandler`）调用至关重要。
  ```javascript
  // 模拟 AI 先调用工具，然后给出最终回答
  await CI.runOutput([
  	'<tool>do_something</tool>', // 第1步：AI 返回工具调用
  	'I have done something.'      // 第2步：AI 返回最终消息
  ]);
  ```

### `CI.assert(condition, message)`
进行断言。如果 `condition` 为 `false`，测试将立即失败，并抛出包含 `message` 的错误。

### `result` 对象
`CI.runOutput` 返回一个 `result` 对象，包含char的GetReply返回的结果。
对于标准的fount角色，它包含以下属性：
- **`result.content` (String):** 最终呈现给用户的文本内容。
- **`result.logContextBefore` (Array|Undefined):** 一个消息日志数组，记录了在生成最终 `content` **之前**的所有对话历史，包括 `system` 角色（如工具执行结果）、`user` 角色和 `assistant` 角色的消息。这对于检查工具的输出非常有用。

### `CI.char`
允许你轻松访问角色对象本身。
```javascript
// 设置或更改 AI 源
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});
```

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

await CI.test('Function: <run-bash>', async () => {
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

await CI.test('Function: <view-file>', async () => {
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

### 调试：输出 Prompt 内容

在调试时，你可能希望看到发送给 AI 的完整 `prompt` 结构。可以通过以下方式开启日志输出：

```javascript
// 将此行代码放在你的测试脚本顶部
CI.echo_prompt_struct = true;
// 后续的 CI.runOutput() 调用将在 GitHub Actions 日志中打印详细的 prompt 对象
await CI.runOutput('Hello');
```
