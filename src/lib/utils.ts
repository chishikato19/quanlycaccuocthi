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
