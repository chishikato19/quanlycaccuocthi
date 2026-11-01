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
  console.log('[Cleanup] Bắt đầu chuẩn hóa tài khoản Super Admin...');

  // 1. Tìm tất cả tài khoản admin
  const adminTeachers = await prisma.teacher.findMany({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { phone: 'admin' },
        { name: { contains: 'Quản Trị' } },
        { department: 'Hệ Thống' },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (adminTeachers.length === 0) {
    console.log('[Cleanup] Không tìm thấy tài khoản admin nào.');
  } else {
    // Chọn tài khoản tốt nhất: Ưu tiên có driveFolderId chứa webhook hoặc link
    let masterAdmin =
      adminTeachers.find((a) => a.driveFolderId && a.driveFolderId.includes('webhookUrl')) ||
      adminTeachers.find((a) => a.driveFolderId && a.driveFolderId.trim().length > 0) ||
      adminTeachers[0];

    console.log(`[Cleanup] Chọn tài khoản chính: ${masterAdmin.name} (${masterAdmin.id})`);

    // Cập nhật tài khoản chính thành SUPER_ADMIN
    await prisma.teacher.update({
      where: { id: masterAdmin.id },
      data: {
        role: 'SUPER_ADMIN',
        phone: 'admin',
        name: 'Quản Trị Hệ Thống (Super Admin)',
        department: 'Hệ Thống',
        isActive: true,
      },
    });

    const duplicateAdmins = adminTeachers.filter((a) => a.id !== masterAdmin.id);

    for (const dup of duplicateAdmins) {
      // Chuyển quyền sở hữu cuộc thi sang masterAdmin
      await prisma.competition.updateMany({
        where: { creatorId: dup.id },
        data: { creatorId: masterAdmin.id },
      });

      // Xóa bài nộp rác nếu có
      await prisma.submission.deleteMany({
        where: { teacherId: dup.id },
      });

      // Xóa phân công cuộc thi của admin
      await prisma.competitionAssignee.deleteMany({
        where: { teacherId: dup.id },
      });

      // Xóa tài khoản trùng lặp
      await prisma.teacher.delete({
        where: { id: dup.id },
      }).catch((e) => console.log(`[Cleanup] Bỏ qua xóa ${dup.id}:`, e.message));
    }

    // Xóa mọi phân công cuộc thi của masterAdmin
    await prisma.competitionAssignee.deleteMany({
      where: { teacherId: masterAdmin.id },
    });

    console.log(`[Cleanup] Đã hợp nhất Super Admin duy nhất: ID ${masterAdmin.id}`);
  }

  // 2. Dọn sạch các link drive-mock ảo gây lỗi 404 trong bảng Submission
  const cleanedSubs = await prisma.submission.updateMany({
    where: {
      driveFileUrl: { contains: 'drive-mock' },
    },
    data: {
      driveFileUrl: null,
      driveFileId: null,
    },
  });
  console.log(`[Cleanup] Đã dọn dẹp ${cleanedSubs.count} đường link ảo drive-mock (tránh lỗi 404).`);

  // 3. Dọn sạch folder-mock trong bảng Competition
  const cleanedComps = await prisma.competition.updateMany({
    where: {
      driveFolderId: { contains: 'folder-mock' },
    },
    data: {
      driveFolderId: null,
      driveFolderUrl: null,
    },
  });
  console.log(`[Cleanup] Đã dọn dẹp ${cleanedComps.count} thư mục ảo folder-mock trong cuộc thi.`);

  console.log('[Cleanup] Hoàn tất quá trình chuẩn hóa hệ thống!');
}

main()
  .catch((e) => {
    console.error('[Cleanup Error]:', e.message);
    process.exit(0);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
