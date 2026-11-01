# Changelog

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi nhận tại file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/)
và tuân thủ [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
- Chuẩn bị khởi tạo dự án Next.js 14+ với Prisma và Tailwind CSS.

## [1.0.0-planning] - 2026-11-01
### Thêm mới (Added)
- Hoàn thành bản đặc tả hệ thống toàn diện (`PROJECT_BLUEPRINT`).
- Thiết lập bộ quy tắc chuẩn dành cho AI (`AI_RULES.md`) đảm bảo tính mô-đun hóa, dễ nâng cấp và không gây lỗi chéo.
- Thiết kế ma trận phân quyền 3 cấp (Tổng Admin, Admin, Giáo viên thường).
- Định nghĩa các trạng thái công việc: Đang diễn ra, Quá hạn, Đã kết thúc sớm, Cho phép nộp muộn (có gắn cờ thống kê).
- Thiết kế cơ chế đăng nhập chọn tên kèm mã PIN cá nhân (hỗ trợ tự đổi PIN và Admin reset PIN).
- Thiết kế tính năng nhập danh sách giáo viên nhanh bằng cách Copy/Paste từ Excel (TSV parser).
- Thiết kế kiến trúc tích hợp Google Drive qua Service Account để lưu trữ ảnh minh chứng tự động.
- Lộ trình triển khai qua Git và Vercel.
