# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)

[fount](https://github.com/steve02081504/fount) キャラクター開発者向けに設計された、シンプルかつ強力な継続的インテグレーション（CI）ツールです。テストを自動化し、キャラクターが安定して動作することを保証します。

構文の問題、API呼び出しの失敗、機能関数（ツール）の実行例外など、コードレベルのエラーを捉えるのに役立ちます。これにより、リリース前にキャラクターの基本的な可用性を確保し、低レベルのエラーがユーザーエクスペリエンスに影響を与えるのを防ぎます。

## ✨ 機能特性

本CIツールは、キャラクターのプログラム的な堅牢性をテストすることに特化しており、主に以下の範囲をカバーします：

- ✅ **構造化テスト**：Jestのような `test` と `subtest` ブロックを使用してテストケースを整理し、テストスクリプトを明確で読みやすくします。
- ✅ **アサーション駆動**：`assert` 関数を通じてテスト結果を検証し、失敗した場合にはエラーメッセージを明確に報告します。
- ✅ **AIソースとフォールバックのテスト**：AIソースが設定されている場合とされていない場合の両方で、キャラクターがリクエストを正常に処理できることを検証します。
- ✅ **マルチステップ対話シミュレーション**：AIの「思考→ツール使用→回答」という完全なプロセスを正確にシミュレートし、複雑な `replyHandler` のロジックをテストします。
- ✅ **環境連携テスト**：ファイルシステム（`fs`）やネットワーク（`http`）などのNode.jsモジュールとの連携をサポートし、ファイルの読み書き、コード実行、ウェブブラウジングなどの実世界での機能をテストします。
- ✅ **システムログの検証**：ツール実行後にAIに返されるシステムレベルの情報（ファイルの内容、検索結果など）をチェックし、ツールの出力が期待通りであることを確認します。

> LLMが生成する内容の不確実性を考慮し、本ツールはプロンプトの品質やAIが生成する内容の優劣を評価することは**できません**。その核心的な価値は、キャラクターのプログラム部分の正しさを保証することにあります。

## 🚀 クイックスタート

わずか3ステップで、あなたのfountキャラクタープロジェクトに自動テストを設定できます。

### ステップ1：Workflowファイルを作成する

キャラクタープロジェクトのルートディレクトリに、CI設定ファイル `.github/workflows/CI.yml` を作成します。

### ステップ2：テンプレートの内容を貼り付ける

以下の内容を `CI.yml` ファイルに貼り付けます。これにより、コードがプッシュされるたびにテストが自動的に実行されます。

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # キャッシュを更新するため

on:
  # 手動でのトリガーを許可
  workflow_dispatch:
  # .mjs ファイルが変更されたときに自動的にトリガー
  push:
    paths:
      - '**.mjs'
    # リリース時にトリガーされるのを避けるため、タグのプッシュは無視
    tags-ignore:
      - '*'
    # 任意のブランチからのプッシュを許可
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # CIテストスクリプトのパスを指定
          CI-filepath: .github/workflows/CI.mjs
```

### ステップ3：CIテストスクリプトを作成する

キャラクタープロジェクトのルートディレクトリに、CIのエントリーポイントファイル `.github/workflows/CI.mjs` を作成します。以下は、モダンな基礎的なテストテンプレートです：

```javascript
// fountCharCI は自動的にグローバルに注入されるため、直接使用できます
const CI = fountCharCI;

// --- テストケース1: AIソースなしのフォールバック処理 ---
await CI.test('Fallback without AI source', async () => {
	// フォールバックハンドラーをテストするためにAIソースを削除します。キャラクターがdataのAIsourceフィールド経由でAIソースを読み込むと仮定します。
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput を引数なしで呼び出し、空またはデフォルトのリクエストをシミュレートします
	await CI.runOutput();
	// エラーがスローされなければ、テストは成功です
});

// --- テストケース2: 基本的なAIの応答 ---
await CI.test('Basic AI Response', async () => {
	// AIソースが設定されていることを確認します。キャラクターがdataのAIsourceフィールド経由でAIソースを読み込むと仮定します。
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// AIソースが "テスト！" を返すとシミュレートします
	const result = await CI.runOutput('テスト！');
	
	// キャラクターの最終的な出力がAIソースの戻り値と一致するかをアサートします
	CI.assert(result.content === 'テスト！', 'Character failed to return the AI content correctly.');
});
```

上記の手順を完了すると、`.mjs` ファイルをGitHubリポジトリにプッシュするたびに、テストプロセスが自動的に実行されます。

## 📖 CI API 詳細

`fount-charCI` は、テストを構築するためのシンプルなAPIを提供します。

### `CI.test(name, asyncFn)`
トップレベルのテストスイートを定義します。`name` はテストの説明で、`asyncFn` はテストロジックを含む非同期関数です。テストは順番に実行されます。

### `CI.subtest(name, asyncFn)`
ネストされたサブテストを定義します。大きなテストブロックをより小さく、関連するユニットに分割するために使用します。使い方は `CI.test` と同じです。

### `CI.runOutput(input)`
これはCIのコア機能で、完全なユーザーとAIの対話をシミュレートし、最終結果を返します。

- **`input` (String):** `input` が文字列の場合、AIがその文字列を最終的な回答として直接返すことをシミュレートします。
  ```javascript
  // AIが直接 "Hello" と応答するのをシミュレート
  const result = await CI.runOutput('Hello');
  CI.assert(result.content === 'Hello');
  ```
- **`input` (Array):** `input` が文字列の配列の場合、マルチステップの対話フローをシミュレートします。配列の各要素はAIからの応答を表します。これはツール呼び出し（`replyHandler`）のテストに不可欠です。
  ```javascript
  // AIがまずツールを呼び出し、その後で最終的な回答をするのをシミュレート
  await CI.runOutput([
  	'<tool>do_something</tool>', // ステップ1：AIがツール呼び出しを返す
  	'I have done something.'      // ステップ2：AIが最終メッセージを返す
  ]);
  ```

### `CI.assert(condition, message)`
アサーションを実行します。`condition` が `false` の場合、テストは直ちに失敗し、`message` を含むエラーがスローされます。

### `result` オブジェクト
`CI.runOutput` は `result` オブジェクトを返します。これにはキャラクターの `GetReply` から返された結果が含まれます。標準的なfountキャラクターの場合、以下のプロパティが含まれます：
- **`result.content` (String):** ユーザーに最終的に表示されるテキストコンテンツ。
- **`result.logContextBefore` (Array|Undefined):** 最終的な `content` が生成される**前**のすべての対話履歴を記録したメッセージログの配列です。これには `system`（例：ツール実行結果）、`user`、`assistant` ロールのメッセージが含まれます。ツールの出力を確認するのに非常に便利です。

### `CI.char`
キャラクターオブジェクト自体に簡単にアクセスできます。
```javascript
// AIソースを設定または変更する
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});
```

## 💡 高度な使用法

### 機能関数（ツール / Reply Handler）のテスト

機能関数をテストする鍵は、`runOutput` の配列形式を使用して「ツール呼び出し→最終応答」のフローをシミュレートし、その副作用とシステムログを確認することです。

**例：** サーバー上にディレクトリを作成する `<run-bash>` 機能をテストします。

```javascript
import fs from 'node:fs';
import path from 'node:path';

