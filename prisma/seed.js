const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Xóa dữ liệu cũ
  await prisma.submission.deleteMany();
  await prisma.competitionAssignee.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.teacher.deleteMany();

  // 1. TÀI KHOẢN TỔNG QUẢN TRỊ CẤP CAO (SUPER ADMIN) - TÁCH BIỆT HOÀN TOÀN KHỎI DANH SÁCH GIÁO VIÊN
  const superAdmin = await prisma.teacher.create({
    data: {
      name: 'Quản Trị Hệ Thống (Super Admin)',
      department: 'Hệ Thống',
      phone: 'admin', // Tên đăng nhập riêng: admin
      role: 'SUPER_ADMIN',
      pinCode: '1234',
      isActive: true,
    },
  });

  // 2. DANH SÁCH GIÁO VIÊN & NHÂN VIÊN TRƯỜNG (Đối tượng thực hiện các cuộc thi)
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
  console.log(`Created Super Admin & ${createdTeachers.length} school teachers.`);

  // 3. TẠO CUỘC THI MẪU (CHỈ GÁN CHO GIÁO VIÊN TRƯỜNG, KHÔNG GÁN SUPER ADMIN)
  const activeDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 ngày nữa
  const comp1 = await prisma.competition.create({
    data: {
      title: 'Cuộc thi Trực tuyến Tìm hiểu Chuyển đổi số Ngành Giáo dục 2026',
      description: 'Toàn thể giáo viên tham gia làm bài trắc nghiệm trên cổng thông tin, chụp lại màn hình kết quả đạt từ 80 điểm trở lên để nộp minh chứng.',
      link: 'https://chuyendoiso.moet.gov.vn',
      deadline: activeDeadline,
      status: 'ACTIVE',
      allowLateSubmission: true,
      allowViewProgress: true,
      creatorId: superAdmin.id,
    },
  });

  // Gán tất cả giáo viên trường (không gán Super Admin)
  for (const t of createdTeachers) {
    await prisma.competitionAssignee.create({
      data: {
        competitionId: comp1.id,
        teacherId: t.id,
      },
    });
  }

  // Giả lập 1 vài giáo viên đã nộp
  for (const t of createdTeachers.slice(0, 6)) {
    await prisma.submission.create({
      data: {
        competitionId: comp1.id,
        teacherId: t.id,
        status: 'ON_TIME',
        driveFileId: 'drive_sample_123',
        driveFileUrl: 'https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop',
        localImageUrl: 'https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop',
        imageFileName: 'chung_nhan_chuyen_doi_so.jpg',
        note: 'Đã hoàn thành 100/100 điểm',
        reviewStatus: 'APPROVED',
      },
    });
  }

  // Cuộc thi mẫu 2: Quá hạn
  const pastDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const comp2 = await prisma.competition.create({
    data: {
      title: 'Hội thi Tìm hiểu An toàn Giao thông và Pháp luật Việt Nam',
      description: 'Chụp giấy chứng nhận tham gia dự thi trực tuyến.',
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

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
