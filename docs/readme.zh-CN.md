# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (US)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-States.png)](../readme.md)
[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)
[![Deutsch](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Germany.png)](./readme.de-DE.md)
[![Español](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Spain.png)](./readme.es-ES.md)
[![Français](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/France.png)](./readme.fr-FR.md)
[![हिन्दी](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/India.png)](./readme.hi-IN.md)
[![Italiano](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Italy.png)](./readme.it-IT.md)
[![한국어](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/South-Korea.png)](./readme.ko-KR.md)
[![Português (Brasil)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Brazil.png)](./readme.pt-BR.md)
[![Русский](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Russia.png)](./readme.ru-RU.md)
[![Tiếng Việt](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Vietnam.png)](./readme.vi-VN.md)

一个简洁而强大的持续集成（CI）工具，专为 [fount](https://github.com/steve02081504/fount) 角色开发者设计，用于自动化测试，确保你的角色能够稳定运行。

它能帮助你捕捉到代码层面的错误，如语法问题、接口调用失败、功能函数（tools）执行异常等，从而在发布前保证角色的基本可用性，避免低级错误影响用户体验。

## ✨ 功能特性

本 CI 工具专注于测试角色的程序健壮性，主要覆盖以下范围：

- ✅ **结构化测试**：使用类似 Jest 的 `test` 块来组织你的测试用例，支持任意层级的嵌套，使测试脚本清晰易读。
- ✅ **并发与顺序测试**：支持按需并行执行测试以提高速度，或通过 `await` 保证测试按顺序执行。
- ✅ **测试钩子 (Hooks)**：提供 `beforeAll`, `afterAll`, `beforeEach`, `afterEach` 等钩子函数，用于在测试的不同生命周期阶段设置和清理环境。
- ✅ **隔离的测试环境**：每个测试都拥有独立的、自动清理的工作区（用于文件操作）和HTTP路由，杜绝了测试间的相互干扰。
- ✅ **断言驱动**：通过 `assert` 函数验证测试结果，失败时会明确报告错误信息。
- ✅ **多步交互模拟**：精准模拟 AI “思考 -> 使用工具 -> 回答” 的完整流程，测试复杂的 `replyHandler` 逻辑。
- ✅ **系统日志与Prompt审查**：能够检查工具执行后返回给 AI 的系统级信息，甚至能获取发送给 AI 的最终 Prompt，确保逻辑和数据处理符合预期。
- ✅ **详细的测试报告**：在 GitHub Actions 中自动生成美观、可交互的测试总结报告，包含每个测试的耗时、日志和错误详情。

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
          # (可选) 指定一个CI专用的用户名，默认为 "CI-user"
          # CI-username: my-ci-user
```

### 第 3 步：创建 CI 测试脚本

在你的角色项目根目录下，创建 CI 的入口文件 `.github/workflows/CI.mjs`。以下是一个现代化的基础测试模板：

```javascript
// fountCharCI 会被自动注入到全局，可以直接使用
const CI = fountCharCI;

// --- 测试用例 1: 无 AI 源的后备处理 ---
await CI.test('noAI Fallback', async () => {
	// 移除 AI 源来测试后备处理器
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput 不带参数，模拟一个空的或默认的请求
	await CI.runOutput();
	// 如果没有抛出错误，则测试通过
});

// --- 测试用例 2: 基础 AI 对话 ---
await CI.test('Basic AI Response', async () => {
	// 确保 AI 源已设置
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

### 测试定义 (Defining Tests)

#### `CI.test(name, asyncFn, options)`

定义一个测试块。它可以是顶层测试，也可以嵌套在其他 `test` 块中形成子测试。

- `name` (String): 测试的描述。
- `asyncFn` (Function): 包含测试逻辑的异步函数。
- `options` (Object, 可选): 测试行为的配置项。
  - `start_emoji` (String): 测试开始时显示的表情符号，默认为 `🧪`。
  - `success_emoji` (String): 测试成功时显示的表情符号，默认为 `✅`。
  - `fail_emoji` (String): 测试失败时显示的表情符号，默认为 `❌`。

#### 并发与顺序测试

`CI.test` 返回一个类 Promise 对象，这使得控制执行流变得非常简单。

- **顺序执行**：如果你希望测试按顺序一个个执行，请在调用时使用 `await`。
- **并发执行**：如果你有多个独立的测试，可以不使用 `await` 来调用它们，使其并发执行。

### 测试钩子 (Hooks)

这些函数允许你在测试的不同生命周期执行代码，非常适合用于设置和拆卸共享的测试环境。

- `CI.beforeAll(asyncFn)`: 在当前作用域（`test`块内）的所有测试开始前运行一次。
- `CI.afterAll(asyncFn)`: 在当前作用域的所有测试结束后运行一次。
- `CI.beforeEach(asyncFn)`: 在当前作用域的每个测试开始前运行。
- `CI.afterEach(asyncFn)`: 在当前作用域的每个测试结束后运行。

```javascript
// 示例：使用钩子和上下文数据来管理一个模拟数据库
CI.test('Tests with a shared database', async () => {
	CI.beforeAll(() => {
		console.log('Initializing mock database...');
		// 使用 context.data 对象存储作用域内的共享资源
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

### 测试上下文 (Test Context)

#### `CI.context`

一个神奇的对象，它提供了对**当前测试**隔离环境的访问。

- `CI.context.workSpace`:
  - `path` (String): 当前测试独有的工作区目录的绝对路径。
- `CI.context.http`:
  - `router` (Express Router): 一个专属于此测试的 Express 路由器实例。
  - `url` (String): 访问此测试专用路由的完整 URL。
- `CI.context.data` (Object): 一个空对象，用于在测试的钩子和主体之间传递数据。

### 模拟交互 (Simulating Interaction)

#### `CI.runInput(input, request)`

模拟**用户发送一条消息**给角色。

- `input` (String | Object): 用户输入。
- `request` (Object, 可选): 一个部分请求对象，用于覆盖默认的请求参数。
- **返回值** (Object): 返回一个包含详细调试信息的对象：
  - `reply` (Object): 角色 `GetReply` 返回的最终结果。
  - `prompt_struct` (Object): 发送给 AI 的结构化 Prompt。
  - `prompt_single` (String): 发送给 AI 的、被转换成单个字符串的 Prompt。

#### `CI.runOutput(output, request)`

模拟 **AI 的输出**，用以测试角色的 `replyHandler`。

- `output` (String | Array | Function): 模拟 AI 的返回内容。
  - **字符串**: 模拟 AI 直接返回该字符串。
  - **数组**: 模拟多步骤交互。数组中的每个元素可以是字符串或函数，会按顺序依次作为 AI 的返回。
  - **函数**: 动态生成 AI 的输出。
    - **异步**: 该函数可以是 `async`。
    - **参数**: 函数会接收一个包含 `prompt_single` 和 `prompt_struct` 的 `result` 对象作为参数。
    - **返回值**: 函数的返回值将成为 AI 在序列中的**下一个**输出。
    - **用途**: 这对于在多步交互的中间步骤进行断言或执行复杂逻辑非常有用。

- `request` (Object, 可选): 同 `CI.runInput`。
- **返回值** (Object): 返回角色 `GetReply` 的最终结果。

#### `result` 对象

交互函数的返回结果（或 `reply` 属性）源自角色 `GetReply` 的返回值，通常包含：

- **`content`** (String): 最终呈现给用户的文本内容。
- **`logContextBefore`** (Array|Undefined): 一个消息日志数组，记录了最终 `content` 生成前的所有历史，包括 `tool`角色（工具执行结果）、`user`角色和`char`角色的消息。

### 辅助工具 (Utility Tools)

- `CI.assert(condition, message)`: 进行断言。
- `CI.char`: 快捷访问当前加载的角色实例对象。
- `CI.sleep(ms)`: 暂停执行指定的毫秒数。
- `CI.wait(fn, timeout)`: 轮询执行 `fn` 直到其返回真值或超时。

## 💡 进阶用法

### 测试文件操作功能

利用 `CI.context.workSpace` 可以安全地测试读写文件的功能。

**示例：** 测试 `<run-bash>` 功能。

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <run-bash>', async () => {
	// 使用隔离的工作区路径
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> failed to create directory.');
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### 测试网页浏览（含中间步骤断言）

利用 `CI.context.http` 和 `runOutput` 的函数参数，可以构建复杂的网络交互测试。

**示例：** 测试 `<web-browse>` 功能，并验证其prompt内容。

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
		// 1. AI决定浏览页面
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. 使用函数验证中间步骤，并提供下一步AI的回复
		async (midResult) => {
			// 断言：检查发送给AI的prompt是否包含了网页内容
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('This is a test paragraph'), 'Web content was not in prompt.');

			// 返回AI的最终回复
			return 'The paragraph says: This is a test paragraph.';
		}
	]);

	// 断言：检查最终给用户的内容是否正确
	CI.assert(result.content.includes('The paragraph says'), 'Final reply is incorrect.');
});
```

## 仍然感到迷茫？

来看看世界上第一个fount角色[`龙胆`是怎么做的](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)！
