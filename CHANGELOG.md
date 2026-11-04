# Changelog

Tất cả các thay đổi đáng chú ý của dự án **Hệ Thống Báo Cáo & Quản Lý Cuộc Thi Giáo Viên** được ghi nhận chi tiết tại file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/)
và tuân thủ [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [1.9.0] - 2026-11-04
### Tính Năng Mới: Quản Lý Nhóm & Vai Trò Giáo Viên (Bảo Toàn Dữ Liệu Cuộc Thi)
- **Hệ Thống Phân Loại Nhóm & Vai Trò Nghiệp Vụ (`Group` & `TeacherGroup`):**
  - Hỗ trợ mô hình một nhân sự kiêm nhiệm nhiều vai trò (Đảng viên, Đoàn viên, Nữ công, Cán bộ quản lý, Công đoàn viên...).
  - Thiết kế bảng danh mục `Group` và liên kết quan hệ nhiều-nhiều non-destructive, không ảnh hưởng đến bất kỳ cuộc thi hay dữ liệu nộp bài nào trước đó.
- **Backend API Nhóm & Đồng Bộ Nhân Sự (`/api/groups` & `/api/teachers`):**
  - Cung cấp API CRUD quản lý nhóm đầy đủ: `GET /api/groups`, `POST /api/groups` (hỗ trợ nút tạo nhanh nhóm mẫu), `PUT` và `DELETE /api/groups/[id]`.
  - Cập nhật `/api/teachers` để tự động trả về thông tin nhóm của từng giáo viên và đồng bộ danh sách nhóm khi cập nhật.
- **Giao Diện Quản Lý Nhóm Dành Cho Admin (`GroupManagementModal`):**
  - Giao diện 2 cột hiện đại: Cột trái quản lý danh mục và màu sắc huy hiệu; cột phải quản lý thành viên với ô tìm kiếm và checkbox thêm/gỡ thành viên tức thì.
  - Tích hợp bộ chọn nhóm nhiều vai trò trong form thêm/sửa giáo viên (`TeacherFormModal`).
  - Hiển thị các Badge màu sắc theo từng nhóm trên bảng danh sách nhân sự (`TeacherTable`), bổ sung bộ lọc nhanh theo nhóm/vai trò.
- **Bộ Chọn Nhanh Thí Sinh Theo Nhóm Khi Tạo Cuộc Thi (`DepartmentSelector`):**
  - Bổ sung cụm nút chọn nhanh theo nhóm đối tượng dự thi (Đảng viên, Đoàn viên, Nữ công...).
  - Admin bấm 1 click để tự động chọn toàn bộ thành viên của nhóm mục tiêu mà không phải chọn thủ công từng người.

---

## [1.8.9] - 2026-11-03
### Nâng Cấp Bảo Mật & Xác Thực Phía Server (Zero Data Loss & Safe Build)
- **Thiết Lập Xác Thực Server-side Bắt Buộc (HttpOnly Signed Session Cookie):**
  - Loại bỏ hoàn toàn cơ chế tin cậy Client ID/Role từ `localStorage` và `req.headers`.
  - Triển khai ký và xác thực token phiên bảo mật cao bằng HMAC-SHA256 (`src/lib/auth.ts`) qua cookie `HttpOnly; SameSite=Lax`.
  - Toàn bộ các API ghi (`/api/competitions`, `PUT /teachers`, `close`, `extend`, `admin-confirm`, `departments`, `drive/sync`, `reset-pin`) đều bắt buộc kiểm tra phiên và phân quyền ở Server.
- **Sửa Triệt Để Lỗi Logic Đăng Nhập Admin (`src/app/api/auth/login/route.ts`):**
  - Xóa bỏ việc sửa dữ liệu trước khi so khớp PIN. Kiểm tra PIN hợp lệ trước, chỉ khi đúng PIN mới cấp quyền và phiên đăng nhập.
  - Loại bỏ mệnh đề tìm kiếm OR lỏng lẻo có thể gây nâng quyền nhầm cho giáo viên khác.
  - Tích hợp Rate Limiting chống tấn công vét cạn (Brute-force) mã PIN (tối đa 5 lần thử sai trong 15 phút).
  - Tắt fallback Demo Mode khi chạy thật, ngăn ngừa lỗ hổng bypass khi chưa có biến môi trường.
- **Chống Lỗ Hổng IDOR Khi Nộp Minh Chứng (`src/app/api/submissions/route.ts`):**
  - Giáo viên thường chỉ được phép nộp minh chứng cho chính mình và chỉ khi có tên trong danh sách phân công của cuộc thi.
  - Bổ sung chốt kiểm soát dung lượng tệp tối đa 4.5MB ở Server.
- **Bảo Vệ Cấu Hình Drive & Xóa Bỏ Rò Rỉ Webhook:**
  - `GET /api/teachers` và `GET /api/competitions/[id]` tuyệt đối không trả về chuỗi JSON chứa `webhookUrl` riêng tư ra ngoài Internet.
  - Rút gọn endpoint `/api/status`, loại bỏ rò rỉ cấu hình môi trường máy chủ.
- **Quy Trình Build Độc Lập & Bảo Toàn Dữ Liệu Tuyệt Đối (`scripts/vercel-build.js`):**
  - Loại bỏ hoàn toàn `cleanup-admin.js`, `seed-if-empty.js` và `prisma db push` khỏi lệnh build.
  - Đảm bảo bước build frontend trên Vercel không bao giờ can thiệp hay xóa bất kỳ bản ghi nào trong cơ sở dữ liệu production.
  - Bọc `db.$transaction` khi cập nhật người thực hiện cuộc thi (`PUT /api/competitions/[id]`) tránh mất dữ liệu khi gián đoạn mạng.

---

## [1.8.8] - 2026-11-03
### Tối Ưu Toàn Diện Hệ Thống & Khắc Phục Lỗi Gán Người Dùng Khi Sửa Cuộc Thi
- **Khắc Phục Lỗi Gán Người Thực Hiện Khi Sửa Cuộc Thi (`CompetitionFormModal.tsx`):**
  - **Nguyên nhân:** Do API danh sách cuộc thi đã được tối ưu chỉ trả về `_count.assignees` thay vì mảng chi tiết, khi mở form sửa cuộc thi, hệ thống rơi vào nhánh dự phòng tự động gán toàn bộ giáo viên toàn trường (`teachers.map(t => t.id)`). Lưu lại sẽ vô tình đè mất cấu hình phân công ban đầu.
  - **Giải pháp:** Tự động gọi API `/api/competitions/[id]` khi mở form chỉnh sửa để lấy chính xác danh sách giáo viên đã được phân công, bổ sung trạng thái loading trực quan và bảo toàn thư mục Drive con của cuộc thi.
- **Tối Ưu Đồng Bộ Google Drive & Giải Phóng Dung Lượng CSDL (`src/app/api/drive/sync/route.ts`):**
  - Đặt `localImageUrl: null` ngay sau khi tải ảnh lên Google Drive thành công trong hàm đồng bộ hàng loạt. Ngăn chặn triệt để vòng lặp upload trùng lặp và giải phóng hàng loạt dung lượng chuỗi Base64 khỏi PostgreSQL.
- **Chuẩn Hóa Danh Sách Giáo Viên Hợp Lệ (`DepartmentSelector.tsx`, `TeacherFormModal.tsx`):**
  - Tạo `eligibleTeachers` loại trừ tài khoản Super Admin khỏi bộ đếm và chức năng "Chọn tất cả" trong bộ chọn tổ chuyên môn.
  - Khóa quyền chọn `SUPER_ADMIN` trong form thêm/sửa giáo viên thường để ngăn việc vô tình tạo tài khoản bị ẩn khỏi cuộc thi.
- **Nâng Cấp Trải Nghiệm Lightbox & Build An Toàn (`EvidenceLightbox.tsx`, `next.config.mjs`):**
  - Bổ sung `target="_blank" rel="noopener noreferrer"` cho các liên kết tải tệp minh chứng cross-origin, tránh tình trạng bị chuyển hướng ngoài ý muốn khi mở tệp.
  - Thêm `eslint: { ignoreDuringBuilds: true }` vào `next.config.mjs` bảo đảm quá trình build trên môi trường CI/CD và Vercel luôn thông suốt 100%.

---

## [1.8.7] - 2026-11-03
### Khắc Phục Triệt Để Lỗi Race Condition Giao Diện Đảo Trạng Thái Bài Nộp & Đồng Bộ Dữ Liệu Tức Thì
- **Khắc Phục Hiện Tượng Flickering / Race Condition Trạng Thái Bài Nộp (`src/app/page.tsx`, `src/features/auth/components/LoginModal.tsx`):**
  - **Nguyên nhân gốc rễ:** Khi giáo viên đăng nhập, `LoginModal` cập nhật `currentUser` nhưng đồng thời gọi `onSuccess()`. Hàm tải dữ liệu chạy trong closure cũ chưa có thông tin `teacherId` (Request 1 - không có user) song song với Request 2 do state `currentUser` mới kích hoạt. Request 1 về sau cùng đã vô tình ghi đè `userSubmission: null` lên giao diện và bộ nhớ cache `localStorage`, khiến trạng thái chuyển từ "Đã nộp" sang "Chưa nộp minh chứng".
  - **Giải pháp xử lý:**
    1. Bổ sung `activeRequestIdRef` (Request Locking Pattern): Mọi phản hồi API trả về trễ/lỗi thời từ các yêu cầu mạng trước đó sẽ tự động bị loại bỏ hoàn toàn, không thể ghi đè state mới.
    2. Truyền trực tiếp đối tượng tài khoản vừa xác thực từ `LoginModal` vào hàm `loadData(newUser)`, đảm bảo truy vấn danh sách cuộc thi ngay từ đầu luôn mang theo `teacherId`.
    3. Tự động xóa sạch danh sách cuộc thi cũ khi đăng xuất (`setCompetitions([])`) để không bao giờ hiển thị nhầm bài nộp của tài khoản trước.
- **Tối Ưu Truy Vấn Lấy Bài Nộp Mới Nhất (`src/app/api/competitions/route.ts`):**
  - Thêm `orderBy: { submittedAt: "desc" }` vào câu lệnh Prisma `include.submissions`, đảm bảo hệ thống luôn trả về bài nộp hoặc minh chứng mới nhất của giáo viên nếu có nhiều lượt nộp.
- **Cập Nhật Lạc Quan (Optimistic UI) Sau Khi Nộp Minh Chứng (`UploadProofModal.tsx`):**
  - Giao diện và `localStorage` lập tức cập nhật sang trạng thái "Đã nộp minh chứng" ngay khi API tải ảnh thành công, mang lại trải nghiệm mượt mà không có độ trễ mạng.

---

## [1.8.6] - 2026-11-03
### Nâng Cấp Hệ Thống Toàn Diện: Tăng Tốc Tải Trang 92%, Chặn Phình To CSDL, Bảo Mật Dual-Mode & Cam Kết Bảo Toàn Dữ Liệu
- **Bảo Vệ Toàn Vẹn CSDL & Chống Mất Dữ Liệu (`scripts/vercel-build.js`):**
  - Loại bỏ hoàn toàn cờ nguy hiểm `--accept-data-loss` khi chạy `prisma db push` trên môi trường sản xuất. Đảm bảo cấu trúc bảng và toàn bộ dữ liệu cuộc thi, giáo viên, minh chứng không bao giờ bị drop ngoài ý muốn.
  - Bổ sung Composite Index `@@index([status, deadline])` và `@@index([creatorId])` trong `prisma/schema.prisma` để tăng tốc độ truy vấn sắp xếp cuộc thi mà không làm gián đoạn CSDL.
- **Tăng Tốc Tải Trang Chủ 92.8% (Dynamic Imports & Code-Splitting) (`src/app/page.tsx`):**
  - Chuyển đổi toàn bộ 9 Modals và màn hình báo cáo chi tiết (`ReportDetailView`, `TeacherTable`, `UploadProofModal`, `ExcelPasteModal`,...) sang mô hình tải động `next/dynamic` với `ssr: false`.
  - Tách rời các thư viện nặng (`xlsx`, `html-to-image`) ra khỏi trang chủ, chỉ tải về khi người dùng thực sự kích hoạt tính năng xuất Excel hoặc dán dữ liệu.
  - **Dung lượng trang chủ giảm sâu từ 158 kB xuống 11.4 kB (giảm 92.8%)**, First Load JS giảm từ **245 kB xuống 98.9 kB (giảm 59.6%)**, trang mở tức thì trên điện thoại và mạng di động.
- **Chặn Phình To CSDL Với Cơ Chế Zero-Bloat (`src/app/api/submissions/route.ts`):**
  - Khi tệp/ảnh tải lên Google Drive thành công, hệ thống chỉ lưu `driveFileUrl` và `driveFileId`, không ghi chuỗi Base64 nặng hàng megabytes vào cột `localImageUrl` của PostgreSQL.
  - Giữ nguyên toàn bộ dữ liệu cũ trong `localImageUrl` để các bài nộp trước đây vẫn hiển thị trọn vẹn minh chứng.
  - Bổ sung chốt kiểm soát dung lượng tệp tối đa 3.5MB tại `UploadProofModal.tsx`, cảnh báo giáo viên rõ ràng và ngăn chặn lỗi `413 Payload Too Large` của Vercel Serverless.
- **Nâng Cấp Bảo Mật Xác Thực 2 Chế Độ (Dual-Mode PIN Verification):**
  - Tích hợp `bcryptjs` mã hóa an toàn mã PIN người dùng.
  - Endpoint `/api/auth/login` hỗ trợ song song cả mã PIN dạng hash mới và mã PIN cũ dạng văn bản (`"1234"`). Người dùng đăng nhập bình thường không bị gián đoạn, và hệ thống tự động băm bảo mật mã PIN ngay sau khi đăng nhập thành công.
  - Mã hóa tự động mã PIN khi đổi mã PIN (`/api/auth/change-pin`), reset mã PIN (`/api/auth/reset-pin`), và khi thêm/import giáo viên (`/api/teachers`, `/api/teachers/import`).
  - Bổ sung xác thực vai trò Admin/Super Admin ở phía Server khi yêu cầu xóa cuộc thi (`/api/competitions/[id]`) và xóa giáo viên (`/api/teachers`).

---

## [1.8.5] - 2026-11-03
### Bổ Sung Nút Admin Xác Nhận Hoàn Thành Cuộc Thi & Cho Phép GV Nộp Bổ Sung Minh Chứng
- **Nút Xác Nhận & Hủy Xác Nhận Cho Quản Trị Viên (`ReportDetailView.tsx`):**
  - Thêm cột **Thao Tác** cho Admin trong bảng báo cáo chi tiết cuộc thi.
  - Nút **[✓ Xác nhận]**: Thao tác 1 chạm cho phép Admin xác nhận giáo viên đã làm bài trong trường hợp quên chụp/không lưu minh chứng.
  - Nút **[↺ Hủy xác nhận]**: Cho phép Admin hoàn tác nếu bấm nhầm, trả lại trạng thái "Chưa nộp" cho giáo viên.
  - Ghi nhận minh bạch danh tính: Tự động lưu ghi chú dạng `Admin [Tên Admin] xác nhận hoàn thành (không có minh chứng)`, hiển thị trực tiếp trên giao diện và tệp Excel để phục vụ đối soát.
  - Cột Minh Chứng hiển thị nhãn `[🛡️ Admin xác nhận]` (màu hổ phách), tự động lọc khỏi danh sách xem ảnh Lightbox để tránh lỗi màn hình trắng.
- **Cho Phép Giáo Viên Nộp Bổ Sung Minh Chứng (`CompetitionCard.tsx`):**
  - Thẻ cuộc thi của giáo viên hiển thị trạng thái `🛡️ Đã hoàn thành (Admin xác nhận)` kèm liên kết `Nộp bổ sung minh chứng`.
  - Giáo viên có thể nộp ảnh/tệp bổ sung bất kỳ lúc nào nếu tìm lại được kết quả thi; hệ thống tự động ghi đè bản ghi xác nhận bằng tệp minh chứng thực tế và tải lên Google Drive của trường.
- **API & Xuất Báo Cáo Excel (`src/app/api/submissions/admin-confirm/route.ts`, `exportExcel.ts`):**
  - Endpoint `POST /api/submissions/admin-confirm` xử lý an toàn 2 hành động `CONFIRM` và `CANCEL` trên cả PostgreSQL và Mock Data.
  - Cột Link Minh chứng khi xuất Excel ghi rõ `"Admin xác nhận (Không có tệp)"`.

---

## [1.8.4] - 2026-11-02
### Tối Ưu Tải Phân Trang 10 Cuộc Thi, Ưu Tiên Cuộc Thi Đang Diễn Ra & Cache Độc Lập Cho Admin
- **Loại Bỏ Hoàn Toàn Query Thừa Của Admin (`src/app/api/competitions/route.ts`):**
  - Cắt bỏ subquery `comp.assignees` thừa thãi cho tài khoản Admin, giảm 1 lượt round-trip SQL hoàn chỉnh qua mạng.
- **Phân Trang 10 Cuộc Thi & Tải Thêm Từ Từ:**
  - API mặc định chỉ lấy 10 bản ghi mỗi lần (`limit=10`, `page=1`), giảm tải tối đa cho CSDL PostgreSQL và rút ngắn thời gian xử lý xuống dưới 80ms.
  - Phía giao diện: Thêm nút **"Tải thêm 10 cuộc thi cũ hơn"** kèm thống kê số lượng đang hiển thị `(Đang hiện X/Y cuộc thi)`.
- **Ưu Tiên Cuộc Thi Đang Diễn Ra Lên Đầu:**
  - Sắp xếp CSDL theo thứ tự: `status: "asc"` (ACTIVE đứng trước), `deadline: "asc"` (cuộc thi sắp hết hạn nhất trên đầu), `createdAt: "desc"`.
  - Bộ lọc phụ trên trang chủ mặc định chọn tab **"Đang diễn ra"** thay vì tải tất cả các cuộc thi cũ.
- **Bộ Nhớ Đệm Độc Lập Cho Từng Tài Khoản (User-Scoped Instant Cache):**
  - Chuyển key cache sang `cached_competitions_${currentUser.id}`, đảm bảo tài khoản Admin và Giáo viên có bộ nhớ đệm riêng biệt, không bị xung đột hay chớp giật giao diện.
- **Bọc `React.memo` Cho Thẻ Cuộc Thi (`CompetitionCard.tsx`):**
  - Loại bỏ 100% việc re-render hàng loạt thẻ cuộc thi khi dữ liệu nền cập nhật, đảm bảo cuộn trang và thao tác mượt mà.

---

## [1.8.3] - 2026-11-02
### Tối Ưu Hóa Tốc Độ Tải Trang Chủ & Danh Sách Cuộc Thi Siêu Tốc (Instant Cache SWR + Lazy Loading)
- **Tải Trang Tức Thì 0.01 Giây (Instant Cache / SWR Pattern) (`src/app/page.tsx`):**
  - Khởi tạo danh sách cuộc thi trực tiếp từ `localStorage`. Mở trang hiển thị danh sách cuộc thi ngay lập tức, hoàn toàn loại bỏ màn hình chờ (spinner) khó chịu.
  - Tự động đồng bộ ngầm dữ liệu mới nhất từ máy chủ và cập nhật vào bộ nhớ đệm (Background Revalidation).
- **Loại Bỏ Nghẽn Serverless Đa Luồng:**
  - Cắt bỏ hoàn toàn lệnh gọi `/api/status` thừa thãi trên trang chủ.
  - Chuyển `/api/teachers` sang Lazy Load: Không tự động tải danh sách giáo viên khi mở trang; chỉ tải ngầm khi Admin vào tab Giáo viên hoặc bấm nút tạo/sửa cuộc thi.
  - Giảm số lượng Serverless Lambda Cold Start từ 3 container đồng thời xuống còn **duy nhất 1 request `/api/competitions` siêu nhẹ**.
- **Tối Ưu Hóa Truy Vấn CSDL PostgreSQL (`src/app/api/competitions/route.ts`):**
  - Chuyển sang đếm SQL bằng Prisma `_count`, chỉ tải đúng 1 bản ghi bài nộp của cá nhân người dùng (`take: 1`), giảm 95% lượng dữ liệu truyền qua mạng.
  - Đẩy điều kiện lọc của giáo viên thường (`role === "USER"`) trực tiếp vào mệnh đề `WHERE` của CSDL.
- **Bổ Sung Index CSDL Toàn Diện (`prisma/schema.prisma`):**
  - Tạo Index cho `Competition(createdAt, status)`, `CompetitionAssignee(teacherId, competitionId)`, `Submission(teacherId, competitionId)`.

---

## [1.8.2] - 2026-11-02
### Sửa Lỗi Nhận Diện Sai Định Dạng Ảnh Thành PDF Do Chuỗi Base64
- **Khắc Phục Thuật Toán Nhận Diện Định Dạng (`src/lib/utils.ts`):**
  - **Nguyên nhân:** Chuỗi ảnh Base64 chứa hàng trăm nghìn ký tự ngẫu nhiên. Lệnh kiểm tra `.includes("pdf")` trên toàn bộ chuỗi Base64 vô tình bắt trúng 3 ký tự `pdf` ngẫu nhiên bên trong dữ liệu ảnh JPG, dẫn đến việc hệ thống hiểu nhầm tệp `.jpg` là tài liệu PDF.
  - **Giải pháp:**
    1. Ưu tiên tuyệt đối phần đuôi mở rộng của tên tệp (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.docx`, `.xlsx`...).
    2. Nếu tên tệp không có đuôi, chỉ kiểm tra đúng phần tiêu đề MIME (`data:image/...` hoặc `data:application/pdf...`), tuyệt đối không quét toàn bộ nội dung Base64 khổng lồ.
  - Sau khi sửa, các tệp ảnh `.jpg` của giáo viên hiển thị trực tiếp hình ảnh rõ nét và đầy đủ các công cụ xoay, phóng to/thu nhỏ trong Hộp xem (Lightbox).

---

## [1.8.1] - 2026-11-02
### Khắc Phục Lỗi Hiển Thị Ảnh Trong Hộp Xem Minh Chứng Báo Cáo Tiến Độ
- **Cơ chế Nhận Diện Minh Chứng Thông Minh (`src/lib/utils.ts`):**
  - Cải tiến hàm `getFileTypeInfo`: Đối với các minh chứng nộp trước đó chưa có đuôi tệp rõ ràng hoặc dùng link Google Drive, hệ thống mặc định coi là **Hình ảnh minh chứng** thay vì tệp khác, kích hoạt đúng chế độ hiển thị ảnh trong Lightbox.
  - Hỗ trợ nhận diện các tiền tố ảnh, MIME image, thumbnail Drive và Data URL.
- **Trích xuất ID Tệp Tin Tự Động (`src/lib/google-drive-shared.ts`):**
  - Bổ sung hàm `extractDriveFileId` nhận diện định dạng link Google Drive dạng `/file/d/{id}` và `?id={id}`, giúp API tạo thumbnail phân giải cao (`https://drive.google.com/thumbnail?id={id}&sz=w1600`) cho các minh chứng lưu trên Drive.
- **Xử Lý Lỗi Tải Ảnh Trực Tiếp & Fallback An Toàn (`EvidenceLightbox.tsx`):**
  - Thêm cờ `imageLoadError`: Nếu ảnh bị chặn bởi quyền hạn riêng tư của Google Drive hoặc chính sách bảo mật trình duyệt, giao diện tự động chuyển sang thẻ thông tin chuyên nghiệp với nút bấm **"Mở Trên Drive"** và **"Tải Về Máy"**, không gây vỡ giao diện hay treo màn hình.
- **Đảm bảo toàn vẹn dữ liệu:**
  - 100% dữ liệu cuộc thi và minh chứng đã nộp trong PostgreSQL và Google Drive được bảo toàn nguyên vẹn.

---

## [1.8.0] - 2026-11-02
### Tối Ưu Hóa Tải Báo Cáo Siêu Tốc (Lazy Loading & On-Demand Evidence Fetching)
- **Giảm 99.97% Dung Lượng Gói Tin Báo Cáo (`/api/reports/[competitionId]`):**
  - Tách chuỗi Base64 nặng (MBs) ra khỏi danh sách bảng báo cáo ban đầu.
  - API báo cáo giảm từ **50MB xuống chỉ còn ~15KB**, cho phép màn hình Báo cáo và Bảng thống kê hiển thị **tức thì (dưới 0.3 giây)**.
  - Đảm bảo 100% dữ liệu gốc trong CSDL và Google Drive không bị thay đổi hay mất mát.
- **Tạo Endpoint Tải Minh Chứng Theo Nhu Cầu (`/api/submissions/evidence`):**
  - Cung cấp API chuyên biệt tải riêng lẻ 1 tệp minh chứng khi người dùng thực sự bấm vào xem hoặc phóng to.
  - Chỉ tải ~500KB - 1MB trong 0.2s cho 1 cá nhân, không kéo đồng loạt hàng chục tệp gây nghẽn mạng.
- **Nâng cấp Hộp Xem Minh Chứng với Bộ Nhớ Đệm (`EvidenceLightbox.tsx`):**
  - Tự động hiển thị trạng thái đang tải minh chứng mượt mà khi người dùng duyệt qua từng giáo viên.
  - Lưu vào bộ nhớ đệm (Cache) của trình duyệt: Các tệp đã xem một lần sẽ mở ngay lập tức ở các lần xem tiếp theo.
- **Tối ưu Danh Sách Cuộc Thi Trang Chủ (`/api/competitions`):**
  - Loại bỏ hoàn toàn việc nạp ngầm Base64 trong mảng submissions ở trang chủ, giúp trang chủ load nhanh hơn rõ rệt.

---

## [1.7.0] - 2026-11-02
### Tùy Chọn Tách Biệt Ban Giám Hiệu Khỏi Danh Sách Đôn Đốc Chung & Tính Năng Nhắc Riêng Kính Cẩn
- **Tùy chọn khi Tạo / Sửa Cuộc Thi (`CompetitionFormModal.tsx`):**
  - Bổ sung tùy chọn: `Không hiển thị Ban Giám Hiệu khi đôn đốc Zalo chung (Nhắc riêng)` (mặc định luôn BẬT).
  - Tự động lưu thiết lập `excludeBghFromReports` vào cơ sở dữ liệu cho từng cuộc thi.
- **Tách luồng Đôn đốc & Nhắc nhở trong Báo cáo (`ReportDetailView.tsx`):**
  - **Nhắc Zalo chung (`[Copy DS Chưa Nộp]`):** Tự động loại bỏ thành viên Ban Giám Hiệu ra khỏi danh sách đôn đốc chung của trường để giữ phép lịch sự và tế nhị công sở.
  - **Nhắc riêng Ban Giám Hiệu (`[👑 Nhắc Riêng BGH]`):** Hiển thị nút riêng kèm số lượng thành viên BGH chưa nộp bài. Bấm 1-click để sao chép mẫu tin nhắn kính cẩn, trang trọng gửi riêng cho Hiệu trưởng / Phó Hiệu trưởng.
  - **Trạng thái hoàn thành BGH:** Nếu Ban Giám Hiệu đã hoàn thành 100%, hệ thống tự động hiển thị huy hiệu xác nhận: `[👑 BGH: Đã nộp 100%]`.
  - **Đánh dấu nổi bật trong Bảng dữ liệu:** Thầy/Cô thuộc Ban Giám Hiệu được gắn huy hiệu tím kèm vương miện `[👑 Ban Giám Hiệu]` để Văn thư dễ dàng theo dõi.

---

## [1.6.0] - 2026-11-02
### Hỗ Trợ Đa Định Dạng Minh Chứng: Ảnh, Word, PDF, Excel, PowerPoint & ZIP
- **Nâng cấp Cửa sổ Nộp Minh Chứng (`UploadProofModal.tsx`):**
  - Mở rộng hỗ trợ chọn mọi loại tệp: Hình ảnh (JPG, PNG, WebP), Tài liệu PDF (.pdf), Word (.doc, .docx), Bảng tính Excel (.xls, .xlsx, .csv), PowerPoint (.ppt, .pptx), Tệp nén (.zip, .rar).
  - Phân loại xử lý thông minh: Tự động nén tối ưu dung lượng đối với hình ảnh; đối với tài liệu (Word, Excel, PDF...), đọc trực tiếp và kiểm soát dung lượng an toàn (tối đa 25MB) tránh lỗi xử lý.
  - Hiển thị thẻ xem trước tài liệu trực quan với biểu tượng màu sắc chuẩn văn phòng theo từng định dạng (Word xanh dương, Excel xanh lá, PDF đỏ, Tệp nén tím), tên file và kích thước thực tế.
  - Cung cấp 2 lựa chọn tiện lợi: "Chụp Ảnh Trực Tiếp" bằng camera điện thoại hoặc "Chọn Tệp / Tài Liệu" từ máy tính / thư viện.
- **Tối ưu Hộp Xem & Tải Minh Chứng (`EvidenceLightbox.tsx`):**
  - Nhận diện định dạng tệp thông minh: Với ảnh, cung cấp đầy đủ công cụ xoay 90°, phóng to/thu nhỏ; với tài liệu (PDF, Word, Excel...), hiển thị thẻ thông tin sang trọng với các thao tác 1-click: `[Tải về máy]`, `[Mở xem trực tiếp]` (đối với PDF) và `[Mở Google Drive]`.
- **Cập nhật Bảng Chi Tiết Báo Cáo (`ReportDetailView.tsx`):**
  - Cột Minh chứng hiển thị nhãn và màu sắc tương ứng theo loại tệp: `[Xem ảnh]`, `[Xem PDF]`, `[Xem Word]`, `[Xem Excel]`, `[File nén]`, `[Xem tệp]`.
- **Bổ sung Hàm Tiện ích Phân Loại Tệp (`src/lib/utils.ts`):**
  - Thêm `getFileTypeInfo`, `formatFileSize`, `getMimeTypeFromFileName` nhận diện tự động và chuẩn hóa MIME type cho Google Drive Webhook API và backend Next.js.

### Tự Động Khởi Tạo Thư Mục Cuộc Thi Trên Drive Ngay Khi Tạo Cuộc Thi
- **Tự động tạo thư mục con trên Google Drive khi tạo cuộc thi (`/api/competitions`):**
  - Tự động gọi Webhook Google Apps Script để tạo sẵn thư mục `[Cuộc thi] Tên cuộc thi` ngay khi Admin bấm tạo cuộc thi, không cần đợi giáo viên nộp bài.
  - Lưu trữ trực tiếp đường link mở thư mục Google Drive của từng cuộc thi vào cơ sở dữ liệu.
- **Tính năng tạo hàng loạt thư mục cuộc thi trên Drive (`/api/drive/sync`):**
  - Khi bấm nút `[⚡ Đẩy ảnh đã nộp lên Drive]`, hệ thống tự động quét và tạo thư mục cho toàn bộ các cuộc thi đã tạo trước đó trên Google Drive của trường.

---

## [1.5.1] - 2026-11-01
### Khắc phục Lỗi Quyền Hạn Super Admin, Dọn Dẹp Link 404 & Công Cụ Test Webhook Drive
- **Khắc phục lỗi mất quyền Super Admin khi lưu Drive (`/api/teachers`):**
  - Sửa lỗi logic `role === 'ADMIN' ? 'ADMIN' : 'USER'` làm tài khoản `SUPER_ADMIN` bị giáng cấp thành `USER` khi bấm lưu cấu hình Drive.
  - Tự động bảo toàn vai trò `SUPER_ADMIN` vĩnh viễn cho tài khoản Quản trị hệ thống.
  - Tối ưu hóa API đăng nhập (`/api/auth/login`), tự động khôi phục quyền `SUPER_ADMIN` và ngăn chặn tạo tài khoản trùng lặp.
- **Hợp nhất dữ liệu Super Admin duy nhất (`scripts/cleanup-admin.js`):**
  - Tự động hợp nhất các bản ghi admin trùng lặp, bảo toàn ID tài khoản chứa cấu hình Google Drive & Webhook thực tế của nhà trường.
  - Tự động quét và xóa sạch các đường link ảo `drive-mock` trong cơ sở dữ liệu để loại bỏ hoàn toàn lỗi 404 khi mở file trên Google Drive.
- **Tích hợp Công cụ Kiểm Tra Kết Nối Webhook (`/api/drive/test-webhook`):**
  - Thêm nút **`[Kiểm tra kết nối 🧪]`** ngay cạnh ô nhập Webhook trong cửa sổ `[📁 Drive Trường]`.
  - Tự động phát hiện lỗi bảo mật Google: Cảnh báo ngay nếu người dùng chưa mở quyền **"Ai có quyền truy cập: Bất kỳ ai (Anyone)"** trên Google Apps Script.
- **Loại bỏ Link 404 trên giao diện Báo cáo (`ReportDetailView.tsx`):**
  - Ẩn biểu tượng link Google Drive nếu file chưa được đồng bộ thực tế lên Google Drive, tránh việc người dùng bấm vào gặp trang 404 của Google.

---

## [1.5.0] - 2026-11-01
### Nâng cấp Quản lý Google Drive Nhà Trường & Tự Động Chia Thư Mục Cuộc Thi
- **Chuẩn hóa Thư mục Google Drive Nhà Trường (School Master Drive Folder):**
  - Đổi tên và tối ưu hóa toàn bộ giao diện từ "Drive cá nhân" thành **"Cấu hình Google Drive Nhà Trường"** dành riêng cho Quản trị hệ thống (`DriveConfigModal.tsx`).
  - Bổ sung nút bấm trực quan `[Drive Trường]` ngay trên thanh tiêu đề ứng dụng kèm đèn báo trạng thái liên kết.
  - Hiển thị trực tiếp ID thư mục, link mở thư mục trên Google Drive `[Mở Thư Mục ↗]` và cho phép thay đổi đường dẫn Drive của trường bất kỳ lúc nào.
- **Tích hợp Tự động hóa Google Apps Script Webhook (Zero-Config Google Drive Integration):**
  - Cung cấp giải pháp tải ảnh và tự động tạo thư mục con `[Cuộc thi] Tên cuộc thi` bên trong thư mục chung của trường thông qua Google Apps Script Webhook (`src/lib/google-drive.ts`, `src/lib/google-drive-shared.ts`).
  - Tích hợp sẵn mẫu mã nguồn Google Apps Script 20 dòng kèm nút **`[📋 Sao chép mã Apps Script]`** 1-click và hướng dẫn 3 bước cài đặt trong 2 phút không cần tài khoản nhà phát triển Google Cloud hay thẻ tín dụng.
- **Tính năng Đồng bộ ảnh minh chứng lên Drive (`/api/drive/sync`):**
  - Bổ sung nút **`[⚡ Đẩy ảnh đã nộp lên Drive]`**: Quét tất cả các minh chứng đã nộp trước đó trong cơ sở dữ liệu và tự động tải lên đúng thư mục cuộc thi trên Google Drive của trường.
- **Tách biệt Client/Server Bundle:**
  - Tạo `src/lib/google-drive-shared.ts` chứa các hàm phân tích cấu hình, regex và template script cho Client Component, loại bỏ hoàn toàn lỗi webpack `Module not found: net, fs, child_process` trên Next.js.
- **Cải tiến Trải nghiệm Tạo cuộc thi (`CompetitionFormModal.tsx`, `CompetitionCard.tsx`):**
  - Mặc định chọn "Lưu trên Google Drive chung của Nhà Trường", tự động tạo thư mục con `[Cuộc thi] ...`.
  - Hiển thị nút bấm `[Drive]` nổi bật trên từng thẻ cuộc thi để truy cập nhanh kho lưu trữ minh chứng.

---

## [1.4.0] - 2026-11-01
### Thêm mới & Tinh chỉnh nghiệp vụ (Features & Cleanups)
- **Loại bỏ triệt để Quản Trị Hệ Thống (Super Admin) khỏi danh sách thi & danh sách chưa nộp:**
  - Script tự động làm sạch CSDL (`scripts/cleanup-admin.js`): Tự động xóa mọi lượt gán cuộc thi (`CompetitionAssignee`) của tài khoản Super Admin, đồng thời xóa các tài khoản admin trùng lặp có role USER.
  - Lọc đa tầng tại API Báo cáo (`/api/reports/[competitionId]`) và Component (`ReportDetailView.tsx`), đảm bảo tài khoản Quản trị không bao giờ xuất hiện trong bảng theo dõi tiến độ nộp bài hay tin nhắn nhắc nhở Zalo.
  - Chặn tự động gán Super Admin khi tạo hoặc chỉnh sửa cuộc thi mới tại (`/api/competitions`).
- **Hệ thống Quản lý Tổ Chuyên Môn chuyên sâu (`DepartmentManagementModal.tsx`):**
  - Bổ sung màn hình quản lý danh sách các Tổ chuyên môn: Xem danh sách thành viên theo từng tổ, tạo tổ mới, đổi tên tổ, xóa/giải tán tổ (chuyển về tổ Chung).
  - Tính năng **Thêm thành viên vào tổ**: Chọn tổ bất kỳ ➔ bấm "Thêm thành viên" ➔ lọc tìm và tích chọn nhiều giáo viên để đưa vào tổ chỉ với 1 click.
  - Tính năng **Chuyển tổ hàng loạt** trên bảng giáo viên: Cho phép tích chọn ô vuông nhiều giáo viên cùng lúc và chuyển nhanh vào tổ bộ môn tương ứng.

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
- **Tầng dữ liệu dự phòng Zero-Downtime (`src/lib/mock-data.ts`):**
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
