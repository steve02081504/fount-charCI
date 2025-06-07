# fount-charCI

[![fount repo](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

[![English (United Kingdom)](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/United-Kingdom.png)](./readme.en-UK.md)
[![日本語](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/Japan.png)](./readme.ja-JP.md)
[![中文](https://raw.githubusercontent.com/gosquared/flags/master/flags/flags/shiny/48/China.png)](./readme.zh-CN.md)

[fount](https://github.com/steve02081504/fount) のキャラ（bot）開発者向けに設計された、テストを自動化し、キャラの安定動作を保証するための、簡潔かつ強力な継続的インテグレーション（CI）ツールです。

構文の問題やAPI呼び出しの失敗といったコードレベルのエラーを捕捉し、リリース前にキャラの基本的な可用性を保証することで、低レベルのエラーがユーザー体験に影響を与えるのを防ぎます。

## ✨ 機能特性

このCIツールは、キャラのプログラム的な堅牢性をテストすることに特化しており、主に以下の範囲をカバーします。

- ✅ **基本的な読み込みテスト**：キャラファイルに重大な構文エラーがなく、fountコアによって正しく読み込めることを保証します。
- ✅ **AIソース統合テスト**：AIソースが設定されている場合とされていない場合の両方で、キャラがチャットリクエストを正常に処理できることを検証します。
- ✅ **コアインターフェイステスト**：`SetData`のようなfountのコアインターフェイスが、キャラによって正しく呼び出され、応答されることを保証します。
- ✅ **Reply Handlerの動作テスト**：AIが返す特定の命令をシミュレートすることで、組み込みの`replyHandler`が期待どおりに実行されるかをテストします。

> LLMが生成するコンテンツの不確実性を考慮し、本ツールはプロンプトの品質やAIが生成するコンテンツの優劣を評価することは**できません**。その核心的な価値は、キャラのプログラム部分の正しさを保証することにあります。

## 🚀 クイックスタート

わずか3ステップで、あなたのfountキャラプロジェクトに自動テストをセットアップできます。

### ステップ1：Workflowファイルを作成する

キャラプロジェクトのルートディレクトリに、CI設定ファイル `.github/workflows/CI.yml` を作成します。

### ステップ2：テンプレートの内容を記述する

以下の内容を`CI.yml`ファイルに貼り付けます。これにより、コードをプッシュするたびにテストが自動的に実行されます。

```yaml
name: Test Running

on:
  # 手動でのトリガーを許可
  workflow_dispatch:
  # .mjsファイルが変更されたときに自動的にトリガー
  push:
    paths:
      - '**.mjs'
    # リリース時のトリガーを避けるため、タグのプッシュは無視
    tags-ignore:
      - '*'
    # すべての分支からのプッシュを許可
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

プロジェクトのルートに、CIのエントリーファイル `.github/workflows/CI.mjs` を作成し、あなたのキャラのロジックに基づいてテストケースを記述します。

以下は基本的なテストテンプレートです。

```javascript
// fountCharCI は自動的にグローバルスコープに注入されるため、直接使用できます
const CI = fountCharCI;

// --- テストケース1: AIソースなし ---
// AIソースが設定されていない状況をシミュレートし、キャラが正常に応答できるかテストします。
// これは、キャラのデフォルトの動作や組み込みコマンドのテストに役立ちます。
await CI.runOutput();

// --- テストケース2: 基本的なAIとの対話 ---
// 1. 'CI'という名前のモックAIソースを設定します。
//    あなたのキャラが data.AIsource フィールドを使ってAIソースを読み込むことを想定しています。
await CI.char.interfaces.config.SetData({
	AIsource: 'CI'
});

// 2. AIソースが "テスト！" を返すようにシミュレートします。
await CI.runOutput('テスト！').then((result) => {
	// 3. キャラクターの最終的な出力がAIソースの応答と一致することをアサート（表明）します。
	CI.assert(result.content === 'テスト！', 'AIソースがある場合に、キャラが内容を正しく返せませんでした');
});

console.log('✅ すべての基本テストに合格しました！');
```

以上の手順を完了すると、`.mjs`ファイルへの変更をGitHubリポジトリにプッシュするたびに、テストワークフローが自動的に実行されます。

## 💡 高度な使い方

### Reply Handlerのテスト

`replyHandler`はfountキャラのコア機能の一つです。`runOutput`を使用して特別な命令を含むAIの応答をシミュレートすることで、`replyHandler`がそれらの命令を正しく解析・実行するかをテストできます。

**例：** サーバー上にディレクトリを作成する`<run>`コマンドをテストします。

```javascript
import fs from 'node:fs';

// runOutput は配列を受け取り、AIソースが複数回呼び出されるシナリオをシミュレートできます。
// 最初の呼び出しは <run> コマンドを返し、2回目の呼び出しはプレーンテキストを返します。
await CI.runOutput([
	// 最初のAIの応答。実行するシェルコマンドを含みます。
	`<run>\nmkdir test_dir\n</run>\nこれはコマンド実行後の補足説明です。`,
	// 2回目のAIの応答。
	`ディレクトリが作成されました。`
]).then((result) => {
	// アサーション1: 'test_dir' ディレクトリが実際に作成されたかを確認します。
	CI.assert(fs.existsSync('test_dir'), 'replyHandlerが<run>コマンドを正しく実行してディレクトリを作成できませんでした');
	
	// アサーション2: キャラが2回目のAI呼び出しを要求し、最終的なコンテンツを返したかを確認します。
	CI.assert(result.content === 'ディレクトリが作成されました。', 'replyHandlerの実行後、期待通りにAIソースを再度リクエストしませんでした');
});

console.log('✅ Reply handlerのテストに合格しました！');
```

### デバッグ：プロンプト内容の出力

デバッグ時、AIに送信される完全な`prompt`構造を確認したいことがあるかもしれません。次のようにしてログ出力を有効にできます。

```javascript
// この行をテストスクリプトの先頭に配置してください。
CI.echo_prompt_struct = true;

// これ以降の CI.runOutput() の呼び出しでは、詳細なプロンプトオブジェクトがログに出力されます。
await CI.runOutput('Hello');
```
