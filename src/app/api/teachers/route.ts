import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractDriveFolderId } from "@/lib/google-drive";

// Lấy danh sách giáo viên trường
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeSuperAdmin = searchParams.get("includeSuperAdmin") === "true";

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

    return NextResponse.json({ success: true, data: teachers });
  } catch (error: unknown) {
    console.error("Fetch teachers error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    if (
      errMessage.includes("Can't reach database server") ||
      errMessage.includes("database") ||
      errMessage.includes("connect") ||
      errMessage.includes("P1001") ||
      errMessage.includes("P2021")
    ) {
      return NextResponse.json(
        { error: "Chưa kết nối được Cơ sở dữ liệu (PostgreSQL). Vui lòng cấu hình DATABASE_URL trên Vercel." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Lỗi khi tải danh sách giáo viên" }, { status: 500 });
  }
}

// Thêm một giáo viên mới
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, department, phone, role, driveFolderId } = body;

    if (!name || !department) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên và tổ chuyên môn" }, { status: 400 });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";

    const newTeacher = await db.teacher.create({
      data: {
        name: name.trim(),
        department: department.trim(),
        phone: phone ? phone.trim() : null,
        role: role === "ADMIN" ? "ADMIN" : "USER",
        pinCode: defaultPin,
        driveFolderId: extractDriveFolderId(driveFolderId),
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
    const body = await req.json();
    const { id, name, department, phone, role, driveFolderId } = body;

    if (!id || !name || !department) {
      return NextResponse.json({ error: "Thông tin cập nhật không hợp lệ" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      department: department.trim(),
      phone: phone ? phone.trim() : null,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    };

    if (driveFolderId !== undefined) {
      updateData.driveFolderId = extractDriveFolderId(driveFolderId);
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID giáo viên" }, { status: 400 });
    }

    const target = await db.teacher.findUnique({ where: { id } });
    if (target?.role === "SUPER_ADMIN") {
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
