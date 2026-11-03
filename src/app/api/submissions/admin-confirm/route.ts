import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Kiểm tra xác thực phía Server: Bắt buộc là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { competitionId, teacherId, action, note } = body;

    if (!competitionId || !teacherId) {
      return NextResponse.json(
        { error: "Thiếu thông tin cuộc thi hoặc giáo viên" },
        { status: 400 }
      );
    }

    if (action !== "CONFIRM" && action !== "CANCEL") {
      return NextResponse.json(
        { error: "Thao tác không hợp lệ (yêu cầu CONFIRM hoặc CANCEL)" },
        { status: 400 }
      );
    }

    // Lấy tên admin đã xác thực từ Server Session, không tin tưởng body client
    const cleanAdminName = auth.user!.name || "Quản trị viên";
    const confirmedNote =
      note && note.trim()
        ? `Admin ${cleanAdminName} xác nhận: ${note.trim()}`
        : `Admin ${cleanAdminName} xác nhận hoàn thành (không có minh chứng)`;

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Cơ sở dữ liệu chưa sẵn sàng" },
        { status: 503 }
      );
    }

    // 2. Cơ sở dữ liệu Cloud PostgreSQL
    if (action === "CONFIRM") {
      const now = new Date();

      const submission = await db.submission.upsert({
        where: {
          competitionId_teacherId: {
            competitionId,
            teacherId,
          },
        },
        update: {
          status: "ON_TIME",
          driveFileId: null,
          driveFileUrl: null,
          localImageUrl: null,
          imageFileName: null,
          note: confirmedNote,
          submittedAt: now,
          reviewStatus: "ADMIN_CONFIRMED",
        },
        create: {
          competitionId,
          teacherId,
          status: "ON_TIME",
          driveFileId: null,
          driveFileUrl: null,
          localImageUrl: null,
          imageFileName: null,
          note: confirmedNote,
          submittedAt: now,
          reviewStatus: "ADMIN_CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã xác nhận hoàn thành cho giáo viên (${cleanAdminName})`,
        data: submission,
      });
    } else {
      // CANCEL: Xóa bản ghi nộp bài
      await db.submission.deleteMany({
        where: {
          competitionId,
          teacherId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã hủy xác nhận hoàn thành cho giáo viên",
      });
    }
  } catch (error) {
    console.error("Admin confirm error:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình cập nhật trạng thái của Quản trị viên" },
      { status: 500 }
    );
  }
}
