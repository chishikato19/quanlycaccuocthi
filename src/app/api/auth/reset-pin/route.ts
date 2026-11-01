import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { targetTeacherId, requesterId } = await req.json();

    if (!targetTeacherId || !requesterId) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    // Kiểm tra quyền của người yêu cầu
    const requester = await db.teacher.findUnique({
      where: { id: requesterId },
    });

    if (!requester || (requester.role !== "ADMIN" && requester.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Bạn không có quyền reset mã PIN" }, { status: 403 });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";

    await db.teacher.update({
      where: { id: targetTeacherId },
      data: { pinCode: defaultPin },
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
