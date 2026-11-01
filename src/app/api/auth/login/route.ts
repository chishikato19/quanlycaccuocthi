import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { teacherId, username, pinCode, isSuperAdminLogin } = await req.json();

    if (!pinCode || !pinCode.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập mã PIN" }, { status: 400 });
    }

    // ĐĂNG NHẬP DÀNH RIÊNG CHO TỔNG QUẢN TRỊ (SUPER ADMIN)
    if (isSuperAdminLogin || username) {
      const inputUsername = (username || "").trim().toLowerCase();
      const superAdmin = await db.teacher.findFirst({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
          OR: [
            { phone: inputUsername },
            { name: { contains: "Admin" } },
          ],
        },
      });

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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
