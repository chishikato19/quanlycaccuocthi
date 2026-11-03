import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Xác thực Server Session bắt buộc: Phải là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { targetTeacherId } = await req.json();

    if (!targetTeacherId) {
      return NextResponse.json({ error: "Thiếu ID giáo viên cần reset PIN" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Cơ sở dữ liệu chưa sẵn sàng" },
        { status: 503 }
      );
    }

    const targetTeacher = await db.teacher.findUnique({
      where: { id: targetTeacherId },
    });

    if (!targetTeacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }

    // Không cho phép ADMIN thường reset mã PIN của SUPER_ADMIN
    if (targetTeacher.role === "SUPER_ADMIN" && auth.user!.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền reset mã PIN của Tổng Quản Trị" },
        { status: 403 }
      );
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";
    const hashedDefaultPin = await bcrypt.hash(defaultPin, 10);

    await db.teacher.update({
      where: { id: targetTeacherId },
      data: { pinCode: hashedDefaultPin },
    });

    return NextResponse.json({
      success: true,
      message: `Đã reset mã PIN của giáo viên "${targetTeacher.name}" về mặc định (${defaultPin})`,
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
