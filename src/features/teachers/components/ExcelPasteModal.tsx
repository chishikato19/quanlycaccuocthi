"use client";

import React, { useState } from "react";
import { parseExcelPaste, ParsedTeacherRow } from "@/lib/excel-parser";
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Upload, Check, Copy } from "lucide-react";

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelPasteModal: React.FC<ExcelPasteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedTeacherRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    const rows = parseExcelPaste(val);
    setParsedRows(rows);
    setError("");
  };

  const validRows = parsedRows.filter(r => r.isValid);

  const handleImport = async () => {
    if (validRows.length === 0) {
      setError("Không có dòng dữ liệu nào hợp lệ để nhập");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/teachers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `Đã nhập thành công ${data.importedCount} giáo viên!`);
        onSuccess();
        onClose();
        setRawText("");
        setParsedRows([]);
      } else {
        setError(data.error || "Lỗi khi nhập danh sách");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Nhập Danh Sách Giáo Viên Từ Excel</h3>
              <p className="text-xs text-slate-500">Bôi đen bảng trong Excel, nhấn Ctrl+C và dán Ctrl+V vào ô dưới</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ô dán văn bản */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Dán nội dung sao chép từ Excel vào đây:
              </label>
              <span className="text-[11px] text-slate-400">Định dạng hỗ trợ: [Họ tên] [Tổ bộ môn] [Số điện thoại]</span>
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={handleTextChange}
              placeholder="Ví dụ dán vào:&#10;Nguyễn Văn An	Toán - Tin	0901234567&#10;Trần Thị Bích	Ngữ Văn	0907654321&#10;Lê Văn Cường	Khoa Học Tự Nhiên"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono bg-slate-50/50"
            />
          </div>

          {/* Bảng xem trước dữ liệu được nhận diện */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Xem trước dữ liệu nhận diện ({validRows.length} hợp lệ / {parsedRows.length} dòng):
              </span>
              {validRows.length > 0 && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng nhập
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
              {parsedRows.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có dữ liệu. Vui lòng dán nội dung từ Excel vào ô phía trên.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">STT</th>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-3">Tổ Chuyên Môn</th>
                      <th className="py-2 px-3">Số Điện Thoại</th>
                      <th className="py-2 px-3">Vai Trò</th>
                      <th className="py-2 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-red-50/50"}>
                        <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{row.name}</td>
                        <td className="py-2 px-3 text-slate-600">{row.department}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono">{row.phone || "---"}</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            {row.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="text-emerald-600 text-[11px] font-medium">Hợp lệ</span>
                          ) : (
                            <span className="text-red-500 text-[11px] font-medium">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={validRows.length === 0 || isSubmitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isSubmitting ? "Đang xử lý..." : `Lưu ${validRows.length} Giáo Viên Vào Hệ Thống`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
