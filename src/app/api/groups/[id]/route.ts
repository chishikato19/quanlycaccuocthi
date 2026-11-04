import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockGroups, mockTeacherGroups } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

// Sửa thông tin nhóm
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;
    const body = await req.json();
    const { name, description, color } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tên nhóm không được để trống" }, { status: 400 });
    }

    const trimmedName = name.trim();

    if (!isDatabaseConfigured()) {
      const idx = mockGroups.findIndex((g) => g.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
      }

      // Check duplicate name on another group
      const duplicate = mockGroups.some(
        (g) => g.id !== id && g.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json({ error: "Tên nhóm này đã được sử dụng" }, { status: 400 });
      }

      mockGroups[idx].name = trimmedName;
      mockGroups[idx].description = description !== undefined ? (description ? description.trim() : null) : mockGroups[idx].description;
      mockGroups[idx].color = color || mockGroups[idx].color;
      mockGroups[idx].updatedAt = new Date();

      return NextResponse.json({
        success: true,
        data: {
          ...mockGroups[idx],
          teacherCount: mockTeacherGroups.filter((tg) => tg.groupId === id).length,
          createdAt: mockGroups[idx].createdAt.toISOString(),
          updatedAt: mockGroups[idx].updatedAt.toISOString(),
        },
      });
    }

    // Check duplicate name in DB
    const existingWithName = await db.group.findFirst({
      where: {
        name: trimmedName,
        id: { not: id },
      },
    });
    if (existingWithName) {
      return NextResponse.json({ error: "Tên nhóm này đã được sử dụng" }, { status: 400 });
    }

    const updated = await db.group.update({
      where: { id },
      data: {
        name: trimmedName,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        color: color || undefined,
      },
      include: {
        _count: {
          select: { teachers: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        color: updated.color || "blue",
        teacherCount: updated._count.teachers,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật nhóm" }, { status: 500 });
  }
}

// Xóa nhóm (Chỉ xóa liên kết nhóm, không ảnh hưởng giáo viên hoặc cuộc thi)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = params;

    if (!isDatabaseConfigured()) {
      const idx = mockGroups.findIndex((g) => g.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 });
      }

      mockGroups.splice(idx, 1);
      // Remove all associations in mockTeacherGroups
      for (let i = mockTeacherGroups.length - 1; i >= 0; i--) {
        if (mockTeacherGroups[i].groupId === id) {
          mockTeacherGroups.splice(i, 1);
        }
      }

      return NextResponse.json({ success: true, message: "Đã xóa nhóm thành công" });
    }

    await db.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa nhóm thành công" });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa nhóm" }, { status: 500 });
  }
}
