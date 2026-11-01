import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { teacherId, pinCode } = await req.json();

    if (!teacherId || !pinCode) {
      return NextResponse.json({ error: "Vui lòng chọn tên và nhập mã PIN" }, { status: 400 });
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

    // Trả về thông tin an toàn (loại bỏ pinCode)
    const { pinCode: _, ...safeUser } = teacher;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
