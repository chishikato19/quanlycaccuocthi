export interface MockTeacher {
  id: string;
  name: string;
  department: string;
  phone: string | null;
  role: string;
  pinCode: string;
  isActive: boolean;
  driveFolderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCompetition {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  deadline: string;
  status: string;
  allowLateSubmission: boolean;
  allowViewProgress: boolean;
  excludeBghFromReports?: boolean;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    driveFolderId: string | null;
  };
  assignees: Array<{
    id: string;
    competitionId: string;
    teacherId: string;
    teacher: {
      id: string;
      name: string;
      department: string;
    };
  }>;
  submissions: Array<{
    id: string;
    competitionId: string;
    teacherId: string;
    status: string;
    submittedAt: string;
    driveFileUrl: string | null;
    localImageUrl: string | null;
    note: string | null;
    reviewStatus: string;
    teacher?: {
      name: string;
      department: string;
    };
  }>;
  isAssigned?: boolean;
  userSubmission?: unknown;
}

export const mockSuperAdmin: MockTeacher = {
  id: "teacher-superadmin-001",
  name: "Quản Trị Hệ Thống (Super Admin)",
  department: "Hệ Thống",
  phone: "admin",
  role: "SUPER_ADMIN",
  pinCode: "1234",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTeachers: MockTeacher[] = [
  // Ban Giám Hiệu
  { id: "tc-01", name: "Thầy Nguyễn Văn An", department: "Ban Giám Hiệu", role: "ADMIN", pinCode: "1234", phone: "0901234561", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-02", name: "Cô Trần Thị Bích", department: "Ban Giám Hiệu", role: "ADMIN", pinCode: "1234", phone: "0901234562", isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Toán - Tin
  { id: "tc-03", name: "Lê Hoàng Cường (Tổ trưởng)", department: "Toán - Tin", role: "ADMIN", pinCode: "1234", phone: "0901234563", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-04", name: "Vũ Đức Em", department: "Toán - Tin", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-05", name: "Đỗ Thị Giang", department: "Toán - Tin", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-06", name: "Bùi Văn Hải", department: "Toán - Tin", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-07", name: "Ngô Thu Hương", department: "Toán - Tin", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-08", name: "Đặng Tuấn Kiệt", department: "Toán - Tin", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Ngữ Văn
  { id: "tc-09", name: "Phạm Thị Dung (Tổ trưởng)", department: "Ngữ Văn", role: "ADMIN", pinCode: "1234", phone: "0901234564", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-10", name: "Hoàng Thị Lan", department: "Ngữ Văn", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-11", name: "Trịnh Minh Long", department: "Ngữ Văn", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-12", name: "Phan Tuyết Mai", department: "Ngữ Văn", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-13", name: "Võ Thị Nga", department: "Ngữ Văn", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-14", name: "Dương Văn Oanh", department: "Ngữ Văn", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Ngoại Ngữ
  { id: "tc-15", name: "Lý Quốc Phúc (Tổ trưởng)", department: "Ngoại Ngữ", role: "ADMIN", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-16", name: "Đào Thu Quỳnh", department: "Ngoại Ngữ", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-17", name: "Hồ Minh Sơn", department: "Ngoại Ngữ", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-18", name: "Tạ Thị Tâm", department: "Ngoại Ngữ", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-19", name: "Mai Văn Uy", department: "Ngoại Ngữ", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Khoa Học Tự Nhiên
  { id: "tc-20", name: "Cao Thị Vân", department: "Khoa Học Tự Nhiên", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-21", name: "Lương Văn Xuân", department: "Khoa Học Tự Nhiên", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-22", name: "Nguyễn Như Ý", department: "Khoa Học Tự Nhiên", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-23", name: "Trần Đại Nghĩa", department: "Khoa Học Tự Nhiên", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Khoa Học Xã Hội
  { id: "tc-24", name: "Vũ Thị Kim Chi", department: "Khoa Học Xã Hội", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-25", name: "Đặng Hữu Phước", department: "Khoa Học Xã Hội", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-26", name: "Lê Thị Thu Thảo", department: "Khoa Học Xã Hội", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-27", name: "Phạm Quang Vinh", department: "Khoa Học Xã Hội", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },

  // Tổ Văn Phòng
  { id: "tc-28", name: "Lâm Văn Tài (Văn thư)", department: "Tổ Văn Phòng", role: "ADMIN", pinCode: "1234", phone: "0912345678", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-29", name: "Đinh Thị Loan (Kế toán)", department: "Tổ Văn Phòng", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "tc-30", name: "Nguyễn Thị Hằng (Y tế)", department: "Tổ Văn Phòng", role: "USER", pinCode: "1234", phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

export const mockCompetitions: MockCompetition[] = [
  {
    id: "comp-sample-01",
    title: "Cuộc thi Trực tuyến Tìm hiểu Chuyển đổi số Ngành Giáo dục 2026",
    description: "Toàn thể giáo viên tham gia làm bài trắc nghiệm trên cổng thông tin, chụp ảnh màn hình kết quả đạt từ 80 điểm trở lên để nộp minh chứng.",
    link: "https://chuyendoiso.moet.gov.vn",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    allowLateSubmission: true,
    allowViewProgress: true,
    driveFolderId: null,
    driveFolderUrl: null,
    creatorId: mockSuperAdmin.id,
    creator: {
      id: mockSuperAdmin.id,
      name: mockSuperAdmin.name,
      driveFolderId: null,
    },
    assignees: mockTeachers.map(t => ({
      id: `assignee-${t.id}-01`,
      competitionId: "comp-sample-01",
      teacherId: t.id,
      teacher: {
        id: t.id,
        name: t.name,
        department: t.department,
      },
    })),
    submissions: mockTeachers.slice(0, 8).map((t, idx) => ({
      id: `sub-${t.id}-01`,
      competitionId: "comp-sample-01",
      teacherId: t.id,
      status: "ON_TIME",
      submittedAt: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
      driveFileUrl: "https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop",
      localImageUrl: "https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop",
      note: "Đã hoàn thành 100/100 điểm trắc nghiệm",
      reviewStatus: "APPROVED",
      teacher: {
        name: t.name,
        department: t.department,
      },
    })),
  },
  {
    id: "comp-sample-02",
    title: "Hội thi Tìm hiểu An toàn Giao thông và Pháp luật Việt Nam",
    description: "Chụp giấy chứng nhận hoặc màn hình xác nhận hoàn thành bài thi tìm hiểu pháp luật ATGT trực tuyến.",
    link: "https://atgt.gov.vn",
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    allowLateSubmission: true,
    allowViewProgress: true,
    driveFolderId: null,
    driveFolderUrl: null,
    creatorId: mockSuperAdmin.id,
    creator: {
      id: mockSuperAdmin.id,
      name: mockSuperAdmin.name,
      driveFolderId: null,
    },
    assignees: mockTeachers.slice(0, 15).map(t => ({
      id: `assignee-${t.id}-02`,
      competitionId: "comp-sample-02",
      teacherId: t.id,
      teacher: {
        id: t.id,
        name: t.name,
        department: t.department,
      },
    })),
    submissions: mockTeachers.slice(0, 5).map((t, idx) => ({
      id: `sub-${t.id}-02`,
      competitionId: "comp-sample-02",
      teacherId: t.id,
      status: idx % 2 === 0 ? "ON_TIME" : "LATE",
      submittedAt: new Date(Date.now() - (idx + 1) * 7200 * 1000).toISOString(),
      driveFileUrl: "https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop",
      localImageUrl: "https://images.unsplash.com/photo-1584697964190-7bb8e7e1f440?w=800&auto=format&fit=crop",
      note: "Nộp bổ sung minh chứng hoàn thành",
      reviewStatus: "APPROVED",
      teacher: {
        name: t.name,
        department: t.department,
      },
    })),
  },
];

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED
  );
}

export function isDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && (url.startsWith("postgresql://") || url.startsWith("postgres://")));
}
