# fount-charCI

[![kho lưu trữ fount](https://steve02081504.github.io/fount/badges/fount_repo.svg)](https://github.com/steve02081504/fount)

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

Một công cụ Tích hợp Liên tục (CI) ngắn gọn nhưng mạnh mẽ, được thiết kế đặc biệt cho các nhà phát triển vai trò [fount](https://github.com/steve02081504/fount) để tự động hóa thử nghiệm và đảm bảo vai trò của bạn chạy ổn định.

Nó giúp bạn phát hiện các lỗi ở cấp độ mã như sự cố cú pháp, lệnh gọi API không thành công và các ngoại lệ trong chức năng công cụ, nhờ đó đảm bảo khả năng sử dụng cơ bản của vai trò của bạn trước khi phát hành và ngăn chặn các lỗi nhỏ ảnh hưởng đến trải nghiệm người dùng.

## ✨ Tính năng

Công cụ CI này tập trung vào việc kiểm tra tính mạnh mẽ về mặt lập trình của vai trò của bạn, chủ yếu bao gồm các lĩnh vực sau:

- ✅ **Kiểm tra có cấu trúc**: Sắp xếp các trường hợp thử nghiệm của bạn bằng cách sử dụng các khối `test` giống như Jest, với sự hỗ trợ cho mọi cấp độ lồng ghép, giúp tập lệnh thử nghiệm của bạn rõ ràng và dễ đọc.
- ✅ **Kiểm tra đồng thời & tuần tự**: Hỗ trợ chạy thử nghiệm song song để tăng tốc độ hoặc đảm bảo thực hiện tuần tự bằng `await`.
- ✅ **Hook kiểm tra**: Cung cấp các hàm hook `beforeAll`, `afterAll`, `beforeEach` và `afterEach` để thiết lập và gỡ bỏ môi trường ở các giai đoạn khác nhau của vòng đời thử nghiệm.
- ✅ **Môi trường thử nghiệm biệt lập**: Mỗi thử nghiệm có không gian làm việc độc lập, được dọn dẹp tự động (cho các thao tác tệp) và bộ định tuyến HTTP, ngăn chặn sự giao thoa giữa các thử nghiệm.
- ✅ **Điều khiển bằng khẳng định**: Xác minh kết quả thử nghiệm bằng hàm `assert`, báo cáo thông báo lỗi rõ ràng khi thất bại.
- ✅ **Mô phỏng tương tác nhiều bước**: Mô phỏng chính xác luồng hoàn chỉnh "suy nghĩ -> sử dụng công cụ -> phản hồi" của AI, kiểm tra logic `replyHandler` phức tạp.
- ✅ **Kiểm tra nhật ký hệ thống & lời nhắc**: Có khả năng kiểm tra thông tin cấp hệ thống được trả về AI sau khi thực hiện công cụ và thậm chí truy xuất lời nhắc cuối cùng được gửi đến AI, đảm bảo logic và xử lý dữ liệu như mong đợi.
- ✅ **Báo cáo thử nghiệm chi tiết**: Tự động tạo các báo cáo tóm tắt thử nghiệm tương tác, đẹp mắt trong GitHub Actions, bao gồm thời lượng, nhật ký và chi tiết lỗi cho mỗi thử nghiệm.

> Với bản chất không xác định của nội dung do LLM tạo ra, công cụ này **không thể** đánh giá chất lượng của lời nhắc hoặc giá trị của nội dung do AI tạo ra. Giá trị cốt lõi của nó nằm ở việc đảm bảo tính đúng đắn của các phần lập trình của vai trò.

## 🚀 Bắt đầu nhanh

Thiết lập thử nghiệm tự động cho dự án vai trò fount của bạn chỉ trong ba bước.

### Bước 1: Tạo tệp quy trình làm việc

Trong thư mục gốc của dự án vai trò của bạn, hãy tạo tệp cấu hình CI: `.github/workflows/CI.yml`.

### Bước 2: Điền vào mẫu

Dán nội dung sau vào tệp `CI.yml`. Nó sẽ tự động chạy thử nghiệm khi đẩy mã.

```yaml
name: Test Running

permissions:
  contents: read
  actions: write # Bắt buộc để cập nhật bộ đệm ẩn

on:
  # Cho phép kích hoạt thủ công
  workflow_dispatch:
  # Tự động kích hoạt khi tệp .mjs thay đổi
  push:
    paths:
      - '**.mjs'
    # Bỏ qua các lần đẩy thẻ để tránh kích hoạt khi phát hành phiên bản
    tags-ignore:
      - '*'
    # Cho phép đẩy từ bất kỳ nhánh nào
    branches:
      - '*'

jobs:
  test-running:
    runs-on: ubuntu-latest
    steps:
      - uses: steve02081504/fount-charCI@master
        with:
          # Chỉ định đường dẫn đến tập lệnh thử nghiệm CI của bạn
          CI-filepath: .github/workflows/CI.mjs
          # (Tùy chọn) Chỉ định tên người dùng cho CI, mặc định là "CI-user"
          # CI-username: my-ci-user
```

### Bước 3: Tạo tập lệnh thử nghiệm CI

Trong thư mục gốc của dự án vai trò của bạn, hãy tạo tệp nhập CI: `.github/workflows/CI.mjs`. Dưới đây là một mẫu thử nghiệm cơ bản, hiện đại:

```javascript
// fountCharCI được tự động đưa vào phạm vi toàn cục và có thể được sử dụng trực tiếp
const CI = fountCharCI;

// --- Trường hợp thử nghiệm 1: Xử lý dự phòng không có nguồn AI ---
await CI.test('noAI Fallback', async () => {
	// Xóa nguồn AI để kiểm tra trình xử lý dự phòng
	await CI.char.interfaces.config.SetData({ AIsource: '' });
	// runOutput không có đối số mô phỏng một yêu cầu trống hoặc mặc định
	await CI.runOutput();
	// Nếu không có lỗi nào được đưa ra, thử nghiệm sẽ thành công
});

// --- Trường hợp thử nghiệm 2: Cuộc trò chuyện AI cơ bản ---
await CI.test('Basic AI Response', async () => {
	// Đảm bảo nguồn AI được đặt
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });

	// Mô phỏng đầu vào của người dùng "Xin chào" và kiểm tra nội dung cuối cùng được trả về bởi vai trò
	const { reply } = await CI.runInput('Xin chào');

	// Khẳng định rằng đầu ra cuối cùng của vai trò khớp với những gì nguồn AI trả về
	// Nguồn AI giả lập CI mặc định trả về "Nếu tôi không bao giờ gặp lại bạn, chào buổi sáng, chào buổi chiều và chúc ngủ ngon."
	CI.assert(reply.content.includes('chào buổi sáng'), 'Nhân vật không trả về chính xác nội dung AI.');
});
```

Sau khi hoàn thành các bước này, quy trình thử nghiệm sẽ tự động chạy mỗi khi bạn đẩy bản cập nhật tệp `.mjs` vào kho lưu trữ GitHub của mình.

## 📖 Tham chiếu API CI

`fount-charCI` cung cấp một API ngắn gọn nhưng mạnh mẽ để xây dựng các thử nghiệm của bạn.

### Xác định thử nghiệm

#### `CI.test(name, asyncFn, options)`

Xác định một khối thử nghiệm. Nó có thể là một thử nghiệm cấp cao nhất hoặc được lồng trong các khối `test` khác để tạo thành các thử nghiệm con.

- `name` (Chuỗi): Mô tả về thử nghiệm.
- `asyncFn` (Hàm): Một hàm không đồng bộ chứa logic thử nghiệm.
- `options` (Đối tượng, Tùy chọn): Các tùy chọn cấu hình cho hành vi của thử nghiệm.
  - `start_emoji` (Chuỗi): Biểu tượng cảm xúc được hiển thị khi thử nghiệm bắt đầu. Mặc định là `🧪`.
  - `success_emoji` (Chuỗi): Biểu tượng cảm xúc được hiển thị khi thử nghiệm thành công. Mặc định là `✅`.
  - `fail_emoji` (Chuỗi): Biểu tượng cảm xúc được hiển thị khi thử nghiệm thất bại. Mặc định là `❌`.

#### Kiểm tra đồng thời & tuần tự

`CI.test` trả về một đối tượng giống như Promise, giúp việc kiểm soát luồng thực thi trở nên rất đơn giản.

- **Thực thi tuần tự**: Sử dụng `await` khi gọi `CI.test` nếu bạn muốn các thử nghiệm chạy lần lượt theo thứ tự.
- **Thực thi đồng thời**: Bạn có thể gọi nhiều thử nghiệm độc lập mà không cần `await` để chúng chạy song song.

### Hook kiểm tra

Các hàm này cho phép bạn thực thi mã ở các điểm khác nhau trong vòng đời thử nghiệm, lý tưởng để thiết lập và gỡ bỏ các môi trường thử nghiệm dùng chung.

- `CI.beforeAll(asyncFn)`: Chạy một lần trước tất cả các thử nghiệm trong phạm vi hiện tại (trong một khối `test`).
- `CI.afterAll(asyncFn)`: Chạy một lần sau khi tất cả các thử nghiệm trong phạm vi hiện tại đã kết thúc.
- `CI.beforeEach(asyncFn)`: Chạy trước mỗi thử nghiệm trong phạm vi hiện tại.
- `CI.afterEach(asyncFn)`: Chạy sau khi mỗi thử nghiệm trong phạm vi hiện tại đã kết thúc.

```javascript
// Ví dụ: Sử dụng hook và dữ liệu ngữ cảnh để quản lý cơ sở dữ liệu giả lập
CI.test('Kiểm tra với cơ sở dữ liệu dùng chung', async () => {
	CI.beforeAll(() => {
		console.log('Đang khởi tạo cơ sở dữ liệu giả lập...');
		// Sử dụng đối tượng context.data để lưu trữ các tài nguyên dùng chung trong phạm vi
		CI.context.data.mockDB = { users: { 'steve': { visits: 0 } } };
	});

	CI.afterAll(() => {
		const finalCount = CI.context.data.mockDB.users.steve.visits;
		console.log(`Kiểm tra cơ sở dữ liệu hoàn tất. Số lượt truy cập cuối cùng: ${finalCount}`);
	});

	CI.test('Lượt truy cập của người dùng tăng bộ đếm', () => {
		CI.context.data.mockDB.users.steve.visits++;
		CI.assert(CI.context.data.mockDB.users.steve.visits > 0, 'Số lượt truy cập phải lớn hơn 0');
	});
});
```

### Ngữ cảnh thử nghiệm

#### `CI.context`

Một đối tượng kỳ diệu cung cấp quyền truy cập vào môi trường biệt lập của **thử nghiệm hiện tại**.

- `CI.context.workSpace`:
  - `path` (Chuỗi): Đường dẫn tuyệt đối đến thư mục làm việc duy nhất của thử nghiệm hiện tại.
- `CI.context.http`:
  - `router` (Bộ định tuyến Express): Một phiên bản bộ định tuyến Express dành riêng cho thử nghiệm này.
  - `url` (Chuỗi): URL đầy đủ để truy cập bộ định tuyến chuyên dụng của thử nghiệm này.
- `CI.context.data` (Đối tượng): Một đối tượng trống được sử dụng để truyền dữ liệu giữa các hook của thử nghiệm và phần thân của nó.

### Mô phỏng tương tác

#### `CI.runInput(input, request)`

Mô phỏng một **người dùng gửi tin nhắn** cho vai trò.

- `input` (Chuỗi | Đối tượng): Đầu vào của người dùng.
- `request` (Đối tượng, Tùy chọn): Một đối tượng yêu cầu một phần để ghi đè các tham số yêu cầu mặc định.
- **Trả về** (Đối tượng): Một đối tượng chứa thông tin gỡ lỗi chi tiết:
  - `reply` (Đối tượng): Kết quả cuối cùng được trả về bởi `GetReply` của vai trò.
  - `prompt_struct` (Đối tượng): Lời nhắc có cấu trúc được gửi đến AI.
  - `prompt_single` (Chuỗi): Lời nhắc được gửi đến AI, được chuyển đổi thành một chuỗi duy nhất.

#### `CI.runOutput(output, request)`

Mô phỏng **đầu ra của AI** để kiểm tra `replyHandler` của vai trò.

- `output` (Chuỗi | Mảng | Hàm): Nội dung mô phỏng được trả về bởi AI.
  - **Chuỗi**: Mô phỏng AI trả về trực tiếp chuỗi này.
  - **Mảng**: Mô phỏng một tương tác nhiều bước. Mỗi phần tử trong mảng, có thể là một chuỗi hoặc một hàm, được sử dụng tuần tự làm giá trị trả về của AI.
  - **Hàm**: Tự động tạo đầu ra của AI.
    - **Không đồng bộ**: Hàm có thể là `async`.
    - **Tham số**: Hàm nhận một đối tượng `result` chứa `prompt_single` và `prompt_struct` làm đối số của nó.
    - **Giá trị trả về**: Giá trị trả về của hàm trở thành đầu ra **tiếp theo** của AI trong chuỗi.
    - **Trường hợp sử dụng**: Điều này cực kỳ hữu ích để đưa ra các khẳng định hoặc thực hiện logic phức tạp giữa một tương tác nhiều bước.

- `request` (Đối tượng, Tùy chọn): Tương tự như `CI.runInput`.
- **Trả về** (Đối tượng): Kết quả cuối cùng từ `GetReply` của vai trò.

#### Đối tượng `result`

Giá trị trả về của các hàm tương tác (hoặc thuộc tính `reply` của chúng) bắt nguồn từ giá trị trả về `GetReply` của vai trò và thường bao gồm:

- **`content`** (Chuỗi): Nội dung văn bản cuối cùng được trình bày cho người dùng.
- **`logContextBefore`** (Mảng|Không xác định): Một mảng các nhật ký tin nhắn ghi lại tất cả lịch sử trước khi `content` cuối cùng được tạo, bao gồm các tin nhắn có vai trò `tool` (kết quả thực hiện công cụ), vai trò `user` và vai trò `char`.

### Công cụ tiện ích

- `CI.assert(condition, message)`: Thực hiện một khẳng định.
- `CI.char`: Một lối tắt để truy cập đối tượng phiên bản vai trò hiện được tải.
- `CI.sleep(ms)`: Tạm dừng thực thi trong số mili giây được chỉ định.
- `CI.wait(fn, timeout)`: Thăm dò hàm `fn` cho đến khi nó trả về một giá trị đúng hoặc hết thời gian chờ.

## 💡 Sử dụng nâng cao

### Kiểm tra các hàm thao tác tệp

Bạn có thể kiểm tra một cách an toàn các hàm đọc và ghi tệp bằng cách sử dụng `CI.context.workSpace`.

**Ví dụ:** Kiểm tra hàm `<run-bash>`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Hàm: <run-bash>', async () => {
	// Sử dụng đường dẫn không gian làm việc biệt lập
	const testDir = path.join(CI.context.workSpace.path, 'bash_test_dir');

	const result = await CI.runOutput([
		`<run-bash>mkdir ${testDir}</run-bash>`,
		'Thư mục đã được tạo.'
	]);

	CI.assert(fs.existsSync(testDir), '<run-bash> không tạo được thư mục.');
	CI.assert(result.content === 'Thư mục đã được tạo.', 'Tin nhắn cuối cùng không chính xác.');
});
```

### Kiểm tra duyệt web (với các khẳng định bước trung gian)

Bạn có thể xây dựng các thử nghiệm tương tác mạng phức tạp bằng cách sử dụng `CI.context.http` và đối số hàm của `runOutput`.

**Ví dụ:** Kiểm tra hàm `<web-browse>` và xác thực nội dung lời nhắc của nó.

```javascript
const CI = fountCharCI;

CI.beforeEach(async () => {
	await CI.char.interfaces.config.SetData({ AIsource: 'CI' });
});

CI.test('Hàm: <web-browse>', async () => {
	const { router, url, root } = CI.context.http;
	const webContent = '<html><body><p>Đây là một đoạn văn thử nghiệm.</p></body></html>';

	router.get(root, (req, res) => res.send(webContent));

	const result = await CI.runOutput([
		// 1. AI quyết định duyệt trang
		`<web-browse><url>${url}</url></web-browse>`,

		// 2. Sử dụng một hàm để xác thực bước trung gian và cung cấp câu trả lời tiếp theo của AI
		async (midResult) => {
			// Khẳng định: Kiểm tra xem lời nhắc được gửi đến AI có bao gồm nội dung trang web không
			const systemLog = midResult.prompt_struct.find(log => log.role === 'tool');
			CI.assert(systemLog.content.includes('Đây là một đoạn văn thử nghiệm'), 'Nội dung web không có trong lời nhắc.');

			// Trả về câu trả lời cuối cùng của AI
			return 'Đoạn văn nói: Đây là một đoạn văn thử nghiệm.';
		}
	]);

	// Khẳng định: Kiểm tra xem nội dung cuối cùng được cung cấp cho người dùng có chính xác không
	CI.assert(result.content.includes('Đoạn văn nói'), 'Câu trả lời cuối cùng không chính xác.');
});
```

## Vẫn cảm thấy lạc lõng?

Hãy xem cách vai trò fount đầu tiên trên thế giới, [`Gentian`](https://github.com/steve02081504/GentianAphrodite/blob/master/.github/workflows/CI.mjs), thực hiện điều đó!
