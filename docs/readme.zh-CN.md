# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)

一个简洁而强大的持续集成工具，专为 [fount](https://github.com/steve02081504/fount) 角色开发者设计，用于自动化测试，确保你的角色能够稳定运行。

它能帮助你捕捉到代码层面的错误，如语法问题、接口调用失败等，从而在发布前保证角色的基本可用性，避免低级错误影响用户体验。

## ✨ 功能特性

本 CI 工具专注于测试角色的程序健壮性，主要覆盖以下范围：

- ✅ **基础加载测试**：确保角色文件没有显著的语法错误，可以被 fount 核心正确加载。
- ✅ **AI 源集成测试**：验证角色在有或没有 AI 源的情况下，都能正常处理聊天请求。
- ✅ **核心接口测试**：确保 `SetData` 等 fount 核心接口能够被角色正确调用和响应。
- ✅ **Reply Handler 行为测试**：通过模拟 AI 返回的特定指令，测试你内置的 `replyHandler` 是否按预期执行。

> 考虑到LLM生成内容的不确定性，本工具**无法**对 Prompt 的质量或 AI 生成内容的优劣进行评估。它的核心价值在于保障角色的程序部分的正确性。

## 🚀 快速上手

只需三步，即可为你的 fount 角色项目配置好自动化测试。

### 第 1 步：创建 Workflow 文件

在你的角色项目根目录下，创建 CI 配置文件：`.github/workflows/CI.yml`。

### 第 2 步：填入模板内容

将以下内容粘贴到 `CI.yml` 文件中。它会在代码推送时自动运行测试。

```yaml
name: Test Running

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

在你的角色项目根目录下，创建 CI 的入口文件 `.github/workflows/CI.mjs`，并根据你的角色逻辑编写测试用例。

以下是一个基础的测试模板：

```javascript
// fountCharCI 会被自动注入到全局，可以直接使用
const CI = fountCharCI;

// --- 测试用例 1: 无 AI 源 ---
// 模拟在没有配置 AI 源的情况下，角色是否能正常响应。
// 这对于检查角色的默认行为或内置命令很有用。
await CI.runOutput();

// --- 测试用例 2: 基础 AI 对话 ---
// 1. 配置一个模拟的 AI 源，名为 'CI'
//    我们假设你的角色通过 data.AIsource 字段来加载 AI 源
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});

// 2. 模拟 AI 源返回 "测试！"
await CI.runOutput('测试！').then((result) => {
	// 3. 断言角色的最终输出是否与 AI 源返回的一致
	CI.assert(result.content === '测试！', '在有 AI 源时，角色未能正确返回内容');
});

console.log('✅ All basic tests passed!');
```

完成以上步骤后，每次当你推送 `.mjs` 文件更新到 GitHub 仓库时，测试流程就会自动运行。

## 💡 进阶用法

### 测试 Reply Handler

`replyHandler` 是 fount 角色的核心功能之一。你可以通过 `runOutput` 模拟 AI 返回包含特殊指令的内容，来测试 `replyHandler` 是否正确解析和执行了这些指令。

**示例：** 测试一个可以在服务器上创建目录的 `<run>` 指令。

```javascript
import fs from 'node:fs';

// runOutput 支持传入一个数组，模拟 AI 源被多次调用的场景
// 第一次调用返回 <run> 指令，第二次返回普通文本
await CI.runOutput([
	// 第一次 AI 返回的内容，包含一个需要执行的 shell 命令
	`<run>\nmkdir test_dir\n</run>\n这是指令执行后的补充说明。`,
	// 第二次 AI 返回的内容
	`目录已创建。`
]).then((result) => {
	// 断言 1: 检查 'test_dir' 目录是否真的被创建了
	CI.assert(fs.existsSync('test_dir'), 'replyHandler 未能正确执行 <run> 指令创建目录');
	
	// 断言 2: 检查角色是否请求了第二次 AI 调用，并返回了最终内容
	CI.assert(result.content === '目录已创建。', 'replyHandler 执行后未按预期再次请求 AI 源');
});

console.log('✅ Reply handler test passed!');
```

### 调试：输出 Prompt 内容

在调试时，你可能希望看到发送给 AI 的完整 `prompt` 结构。可以通过以下方式开启日志输出：

```javascript
// 将此行代码放在你的测试脚本顶部
CI.echo_prompt_struct = true;

// 后续的 CI.runOutput() 调用将在日志中打印详细的 prompt 对象
await CI.runOutput('Hello');
```
