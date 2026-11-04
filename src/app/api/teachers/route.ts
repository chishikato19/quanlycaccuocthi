import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { parseDriveConfig } from "@/lib/google-drive";
import {
  isDatabaseConfigured,
  mockTeachers,
  mockTeacherGroups,
  mockGroups,
  getEnrichedMockTeachers,
  MockTeacher,
} from "@/lib/mock-data";
import { requireAuth, getServerSession } from "@/lib/auth";

// Lấy danh sách giáo viên trường
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeSuperAdmin = searchParams.get("includeSuperAdmin") === "true";
    const session = getServerSession();

    if (!isDatabaseConfigured()) {
      let data = getEnrichedMockTeachers();
      if (!includeSuperAdmin) {
        data = data.filter((t) => t.role !== "SUPER_ADMIN");
      }
      return NextResponse.json({ success: true, data, isDemoMode: true });
    }

    const whereClause: Record<string, unknown> = { isActive: true };
    if (!includeSuperAdmin) {
      whereClause.role = { not: "SUPER_ADMIN" };
    }

    const teachers = await db.teacher.findMany({
      where: whereClause,
      orderBy: [
        { department: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        department: true,
        phone: true,
        role: true,
        driveFolderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        groups: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // BẢO MẬT: Loại bỏ hoàn toàn webhookUrl riêng tư khỏi kết quả trả về công khai
    const sanitizedTeachers = teachers.map((t) => {
      const isOwner = session && (session.id === t.id || session.role === "SUPER_ADMIN");
      const parsed = parseDriveConfig(t.driveFolderId);
      const groups = t.groups ? t.groups.map((tg) => tg.group) : [];
      const groupIds = groups.map((g) => g.id);
      return {
        ...t,
        groups,
        groupIds,
        // Chỉ trả về folderId sạch cho người dùng thông thường; không bao giờ leak chuỗi Webhook riêng
        driveFolderId: isOwner ? t.driveFolderId : parsed.folderId,
      };
    });

    return NextResponse.json({ success: true, data: sanitizedTeachers });
  } catch (error: unknown) {
    console.error("Fetch teachers error:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối cơ sở dữ liệu khi tải danh sách giáo viên" },
      { status: 500 }
    );
  }
}

// Thêm một giáo viên mới
export async function POST(req: Request) {
  try {
    // 1. Xác thực Server Session: Bắt buộc là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { name, department, phone, role, groupIds } = body;

    if (!name || !department) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên và tổ chuyên môn" }, { status: 400 });
    }

    // Chỉ SUPER_ADMIN mới được chỉ định tạo tài khoản ADMIN; tuyệt đối không cho phép tạo SUPER_ADMIN thứ hai
    let assignedRole: "USER" | "ADMIN" = "USER";
    if (role === "ADMIN" && auth.user!.role === "SUPER_ADMIN") {
      assignedRole = "ADMIN";
    }

    if (!isDatabaseConfigured()) {
      const newId = `tc-${Date.now()}`;
      const newMock: MockTeacher = {
        id: newId,
        name: name.trim(),
        department: department.trim(),
        phone: phone ? phone.trim() : null,
        role: assignedRole,
        pinCode: "1234",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTeachers.push(newMock);

      if (Array.isArray(groupIds) && groupIds.length > 0) {
        for (const gid of groupIds) {
          mockTeacherGroups.push({ teacherId: newId, groupId: gid });
        }
      }

      const assignedGroups = mockGroups
        .filter((g) => groupIds?.includes(g.id))
        .map((g) => ({ id: g.id, name: g.name, color: g.color }));

      return NextResponse.json({
        success: true,
        data: {
          ...newMock,
          groups: assignedGroups,
          groupIds: groupIds || [],
        },
      });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";
    const hashedPin = await bcrypt.hash(defaultPin, 10);

    const newTeacher = await db.teacher.create({
      data: {
        name: name.trim(),
        department: department.trim(),
        phone: phone ? phone.trim() : null,
        role: assignedRole,
        pinCode: hashedPin,
      },
      select: {
        id: true,
        name: true,
        department: true,
        phone: true,
        role: true,
        driveFolderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (Array.isArray(groupIds) && groupIds.length > 0) {
      await db.teacherGroup.createMany({
        data: groupIds.map((groupId: string) => ({
          teacherId: newTeacher.id,
          groupId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newTeacher,
        groupIds: groupIds || [],
      },
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo giáo viên" }, { status: 500 });
  }
}

// Cập nhật thông tin giáo viên & Cấu hình Google Drive riêng của Admin & Gán vai trò
export async function PUT(req: Request) {
  try {
    // 1. Xác thực Server Session: Bắt buộc là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { id, name, department, phone, role, driveFolderId, groupIds } = body;

    if (!id || !name || !department) {
      return NextResponse.json({ error: "Thông tin cập nhật không hợp lệ" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      const idx = mockTeachers.findIndex((t) => t.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
      }

      mockTeachers[idx].name = name.trim();
      mockTeachers[idx].department = department.trim();
      mockTeachers[idx].phone = phone ? phone.trim() : null;
      if (auth.user!.role === "SUPER_ADMIN" && role && mockTeachers[idx].role !== "SUPER_ADMIN") {
        mockTeachers[idx].role = role;
      }
      mockTeachers[idx].updatedAt = new Date();

      if (Array.isArray(groupIds)) {
        for (let i = mockTeacherGroups.length - 1; i >= 0; i--) {
          if (mockTeacherGroups[i].teacherId === id) {
            mockTeacherGroups.splice(i, 1);
          }
        }
        for (const gid of groupIds) {
          mockTeacherGroups.push({ teacherId: id, groupId: gid });
        }
      }

      const assignedGroups = mockGroups
        .filter((g) => groupIds?.includes(g.id))
        .map((g) => ({ id: g.id, name: g.name, color: g.color }));

      return NextResponse.json({
        success: true,
        data: {
          ...mockTeachers[idx],
          groups: assignedGroups,
          groupIds: groupIds || [],
        },
      });
    }

    const targetTeacher = await db.teacher.findUnique({ where: { id } });
    if (!targetTeacher) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }

    // Bảo vệ quyền: Không cho phép thay đổi role của SUPER_ADMIN
    let finalRole = targetTeacher.role;
    if (targetTeacher.role !== "SUPER_ADMIN") {
      if (auth.user!.role === "SUPER_ADMIN") {
        finalRole = role === "ADMIN" ? "ADMIN" : "USER";
      } else {
        // ADMIN thường không thể tự phong hoặc gỡ ADMIN của người khác
        finalRole = targetTeacher.role;
      }
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      department: department.trim(),
      phone: phone ? phone.trim() : null,
      role: finalRole,
    };

    // Chỉ chính chủ tài khoản hoặc Super Admin mới được cấu hình Drive
    if (driveFolderId !== undefined && (auth.user!.id === id || auth.user!.role === "SUPER_ADMIN")) {
      updateData.driveFolderId = typeof driveFolderId === "string" ? driveFolderId.trim() : null;
    }

    const updated = await db.teacher.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        department: true,
        phone: true,
        role: true,
        driveFolderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (Array.isArray(groupIds)) {
      await db.teacherGroup.deleteMany({ where: { teacherId: id } });
      if (groupIds.length > 0) {
        await db.teacherGroup.createMany({
          data: groupIds.map((groupId: string) => ({
            teacherId: id,
            groupId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        groupIds: groupIds || [],
      },
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật giáo viên" }, { status: 500 });
  }
}

// Xóa giáo viên
export async function DELETE(req: Request) {
  try {
    // 1. Xác thực Server Session: Bắt buộc là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID giáo viên" }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      const idx = mockTeachers.findIndex((t) => t.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
      }
      if (mockTeachers[idx].role === "SUPER_ADMIN" || mockTeachers[idx].phone === "admin") {
        return NextResponse.json({ error: "Không thể xóa tài khoản Tổng Quản Trị" }, { status: 403 });
      }
      mockTeachers.splice(idx, 1);
      return NextResponse.json({ success: true, message: "Đã xóa giáo viên" });
    }

    const target = await db.teacher.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy giáo viên" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN" || target.phone === "admin") {
      return NextResponse.json({ error: "Không thể xóa tài khoản Tổng Quản Trị" }, { status: 403 });
    }

    await db.teacher.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Đã xóa giáo viên" });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa giáo viên" }, { status: 500 });
  }
}
