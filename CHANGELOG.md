# Changelog

Tất cả các thay đổi đáng chú ý của dự án này sẽ được ghi nhận tại file này.
Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/)
và tuân thủ [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-01
### Thêm mới & Tối ưu (Added & Improved)
- **Tách biệt tài khoản Tổng Quản Trị (Super Admin):**
  - Super Admin là tài khoản quản trị hệ thống độc lập, không nằm trong danh sách giáo viên của trường và không bị gán vào các cuộc thi chuyên môn.
  - Cổng đăng nhập riêng: Tên đăng nhập `admin` + Mật mã riêng.
  - Phân quyền cấp cao: Chỉ Super Admin mới có quyền cấp hoặc hủy quyền `ADMIN` cho các giáo viên trong trường (thao tác 1 chạm tiện lợi).
- **Tối ưu trải nghiệm Mobile 100%:**
  - Cấu hình viewport chuẩn chống zoom ngoài ý muốn trên iOS và Android (`width=device-width, initialScale=1, maximumScale=1`).
  - Nâng chiều cao nút bấm tối thiểu đạt chuẩn 42px - 44px (touch-friendly) thuận tiện cho ngón tay cái.
  - Tối ưu Lightbox xem minh chứng trên màn hình nhỏ: Nút đóng lớn, thanh công cụ linh hoạt, ảnh tự co giãn theo tỷ lệ màn hình điện thoại.
  - Thanh tiêu đề và các bộ lọc tự động xuống dòng và co giãn mượt mà từ màn hình 360px trở lên.

## [1.0.0] - 2026-11-01
### Thêm mới (Added)
- Hoàn thành bản dựng hệ thống Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma ORM.
- Chức năng chọn nhanh theo Tổ chuyên môn khi giao việc (1 chạm chọn cả tổ + chọn lẻ cá nhân).
- Chức năng nộp minh chứng di động: mở camera chụp trực tiếp hoặc chọn ảnh, tự động nén ảnh client.
- Chức năng xem nhanh minh chứng Lightbox: Zoom in/out, xoay ảnh 90°, nút mở Drive gốc, duyệt tuần tự Next/Prev.
- Chức năng xuất báo cáo: Excel (.xlsx), ảnh PNG (.png), sao chép ảnh vào clipboard để dán Zalo, copy văn bản nhắc nhở Zalo.
- Quản lý danh sách giáo viên: bôi đen copy/paste trực tiếp từ Excel, thêm/sửa/xóa, mã PIN cá nhân, reset PIN về mặc định (1234).
- Vòng đời trạng thái công việc: Đang diễn ra, Quá hạn, Đã kết thúc sớm, Cho phép nộp muộn (gắn cờ LATE).
