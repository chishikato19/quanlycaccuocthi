import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/utils";

export interface ReportRowData {
  stt: number;
  submissionId?: string | null;
  teacherId: string;
  teacherName: string;
  department: string;
  isBgh?: boolean;
  phone?: string;
  isSubmitted: boolean;
  submissionStatus: string; // 'ĐÚNG HẠN' | 'NỘP MUỘN' | 'CHƯA NỘP'
  submitTime: string | null;
  driveFileUrl: string | null;
  localImageUrl?: string | null;
  imageFileName?: string | null;
  note?: string;
}

export function exportReportToExcel(params: {
  competitionTitle: string;
  rows: ReportRowData[];
  filterType: "ALL" | "SUBMITTED" | "NOT_SUBMITTED";
  columns: {
    fullName: boolean;
    department: boolean;
    submitTime: boolean;
    submissionStatus: boolean;
    evidenceLink: boolean;
    note: boolean;
  };
}) {
  const { competitionTitle, rows, filterType, columns } = params;

  // Lọc hàng dữ liệu
  let filteredRows = [...rows];
  if (filterType === "SUBMITTED") {
    filteredRows = filteredRows.filter(r => r.isSubmitted);
  } else if (filterType === "NOT_SUBMITTED") {
    filteredRows = filteredRows.filter(r => !r.isSubmitted);
  }

  // Định dạng dữ liệu cho Excel
  const excelData = filteredRows.map((row, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowObj: Record<string, any> = {
      "STT": idx + 1,
    };

    if (columns.fullName) rowObj["Họ và Tên"] = row.teacherName;
    if (columns.department) rowObj["Tổ Chuyên Môn"] = row.department;
    if (columns.submissionStatus) rowObj["Trạng Thái Tham Gia"] = row.submissionStatus;
    if (columns.submitTime) rowObj["Thời Gian Nộp"] = row.submitTime ? formatDateTime(row.submitTime) : "---";
    if (columns.evidenceLink) rowObj["Link Minh Chứng (Drive)"] = row.driveFileUrl || (row.isSubmitted ? "Đã nộp" : "Chưa có");
    if (columns.note) rowObj["Ghi Chú"] = row.note || "";

    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Tự động căn chỉnh độ rộng cột
  const colWidths = Object.keys(excelData[0] || {}).map(key => ({
    wch: Math.max(key.length + 4, 15),
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Báo Cáo Cuộc Thi");

  // Xuất file tải về
  const filterLabel = filterType === "SUBMITTED" ? "_DaNop" : filterType === "NOT_SUBMITTED" ? "_ChuaNop" : "_ToanBo";
  const sanitizedTitle = competitionTitle.replace(/[^a-zA-Z0-9_\sÀ-ỹ]/g, "").slice(0, 30);
  const fileName = `BaoCao_${sanitizedTitle}${filterLabel}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
