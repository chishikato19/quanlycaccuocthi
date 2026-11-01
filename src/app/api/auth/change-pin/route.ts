import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { teacherId, oldPin, newPin } = await req.json();

    if (!teacherId || !oldPin || !newPin) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ mã PIN cũ và mã PIN mới" }, { status: 400 });
    }

    if (newPin.trim().length < 4) {
      return NextResponse.json({ error: "Mã PIN mới phải có ít nhất 4 ký tự" }, { status: 400 });
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }

    if (teacher.pinCode !== oldPin.trim()) {
      return NextResponse.json({ error: "Mã PIN hiện tại không đúng" }, { status: 400 });
    }

    await db.teacher.update({
      where: { id: teacherId },
      data: { pinCode: newPin.trim() },
    });

    return NextResponse.json({ success: true, message: "Đổi mã PIN thành công!" });
  } catch (error) {
    console.error("Change PIN error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
