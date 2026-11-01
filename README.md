# Hệ Thống Báo Cáo & Quản Lý Cuộc Thi Giáo Viên

Ứng dụng web tinh gọn, tối ưu trên thiết bị di động dành cho trường học và các cơ sở giáo dục nhằm quản lý, đôn đốc và thu thập minh chứng tham gia các cuộc thi/nhiệm vụ của giáo viên và người lao động.

---

## 🚀 Tính Năng Chính

* **Phân quyền 3 cấp:** Tổng Admin (quản lý toàn diện), Admin (tạo việc, xem báo cáo, xuất Excel), Giáo viên thường (xem việc được giao, nộp minh chứng).
* **Đăng nhập siêu tốc:** Chọn tên từ danh sách gợi ý + Xác thực bằng mã PIN cá nhân (có chức năng tự đổi PIN và Admin reset PIN).
* **Quản lý danh sách giáo viên thông minh:** Nhập hàng loạt bằng cách bôi đen copy/paste trực tiếp từ Excel, thêm/sửa/xóa nhanh chóng.
* **Theo dõi trạng thái linh hoạt:**
  * Quản lý trạng thái: Đang diễn ra, Sắp hết hạn, Quá hạn, Đã kết thúc sớm.
  * Tùy chọn gia hạn, kết thúc sớm công việc.
  * Tùy chọn **"Cho phép nộp quá hạn"** kèm nhãn thống kê nộp muộn (Late submission).
  * Tùy chọn **"Cho phép người dùng xem tiến độ"** để giáo viên tự theo dõi số lượng đồng nghiệp đã nộp.
* **Lưu trữ ảnh minh chứng Google Drive:** Tự động nén ảnh tại máy người dùng và tải thẳng vào thư mục riêng biệt trên Google Drive qua Service Account.
* **Thống kê & Báo cáo:** Xuất file Excel báo cáo hoàn chỉnh, nút sao chép nhanh danh sách giáo viên chưa nộp để gửi vào nhóm Zalo.

---

## 🛠️ Công Nghệ Sử Dụng

* **Frontend & Backend:** [Next.js 14+](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS.
* **Database & ORM:** PostgreSQL (Neon / Supabase) kết hợp [Prisma ORM](https://www.prisma.io/).
* **File Storage:** Google Drive API (Service Account).
* **Deployment:** Vercel + GitHub/GitLab.

---

## 📁 Tài Liệu Chuẩn Của Dự Án

* [AI_RULES.md](AI_RULES.md): Bộ quy tắc phát triển, chia nhỏ module và nguyên tắc bảo trì dành cho AI.
* [CHANGELOG.md](CHANGELOG.md): Nhật ký phiên bản và các thay đổi tính năng.
