import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await db.competition.update({
      where: { id: params.id },
      data: {
        status: "CLOSED_EARLY",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã kết thúc sớm cuộc thi!",
      data: updated,
    });
  } catch (error) {
    console.error("Close competition error:", error);
    return NextResponse.json({ error: "Lỗi khi kết thúc sớm cuộc thi" }, { status: 500 });
  }
}
