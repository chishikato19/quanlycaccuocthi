import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCompetitionSubfolder, extractDriveFolderId } from "@/lib/google-drive";
import { isDatabaseConfigured, mockCompetitions } from "@/lib/mock-data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const role = searchParams.get("role");

    if (!isDatabaseConfigured()) {
      const result = mockCompetitions.map(comp => {
        const isAssigned = teacherId
          ? comp.assignees.some(a => a.teacherId === teacherId)
          : true;

        const userSub = teacherId
          ? comp.submissions.find(s => s.teacherId === teacherId)
          : null;

        const totalAssignees = comp.assignees.length;
        const totalSubmissions = comp.submissions.length;
        const onTimeSubmissions = comp.submissions.filter(s => s.status === "ON_TIME").length;
        const lateSubmissions = comp.submissions.filter(s => s.status === "LATE").length;
        const completionRate = totalAssignees > 0
          ? Math.round((totalSubmissions / totalAssignees) * 100)
          : 0;

        return {
          ...comp,
          isAssigned,
          userSubmission: userSub || null,
          stats: {
            totalAssignees,
            totalSubmissions,
            onTimeSubmissions,
            lateSubmissions,
            completionRate,
          },
        };
      });

      return NextResponse.json({ success: true, data: result, isDemoMode: true });
    }

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

      // Link mở thư mục cuộc thi trên Drive
      const folderUrl = comp.driveFolderUrl || (comp.driveFolderId ? `https://drive.google.com/drive/folders/${comp.driveFolderId}` : null);

      return {
        id: comp.id,
        title: comp.title,
        description: comp.description,
        link: comp.link,
        deadline: comp.deadline.toISOString(),
        status: comp.status,
        allowLateSubmission: comp.allowLateSubmission,
        allowViewProgress: comp.allowViewProgress,
        driveFolderId: comp.driveFolderId,
        driveFolderUrl: folderUrl,
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
    return NextResponse.json({ success: true, data: mockCompetitions, isDemoMode: true });
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

    // 1. TỰ ĐỘNG TẠO THƯ MỤC CON CHO CUỘC THI NÀY TRONG THƯ MỤC CHUNG
    const creator = await db.teacher.findUnique({
      where: { id: creatorId },
      select: { driveFolderId: true },
    });

    // Thư mục cha chung (Ưu tiên thư mục Admin cấu hình riêng, nếu không lấy của Super Admin)
    const masterParentFolder = driveFolderId || creator?.driveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const subfolderResult = await ensureCompetitionSubfolder({
      competitionTitle: title,
      parentFolderId: masterParentFolder,
    });

    // 2. Tạo bản ghi cuộc thi kèm ID và Link thư mục con trên Drive
    const competition = await db.competition.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        link: link ? link.trim() : null,
        deadline: new Date(deadline),
        status: "ACTIVE",
        allowLateSubmission: Boolean(allowLateSubmission),
        allowViewProgress: Boolean(allowViewProgress),
        driveFolderId: subfolderResult.folderId,
        driveFolderUrl: subfolderResult.folderUrl,
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
