import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractDriveFolderId } from "@/lib/google-drive";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const role = searchParams.get("role");

    const competitions = await db.competition.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true, driveFolderId: true },
        },
        assignees: {
          include: {
            teacher: {
              select: { id: true, name: true, department: true },
            },
          },
        },
        submissions: {
          select: {
            id: true,
            teacherId: true,
            status: true,
            submittedAt: true,
            driveFileUrl: true,
            localImageUrl: true,
            note: true,
            reviewStatus: true,
          },
        },
      },
    });

    const result = competitions.map(comp => {
      const isAssigned = teacherId
        ? comp.assignees.some(a => a.teacherId === teacherId)
        : true;

      const userSub = teacherId
        ? comp.submissions.find(s => s.teacherId === teacherId)
        : null;

      return {
        id: comp.id,
        title: comp.title,
        description: comp.description,
        link: comp.link,
        deadline: comp.deadline.toISOString(),
        status: comp.status,
        allowLateSubmission: comp.allowLateSubmission,
        allowViewProgress: comp.allowViewProgress,
        driveFolderId: comp.driveFolderId || comp.creator.driveFolderId || null,
        creatorId: comp.creatorId,
        creatorName: comp.creator.name,
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
        totalAssignees: comp.assignees.length,
        totalSubmissions: comp.submissions.length,
        isAssigned,
        userSubmission: userSub
          ? {
              ...userSub,
              submittedAt: userSub.submittedAt.toISOString(),
            }
          : null,
      };
    });

    const filtered = (role === "USER" && teacherId)
      ? result.filter(c => c.isAssigned)
      : result;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Fetch competitions error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy danh sách cuộc thi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      link,
      deadline,
      allowLateSubmission = true,
      allowViewProgress = true,
      driveFolderId,
      creatorId,
      assigneeIds = [],
    } = body;

    if (!title || !deadline || !creatorId) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tiêu đề và hạn nộp" }, { status: 400 });
    }

    if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một người thực hiện" }, { status: 400 });
    }

    // Trích xuất Folder ID chuẩn nếu người dùng dán link Drive
    const cleanFolderId = extractDriveFolderId(driveFolderId);

    const competition = await db.competition.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        link: link ? link.trim() : null,
        deadline: new Date(deadline),
        status: "ACTIVE",
        allowLateSubmission: Boolean(allowLateSubmission),
        allowViewProgress: Boolean(allowViewProgress),
        driveFolderId: cleanFolderId,
        creatorId,
        assignees: {
          create: assigneeIds.map((tId: string) => ({
            teacherId: tId,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, data: competition });
  } catch (error) {
    console.error("Create competition error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo cuộc thi mới" }, { status: 500 });
  }
}
