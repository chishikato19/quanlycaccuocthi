const { PrismaClient } = require('@prisma/client');

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

if (dbUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

async function main() {
  console.log('[Cleanup] Bắt đầu dọn dẹp tài khoản Super Admin khỏi danh sách tham gia cuộc thi...');

  // Tìm tất cả ID của Super Admin hoặc tài khoản quản trị
  const adminTeachers = await prisma.teacher.findMany({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { phone: 'admin' },
        { name: { contains: 'Quản Trị' } },
        { department: 'Hệ Thống' },
      ],
    },
    select: { id: true, name: true, role: true, phone: true },
  });

  const adminIds = adminTeachers.map((a) => a.id);

  if (adminIds.length > 0) {
    // 1. Xóa tất cả lượt gán cuộc thi của Super Admin
    const deletedAssignees = await prisma.competitionAssignee.deleteMany({
      where: { teacherId: { in: adminIds } },
    });
    console.log(`[Cleanup] Đã xóa ${deletedAssignees.count} lượt gán cuộc thi cho Quản Trị Hệ Thống.`);

    // 2. Xóa các bản ghi Super Admin trùng lặp có role USER
    const deletedDuplicateAdmins = await prisma.teacher.deleteMany({
      where: {
        id: { in: adminIds },
        role: { not: 'SUPER_ADMIN' },
      },
    });
    console.log(`[Cleanup] Đã xóa ${deletedDuplicateAdmins.count} tài khoản Quản Trị Hệ Thống bị trùng lặp.`);
  }

  console.log('[Cleanup] Hoàn tất dọn dẹp!');
}

main()
  .catch((e) => {
    console.error('[Cleanup Error]:', e.message);
    process.exit(0);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