const CI = fountCharCI;
const testWorkspace = './ci-test-workspace';
fs.mkdirSync(testWorkspace, { recursive: true });
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

await CI.test('Function: <run-bash>', async () => {
	const testDir = path.join(testWorkspace, 'bash_test_dir');

	// AIがまず <run-bash> を呼び出し、次に確認メッセージを出すのをシミュレート
	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	// アサーション1: 副作用をチェック -> ディレクトリは実際に作成されたか？
	CI.assert(fs.existsSync(testDir), '<run-bash> failed to execute command.');

	// アサーション2: 最終出力をチェック -> AIはメッセージを再生成したか？
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### ツールのシステム出力の確認

一部の機能（ファイルの読み取りやウェブブラウジングなど）は直接的な副作用を生じさせず、結果を `system` メッセージとしてAIに返します。`result.logContextBefore` を調べることでこれを検証できます。

**例：** `<view-file>` 機能をテストします。

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

	// ツール実行後に返された system ログを見つける
	const systemLog = result.logContextBefore.find(log => log.role === 'system');

	// アサーション: system ログに正しいファイル内容が含まれているかを確認
	CI.assert(systemLog && systemLog.content.includes(fileContent), '<view-file> failed to read file content.');
});
```

### デバッグ：プロンプト内容の出力

デバッグ中に、AIに送信される完全な `prompt` 構造を確認したい場合があるかもしれません。以下のようにしてログ出力を有効にできます：

```javascript
// この行をテストスクリプトの先頭に配置します
CI.echo_prompt_struct = true;
// これ以降の CI.runOutput() 呼び出しは、GitHub Actions のログに詳細なプロンプトオブジェクトを出力します
await CI.runOutput('Hello');
```
