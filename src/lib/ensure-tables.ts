import { db } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/mock-data";

let isEnsured = false;

/**
 * Đảm bảo các bảng mới Group và TeacherGroup tồn tại trong PostgreSQL
 * Chạy an toàn với "CREATE TABLE IF NOT EXISTS" - Tuyệt đối không can thiệp bảng cũ hay xóa dữ liệu.
 */
export async function ensureGroupTablesExist(): Promise<void> {
  if (isEnsured || !isDatabaseConfigured()) return;

  try {
    // 1. Tạo bảng Group nếu chưa có
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Group" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "color" TEXT DEFAULT 'blue',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tạo bảng liên kết TeacherGroup nếu chưa có
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TeacherGroup" (
        "teacherId" TEXT NOT NULL,
        "groupId" TEXT NOT NULL,
        "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("teacherId", "groupId"),
        CONSTRAINT "TeacherGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "TeacherGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 3. Tạo index phục vụ tìm kiếm nhanh
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Group_name_idx" ON "Group"("name");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TeacherGroup_groupId_idx" ON "TeacherGroup"("groupId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "TeacherGroup_teacherId_idx" ON "TeacherGroup"("teacherId");`);

    isEnsured = true;
  } catch (error) {
    console.warn("Could not auto-create Group tables via raw SQL:", error);
  }
}
