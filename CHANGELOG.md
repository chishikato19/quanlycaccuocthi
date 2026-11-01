# Changelog

Tất cả các thay đổi đáng chú ý của dự án **Hệ Thống Báo Cáo & Quản Lý Cuộc Thi Giáo Viên** được ghi nhận chi tiết tại file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/)
và tuân thủ [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [1.3.3] - 2026-11-01
### Tương thích linh hoạt biến môi trường Neon/Vercel (Enhanced Database Auto-Detection)
- **Tự động nhận diện đa biến môi trường (`DATABASE_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `DATABASE_URL_UNPOOLED`):**
  - Khắc phục trường hợp Vercel Marketplace inject các tên biến khác nhau như `POSTGRES_PRISMA_URL` hoặc `POSTGRES_URL` thay vì `DATABASE_URL`.
  - Tự động map sang `DATABASE_URL` trong cả runtime và build-time (`scripts/vercel-build.js`, `prisma/seed-if-empty.js`, `src/lib/db.ts`).
  - Git push phiên bản mới giúp tự động kích hoạt build lại trên Vercel mà người dùng không cần bấm redeploy thủ công.

---

## [1.3.2] - 2026-11-01
### Thêm mới & Cứu trợ khẩn cấp (Emergency Fallback & Zero-Config Live)
- **Tầng dữ liệu dự phòng Zero-Downtime ([`src/lib/mock-data.ts`](file:///e:/du_an_antigravity/bao_cao_cac_cuoc_thi_van_thu/src/lib/mock-data.ts)):**
  - Đảm bảo **người dùng luôn luôn đăng nhập được vào Super Admin** (`admin` / `1234`) ngay lập tức trên Vercel kể cả khi chưa tạo cơ sở dữ liệu đám mây PostgreSQL.
  - Toàn bộ các API chính (`/api/auth/login`, `/api/teachers`, `/api/competitions`, `/api/reports`, `/api/submissions`) tự động chuyển sang chế độ Demo thông minh nếu chưa có biến môi trường `DATABASE_URL`.
- **Thanh thông báo trạng thái CSDL trực quan trên giao diện:**
  - Bổ sung thanh thông báo ở đầu trang khi hệ thống đang chạy chế độ Xem trước, hướng dẫn 1-click kích hoạt PostgreSQL trên Vercel.
  - Khi người dùng thêm database PostgreSQL trên Vercel, hệ thống tự động nhận diện và chuyển sang lưu trữ vĩnh viễn không cần sửa code.

---

## [1.3.1] - 2026-11-01
### Sửa lỗi & Tương thích Vercel Serverless (Fixed & Vercel Readiness)
- **Khắc phục lỗi không đăng nhập được Super Admin trên Vercel (Lỗi CSDL Serverless):**
  - Chuyển đổi cấu hình Prisma Datasource sang **PostgreSQL** (`provider = "postgresql"`), tương thích hoàn toàn với kiến trúc Serverless phi máy chủ trên Vercel (kết nối Neon Postgres / Supabase / Vercel Postgres).
  - Khắc phục triệt để hạn chế của SQLite cục bộ (vốn bị lỗi quyền chỉ đọc `SQLITE_READONLY` và không lưu trữ vĩnh viễn trên Vercel Serverless Functions).
- **Tự động đồng bộ bảng & Khởi tạo dữ liệu trên Vercel (`scripts/vercel-build.js`):**
  - Tích hợp quy trình build thông minh: tự động chạy `prisma generate`, đồng bộ cấu trúc bảng qua `prisma db push` ngay trong quá trình build của Vercel mà không cần chạy migration thủ công.
  - Script tự động nạp dữ liệu `seed-if-empty.js`: Tự động khởi tạo tài khoản Tổng Quản Trị Super Admin (`admin` / `1234`), danh sách giáo viên trường và cuộc thi mẫu khi cơ sở dữ liệu mới được kết nối; không làm ảnh hưởng đến dữ liệu sẵn có.
- **Cơ chế tự phục hồi tài khoản Super Admin (Self-healing Auth):**
  - API `/api/auth/login` được bổ sung cơ chế kiểm tra tự động: Nếu CSDL chưa có Super Admin, hệ thống tự động khởi tạo ngay lập tức khi đăng nhập `admin` / `1234`.
  - Hiển thị thông báo hướng dẫn rõ ràng trên giao diện nếu CSDL chưa được cấu hình `DATABASE_URL`.

---

## [1.3.0] - 2026-11-01
### Thêm mới & Tối ưu (Added & Improved)
- **Tự động phân cấp thư mục con trên Google Drive (Hierarchical Drive Storage):**
  - Trong thư mục gốc chung của trường hoặc thư mục riêng của Admin, mỗi cuộc thi khi được tạo sẽ **tự động sinh ra một thư mục con riêng biệt** mang tên: `[Cuộc thi] + Tên cuộc thi`.
  - Toàn bộ ảnh minh chứng của giáo viên nộp cho cuộc thi đó được lưu thẳng vào đúng thư mục con tương ứng, không bị lẫn lộn giữa các cuộc thi.
  - Thêm nút bấm trực tiếp **`[📁 Mở Thư Mục Drive]`** trên Thẻ cuộc thi và Trang chi tiết báo cáo, giúp BGH và các đoàn kiểm tra mở xem/tải trọn bộ ảnh gốc của cuộc thi chỉ với 1 click.
- **Hỗ trợ 2 nguồn tải ảnh minh chứng linh hoạt trên di động:**
  - `📷 Chụp Ảnh Trực Tiếp`: Mở camera điện thoại chụp giấy khen/chứng chỉ/màn hình thi ngay tại chỗ.
  - `🖼️ Lấy Từ Thư Viện Ảnh`: Mở album/bộ sưu tập ảnh của điện thoại hoặc máy tính để chọn ảnh chụp màn hình (screenshot) đã lưu từ trước.
- **Cấu hình Google Drive lai (Hybrid Personal Admin Drive):**
  - Cho phép tài khoản Admin cấu hình thư mục Google Drive cá nhân của mình để lưu minh chứng các cuộc thi do Admin đó phụ trách.
  - Thêm hộp thoại `DriveConfigModal` để Admin lưu link Drive cá nhân một lần, hệ thống tự động điền sẵn khi tạo cuộc thi mới.
  - Cơ chế tự động trích xuất Folder ID từ đường link chia sẻ Google Drive bất kỳ (`extractDriveFolderId`).
  - Fallback an toàn: Nếu Admin không điền link riêng, hệ thống tự động lưu vào thư mục Drive chung của Super Admin (Nhà trường).

---

## [1.2.0] - 2026-11-01
### Thêm mới (Added)
- **Tách biệt hoàn toàn tài khoản Tổng Quản Trị (Super Admin):**
  - Tài khoản Super Admin (`admin`) là tài khoản quản trị hệ thống độc lập, hoàn toàn không nằm trong danh sách giáo viên của trường và không bị gán tham gia các cuộc thi chuyên môn.
  - Màn hình đăng nhập phân tách 2 cổng rõ ràng: Cổng dành cho Giáo viên trường (chọn tên + PIN) và Cổng dành cho Super Admin (tên đăng nhập + mật mã riêng).
- **Phân cấp quyền hạn chuyên biệt (Role Delegation):**
  - Chỉ duy nhất Super Admin có đặc quyền phân công hoặc thu hồi quyền `ADMIN` cho các giáo viên trong trường (thao tác 1 chạm trực tiếp trên bảng danh sách).
  - Các tài khoản Admin thường không thể tự ý phân quyền cho người khác, đảm bảo tính bảo mật và kỷ luật quản lý.

---

## [1.1.0] - 2026-11-01
### Tối ưu (Improved)
- **Tối ưu trải nghiệm Mobile-First 100%:**
  - Cấu hình thẻ Viewport chuẩn cho thiết bị di động (`width=device-width, initialScale=1, maximumScale=1, userScalable=false`), chống lỗi phóng to màn hình ngoài ý muốn trên iOS và Android.
  - Chuẩn hóa toàn bộ nút bấm cốt lõi (*"Nộp minh chứng"*, *"Xem báo cáo"*, *"Xác nhận nộp"*, v.v.) đạt chiều cao chạm tối thiểu **42px – 44px**, thuận tiện cho thao tác một tay bằng ngón cái.
  - Tối ưu giao diện xem ảnh phóng to (Evidence Lightbox) trên màn hình nhỏ: Nút đóng to rõ, ảnh tự động co giãn tỷ lệ màn hình, công cụ xoay ảnh 90° xử lý ảnh chụp điện thoại bị nghiêng/ngược.
  - Thanh tiêu đề và các bộ lọc tự động xuống dòng và co giãn mượt mà từ màn hình di động 360px trở lên.

---

## [1.0.0] - 2026-11-01
### Thêm mới (Added)
- **Khởi tạo kiến trúc nền tảng:**
  - Xây dựng hệ thống bằng **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, và **Prisma ORM**.
  - Áp dụng kiến trúc mô-đun hóa **Feature-Driven Architecture** (`src/features/`), cách ly hoàn toàn logic giữa các tính năng: auth, competitions, submissions, reports, teachers.
  - Thiết lập bộ quy tắc chuẩn dành cho AI (`AI_RULES.md`) và tài liệu giới thiệu (`README.md`).
- **Phân công công việc thông minh:**
  - Tích hợp bộ chọn `DepartmentSelector`: 1 chạm chọn toàn bộ giáo viên trong một tổ chuyên môn (Toán - Tin, Ngữ Văn, Ngoại Ngữ, KHTN, KHXH, Văn Phòng...) kết hợp chọn lẻ từng cá nhân.
  - Hiển thị thông số trực tiếp: `Đã chọn: X / Y giáo viên`.
- **Vòng đời trạng thái công việc toàn diện:**
  - Hỗ trợ các trạng thái: `Đang diễn ra`, `Sắp hết hạn`, `Quá hạn`, `Đã kết thúc sớm`.
  - Quyền hạn người tạo việc: Chỉnh sửa thông tin, Gia hạn thời gian (Extend deadline), Kết thúc sớm (Close early).
  - Tùy chọn **"Cho phép nộp khi quá hạn"**: Tiếp nhận bài nộp muộn và tự động gắn nhãn `NỘP MUỘN` phục vụ đánh giá thi đua.
  - Tùy chọn **"Cho phép người dùng xem tiến độ"**: Hiển thị thanh tỷ lệ % hoàn thành cho giáo viên theo dõi.
- **Xác thực mã PIN cá nhân:**
  - Đăng nhập siêu tốc bằng cách chọn tên trong danh sách và nhập mã PIN 4 số (mặc định: `1234`).
  - Chức năng tự đổi mã PIN cá nhân cho từng người dùng.
  - Chức năng Admin/Super Admin reset mã PIN về mặc định khi giáo viên quên mật khẩu.
- **Quản lý danh sách giáo viên & Nạp dữ liệu Excel:**
  - Hỗ trợ bôi đen copy/paste dạng bảng trực tiếp từ Excel (`Ctrl + C` và `Ctrl + V`).
  - Bộ phân tích TSV (`excel-parser.ts`) tự động nhận diện cột (Họ tên, Tổ bộ môn, SĐT, Vai trò), kiểm tra dữ liệu hợp lệ và hiển thị bảng xem trước (preview) trước khi lưu.
  - Thêm mới lẻ, chỉnh sửa thông tin, xóa giáo viên.
- **Nộp minh chứng & Nén ảnh tự động:**
  - Tích hợp thư viện `browser-image-compression` nén ảnh tại client xuống dung lượng tối ưu ~150-200 KB, giúp nộp siêu nhanh qua mạng 3G/4G và tiết kiệm tối đa dung lượng máy chủ.
  - Lưu trữ minh chứng trên Google Drive qua Service Account.
- **Trình duyệt minh chứng Lightbox Viewer:**
  - Xem ảnh phóng to sắc nét, thu nhỏ, phóng to, xoay ảnh 90°.
  - Duyệt tuần tự liên tục giữa các giáo viên bằng nút mũi tên `← Trước` / `Sau →` hoặc phím mũi tên bàn phím mà không cần đóng mở popup.
- **Xuất báo cáo đa định dạng:**
  - Xuất bảng tính Excel (`.xlsx`) tự động căn độ rộng cột và định dạng trạng thái tham gia.
  - Xuất thẻ báo cáo đồ họa độ nét cao dạng ảnh PNG (`.png`).
  - Nút **"Sao chép ảnh vào Clipboard"** để dán trực tiếp (`Ctrl + V`) vào nhóm Zalo của trường.
  - Nút **"Copy DS Chưa Nộp"** tự động trích xuất danh sách giáo viên chưa nộp kèm lời nhắc để gửi đôn đốc qua Zalo.
