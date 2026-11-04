import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockGroups, mockTeacherGroups } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";

const DEFAULT_PRESET_GROUPS = [
  { name: "Đảng viên", description: "Cán bộ, giáo viên thuộc Chi bộ", color: "red" },
  { name: "Đoàn viên", description: "Chi đoàn thanh niên giáo viên", color: "blue" },
  { name: "Nữ công", description: "Cán bộ, giáo viên, nhân viên nữ", color: "rose" },
  { name: "Cán bộ quản lý", description: "Ban Giám hiệu và Tổ trưởng chuyên môn", color: "purple" },
  { name: "Công đoàn viên", description: "Toàn thể đoàn viên công đoàn", color: "amber" },
];

// Lấy danh sách nhóm / vai trò
export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      const data = mockGroups.map((g) => {
        const count = mockTeacherGroups.filter((tg) => tg.groupId === g.id).length;
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          color: g.color,
          teacherCount: count,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        };
      });
      return NextResponse.json({ success: true, data, isDemoMode: true });
    }

    const groups = await db.group.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { teachers: true },
        },
      },
    });

    const data = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      color: g.color || "blue",
      teacherCount: g._count.teachers,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch groups error:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối khi tải danh sách nhóm/vai trò" },
      { status: 500 }
    );
  }
}

// Tạo nhóm mới hoặc khởi tạo nhóm mặc định
export async function POST(req: Request) {
  try {
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { action, name, description, color = "blue" } = body;

    // Khởi tạo các nhóm mặc định thông dụng
    if (action === "SEED_DEFAULTS") {
      if (!isDatabaseConfigured()) {
        for (const preset of DEFAULT_PRESET_GROUPS) {
          const exists = mockGroups.some((g) => g.name.toLowerCase() === preset.name.toLowerCase());
          if (!exists) {
            mockGroups.push({
              id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: preset.name,
              description: preset.description,
              color: preset.color,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
        return NextResponse.json({
          success: true,
          message: "Đã khởi tạo các nhóm mặc định thành công",
        });
      }

      for (const preset of DEFAULT_PRESET_GROUPS) {
        await db.group.upsert({
          where: { name: preset.name },
          update: {},
          create: {
            name: preset.name,
            description: preset.description,
            color: preset.color,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Đã khởi tạo các nhóm mặc định thành công",
      });
    }

    // Tạo nhóm đơn lẻ
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập tên nhóm / vai trò" }, { status: 400 });
    }

    const trimmedName = name.trim();

    if (!isDatabaseConfigured()) {
      const exists = mockGroups.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        return NextResponse.json({ error: "Tên nhóm này đã tồn tại" }, { status: 400 });
      }

      const newGroup = {
        id: `grp-${Date.now()}`,
        name: trimmedName,
        description: description ? description.trim() : null,
        color: color || "blue",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGroups.push(newGroup);

      return NextResponse.json({
        success: true,
        data: {
          ...newGroup,
          teacherCount: 0,
          createdAt: newGroup.createdAt.toISOString(),
          updatedAt: newGroup.updatedAt.toISOString(),
        },
      });
    }

    const exists = await db.group.findUnique({
      where: { name: trimmedName },
    });
    if (exists) {
      return NextResponse.json({ error: "Tên nhóm này đã tồn tại" }, { status: 400 });
    }

    const created = await db.group.create({
      data: {
        name: trimmedName,
        description: description ? description.trim() : null,
        color: color || "blue",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...created,
        teacherCount: 0,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo nhóm mới" }, { status: 500 });
  }
}
