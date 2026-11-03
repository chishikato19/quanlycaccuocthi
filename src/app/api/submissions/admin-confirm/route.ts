import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockCompetitions } from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { competitionId, teacherId, action, adminName, note } = body;

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

    const cleanAdminName = adminName ? String(adminName).trim() : "Quản trị viên";
    const confirmedNote =
      note && note.trim()
        ? `Admin ${cleanAdminName} xác nhận: ${note.trim()}`
        : `Admin ${cleanAdminName} xác nhận hoàn thành (không có minh chứng)`;

    // 1. Chế độ xem trước (Demo in-memory mode)
    if (!isDatabaseConfigured()) {
      const comp =
        mockCompetitions.find((c) => c.id === competitionId) || mockCompetitions[0];

      if (action === "CONFIRM") {
        const existingIdx = comp.submissions.findIndex(
          (s) => s.teacherId === teacherId
        );
        if (existingIdx >= 0) {
          comp.submissions[existingIdx] = {
            ...comp.submissions[existingIdx],
            status: "ON_TIME",
            driveFileUrl: null,
            localImageUrl: null,
            note: confirmedNote,
            reviewStatus: "ADMIN_CONFIRMED",
            submittedAt: new Date().toISOString(),
          };
        } else {
          comp.submissions.push({
            id: `demo-sub-${Date.now()}`,
            competitionId,
            teacherId,
            status: "ON_TIME",
            submittedAt: new Date().toISOString(),
            driveFileUrl: null,
            localImageUrl: null,
            note: confirmedNote,
            reviewStatus: "ADMIN_CONFIRMED",
          });
        }
      } else {
        // CANCEL: Xóa bài nộp
        comp.submissions = comp.submissions.filter(
          (s) => s.teacherId !== teacherId
        );
      }

      return NextResponse.json({
        success: true,
        message:
          action === "CONFIRM"
            ? `Đã xác nhận hoàn thành cho giáo viên (${cleanAdminName})`
            : "Đã hủy xác nhận hoàn thành",
        isDemoMode: true,
      });
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
