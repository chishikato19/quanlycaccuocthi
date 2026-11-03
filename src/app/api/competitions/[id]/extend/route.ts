import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { newDeadline } = await req.json();

    if (!newDeadline) {
      return NextResponse.json({ error: "Vui lòng chọn thời hạn mới" }, { status: 400 });
    }

    const updated = await db.competition.update({
      where: { id: params.id },
      data: {
        deadline: new Date(newDeadline),
        status: "ACTIVE", // Khôi phục về hoạt động nếu trước đó đã hết hạn
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gia hạn cuộc thi thành công!",
      data: updated,
    });
  } catch (error) {
    console.error("Extend competition error:", error);
    return NextResponse.json({ error: "Lỗi khi gia hạn cuộc thi" }, { status: 500 });
  }
}
