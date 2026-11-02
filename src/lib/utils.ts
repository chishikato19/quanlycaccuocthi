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

  // 1. Kiểm tra tài liệu chuyên biệt trước:
  // PDF (.pdf)
  if (name.endsWith(".pdf") || raw.includes("application/pdf") || raw.includes("pdf")) {
    return {
      category: "PDF",
      label: "Tài liệu PDF",
      ext: "PDF",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      borderColor: "border-rose-200",
    };
  }

  // Word (.doc, .docx)
  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    raw.includes("word") ||
    raw.includes("officedocument.wordprocessingml")
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

  // Excel (.xls, .xlsx, .csv)
  if (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv") ||
    raw.includes("sheet") ||
    raw.includes("excel") ||
    raw.includes("spreadsheetml") ||
    raw.includes("csv")
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

  // PowerPoint (.ppt, .pptx)
  if (
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    raw.includes("presentation") ||
    raw.includes("powerpoint")
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

  // Nén (.zip, .rar, .7z)
  if (
    name.endsWith(".zip") ||
    name.endsWith(".rar") ||
    name.endsWith(".7z") ||
    raw.includes("zip") ||
    raw.includes("compressed")
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

  // 2. Hình ảnh (Ảnh chụp minh chứng):
  // Mặc định hệ thống minh chứng là Hình ảnh (hoặc URL thumbnail Drive / Data URL / tên file không có đuôi tài liệu khác)
  const isExplicitImage =
    raw.startsWith("data:image/") ||
    raw.includes("image") ||
    raw.includes("thumbnail") ||
    raw.includes("googleusercontent") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif") ||
    name.endsWith(".bmp");

  if (isExplicitImage || !name || !name.includes(".")) {
    const ext = name.includes(".") ? (name.split(".").pop() || "jpg") : "JPG";
    return {
      category: "IMAGE",
      label: "Hình ảnh",
      ext: ext.toUpperCase(),
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      borderColor: "border-sky-200",
    };
  }

  // 3. Khác
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

