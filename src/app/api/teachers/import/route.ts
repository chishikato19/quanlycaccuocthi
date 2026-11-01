import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ParsedTeacherRow } from "@/lib/excel-parser";

export async function POST(req: Request) {
  try {
    const { rows } = (await req.json()) as { rows: ParsedTeacherRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu hợp lệ để nhập" }, { status: 400 });
    }

    const defaultPin = process.env.DEFAULT_USER_PIN || "1234";
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (!row.isValid || !row.name) {
        skippedCount++;
        continue;
      }

      // Kiểm tra xem giáo viên đã tồn tại chưa (dựa theo tên và tổ bộ môn)
      const existing = await db.teacher.findFirst({
        where: {
          name: row.name.trim(),
          department: row.department.trim(),
        },
      });

      if (existing) {
        // Cập nhật lại số điện thoại hoặc kích hoạt lại nếu đã bị ẩn
        await db.teacher.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            phone: row.phone ? row.phone.trim() : existing.phone,
            role: row.role || existing.role,
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
            role: row.role || "USER",
            pinCode: defaultPin,
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
