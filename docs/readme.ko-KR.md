# fount-charCI

[![fount 레포](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

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

간결하면서도 강력한 CI(Continuous Integration) 도구로, [fount](https://github.com/steve02081504/fount) 역할 개발자가 테스트를 자동화하고 역할이 안정적으로 실행되도록 특별히 설계되었습니다.

구문 문제, 실패한 API 호출, 도구 기능의 예외와 같은 코드 수준 오류를 포착하여 릴리스 전에 역할의 기본 사용성을 보장하고 사소한 실수가 사용자 경험에 영향을 미치는 것을 방지합니다.

## ✨ 기능

이 CI 도구는 역할의 프로그래밍 방식 견고성을 테스트하는 데 중점을 두며 주로 다음 영역을 다룹니다.

- ✅ **구조화된 테스트**: Jest와 유사한 `test` 블록을 사용하여 테스트 케이스를 구성하고 모든 수준의 중첩을 지원하여 테스트 스크립트를 명확하고 읽기 쉽게 만듭니다.
- ✅ **동시 및 순차 테스트**: 속도를 높이기 위해 병렬로 테스트를 실행하거나 `await`를 사용하여 순차 실행을 보장합니다.
- ✅ **테스트 후크**: 테스트 수명 주기의 여러 단계에서 환경을 설정하고 해제하기 위한 `beforeAll`, `afterAll`, `beforeEach` 및 `afterEach` 후크 함수를 제공합니다.
- ✅ **격리된 테스트 환경**: 각 테스트에는 자체적으로 독립적이고 자동으로 정리되는 작업 공간(파일 작업용)과 HTTP 라우터가 있어 테스트 간의 간섭을 방지합니다.
- ✅ **어설션 기반**: 실패 시 명확한 오류 메시지를 보고하는 `assert` 함수로 테스트 결과를 확인합니다.
- ✅ **다단계 상호 작용 시뮬레이션**: AI의 전체 "생각 -> 도구 사용 -> 응답" 흐름을 정밀하게 시뮬레이션하여 복잡한 `replyHandler` 로직을 테스트합니다.
- ✅ **시스템 로그 및 프롬프트 검사**: 도구 실행 후 AI로 반환된 시스템 수준 정보를 검사하고 AI로 전송된 최종 프롬프트를 검색하여 로직 및 데이터 처리가 예상대로인지 확인합니다.
- ✅ **상세한 테스트 보고서**: 각 테스트의 기간, 로그 및 오류 세부 정보를 포함하여 GitHub Actions에서 아름답고 대화형인 테스트 요약 보고서를 자동으로 생성합니다.

> LLM 생성 콘텐츠의 비결정적 특성을 고려할 때 이 도구는 프롬프트의 품질이나 AI 생성 콘텐츠의 장점을 평가할 수 **없습니다**. 핵심 가치는 역할의 프로그래밍 부분의 정확성을 보장하는 데 있습니다.

## 🚀 빠른 시작

단 세 단계만으로 fount 역할 프로젝트에 대한 자동화된 테스트를 설정합니다.

### 1단계: 워크플로 파일 만들기

역할 프로젝트의 루트 디렉터리에 CI 구성 파일인 `.github/workflows/CI.yml`을 만듭니다.

### 2단계: 템플릿으로 채우기

다음 내용을 `CI.yml` 파일에 붙여넣습니다. 코드 푸시 시 자동으로 테스트를 실행합니다.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # 캐시 업데이트에 필요

on:
  # 수동 트리거 허용
  workflow_dispatch:
  # .mjs 파일이 변경되면 자동으로 트리거
  push:
    paths:
      - '**.mjs'
    # 버전 릴리스 시 트리거 방지를 위해 태그 푸시 무시
    tags-ignore:
      - '*'
    # 모든 브랜치에서 푸시 허용
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # CI 테스트 스크립트 경로 지정
          CI-filepath: .github/workflows/CI.mjs
          # (선택 사항) CI 사용자 이름 지정, 기본값 "CI-user"
          # CI-username: my-ci-user
```

### 3단계: CI 테스트 스크립트 만들기

역할 프로젝트의 루트 디렉터리에 CI 진입 파일인 `.github/workflows/CI.mjs`를 만듭니다. 다음은 현대적이고 기본적인 테스트 템플릿입니다.

```javascript
// fountCharCI는 전역 범위에 자동으로 주입되며 직접 사용할 수 있습니다.
const CI = fountCharCI;

// --- 테스트 케이스 1: AI 소스 없는 폴백 처리 ---
await CI.test('noAI Fallback', async () => {
	// 폴백 핸들러를 테스트하기 위해 AI 소스 제거
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// 인수가 없는 runOutput은 비어 있거나 기본 요청을 시뮬레이션합니다.
	await CI.runOutput();
	// 오류가 발생하지 않으면 테스트 통과
});

// --- 테스트 케이스 2: 기본 AI 대화 ---
await CI.test('Basic AI Response', async () => {
	// AI 소스가 설정되었는지 확인
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// 사용자 입력 "안녕하세요"를 시뮬레이션하고 역할에서 반환된 최종 콘텐츠 확인
	const { reply } = await CI.runInput('안녕하세요');

	// 역할의 최종 출력이 AI 소스에서 반환된 것과 일치하는지 확인
	// CI 모의 AI 소스는 기본적으로 "다시는 못 보게 된다면 좋은 아침, 좋은 오후, 좋은 밤입니다."를 반환합니다.
	CI.assert(reply.content.includes('좋은 아침'), '캐릭터가 AI 콘텐츠를 올바르게 반환하지 못했습니다.');
});
```

이러한 단계가 완료되면 GitHub 리포지토리의 `.mjs` 파일에 업데이트를 푸시할 때마다 테스트 워크플로가 자동으로 실행됩니다.

## 📖 CI API 참조

`fount-charCI`는 테스트를 빌드하기 위한 간결하면서도 강력한 API를 제공합니다.

### 테스트 정의

#### `CI.test(name, asyncFn, options)`

테스트 블록을 정의합니다. 최상위 테스트이거나 다른 `test` 블록 내에 중첩되어 하위 테스트를 형성할 수 있습니다.

- `name` (문자열): 테스트에 대한 설명입니다.
- `asyncFn` (함수): 테스트 로직을 포함하는 비동기 함수입니다.
- `options` (객체, 선택 사항): 테스트 동작에 대한 구성 옵션입니다.
  - `start_emoji` (문자열): 테스트 시작 시 표시되는 이모지입니다. 기본값은 `🧪`입니다.
  - `success_emoji` (문자열): 테스트 성공 시 표시되는 이모지입니다. 기본값은 `✅`입니다.
  - `fail_emoji` (문자열): 테스트 실패 시 표시되는 이모지입니다. 기본값은 `❌`입니다.

#### 동시 및 순차 테스트

`CI.test`는 Promise와 유사한 객체를 반환하므로 실행 흐름을 매우 간단하게 제어할 수 있습니다.

- **순차 실행**: 테스트를 순서대로 하나씩 실행하려면 `CI.test`를 호출할 때 `await`를 사용합니다.
- **동시 실행**: 병렬로 실행하려면 `await` 없이 여러 독립적인 테스트를 호출할 수 있습니다.

### 테스트 후크

이러한 함수를 사용하면 테스트 수명 주기의 여러 지점에서 코드를 실행할 수 있으며 공유 테스트 환경을 설정하고 해제하는 데 이상적입니다.

- `CI.beforeAll(asyncFn)`: 현재 범위(`test` 블록 내)의 모든 테스트 전에 한 번 실행됩니다.
- `CI.afterAll(asyncFn)`: 현재 범위의 모든 테스트가 완료된 후 한 번 실행됩니다.
- `CI.beforeEach(asyncFn)`: 현재 범위의 각 테스트 전에 실행됩니다.
- `CI.afterEach(asyncFn)`: 현재 범위의 각 테스트가 완료된 후 실행됩니다.

```javascript
// 예: 후크 및 컨텍스트 데이터를 사용하여 모의 데이터베이스 관리
CI.test('공유 데이터베이스를 사용한 테스트', async () => {
	CI.beforeAll(() => {
		console.log('모의 데이터베이스 초기화 중...');
		// 범위 내에서 공유 리소스를 저장하려면 context.data 객체 사용
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`데이터베이스 테스트 완료. 최종 방문 횟수: ${finalCount}`);
	});

	CI.test('사용자 방문 시 카운터 증가', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, '방문 횟수는 0보다 커야 합니다.');
	});
});
```

### 테스트 컨텍스트

#### `CI.context`

**현재 테스트**의 격리된 환경에 대한 액세스를 제공하는 마법 같은 객체입니다.

- `CI.context.workSpace`:
  - `path` (문자열): 현재 테스트의 고유한 작업 디렉터리에 대한 절대 경로입니다.
- `CI.context.http`:
  - `router` (Express 라우터): 이 테스트 전용 Express 라우터 인스턴스입니다.
  - `url` (문자열): 이 테스트의 전용 라우터에 액세스하기 위한 전체 URL입니다.
- `CI.context.data` (객체): 테스트의 후크와 본문 간에 데이터를 전달하는 데 사용되는 빈 객체입니다.

### 상호 작용 시뮬레이션

#### `CI.runInput(input, request)`

역할에 **사용자가 메시지를 보내는 것**을 시뮬레이션합니다.

- `input` (문자열 | 객체): 사용자 입력입니다.
- `request` (객체, 선택 사항): 기본 요청 매개변수를 재정의하기 위한 부분 요청 객체입니다.
- **반환값** (객체): 상세한 디버깅 정보를 포함하는 객체입니다.
  - `reply` (객체): 역할의 `GetReply`에서 반환된 최종 결과입니다.
  - `prompt_struct` (객체): AI로 전송된 구조화된 프롬프트입니다.
  - `prompt_single` (문자열): AI로 전송된 프롬프트로, 단일 문자열로 변환됩니다.

#### `CI.runOutput(output, request)`

역할의 `replyHandler`를 테스트하기 위해 **AI의 출력**을 시뮬레이션합니다.

- `output` (문자열 | 배열 | 함수): AI에서 반환된 시뮬레이션된 콘텐츠입니다.
  - **문자열**: AI가 이 문자열을 직접 반환하는 것을 시뮬레이션합니다.
  - **배열**: 다단계 상호 작용을 시뮬레이션합니다. 문자열 또는 함수일 수 있는 배열의 각 요소는 AI의 반환 값으로 순차적으로 사용됩니다.
  - **함수**: AI의 출력을 동적으로 생성합니다.
    - **비동기**: 함수는 `async`일 수 있습니다.
    - **매개변수**: 함수는 인수로 `prompt_single` 및 `prompt_struct`를 포함하는 `result` 객체를 받습니다.
    - **반환 값**: 함수의 반환 값은 시퀀스에서 AI의 **다음** 출력이 됩니다.
    - **사용 사례**: 다단계 상호 작용 중간에 어설션을 만들거나 복잡한 로직을 실행하는 데 매우 유용합니다.

- `request` (객체, 선택 사항): `CI.runInput`과 동일합니다.
- **반환값** (객체): 역할의 `GetReply`에서 반환된 최종 결과입니다.

#### `result` 객체

상호 작용 함수(또는 해당 `reply` 속성)의 반환 값은 역할의 `GetReply` 반환 값에서 비롯되며 일반적으로 다음을 포함합니다.

- **`content`** (문자열): 사용자에게 제공되는 최종 텍스트 콘텐츠입니다.
- **`logContextBefore`** (배열|정의되지 않음): 최종 `content`가 생성되기 전의 모든 기록을 기록하는 메시지 로그 배열로, `tool` 역할(도구 실행 결과), `user` 역할 및 `char` 역할이 있는 메시지를 포함합니다.

### 유틸리티 도구

- `CI.assert(condition, message)`: 어설션을 수행합니다.
- `CI.char`: 현재 로드된 역할 인스턴스 객체에 액세스하기 위한 바로 가기입니다.
- `CI.sleep(ms)`: 지정된 밀리초 동안 실행을 일시 중지합니다.
- `CI.wait(fn, timeout)`: `fn` 함수가 참 값을 반환하거나 시간 초과될 때까지 폴링합니다.

## 💡 고급 사용법

### 파일 작업 함수 테스트

`CI.context.workSpace`를 사용하여 파일을 읽고 쓰는 함수를 안전하게 테스트할 수 있습니다.

**예:** `<run-bash>` 함수 테스트.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('함수: <run-bash>', async () => {
	// 격리된 작업 공간 경로 사용
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'디렉터리가 생성되었습니다.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash>가 디렉터리를 만들지 못했습니다.');
	CI.assert(result.content === '디렉터리가 생성되었습니다.', '최종 메시지가 잘못되었습니다.');
});
```

