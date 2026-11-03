import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const auth = requireAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { teacherId, oldPin, newPin } = await req.json();

    if (!teacherId || !oldPin || !newPin) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ mã PIN cũ và mã PIN mới" }, { status: 400 });
    }

    // Chỉ chính chủ tài khoản mới được đổi mã PIN của mình
    if (auth.user!.id !== teacherId && auth.user!.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Bạn chỉ có thể đổi mã PIN của chính mình" }, { status: 403 });
    }

    if (newPin.trim().length < 4) {
      return NextResponse.json({ error: "Mã PIN mới phải có ít nhất 4 ký tự" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Cơ sở dữ liệu chưa sẵn sàng" },
        { status: 503 }
      );
    }

    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }

    const dbPin = teacher.pinCode || "";
    const isHashed = dbPin.startsWith("$2a$") || dbPin.startsWith("$2b$") || dbPin.startsWith("$2y$");
    const isOldPinValid = isHashed ? await bcrypt.compare(oldPin.trim(), dbPin) : (dbPin === oldPin.trim());

    if (!isOldPinValid) {
      return NextResponse.json({ error: "Mã PIN hiện tại không đúng" }, { status: 400 });
    }

    const hashedNewPin = await bcrypt.hash(newPin.trim(), 10);
    await db.teacher.update({
      where: { id: teacherId },
      data: { pinCode: hashedNewPin },
    });

    return NextResponse.json({ success: true, message: "Đổi mã PIN thành công!" });
  } catch (error) {
    console.error("Change PIN error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
