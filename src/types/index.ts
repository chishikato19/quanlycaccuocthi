export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface GroupDto {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  teacherCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherDto {
  id: string;
  name: string;
  department: string;
  phone?: string | null;
  role: Role;
  pinCode?: string;
  isActive: boolean;
  driveFolderId?: string | null;
  groups?: GroupDto[];
  groupIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionDto {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  deadline: string;
  status: 'ACTIVE' | 'CLOSED_EARLY';
  allowLateSubmission: boolean;
  allowViewProgress: boolean;
  excludeBghFromReports?: boolean;
  driveFolderId?: string | null;
  driveFolderUrl?: string | null;
  creatorId: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  assignees?: {
    teacherId: string;
    teacherName: string;
    department: string;
  }[];
  totalAssignees?: number;
  totalSubmissions?: number;
  userSubmission?: SubmissionDto | null;
}

export interface SubmissionDto {
  id: string;
  competitionId: string;
  teacherId: string;
  teacherName?: string;
  department?: string;
  status: 'ON_TIME' | 'LATE';
  driveFileId?: string | null;
  driveFileUrl?: string | null;
  localImageUrl?: string | null;
  imageFileName?: string | null;
  note?: string | null;
  submittedAt: string;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADMIN_CONFIRMED' | string;
}

export interface ExportFilterOptions {
  statusFilter: 'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED';
  departmentFilter?: string; // 'ALL' or specific department
  columns: {
    fullName: boolean;
    department: boolean;
    submitTime: boolean;
    submissionStatus: boolean; // Đúng hạn / Trễ hạn / Chưa nộp
    evidenceLink: boolean;
    note: boolean;
  };
}
