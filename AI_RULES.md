# BỘ QUY TẮC PHÁT TRIỂN & BẢO TRÌ DÀNH CHO AI (AI_RULES.md)
> **Mục tiêu:** Đảm bảo mọi AI Coding Assistant khi đọc mã nguồn dự án này đều tuân thủ kiến trúc mô-đun hóa, dễ nâng cấp, mở rộng và tuyệt đối không làm gãy vỡ (break) các tính năng hiện có.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Feature-Driven Architecture (Chia theo Mô-đun Tính Năng):**
   * Mọi mã nguồn liên quan đến một nghiệp vụ cụ thể PHẢI nằm gọn trong thư mục `src/features/[feature_name]/`.
   * Cấu trúc mỗi module gồm:
     * `components/`: UI riêng của module.
     * `hooks/`: Custom React hooks xử lý state/logic cục bộ.
     * `services/`: Hàm gọi API hoặc nghiệp vụ độc lập.
   * **Quy tắc cách ly:** Khi sửa hoặc thêm mới tính năng trong module `teachers`, TUYỆT ĐỐI KHÔNG sửa trực tiếp file trong module `competitions` hay `submissions` nếu không có yêu cầu liên đới rõ ràng.

2. **Single Responsibility (Trách nhiệm Đơn nhất):**
   * Mỗi file không quá 250 - 300 dòng code. Nếu 1 component dài hơn, BẮT BUỘC phải chia nhỏ thành các sub-components.
   * Logic nghiệp vụ nặng (như tính toán trạng thái quá hạn, phân tích dữ liệu Excel, upload Google Drive) PHẢI tách riêng vào file helper trong `src/lib/` hoặc `services/`.

3. **Type-Safety Tuyệt đối với TypeScript:**
   * Nghiêm cấm sử dụng kiểu `any`. Mọi dữ liệu (Teacher, Competition, Submission) đều phải có interface/type rõ ràng trong `src/types/`.

4. **Zero-Breaking-Change (Không phá vỡ chức năng cũ):**
   * Khi thêm trường dữ liệu mới (ví dụ thêm cài đặt trong Competition), luôn đặt giá trị mặc định (`optional` hoặc default value) để các bản ghi cũ không bị lỗi crash.

---

## 2. QUY ĐỊNH VỀ CẤU TRÚC FILE & TỔ CHỨC THƯ MỤC

```text
src/
├── app/                  # Chỉ chứa route, layout và server handlers (App Router)
│   ├── api/              # API endpoints mỏng (chỉ parse request, gọi service)
│   └── (pages)/          # Giao diện chính theo từng trang
├── features/             # CÁC MÔ-ĐUN TÍNH NĂNG ĐỘC LẬP
│   ├── auth/             # Quản lý đăng nhập, mã PIN, phân quyền
│   ├── teachers/         # Quản lý GV, copy/paste Excel, sửa/xóa
│   ├── competitions/     # Quản lý công việc, gia hạn, kết thúc sớm
│   ├── submissions/      # Nộp minh chứng, xem ảnh, thống kê muộn
│   └── reports/          # Thống kê tiến độ, xuất Excel
├── components/           # UI Component dùng chung (Button, Modal, Input, Badge)
├── lib/                  # Tiện ích chung (db.ts, google-drive.ts, excel-parser.ts)
└── types/                # Type definitions toàn hệ thống
```

---

## 3. QUY TRÌNH KHI SỬA CHỮA HOẶC NÂNG CẤP

Mỗi khi AI thực hiện một yêu cầu mới từ người dùng:
1. **Bước 1 (Đọc & Xác định phạm vi):** Xác định tính năng thuộc feature nào. Chỉ tác động vào đúng feature đó.
2. **Bước 2 (Kiểm tra Type & Schema):** Nếu cần thêm trường dữ liệu, kiểm tra `prisma/schema.prisma` và `src/types/`.
3. **Bước 3 (Thực hiện & Kiểm thử):** Viết code sạch, xử lý đầy đủ các trạng thái `loading`, `error`, `empty data`.
4. **Bước 4 (Cập nhật CHANGELOG.md):** Luôn ghi lại nội dung vừa thay đổi vào `CHANGELOG.md` theo định dạng chuẩn.

---

## 4. QUY ĐỊNH VỀ TRẠNG THÁI VÀ NGHIỆP VỤ ĐẶC THÙ

* **Trạng thái nộp bài:**
  * `ON_TIME`: Nộp trước hoặc đúng thời điểm `deadline`.
  * `LATE`: Nộp sau thời điểm `deadline` (chỉ khả dụng khi công việc bật `allowLateSubmission = true`).
  * `OVERDUE_NOT_SUBMITTED`: Đã quá hạn nhưng chưa nộp.
* **Xử lý Google Drive:**
  * Toàn bộ thao tác upload/lưu trữ ảnh thực hiện ở Server API qua Service Account.
  * Tự động nén ảnh tại máy client trước khi gửi lên máy chủ để tối ưu băng thông Vercel.
* **Mã PIN:**
  * Luôn mã hóa hoặc so khớp an toàn, có giá trị reset mặc định rõ ràng (mặc định: `1234`).

---

## 5. QUY ƯỚC ĐẶT TÊN (NAMING CONVENTIONS)

* **Components:** PascalCase (VD: `TeacherTable.tsx`, `UploadProofModal.tsx`).
* **Hooks:** camelCase với tiền tố `use` (VD: `useTeachers.ts`, `useAuth.ts`).
* **Utils / Services:** camelCase (VD: `googleDriveService.ts`, `excelParser.ts`).
* **Types / Interfaces:** PascalCase (VD: `TeacherDto`, `CompetitionFilter`).
