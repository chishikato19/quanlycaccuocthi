import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ParsedTeacherRow } from "@/lib/excel-parser";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Xác thực Server Session bắt buộc: Phải là ADMIN hoặc SUPER_ADMIN
    const auth = requireAuth(["ADMIN", "SUPER_ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { rows } = (await req.json()) as { rows: ParsedTeacherRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu hợp lệ để nhập" }, { status: 400 });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";
    const hashedPin = await bcrypt.hash(defaultPin, 10);
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (!row.isValid || !row.name) {
        skippedCount++;
        continue;
      }

      // BẢO MẬT: Tuyệt đối không cho phép tạo SUPER_ADMIN từ file dán; chỉ SUPER_ADMIN mới được gán role ADMIN
      let safeRole: "USER" | "ADMIN" = "USER";
      if (row.role === "ADMIN" && auth.user!.role === "SUPER_ADMIN") {
        safeRole = "ADMIN";
      }

      // Kiểm tra xem giáo viên đã tồn tại chưa (dựa theo tên và tổ bộ môn)
      const existing = await db.teacher.findFirst({
        where: {
          name: row.name.trim(),
          department: row.department.trim(),
        },
      });

      if (existing) {
        // Cập nhật lại số điện thoại hoặc kích hoạt lại nếu đã bị ẩn (bảo toàn role cũ nếu là SUPER_ADMIN)
        const updateRole = existing.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : safeRole;
        await db.teacher.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            phone: row.phone ? row.phone.trim() : existing.phone,
            role: updateRole,
          },
        });
        importedCount++;
      } else {
        // Tạo mới
        await db.teacher.create({
          data: {
            name: row.name.trim(),
            department: row.department.trim() || "Chung",
            phone: row.phone ? row.phone.trim() : null,
            role: safeRole,
            pinCode: hashedPin,
            isActive: true,
          },
        });
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${importedCount} giáo viên (bỏ qua ${skippedCount} dòng không hợp lệ)`,
      importedCount,
      skippedCount,
    });
  } catch (error) {
    console.error("Import teachers error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi nhập danh sách" }, { status: 500 });
  }
}
