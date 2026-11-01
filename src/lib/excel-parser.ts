import { normalizeVietnamese } from "./utils";

export interface ParsedTeacherRow {
  name: string;
  department: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isValid: boolean;
  error?: string;
}

export function parseExcelPaste(rawText: string): ParsedTeacherRow[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const results: ParsedTeacherRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Tách cột bằng phím Tab (chuẩn clipboard từ Excel) hoặc dấu phẩy/chấm phẩy
    let cells = line.split("\t");
    if (cells.length === 1 && line.includes(",")) {
      cells = line.split(",");
    }

    const cleanCells = cells.map(c => c.trim().replace(/^["']|["']$/g, ""));
    if (cleanCells.length === 0 || cleanCells.every(c => c === "")) continue;

    // Kiểm tra nếu là dòng tiêu đề (Header row) -> bỏ qua
    const firstCellNormalized = normalizeVietnamese(cleanCells[0]);
    if (
      firstCellNormalized === "stt" ||
      firstCellNormalized === "ho va ten" ||
      firstCellNormalized === "ho ten" ||
      firstCellNormalized === "ten"
    ) {
      continue;
    }

    // Xử lý các cột:
    // Cấu trúc 1: [STT], [Họ và tên], [Tổ chuyên môn], [SĐT/Ghi chú]
    // Cấu trúc 2: [Họ và tên], [Tổ chuyên môn], [SĐT]
    let name = "";
    let department = "Chung";
    let phone = "";
    let role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' = 'USER';

    // Nếu cột đầu tiên là số thứ tự (STT)
    if (/^\d+$/.test(cleanCells[0]) && cleanCells.length > 1) {
      name = cleanCells[1] || "";
      department = cleanCells[2] || "Chung";
      phone = cleanCells[3] || "";
      if (cleanCells[4]) {
        const rNorm = normalizeVietnamese(cleanCells[4]);
        if (rNorm.includes("tong admin") || rNorm.includes("super")) role = "SUPER_ADMIN";
        else if (rNorm.includes("admin") || rNorm.includes("quan tri")) role = "ADMIN";
      }
    } else {
      name = cleanCells[0] || "";
      department = cleanCells[1] || "Chung";
      phone = cleanCells[2] || "";
      if (cleanCells[3]) {
        const rNorm = normalizeVietnamese(cleanCells[3]);
        if (rNorm.includes("tong admin") || rNorm.includes("super")) role = "SUPER_ADMIN";
        else if (rNorm.includes("admin") || rNorm.includes("quan tri")) role = "ADMIN";
      }
    }

    if (!name || name.length < 2) {
      results.push({
        name: name || "(Trống)",
        department,
        phone,
        role,
        isValid: false,
        error: "Họ tên không hợp lệ",
      });
    } else {
      results.push({
        name,
        department: department || "Chung",
        phone,
        role,
        isValid: true,
      });
    }
  }

  return results;
}
