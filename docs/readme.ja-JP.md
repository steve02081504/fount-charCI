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
- ✅ **並行テストと順次テスト**：テストを並列実行して速度を向上させたり、`await` を使用してテストを順次実行したりできます。
- ✅ **アサーション駆動**：`assert` 関数を通じてテスト結果を検証し、失敗した場合にはエラーメッセージを明確に報告します。
- ✅ **AIソースとフォールバックのテスト**：AIソースが設定されている場合とされていない場合の両方で、キャラクターがリクエストを正常に処理できることを検証します。
- ✅ **マルチステップ対話シミュレーション**：AIの「思考→ツール使用→回答」という完全なプロセスを正確にシミュレートし、複雑な `replyHandler` のロジックをテストします。
- ✅ **環境連携テスト**：ファイルシステム（`fs`）やネットワーク（`http`）などのNode.jsモジュールとの連携をサポートし、ファイルの読み書き、コード実行、ウェブブラウジングなどの実世界での機能をテストします。
- ✅ **システムログとプロンプトの検証**：ツール実行後にAIに返されるシステムレベルの情報や、AIに送信された最終的なプロンプトまで確認でき、ロジックとデータ処理が期待通りであることを保証します。

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

	// ユーザーが「こんにちは」と送信した際のキャラクターの最終的な応答をチェックします
	const { reply } = await CI.runInput('こんにちは');

	// キャラクターの最終的な出力がAIソースの戻り値と一致するかをアサートします
	// CIの模擬AIソースはデフォルトで "If I never see you again, good morning, good afternoon, and good night." を返します
	CI.assert(reply.content.includes('good morning'), 'Character failed to return the AI content correctly.');
});
```

上記の手順を完了すると、`.mjs` ファイルをGitHubリポジトリにプッシュするたびに、テストプロセスが自動的に実行されます。

## 📖 CI API 詳細

`fount-charCI` は、テストを構築するためのシンプルかつ強力なAPIを提供します。

### テストスイート (Test Suites)

#### `CI.test(name, asyncFn, options)`
トップレベルのテストスイートを定義します。
- `name` (String): テストの説明。
- `asyncFn` (Function): テストロジックを含む非同期関数。
- `options` (Object, 任意): テストの動作を設定するオプション。
    - `start_emoji` (String): テスト開始時に表示される絵文字。デフォルト: `🧪`。
    - `success_emoji` (String): テスト成功時に表示される絵文字。デフォルト: `✅`。
    - `fail_emoji` (String): テスト失敗時に表示される絵文字。デフォルト: `❌`。
    - `clean_chat_log` (Boolean): テスト開始前にコンテキストのチャットログをクリアするかどうか。デフォルト: `true`。
    - `group_output` (Boolean): GitHub Actionsのログでこのテストの出力をグループに折りたたむか。デフォルト: `true`。

#### `CI.subtest(name, asyncFn, options)`
ネストされたサブテストを定義します。機能的には `CI.test` と全く同じですが、`group_output` がデフォルトで `false` になっており、GitHub ActionsログでのネストされたグループによるUIの混乱を避けます。

#### 並行テストと順次テスト
`CI.test` と `CI.subtest` は非同期であり、Promiseを返します。
- **順次実行**: テストを呼び出す際に `await` を使用すると、次のテストが始まる前に現在のテストが完了することを保証します。これは、テスト間に依存関係がある場合に不可欠です。
  ```javascript
  await CI.test('ステップ1：環境設定', async () => { /* ... */ });
  await CI.test('ステップ2：結果の検証', async () => { /* ... */ });
  ```
- **並行実行**: 複数の独立したテストがある場合、`await` なしで呼び出すことで並行して実行でき、総テスト時間を短縮できます。CIランナーは、呼び出されたすべてのテストが完了するのを自動的に待ってから終了します。
  ```javascript
  // これら2つのテストは同時に開始されます
  CI.test('独立したテストA', async () => { /* ... */ });
  CI.test('独立したテストB', async () => { /* ... */ });
  ```

### インタラクションのシミュレーション (Simulating Interaction)

#### `CI.runInput(input, request)`
**ユーザーがキャラクターにメッセージを送信する**のをシミュレートします。これは、入力に対するキャラクターの応答をテストする最も直接的な方法です。
- `input` (String | Object): ユーザーの入力。
    - 文字列の場合、ユーザーからのプレーンテキストメッセージをシミュレートします。
    - オブジェクトの場合、`{ role: 'user', content: 'hello', files: [] }` のように、より複雑なメッセージを構築できます。
- `request` (Object, 任意): デフォルトのリクエストパラメータ（`username`、`chat_id`など）を上書きするための部分的なリクエストオブジェクト。
- **戻り値** (Object): 詳細なデバッグ情報を含むオブジェクトを返します。
    - `reply` (Object): キャラクターの `GetReply` から返された最終的な結果オブジェクト。`CI.runOutput` の戻り値と同じです。
    - `prompt_struct` (Object): AIに送信された構造化プロンプト。プロンプトエンジニアリングのデバッグに不可欠です。
    - `prompt_single` (String): AIに送信された、単一文字列に変換されたプロンプト。

#### `CI.runOutput(output, request)`
**AIの出力**をシミュレートします。この関数は、キャラクターの `replyHandler`、つまりAIからのツール呼び出しや特殊な指示を処理するロジックのテストに最適です。
- `output` (String | Array<String>): シミュレートするAIの応答内容。
    - 文字列の場合、AIがその文字列を最終的な回答として直接返すことをシミュレートします。
    - 文字列の配列の場合、マルチステップの対話をシミュレートします。配列の最初の要素がAIの最初の応答（通常はツール呼び出し）、2番目がその次の応答、といった具合です。
- `request` (Object, 任意): `CI.runInput` と同じです。
- **戻り値** (Object): キャラクターの `GetReply` からの最終結果。通常、`content` や `logContextBefore` などのプロパティを含みます。

#### `result` オブジェクト
`CI.runOutput` の戻り値（または `CI.runInput` の `reply` プロパティ）は、キャラクターの `GetReply` からのものです。標準的なfountキャラクターの場合、通常は以下を含みます：
- **`content`** (String): ユーザーに最終的に表示されるテキストコンテンツ。
- **`logContextBefore`** (Array|Undefined): 最終的な `content` が生成される**前**のすべての対話履歴を記録したメッセージログの配列です。これには `system`（例：ツール実行結果）、`user`、`assistant` ロールのメッセージが含まれます。ツールの出力を確認するのに非常に便利です。

### ユーティリティツール (Utility Tools)

#### `CI.assert(condition, message)`
アサーションを実行します。`condition` が `false` の場合、テストは直ちに失敗し、`message` を含むエラーがスローされます。

#### `CI.char`
現在ロードされているキャラクターインスタンスオブジェクトに直接アクセスできるショートカットです。これを使用して、キャラクターの内部メソッドを呼び出したり、設定を変更したりできます。
```javascript
// AIソースを設定または変更する
await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
```

#### `CI.clearChatLog()`
現在のテストコンテキスト内のチャット履歴（`test_chat_log`）をクリアします。

#### `CI.sleep(ms)`
現在の非同期関数の実行を指定されたミリ秒数だけ一時停止します。`new Promise(resolve => setTimeout(resolve, ms))` と同等です。

#### `CI.wait(fn, timeout)`
`fn` 関数がtruthyな値を返すか、タイムアウト（デフォルト：10000ms）に達するまで繰り返し実行するポーリングユーティリティです。非同期のバックグラウンド操作の完了を待つのに便利です。

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

CI.test('Function: <run-bash>', async () => {
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

CI.test('Function: <view-file>', async () => {
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

## それでも迷う場合は？

世界初のfountキャラクター[`龍胆` がどのように実装しているか](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)を見てみましょう！
