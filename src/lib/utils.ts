import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "---";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "---";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "---";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "---";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function isOverdue(deadlineInput: string | Date): boolean {
  const deadline = typeof deadlineInput === "string" ? new Date(deadlineInput) : deadlineInput;
  return new Date() > deadline;
}

export function getRemainingTimeText(deadlineInput: string | Date): { text: string; isPast: boolean } {
  const deadline = typeof deadlineInput === "string" ? new Date(deadlineInput) : deadlineInput;
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overdueHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    if (overdueHours < 24) {
      return { text: `Quá hạn ${overdueHours} giờ`, isPast: true };
    }
    const overdueDays = Math.floor(overdueHours / 24);
    return { text: `Quá hạn ${overdueDays} ngày`, isPast: true };
  }

  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (remainingHours < 24) {
    return { text: `Còn ${remainingHours} giờ`, isPast: false };
  }
  const remainingDays = Math.floor(remainingHours / 24);
  const leftHours = remainingHours % 24;
  return { text: `Còn ${remainingDays} ngày ${leftHours} giờ`, isPast: false };
}

export function normalizeVietnamese(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export type FileTypeCategory = "IMAGE" | "PDF" | "WORD" | "EXCEL" | "POWERPOINT" | "ARCHIVE" | "OTHER";

export interface FileTypeInfo {
  category: FileTypeCategory;
  label: string;
  ext: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export function getFileTypeInfo(fileName?: string | null, dataUrlOrMime?: string | null): FileTypeInfo {
  const name = (fileName || "").toLowerCase();
  const raw = (dataUrlOrMime || "").toLowerCase();

  // Mặc định nếu chưa có tên file và chưa có dataUrl: xem như Ảnh minh chứng
  if (!name && !raw) {
    return {
      category: "IMAGE",
      label: "Hình ảnh",
      ext: "JPG",
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      borderColor: "border-sky-200",
    };
  }

  // 1. Hình ảnh
  if (
    raw.startsWith("data:image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif") ||
    name.endsWith(".bmp")
  ) {
    const ext = name.split(".").pop() || "jpg";
    return {
      category: "IMAGE",
      label: "Hình ảnh",
      ext: ext.toUpperCase(),
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      borderColor: "border-sky-200",
    };
  }

  // 2. PDF
  if (raw.includes("pdf") || name.endsWith(".pdf")) {
    return {
      category: "PDF",
      label: "Tài liệu PDF",
      ext: "PDF",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      borderColor: "border-rose-200",
    };
  }

  // 3. Word (.doc, .docx)
  if (
    raw.includes("word") ||
    raw.includes("officedocument.wordprocessingml") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return {
      category: "WORD",
      label: "Tài liệu Word",
      ext: name.endsWith(".doc") ? "DOC" : "DOCX",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      borderColor: "border-blue-200",
    };
  }

  // 4. Excel (.xls, .xlsx, .csv)
  if (
    raw.includes("sheet") ||
    raw.includes("excel") ||
    raw.includes("spreadsheetml") ||
    raw.includes("csv") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv")
  ) {
    return {
      category: "EXCEL",
      label: "Bảng tính Excel",
      ext: name.endsWith(".xls") ? "XLS" : name.endsWith(".csv") ? "CSV" : "XLSX",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      borderColor: "border-emerald-200",
    };
  }

  // 5. PowerPoint (.ppt, .pptx)
  if (
    raw.includes("presentation") ||
    raw.includes("powerpoint") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ) {
    return {
      category: "POWERPOINT",
      label: "Trình chiếu PowerPoint",
      ext: name.endsWith(".ppt") ? "PPT" : "PPTX",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      borderColor: "border-amber-200",
    };
  }

  // 6. Nén (.zip, .rar, .7z)
  if (
    raw.includes("zip") ||
    raw.includes("compressed") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z")
  ) {
    return {
      category: "ARCHIVE",
      label: "Tệp nén",
      ext: name.endsWith(".rar") ? "RAR" : "ZIP",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      borderColor: "border-purple-200",
    };
  }

  // 7. Khác
  const ext = name.split(".").pop() || "FILE";
  return {
    category: "OTHER",
    label: "Tệp đính kèm",
    ext: ext.toUpperCase(),
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    borderColor: "border-slate-200",
  };
}

export function getMimeTypeFromFileName(fileName?: string | null): string {
  if (!fileName) return "application/octet-stream";
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "zip":
      return "application/zip";
    case "rar":
      return "application/x-rar-compressed";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

