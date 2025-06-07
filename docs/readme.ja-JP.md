# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

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

[fount](https://github.com/steve02081504/fount) のロール開発者向けに設計された、簡潔かつ強力な継続的インテグレーション（CI）ツールです。テストを自動化し、あなたのロールが安定して動作することを保証します。

構文の問題、API呼び出しの失敗、機能関数（tools）の実行時例外など、コードレベルのエラーを捕捉するのに役立ちます。これにより、リリース前にロールの基本的な可用性を確保し、初歩的なエラーがユーザー体験に影響を与えるのを防ぎます。

## ✨ 主な機能

本CIツールは、ロールのプログラム的な堅牢性をテストすることに重点を置いており、主に以下の範囲をカバーしています：

- ✅ **構造化テスト**：Jestライクな `test` ブロックを使用してテストケースを整理し、任意の階層でのネストをサポート。テストスクリプトを明確で読みやすくします。
- ✅ **並行・順次テスト**：テストを並列実行して速度を向上させたり、 `await` を使用してテストが順次実行されることを保証したりできます。
- ✅ **テストフック (Hooks)**： `beforeAll`, `afterAll`, `beforeEach`, `afterEach` などのフック関数を提供し、テストのさまざまなライフサイクル段階で環境のセットアップやクリーンアップを行えます。
- ✅ **隔離されたテスト環境**：各テストは独立した、自動的にクリーンアップされるワークスペース（ファイル操作用）とHTTPルートを持ち、テスト間の相互干渉を排除します。
- ✅ **アサーション駆動**： `assert` 関数でテスト結果を検証し、失敗時には明確なエラーメッセージを報告します。
- ✅ **マルチステップ対話シミュレーション**：AIの「思考→ツール使用→応答」という完全なプロセスを正確にシミュレートし、複雑な `replyHandler` のロジックをテストします。
- ✅ **システムログとプロンプトの検査**：ツール実行後にAIに返されるシステムレベルの情報を確認でき、さらにはAIに送信される最終的なプロンプトも取得可能。ロジックとデータ処理が期待通りであることを保証します。
- ✅ **詳細なテストレポート**：GitHub Actionsで、各テストの所要時間、ログ、エラー詳細を含む、見やすくインタラクティブなテストサマリーレポートを自動生成します。

> LLMが生成するコンテンツの不確実性を考慮し、本ツールはプロンプトの品質やAI生成コンテンツの優劣を評価することは**できません**。その核心的な価値は、ロールのプログラム部分の正しさを保証することにあります。

## 🚀 クイックスタート

わずか3ステップで、あなたのfountロールプロジェクトに自動テストを設定できます。

### ステップ1：Workflowファイルを作成する

ロールプロジェクトのルートディレクトリに、CI設定ファイルを作成します：`.github/workflows/CI.yml`。

### ステップ2：テンプレートの内容を貼り付ける

以下の内容を `CI.yml` ファイルに貼り付けてください。コードがプッシュされると自動的にテストが実行されます。

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # キャッシュの更新に必要

on:
  # 手動でのトリガーを許可
  workflow_dispatch:
  # .mjs ファイルが変更されたときに自動的にトリガー
  push:
    paths:
      - '**.mjs'
    # バージョンリリース時のトリガーを避けるため、タグのプッシュは無視
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
          # (任意) CI専用のユーザー名を指定、デフォルトは "CI-user"
          # CI-username: my-ci-user
```

### ステップ3：CIテストスクリプトを作成する

ロールプロジェクトのルートディレクトリに、CIのエントリーファイル `.github/workflows/CI.mjs` を作成します。以下はモダンな基本テストテンプレートです：

```javascript
// fountCharCI はグローバルに自動注入されるため、直接使用できます
const CI = fountCharCI;

// --- テストケース1: AIソースがない場合のフォールバック処理 ---
await CI.test('noAI Fallback', async () => {
	// AIソースを削除してフォールバックハンドラをテスト
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// 引数なしで runOutput を実行し、空またはデフォルトのリクエストをシミュレート
	await CI.runOutput();
	// エラーがスローされなければ、テストは成功
});

// --- テストケース2: 基本的なAIとの対話 ---
await CI.test('Basic AI Response', async () => {
	// AIソースが設定されていることを確認
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// ユーザーが「こんにちは」と入力したのをシミュレートし、ロールが返す最終的な内容をチェック
	const { reply } = await CI.runInput('こんにちは');

	// ロールの最終出力がAIソースの戻り値と一致するかをアサート
	// CIの模擬AIソースはデフォルトで "If I never see you again, good morning, good afternoon, and good night." を返します
	CI.assert(reply.content.includes('good morning'), 'Character failed to return the AI content correctly.');
});
```

以上のステップを完了すると、`.mjs` ファイルをGitHubリポジトリにプッシュするたびに、テストプロセスが自動的に実行されます。

## 📖 CI API 詳細

`fount-charCI` は、テストを構築するための簡潔で強力なAPIセットを提供します。

### テストの定義 (Defining Tests)

#### `CI.test(name, asyncFn, options)`

テストブロックを定義します。トップレベルのテストとしても、他の `test` ブロック内にネストしてサブテストを形成することもできます。

- `name` (String): テストの説明。
- `asyncFn` (Function): テストロジックを含む非同期関数。
- `options` (Object, 任意): テストの振る舞いを設定するオプション。
  - `start_emoji` (String): テスト開始時に表示される絵文字。デフォルトは `🧪`。
  - `success_emoji` (String): テスト成功時に表示される絵文字。デフォルトは `✅`。
  - `fail_emoji` (String): テスト失敗時に表示される絵文字。デフォルトは `❌`。

#### 並行・順次テスト

`CI.test` はPromiseライクなオブジェクトを返すため、実行フローの制御が非常に簡単です。

- **順次実行**: テストを順番に実行したい場合は、呼び出し時に `await` を使用してください。
- **並行実行**: 複数の独立したテストがある場合、 `await` を使用せずに呼び出すことで、それらを並行して実行できます。

### テストフック (Hooks)

これらの関数を使用すると、テストのさまざまなライフサイクルでコードを実行でき、共有テスト環境のセットアップやティアダウンに最適です。

- `CI.beforeAll(asyncFn)`: 現在のスコープ（`test`ブロック内）の全テストが開始される前に一度だけ実行されます。
- `CI.afterAll(asyncFn)`: 現在のスコープの全テストが終了した後に一度だけ実行されます。
- `CI.beforeEach(asyncFn)`: 現在のスコープの各テストが開始される前に実行されます。
- `CI.afterEach(asyncFn)`: 現在のスコープの各テストが終了した後に実行されます。

```javascript
// 例：フックとコンテキストデータを使用して模擬データベースを管理する
CI.test('Tests with a shared database', async () => {
	CI.beforeAll(() => {
		console.log('Initializing mock database...');
		// context.data オブジェクトを使用してスコープ内の共有リソースを保存
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

### テストコンテキスト (Test Context)

#### `CI.context`

**現在のテスト**の隔離された環境へのアクセスを提供する魔法のようなオブジェクトです。

- `CI.context.workSpace`:
  - `path` (String): 現在のテスト専用のワークスペースディレクトリの絶対パス。
- `CI.context.http`:
  - `router` (Express Router): このテスト専用のExpressルーターインスタンス。
  - `url` (String): このテスト専用のルートにアクセスするための完全なURL。
- `CI.context.data` (Object): テストのフックと本体の間でデータを渡すための空のオブジェクト。

### インタラクションのシミュレーション (Simulating Interaction)

#### `CI.runInput(input, request)`

**ユーザーがロールにメッセージを送信する**のをシミュレートします。

- `input` (String | Object): ユーザーの入力。
- `request` (Object, 任意): デフォルトのリクエストパラメータを上書きするための部分的なリクエストオブジェクト。
- **戻り値** (Object): 詳細なデバッグ情報を含むオブジェクトを返します：
  - `reply` (Object): ロールの `GetReply` が返した最終結果。
  - `prompt_struct` (Object): AIに送信された構造化プロンプト。
  - `prompt_single` (String): AIに送信された、単一の文字列に変換されたプロンプト。

#### `CI.runOutput(output, request)`

**AIの出力**をシミュレートし、ロールの `replyHandler` をテストします。

- `output` (String | Array | Function): 模擬AIが返すコンテンツ。
  - **String**: AIがこの文字列を直接返すのをシミュレートします。
  - **Array**: マルチステップの対話をシミュレートします。配列の各要素（文字列または関数）が、順番にAIの戻り値として使用されます。
  - **Function**: AIの出力を動的に生成します。
    - **非同期**: この関数は `async` にすることができます。
    - **引数**: 関数は `prompt_single` と `prompt_struct` を含む `result` オブジェクトを引数として受け取ります。
    - **戻り値**: 関数の戻り値が、シーケンスにおけるAIの**次の**出力となります。
    - **用途**: マルチステップ対話の途中段階でアサーションを行ったり、複雑なロジックを実行したりするのに非常に便利です。

- `request` (Object, 任意): `CI.runInput` と同じです。
- **戻り値** (Object): ロールの `GetReply` の最終結果を返します。

#### `result` オブジェクト

インタラクション関数の戻り値（またはその `reply` プロパティ）は、ロールの `GetReply` の戻り値に由来し、通常は以下を含みます：

- **`content`** (String): ユーザーに最終的に提示されるテキストコンテンツ。
- **`logContextBefore`** (Array|Undefined): 最終的な `content` が生成される前の全履歴を記録したメッセージログの配列。`tool` ロール（ツール実行結果）、`user` ロール、`char` ロールのメッセージが含まれます。

### ユーティリティツール (Utility Tools)

- `CI.assert(condition, message)`: アサーションを実行します。
- `CI.char`: 現在ロードされているロールインスタンスオブジェクトへのショートカットアクセス。
- `CI.sleep(ms)`: 指定されたミリ秒数だけ実行を一時停止します。
- `CI.wait(fn, timeout)`: `fn` が真値を返すかタイムアウトするまで、ポーリング実行します。

## 💡 高度な使用法

### ファイル操作機能のテスト

`CI.context.workSpace` を利用して、ファイルの読み書き機能を安全にテストできます。

**例：** `<run-bash>` 機能のテスト。

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Function: <run-bash>', async () => {
	// 隔離されたワークスペースのパスを使用
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Directory created.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> failed to create directory.');
	CI.assert(result.content === 'Directory created.', 'Final message is incorrect.');
});
```

### Webブラウジングのテスト（中間ステップのアサーションを含む）

`CI.context.http` と `runOutput` の関数引数を利用して、複雑なネットワーク対話テストを構築できます。

**例：** `<web-browse>` 機能のテストと、そのプロンプト内容の検証。

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
		// 1. AIがページをブラウズすることを決定
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. 関数を使用して中間ステップを検証し、AIの次の返信を提供
		async (midResult) => {
			// アサーション：AIに送信されたプロンプトにWebコンテンツが含まれているかチェック
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('This is a test paragraph'), 'Web content was not in prompt.');

			// AIの最終的な返信を返す
			return 'The paragraph says: This is a test paragraph.';
		}
	]);

	// アサーション：ユーザーへの最終的な内容が正しいかチェック
	CI.assert(result.content.includes('The paragraph says'), 'Final reply is incorrect.');
});
```

## まだ迷っていますか？

世界初のfountロール[`龍胆（Gentian）`がどのように実装しているか](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)を見てみましょう！
