import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { parseDriveConfig } from "@/lib/google-drive";
import { isDatabaseConfigured, mockTeachers } from "@/lib/mock-data";
import { requireAuth, getServerSession } from "@/lib/auth";

// Lấy danh sách giáo viên trường
export async function GET(req: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, data: mockTeachers, isDemoMode: true });
    }

    const { searchParams } = new URL(req.url);
    const includeSuperAdmin = searchParams.get("includeSuperAdmin") === "true";
    const session = getServerSession();

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
      },
    });

    // BẢO MẬT: Loại bỏ hoàn toàn webhookUrl riêng tư khỏi kết quả trả về công khai
    const sanitizedTeachers = teachers.map((t) => {
      const isOwner = session && (session.id === t.id || session.role === "SUPER_ADMIN");
      const parsed = parseDriveConfig(t.driveFolderId);
      return {
        ...t,
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
    const { name, department, phone, role } = body;

    if (!name || !department) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên và tổ chuyên môn" }, { status: 400 });
    }

    // Chỉ SUPER_ADMIN mới được chỉ định tạo tài khoản ADMIN; tuyệt đối không cho phép tạo SUPER_ADMIN thứ hai
    let assignedRole: "USER" | "ADMIN" = "USER";
    if (role === "ADMIN" && auth.user!.role === "SUPER_ADMIN") {
      assignedRole = "ADMIN";
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

    return NextResponse.json({ success: true, data: newTeacher });
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo giáo viên" }, { status: 500 });
  }
}

// Cập nhật thông tin giáo viên & Cấu hình Google Drive riêng của Admin
export async function PUT(req: Request) {
  try {
    // 1. Xác thực Server Session: Bắt buộc là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { id, name, department, phone, role, driveFolderId } = body;

    if (!id || !name || !department) {
      return NextResponse.json({ error: "Thông tin cập nhật không hợp lệ" }, { status: 400 });
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

    return NextResponse.json({ success: true, data: updated });
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
