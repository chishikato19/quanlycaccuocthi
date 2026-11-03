import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCompetitionSubfolder, extractDriveFolderId, parseDriveConfig } from "@/lib/google-drive";
import { isDatabaseConfigured, mockCompetitions } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const role = searchParams.get("role");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    // Giới hạn trần phân trang tối đa 100 cuộc thi để ngăn chặn DoS bộ nhớ
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;
    const fetchAll = searchParams.get("all") === "true";

    if (!isDatabaseConfigured()) {
      const sortedMock = [...mockCompetitions].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "ACTIVE" ? -1 : 1;
        }
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      const total = sortedMock.length;
      const pagedMock = fetchAll ? sortedMock : sortedMock.slice(skip, skip + limit);

      const result = pagedMock.map(comp => {
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

      return NextResponse.json({
        success: true,
        data: result,
        isDemoMode: true,
        pagination: {
          page,
          limit,
          total,
          hasMore: !fetchAll && skip + result.length < total,
        },
      });
    }

    // 1. Lọc trực tiếp ở cấp CSDL: Nếu là USER thường thì chỉ lấy cuộc thi mà giáo viên này được phân công
    const whereClause: Record<string, unknown> = {};
    if (role === "USER" && teacherId) {
      whereClause.assignees = {
        some: { teacherId },
      };
    }

    // 2. Tối ưu include: chỉ đếm tổng số lượng (_count), LOẠI BỎ hoàn toàn query thừa assignees
    const includeClause: Record<string, unknown> = {
      creator: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          assignees: true,
          submissions: true,
        },
      },
    };

    if (teacherId) {
      // Chỉ lấy duy nhất 1 bản ghi bài nộp mới nhất của chính người dùng hiện tại
      includeClause.submissions = {
        where: { teacherId },
        select: {
          id: true,
          teacherId: true,
          status: true,
          submittedAt: true,
          driveFileUrl: true,
          note: true,
          reviewStatus: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 1,
      };
    }

    // Đếm tổng số cuộc thi
    const total = await db.competition.count({ where: whereClause });

    // Truy vấn phân trang 10 cuộc thi mỗi lần, ưu tiên cuộc thi Đang diễn ra và hạn chót gần nhất
    const competitions = await db.competition.findMany({
      where: whereClause,
      orderBy: [
        { status: "asc" },     // "ACTIVE" đứng trước "CLOSED_EARLY"
        { deadline: "asc" },   // Cuộc thi đang diễn ra sắp hết hạn hiển thị trước
        { createdAt: "desc" }, // Mới tạo hiển thị trước
      ],
      include: includeClause as any,
      ...(fetchAll ? {} : { skip, take: limit }),
    });

    const result = competitions.map((comp: any) => {
      const userSub = (teacherId && comp.submissions && comp.submissions.length > 0)
        ? comp.submissions[0]
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
        excludeBghFromReports: comp.excludeBghFromReports ?? true,
        driveFolderId: comp.driveFolderId,
        driveFolderUrl: folderUrl,
        creatorId: comp.creatorId,
        creatorName: comp.creator?.name || "Ban Giám Hiệu",
        createdAt: comp.createdAt.toISOString(),
        updatedAt: comp.updatedAt.toISOString(),
        totalAssignees: comp._count?.assignees ?? 0,
        totalSubmissions: comp._count?.submissions ?? 0,
        isAssigned: true,
        userSubmission: userSub
          ? {
              ...userSub,
              submittedAt: userSub.submittedAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        hasMore: !fetchAll && skip + result.length < total,
      },
    });
  } catch (error) {
    console.error("Fetch competitions error:", error);
    return NextResponse.json(
      { error: "Không thể kết nối cơ sở dữ liệu để tải danh sách cuộc thi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Kiểm tra xác thực phía Server (Chỉ Admin hoặc Super Admin mới được tạo cuộc thi)
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const {
      title,
      description,
      link,
      deadline,
      allowLateSubmission = true,
      allowViewProgress = true,
      excludeBghFromReports = true,
      driveFolderId,
      assigneeIds = [],
    } = body;

    // Sử dụng ID người tạo từ Server Session đã xác thực để chống mạo danh
    const creatorId = auth.user!.id;

    if (!title || !deadline) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ tiêu đề và hạn nộp" }, { status: 400 });
    }

    if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một người thực hiện" }, { status: 400 });
    }

    // 1. TỰ ĐỘNG TẠO THƯ MỤC CON CHO CUỘC THI NÀY TRONG THƯ MỤC CHUNG
    const superAdmin = await db.teacher.findFirst({
      where: {
        OR: [
          { role: "SUPER_ADMIN" },
          { phone: "admin" },
          { name: { contains: "Quản Trị" } },
          { department: "Hệ Thống" },
        ],
      },
      select: { driveFolderId: true },
    });

    const creator = await db.teacher.findUnique({
      where: { id: creatorId },
      select: { driveFolderId: true },
    });

    const schoolDriveConfig = parseDriveConfig(superAdmin?.driveFolderId || creator?.driveFolderId);
    const customConfig = driveFolderId ? parseDriveConfig(driveFolderId) : null;

    const resolvedParentId = customConfig?.folderId || schoolDriveConfig.folderId;
    const resolvedWebhookUrl = customConfig?.webhookUrl || schoolDriveConfig.webhookUrl;

    const subfolderResult = await ensureCompetitionSubfolder({
      competitionTitle: title,
      parentFolderId: resolvedParentId,
      webhookUrl: resolvedWebhookUrl,
    });

    // Lọc bỏ tài khoản Super Admin ra khỏi danh sách người được gán cuộc thi
    const superAdminIds = (
      await db.teacher.findMany({
        where: {
          OR: [
            { role: "SUPER_ADMIN" },
            { phone: "admin" },
            { name: { contains: "Quản Trị" } },
            { department: "Hệ Thống" },
          ],
        },
        select: { id: true },
      })
    ).map((a) => a.id);

    const safeAssigneeIds = assigneeIds.filter((id: string) => !superAdminIds.includes(id));

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
        excludeBghFromReports: Boolean(excludeBghFromReports),
        driveFolderId: subfolderResult.folderId,
        driveFolderUrl: subfolderResult.folderUrl,
        creatorId,
        assignees: {
          create: safeAssigneeIds.map((tId: string) => ({
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