### 웹 브라우징 테스트(중간 단계 어설션 포함)

`CI.context.http`와 `runOutput`의 함수 인수를 사용하여 복잡한 네트워크 상호 작용 테스트를 구성할 수 있습니다.

**예:** `<web-browse>` 함수 테스트 및 해당 프롬프트 콘텐츠 유효성 검사.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('함수: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>이것은 테스트 단락입니다.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. AI가 페이지를 탐색하기로 결정합니다.
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. 함수를 사용하여 중간 단계를 확인하고 AI의 다음 응답을 제공합니다.
		async (midResult) => {
			// 어설션: AI로 전송된 프롬프트에 웹 페이지 콘텐츠가 포함되어 있는지 확인합니다.
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('이것은 테스트 단락입니다.'), '웹 콘텐츠가 프롬프트에 없었습니다.');

			// AI의 최종 응답 반환
			return '단락 내용은 다음과 같습니다. 이것은 테스트 단락입니다.';
		}
	]);

	// 어설션: 사용자에게 제공된 최종 콘텐츠가 올바른지 확인합니다.
	CI.assert(result.content.includes('단락 내용은 다음과 같습니다.'), '최종 응답이 잘못되었습니다.');
});
```

## 아직도 막막하신가요?

세계 최초의 fount 역할인 [`Gentian`](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs)이 어떻게 하는지 살펴보세요!
