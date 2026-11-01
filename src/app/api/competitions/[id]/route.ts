import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const competition = await db.competition.findUnique({
      where: { id: params.id },
      include: {
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
    const body = await req.json();
    const {
      title,
      description,
      link,
      deadline,
      allowLateSubmission,
      allowViewProgress,
      assigneeIds,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (link !== undefined) updateData.link = link ? link.trim() : null;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (allowLateSubmission !== undefined) updateData.allowLateSubmission = Boolean(allowLateSubmission);
    if (allowViewProgress !== undefined) updateData.allowViewProgress = Boolean(allowViewProgress);

    // Cập nhật người thực hiện nếu có truyền assigneeIds
    if (Array.isArray(assigneeIds)) {
      // Xóa các assignee cũ
      await db.competitionAssignee.deleteMany({
        where: { competitionId: params.id },
      });

      // Tạo các assignee mới
      await db.competitionAssignee.createMany({
        data: assigneeIds.map((tId: string) => ({
          competitionId: params.id,
          teacherId: tId,
        })),
      });
    }

    const updated = await db.competition.update({
      where: { id: params.id },
      data: updateData,
    });

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
    await db.competition.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Đã xóa cuộc thi" });
  } catch (error) {
    console.error("Delete competition error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa cuộc thi" }, { status: 500 });
  }
}
