import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const { targetTeacherId, requesterId } = await req.json();

    if (!targetTeacherId || !requesterId) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Đã reset mã PIN của giáo viên về mặc định (1234) [Chế độ xem trước]",
      });
    }

    // Kiểm tra quyền của người yêu cầu
    const requester = await db.teacher.findUnique({
      where: { id: requesterId },
    });

    if (!requester || (requester.role !== "ADMIN" && requester.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Bạn không có quyền reset mã PIN" }, { status: 403 });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";
    const hashedDefaultPin = await bcrypt.hash(defaultPin, 10);

    await db.teacher.update({
      where: { id: targetTeacherId },
      data: { pinCode: hashedDefaultPin },
    });

    return NextResponse.json({
      success: true,
      message: `Đã reset mã PIN của giáo viên về mặc định (${defaultPin})`,
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi máy chủ" }, { status: 500 });
  }
}
