import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockCompetitions } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get("competitionId");
    const teacherId = searchParams.get("teacherId");
    const submissionId = searchParams.get("submissionId");

    if (!submissionId && (!competitionId || !teacherId)) {
      return NextResponse.json(
        { error: "Thiếu thông tin tra cứu minh chứng" },
        { status: 400 }
      );
    }

    // 1. Chế độ xem trước (Demo in-memory mode)
    if (!isDatabaseConfigured()) {
      const comp = mockCompetitions.find((c) => c.id === competitionId) || mockCompetitions[0];
      const sub = comp.submissions.find(
        (s) =>
          (submissionId && s.id === submissionId) ||
          (teacherId && s.teacherId === teacherId)
      );

      return NextResponse.json({
        success: true,
        data: {
          imageUrl: sub?.localImageUrl || sub?.driveFileUrl || "",
          driveFileUrl: sub?.driveFileUrl || null,
          imageFileName: null,
          note: sub?.note || "",
        },
      });
    }

    // 2. Cơ sở dữ liệu Cloud PostgreSQL (Chỉ đọc đúng 1 bản ghi yêu cầu)
    let submission = null;

    if (submissionId) {
      submission = await db.submission.findUnique({
        where: { id: submissionId },
        select: {
          id: true,
          competitionId: true,
          teacherId: true,
          localImageUrl: true,
          driveFileUrl: true,
          imageFileName: true,
          note: true,
        },
      });
    } else if (competitionId && teacherId) {
      submission = await db.submission.findUnique({
        where: {
          competitionId_teacherId: {
            competitionId,
            teacherId,
          },
        },
        select: {
          id: true,
          competitionId: true,
          teacherId: true,
          localImageUrl: true,
          driveFileUrl: true,
          imageFileName: true,
          note: true,
        },
      });
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu minh chứng" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: submission.localImageUrl || submission.driveFileUrl || "",
        driveFileUrl: submission.driveFileUrl || null,
        imageFileName: submission.imageFileName || null,
        note: submission.note || "",
      },
    });
  } catch (error) {
    console.error("Fetch evidence error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi tải minh chứng" },
      { status: 500 }
    );
  }
}
