import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockTeachers } from "@/lib/mock-data";

// Lấy danh sách các tổ và số lượng thành viên
export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      const counts: Record<string, number> = {};
      for (const t of mockTeachers) {
        if (t.role !== "SUPER_ADMIN") {
          const dept = t.department || "Chung";
          counts[dept] = (counts[dept] || 0) + 1;
        }
      }
      const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
      return NextResponse.json({ success: true, data });
    }

    const teachers = await db.teacher.findMany({
      where: {
        isActive: true,
        role: { not: "SUPER_ADMIN" },
        name: { not: { contains: "Quản Trị" } },
      },
      select: { department: true },
    });

    const counts: Record<string, number> = {};
    for (const t of teachers) {
      const dept = t.department || "Chung";
      counts[dept] = (counts[dept] || 0) + 1;
    }

    const data = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Fetch departments error:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách tổ chuyên môn" }, { status: 500 });
  }
}

// Thao tác với Tổ chuyên môn: ASSIGN (thêm/chuyển vào tổ), RENAME (đổi tên tổ), DELETE (xóa tổ)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, department, teacherIds, oldName, newName, departmentName } = body;

    // 1. GÁN HOẶC CHUYỂN GIÁO VIÊN VÀO TỔ
    if (action === "ASSIGN" || department) {
      const targetDept = (department || "").trim();
      if (!targetDept) {
        return NextResponse.json({ error: "Tên tổ không được để trống" }, { status: 400 });
      }
      if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        return NextResponse.json({ error: "Vui lòng chọn ít nhất một giáo viên" }, { status: 400 });
      }

      if (!isDatabaseConfigured()) {
        for (const t of mockTeachers) {
          if (teacherIds.includes(t.id)) {
            t.department = targetDept;
          }
        }
        return NextResponse.json({
          success: true,
          message: `Đã chuyển ${teacherIds.length} giáo viên vào "${targetDept}"`,
        });
      }

      await db.teacher.updateMany({
        where: { id: { in: teacherIds } },
        data: { department: targetDept },
      });

      return NextResponse.json({
        success: true,
        message: `Đã chuyển ${teacherIds.length} giáo viên vào "${targetDept}"`,
      });
    }

    // 2. ĐỔI TÊN TỔ CHUYÊN MÔN
    if (action === "RENAME") {
      const fromName = (oldName || "").trim();
      const toName = (newName || "").trim();

      if (!fromName || !toName) {
        return NextResponse.json({ error: "Tên tổ cũ và tên tổ mới không hợp lệ" }, { status: 400 });
      }

      if (!isDatabaseConfigured()) {
        for (const t of mockTeachers) {
          if (t.department === fromName) t.department = toName;
        }
        return NextResponse.json({ success: true, message: `Đã đổi tên tổ thành "${toName}"` });
      }

      const res = await db.teacher.updateMany({
        where: { department: fromName },
        data: { department: toName },
      });

      return NextResponse.json({
        success: true,
        message: `Đã đổi tên tổ từ "${fromName}" thành "${toName}" (${res.count} giáo viên)`,
      });
    }

    // 3. XÓA TỔ (Chuyển các thành viên về tổ "Chung")
    if (action === "DELETE") {
      const target = (departmentName || "").trim();
      if (!target || target === "Chung") {
        return NextResponse.json({ error: "Không thể xóa tổ mặc định này" }, { status: 400 });
      }

      if (!isDatabaseConfigured()) {
        for (const t of mockTeachers) {
          if (t.department === target) t.department = "Chung";
        }
        return NextResponse.json({ success: true, message: `Đã giải thể tổ "${target}"` });
      }

      await db.teacher.updateMany({
        where: { department: target },
        data: { department: "Chung" },
      });

      return NextResponse.json({
        success: true,
        message: `Đã giải tán tổ "${target}", các thành viên đã được chuyển về tổ "Chung"`,
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    console.error("Department API error:", error);
    return NextResponse.json({ error: "Lỗi xử lý tổ chuyên môn" }, { status: 500 });
  }
}
