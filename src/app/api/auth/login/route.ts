import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockSuperAdmin, mockTeachers } from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const { teacherId, username, pinCode, isSuperAdminLogin } = await req.json();

    if (!pinCode || !pinCode.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập mã PIN" }, { status: 400 });
    }

    // NẾU CHƯA CẤU HÌNH DATABASE_URL: CHẠY TRỰC TIẾP Ở CHẾ ĐỘ FALLBACK/DEMO KHÔNG LỖI
    if (!isDatabaseConfigured()) {
      if (isSuperAdminLogin || username) {
        const inputUsername = (username || "").trim().toLowerCase();
        if (inputUsername === "admin" || !inputUsername) {
          if (pinCode.trim() === "1234") {
            const { pinCode: _, ...safeUser } = mockSuperAdmin;
            return NextResponse.json({ success: true, user: safeUser, isDemoMode: true });
          }
          return NextResponse.json({ error: "Mật mã Tổng Quản Trị không chính xác" }, { status: 401 });
        }
        return NextResponse.json({ error: "Tài khoản Tổng Quản Trị không tồn tại" }, { status: 404 });
      }

      if (!teacherId) {
        return NextResponse.json({ error: "Vui lòng chọn tên giáo viên" }, { status: 400 });
      }

      const teacher = mockTeachers.find((t) => t.id === teacherId);
      if (!teacher) {
        return NextResponse.json({ error: "Không tìm thấy thông tin giáo viên" }, { status: 404 });
      }
      if (teacher.pinCode !== pinCode.trim()) {
        return NextResponse.json({ error: "Mã PIN không chính xác" }, { status: 401 });
      }

      const { pinCode: _, ...safeUser } = teacher;
      return NextResponse.json({ success: true, user: safeUser, isDemoMode: true });
    }

    // ĐĂNG NHẬP DÀNH RIÊNG CHO TỔNG QUẢN TRỊ (SUPER ADMIN) KHI ĐÃ KẾT NỐI DATABASE
    if (isSuperAdminLogin || username) {
      const inputUsername = (username || "").trim().toLowerCase();
      let superAdmin = await db.teacher.findFirst({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
          OR: [
            { phone: inputUsername },
            { name: { contains: "Admin" } },
          ],
        },
      });

      // TỰ ĐỘNG KHỞI TẠO: Nếu trong CSDL chưa có bất kỳ Super Admin nào, tự động tạo tài khoản mặc định
      if (!superAdmin && (inputUsername === "admin" || !inputUsername)) {
        const superAdminCount = await db.teacher.count({
          where: { role: "SUPER_ADMIN" },
        });

        if (superAdminCount === 0) {
          superAdmin = await db.teacher.create({
            data: {
              name: "Quản Trị Hệ Thống (Super Admin)",
              department: "Hệ Thống",
              phone: "admin",
              role: "SUPER_ADMIN",
              pinCode: "1234",
              isActive: true,
            },
          });
        }
      }

      if (!superAdmin) {
        return NextResponse.json({ error: "Tài khoản Tổng Quản Trị không tồn tại" }, { status: 404 });
      }

      if (superAdmin.pinCode !== pinCode.trim()) {
        return NextResponse.json({ error: "Mật mã Tổng Quản Trị không chính xác" }, { status: 401 });
      }

      const { pinCode: _, ...safeUser } = superAdmin;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // ĐĂNG NHẬP GIÁO VIÊN / NHÂN VIÊN THƯỜNG
    if (!teacherId) {
      return NextResponse.json({ error: "Vui lòng chọn tên giáo viên" }, { status: 400 });
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ error: "Không tìm thấy thông tin giáo viên" }, { status: 404 });
    }

    if (teacher.pinCode !== pinCode.trim()) {
      return NextResponse.json({ error: "Mã PIN không chính xác" }, { status: 401 });
    }

    const { pinCode: _, ...safeUser } = teacher;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Chưa kết nối được Cơ sở dữ liệu (PostgreSQL). Vui lòng cấu hình DATABASE_URL trên Vercel." },
      { status: 500 }
    );
  }
}
