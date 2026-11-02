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
  const name = (fileName || "").toLowerCase().trim();
  const raw = (dataUrlOrMime || "").toLowerCase().trim();

  // Chỉ lấy phần MIME type header nếu raw là Data URL (ví dụ: "data:image/jpeg" từ "data:image/jpeg;base64,xxxx")
  // Tuyệt đối KHÔNG tìm kiếm chuỗi con trên toàn bộ chuỗi Base64 khổng lồ (tránh trùng ngẫu nhiên chữ 'pdf', 'word'...)
  let mimeHeader = raw;
  if (raw.startsWith("data:")) {
    mimeHeader = raw.slice(0, 60).split(";")[0];
  }

  // 1. Ưu tiên cao nhất: Kiểm tra đuôi mở rộng của tên tệp tin (File Extension)
  if (name.includes(".")) {
    const ext = name.split(".").pop() || "";

    // 1.1 Hình ảnh
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "heic"].includes(ext)) {
      return {
        category: "IMAGE",
        label: "Hình ảnh",
        ext: ext.toUpperCase(),
        badgeBg: "bg-sky-50",
        badgeText: "text-sky-700",
        borderColor: "border-sky-200",
      };
    }

    // 1.2 PDF
    if (ext === "pdf") {
      return {
        category: "PDF",
        label: "Tài liệu PDF",
        ext: "PDF",
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        borderColor: "border-rose-200",
      };
    }

    // 1.3 Word
    if (["doc", "docx"].includes(ext)) {
      return {
        category: "WORD",
        label: "Tài liệu Word",
        ext: ext.toUpperCase(),
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        borderColor: "border-blue-200",
      };
    }

    // 1.4 Excel
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return {
        category: "EXCEL",
        label: "Bảng tính Excel",
        ext: ext.toUpperCase(),
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        borderColor: "border-emerald-200",
      };
    }

    // 1.5 PowerPoint
    if (["ppt", "pptx"].includes(ext)) {
      return {
        category: "POWERPOINT",
        label: "Trình chiếu PowerPoint",
        ext: ext.toUpperCase(),
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-700",
        borderColor: "border-amber-200",
      };
    }

    // 1.6 Nén
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      return {
        category: "ARCHIVE",
        label: "Tệp nén",
        ext: ext.toUpperCase(),
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-700",
        borderColor: "border-purple-200",
      };
    }
  }

  // 2. Nếu tên tệp không có đuôi mở rộng, kiểm tra Header MIME Type / URL Drive
  // 2.1 Hình ảnh
  if (
    mimeHeader.startsWith("data:image/") ||
    mimeHeader.startsWith("image/") ||
    mimeHeader.includes("thumbnail") ||
    mimeHeader.includes("googleusercontent")
  ) {
    return {
      category: "IMAGE",
      label: "Hình ảnh",
      ext: "JPG",
      badgeBg: "bg-sky-50",
      badgeText: "text-sky-700",
      borderColor: "border-sky-200",
    };
  }

  // 2.2 PDF
  if (mimeHeader === "application/pdf" || mimeHeader.startsWith("data:application/pdf")) {
    return {
      category: "PDF",
      label: "Tài liệu PDF",
      ext: "PDF",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      borderColor: "border-rose-200",
    };
  }

  // 2.3 Word
  if (
    mimeHeader.includes("word") ||
    mimeHeader.includes("officedocument.wordprocessingml")
  ) {
    return {
      category: "WORD",
      label: "Tài liệu Word",
      ext: "DOCX",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      borderColor: "border-blue-200",
    };
  }

  // 2.4 Excel
  if (
    mimeHeader.includes("spreadsheetml") ||
    mimeHeader.includes("ms-excel") ||
    mimeHeader.includes("csv")
  ) {
    return {
      category: "EXCEL",
      label: "Bảng tính Excel",
      ext: "XLSX",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      borderColor: "border-emerald-200",
    };
  }

  // 2.5 PowerPoint
  if (
    mimeHeader.includes("presentationml") ||
    mimeHeader.includes("ms-powerpoint")
  ) {
    return {
      category: "POWERPOINT",
      label: "Trình chiếu PowerPoint",
      ext: "PPTX",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      borderColor: "border-amber-200",
    };
  }

  // 2.6 Nén
  if (
    mimeHeader.includes("zip") ||
    mimeHeader.includes("compressed") ||
    mimeHeader.includes("x-rar")
  ) {
    return {
      category: "ARCHIVE",
      label: "Tệp nén",
      ext: "ZIP",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      borderColor: "border-purple-200",
    };
  }

  // 3. Mặc định trong hệ thống minh chứng cuộc thi: Nếu không có đuôi tệp rõ ràng thì coi là Hình ảnh
  return {
    category: "IMAGE",
    label: "Hình ảnh",
    ext: "JPG",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    borderColor: "border-sky-200",
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

