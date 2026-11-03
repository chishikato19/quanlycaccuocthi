import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractDriveFolderId } from "@/lib/google-drive";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const competition = await db.competition.findUnique({
      where: { id: params.id },
      include: {
        // Chỉ lấy tên và ID người tạo, tuyệt đối không trả về driveFolderId nhạy cảm
        creator: { select: { id: true, name: true } },
        assignees: {
          include: {
            teacher: {
              select: { id: true, name: true, department: true, phone: true },
            },
          },
        },
        submissions: {
          include: {
            teacher: {
              select: { id: true, name: true, department: true },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: "Không tìm thấy cuộc thi" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: competition });
  } catch (error) {
    console.error("Fetch competition detail error:", error);
    return NextResponse.json({ error: "Lỗi tải thông tin cuộc thi" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Kiểm tra xác thực phía Server (Chỉ Admin hoặc Super Admin)
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const {
      title,
      description,
      link,
      deadline,
      allowLateSubmission,
      allowViewProgress,
      excludeBghFromReports,
      driveFolderId,
      assigneeIds,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (link !== undefined) updateData.link = link ? link.trim() : null;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (allowLateSubmission !== undefined) updateData.allowLateSubmission = Boolean(allowLateSubmission);
    if (allowViewProgress !== undefined) updateData.allowViewProgress = Boolean(allowViewProgress);
    if (excludeBghFromReports !== undefined) updateData.excludeBghFromReports = Boolean(excludeBghFromReports);
    if (driveFolderId !== undefined) {
      const cleanId = extractDriveFolderId(driveFolderId);
      updateData.driveFolderId = cleanId;
      if (cleanId) {
        updateData.driveFolderUrl = `https://drive.google.com/drive/folders/${cleanId}`;
      }
    }

    // 2. Sử dụng Prisma Transaction để bảo toàn toàn vẹn dữ liệu:
    // Nếu có lỗi xảy ra, toàn bộ thao tác được rollback, không làm mất danh sách phân công
    const txOperations: any[] = [];

    if (Array.isArray(assigneeIds)) {
      txOperations.push(
        db.competitionAssignee.deleteMany({
          where: { competitionId: params.id },
        })
      );

      // Lọc bỏ tài khoản Super Admin ra khỏi người tham gia
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

      txOperations.push(
        db.competitionAssignee.createMany({
          data: safeAssigneeIds.map((tId: string) => ({
            competitionId: params.id,
            teacherId: tId,
          })),
        })
      );
    }

    txOperations.push(
      db.competition.update({
        where: { id: params.id },
        data: updateData,
      })
    );

    const txResults = await db.$transaction(txOperations);
    const updated = txResults[txResults.length - 1];

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update competition error:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật cuộc thi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra quyền nghiêm ngặt qua Session Cookie: Chỉ Admin hoặc Super Admin
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    await db.competition.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Đã xóa cuộc thi" });
  } catch (error) {
    console.error("Delete competition error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa cuộc thi" }, { status: 500 });
  }
}
