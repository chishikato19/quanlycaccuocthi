const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[Auto-Seed] Kiểm tra cơ sở dữ liệu...');

  // 1. Kiểm tra tài khoản Tổng Quản Trị (Super Admin)
  let superAdmin = await prisma.teacher.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!superAdmin) {
    console.log('[Auto-Seed] Chưa có Super Admin. Đang khởi tạo Super Admin mặc định...');
    superAdmin = await prisma.teacher.create({
      data: {
        name: 'Quản Trị Hệ Thống (Super Admin)',
        department: 'Hệ Thống',
        phone: 'admin', // Tên đăng nhập riêng: admin
        role: 'SUPER_ADMIN',
        pinCode: '1234',
        isActive: true,
      },
    });
    console.log('[Auto-Seed] Đã tạo Super Admin thành công (Tên đăng nhập: admin, PIN: 1234)');
  } else {
    console.log('[Auto-Seed] Super Admin đã tồn tại:', superAdmin.phone);
  }

  // 2. Kiểm tra danh sách giáo viên trường
  const teacherCount = await prisma.teacher.count({
    where: { role: { not: 'SUPER_ADMIN' } },
  });

  if (teacherCount === 0) {
    console.log('[Auto-Seed] Chưa có giáo viên. Đang nạp danh sách giáo viên mẫu ban đầu...');

    const schoolTeachers = [
      // Ban Giám Hiệu
      { name: 'Thầy Nguyễn Văn An', department: 'Ban Giám Hiệu', role: 'ADMIN', pinCode: '1234', phone: '0901234561' },
      { name: 'Cô Trần Thị Bích', department: 'Ban Giám Hiệu', role: 'ADMIN', pinCode: '1234', phone: '0901234562' },

      // Tổ Toán - Tin
      { name: 'Lê Hoàng Cường (Tổ trưởng)', department: 'Toán - Tin', role: 'ADMIN', pinCode: '1234', phone: '0901234563' },
      { name: 'Vũ Đức Em', department: 'Toán - Tin', role: 'USER', pinCode: '1234' },
      { name: 'Đỗ Thị Giang', department: 'Toán - Tin', role: 'USER', pinCode: '1234' },
      { name: 'Bùi Văn Hải', department: 'Toán - Tin', role: 'USER', pinCode: '1234' },
      { name: 'Ngô Thu Hương', department: 'Toán - Tin', role: 'USER', pinCode: '1234' },
      { name: 'Đặng Tuấn Kiệt', department: 'Toán - Tin', role: 'USER', pinCode: '1234' },

      // Tổ Ngữ Văn
      { name: 'Phạm Thị Dung (Tổ trưởng)', department: 'Ngữ Văn', role: 'ADMIN', pinCode: '1234', phone: '0901234564' },
      { name: 'Hoàng Thị Lan', department: 'Ngữ Văn', role: 'USER', pinCode: '1234' },
      { name: 'Trịnh Minh Long', department: 'Ngữ Văn', role: 'USER', pinCode: '1234' },
      { name: 'Phan Tuyết Mai', department: 'Ngữ Văn', role: 'USER', pinCode: '1234' },
      { name: 'Võ Thị Nga', department: 'Ngữ Văn', role: 'USER', pinCode: '1234' },
      { name: 'Dương Văn Oanh', department: 'Ngữ Văn', role: 'USER', pinCode: '1234' },

      // Tổ Ngoại Ngữ
      { name: 'Lý Quốc Phúc (Tổ trưởng)', department: 'Ngoại Ngữ', role: 'ADMIN', pinCode: '1234' },
      { name: 'Đào Thu Quỳnh', department: 'Ngoại Ngữ', role: 'USER', pinCode: '1234' },
      { name: 'Hồ Minh Sơn', department: 'Ngoại Ngữ', role: 'USER', pinCode: '1234' },
      { name: 'Tạ Thị Tâm', department: 'Ngoại Ngữ', role: 'USER', pinCode: '1234' },
      { name: 'Mai Văn Uy', department: 'Ngoại Ngữ', role: 'USER', pinCode: '1234' },

      // Tổ Khoa Học Tự Nhiên
      { name: 'Cao Thị Vân', department: 'Khoa Học Tự Nhiên', role: 'USER', pinCode: '1234' },
      { name: 'Lương Văn Xuân', department: 'Khoa Học Tự Nhiên', role: 'USER', pinCode: '1234' },
      { name: 'Nguyễn Như Ý', department: 'Khoa Học Tự Nhiên', role: 'USER', pinCode: '1234' },
      { name: 'Trần Đại Nghĩa', department: 'Khoa Học Tự Nhiên', role: 'USER', pinCode: '1234' },

      // Tổ Khoa Học Xã Hội
      { name: 'Vũ Thị Kim Chi', department: 'Khoa Học Xã Hội', role: 'USER', pinCode: '1234' },
      { name: 'Đặng Hữu Phước', department: 'Khoa Học Xã Hội', role: 'USER', pinCode: '1234' },
      { name: 'Lê Thị Thu Thảo', department: 'Khoa Học Xã Hội', role: 'USER', pinCode: '1234' },
      { name: 'Phạm Quang Vinh', department: 'Khoa Học Xã Hội', role: 'USER', pinCode: '1234' },

      // Tổ Văn Phòng
      { name: 'Lâm Văn Tài (Văn thư)', department: 'Tổ Văn Phòng', role: 'ADMIN', pinCode: '1234', phone: '0912345678' },
      { name: 'Đinh Thị Loan (Kế toán)', department: 'Tổ Văn Phòng', role: 'USER', pinCode: '1234' },
      { name: 'Nguyễn Thị Hằng (Y tế)', department: 'Tổ Văn Phòng', role: 'USER', pinCode: '1234' },
    ];

    const createdTeachers = [];
    for (const t of schoolTeachers) {
      const teacher = await prisma.teacher.create({ data: t });
      createdTeachers.push(teacher);
    }
    console.log(`[Auto-Seed] Đã tạo thành công ${createdTeachers.length} giáo viên mẫu.`);

    // 3. Tạo cuộc thi mẫu ban đầu
    const compCount = await prisma.competition.count();
    if (compCount === 0) {
      console.log('[Auto-Seed] Tạo cuộc thi mẫu...');
      const activeDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 ngày tới
      const comp1 = await prisma.competition.create({
        data: {
          title: 'Cuộc thi Trực tuyến Tìm hiểu Chuyển đổi số Ngành Giáo dục 2026',
          description: 'Toàn thể giáo viên tham gia làm bài trắc nghiệm trên cổng thông tin, chụp ảnh màn hình kết quả đạt để nộp minh chứng.',
          link: 'https://chuyendoiso.moet.gov.vn',
          deadline: activeDeadline,
          status: 'ACTIVE',
          allowLateSubmission: true,
          allowViewProgress: true,
          creatorId: superAdmin.id,
        },
      });

      // Gán tất cả giáo viên trường vào cuộc thi 1
      for (const t of createdTeachers) {
        await prisma.competitionAssignee.create({
          data: {
            competitionId: comp1.id,
            teacherId: t.id,
          },
        });
      }

      // Cuộc thi mẫu 2
      const pastDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // Quá hạn 2 ngày
      const comp2 = await prisma.competition.create({
        data: {
          title: 'Hội thi Tìm hiểu An toàn Giao thông và Pháp luật Việt Nam',
          description: 'Chụp giấy chứng nhận tham gia dự thi trực tuyến nộp minh chứng.',
          link: 'https://atgt.gov.vn',
          deadline: pastDeadline,
          status: 'ACTIVE',
          allowLateSubmission: true,
          allowViewProgress: true,
          creatorId: superAdmin.id,
        },
      });

      for (const t of createdTeachers.slice(0, 15)) {
        await prisma.competitionAssignee.create({
          data: {
            competitionId: comp2.id,
            teacherId: t.id,
          },
        });
      }

      console.log('[Auto-Seed] Đã tạo thành công 2 cuộc thi mẫu.');
    }
  } else {
    console.log(`[Auto-Seed] Đã có ${teacherCount} giáo viên trong CSDL. Bỏ qua bước nạp giáo viên mẫu.`);
  }

  console.log('[Auto-Seed] Hoàn tất kiểm tra và khởi tạo dữ liệu ban đầu.');
}

main()
  .catch((e) => {
    console.error('[Auto-Seed Error]:', e);
    // Không làm sập tiến trình build nếu CSDL chưa kết nối kịp
    process.exit(0);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
