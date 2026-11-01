"use client";

import React, { useState, useRef } from "react";
import {
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  Copy,
  Check,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  Calendar
} from "lucide-react";
import { ReportRowData, exportReportToExcel } from "../services/exportExcel";
import { downloadReportAsPng, copyReportToClipboard } from "../services/exportImage";
import { formatDateTime } from "@/lib/utils";

interface ExportModalProps {
  competitionTitle: string;
  rows: ReportRowData[];
  stats: {
    totalAssignees: number;
    totalSubmitted: number;
    totalOnTime: number;
    totalLate: number;
    totalNotSubmitted: number;
    completionRate: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  competitionTitle,
  rows,
  stats,
  isOpen,
  onClose,
}) => {
  const previewCardRef = useRef<HTMLDivElement>(null);

  const [filterType, setFilterType] = useState<"ALL" | "SUBMITTED" | "NOT_SUBMITTED">("ALL");
  const [columns, setColumns] = useState({
    fullName: true,
    department: true,
    submitTime: true,
    submissionStatus: true,
    evidenceLink: true,
    note: true,
  });

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  // Lọc dữ liệu hiển thị xem trước
  const filteredRows = rows.filter(r => {
    if (filterType === "SUBMITTED") return r.isSubmitted;
    if (filterType === "NOT_SUBMITTED") return !r.isSubmitted;
    return true;
  });

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      exportReportToExcel({
        competitionTitle,
        rows,
        filterType,
        columns,
      });
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xuất file Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPng = async () => {
    if (!previewCardRef.current) return;
    setIsExportingPng(true);
    try {
      const sanitized = competitionTitle.replace(/[^a-zA-Z0-9_\sÀ-ỹ]/g, "").slice(0, 30);
      await downloadReportAsPng(previewCardRef.current, `BaoCao_${sanitized}`);
    } catch (e) {
      console.error(e);
      alert("Không thể xuất ảnh, vui lòng thử lại");
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (!previewCardRef.current) return;
    const ok = await copyReportToClipboard(previewCardRef.current);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } else {
      alert("Trình duyệt không hỗ trợ sao chép ảnh trực tiếp, bạn vui lòng chọn nút 'Tải ảnh PNG'");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>Tùy Chọn Xuất Báo Cáo & Danh Sách</span>
            </h3>
            <p className="text-xs text-slate-500 line-clamp-1">{competitionTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cấu hình bộ lọc & cột */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4 text-xs">
          {/* Bộ lọc đối tượng */}
          <div>
            <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-[11px]">
              1. Lọc đối tượng xuất báo cáo:
            </span>
            <div className="flex flex-wrap gap-2">
              <label
                onClick={() => setFilterType("ALL")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                  filterType === "ALL"
                    ? "bg-sky-50 border-sky-400 text-sky-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input type="radio" checked={filterType === "ALL"} onChange={() => {}} className="hidden" />
                <span>Toàn bộ danh sách ({rows.length})</span>
              </label>

              <label
                onClick={() => setFilterType("SUBMITTED")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                  filterType === "SUBMITTED"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input type="radio" checked={filterType === "SUBMITTED"} onChange={() => {}} className="hidden" />
                <span>Chỉ người ĐÃ tham gia ({stats.totalSubmitted})</span>
              </label>

              <label
                onClick={() => setFilterType("NOT_SUBMITTED")}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                  filterType === "NOT_SUBMITTED"
                    ? "bg-rose-50 border-rose-400 text-rose-800 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input type="radio" checked={filterType === "NOT_SUBMITTED"} onChange={() => {}} className="hidden" />
                <span>Chỉ người CHƯA nộp ({stats.totalNotSubmitted})</span>
              </label>
            </div>
          </div>

          {/* Cột hiển thị */}
          <div>
            <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-[11px]">
              2. Các thông tin tùy chọn khi xuất:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { key: "fullName", label: "Họ và tên" },
                { key: "department", label: "Tổ chuyên môn" },
                { key: "submissionStatus", label: "Trạng thái (Đúng / Trễ hạn)" },
                { key: "submitTime", label: "Thời gian nộp" },
                { key: "evidenceLink", label: "Link minh chứng (Drive)" },
                { key: "note", label: "Ghi chú thêm" },
              ].map(col => {
                const isChecked = columns[col.key as keyof typeof columns];
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key as keyof typeof columns)}
                    className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                      isChecked
                        ? "bg-slate-800 border-slate-800 text-white font-medium"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Khung xem trước bảng dữ liệu (Đây cũng là vùng được chụp khi xuất ảnh PNG) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div
            ref={previewCardRef}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-800 max-w-full"
          >
            {/* Header Thẻ Báo Cáo */}
            <div className="border-b-2 border-sky-600 pb-3 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs uppercase font-bold text-sky-700 tracking-wider">
                    BÁO CÁO TIẾN ĐỘ THAM GIA CUỘC THI
                  </h4>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">{competitionTitle}</h2>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <div>Ngày xuất: {formatDateTime(new Date())}</div>
                  <div className="font-semibold text-slate-700">
                    Chế độ lọc: {filterType === "ALL" ? "Toàn bộ" : filterType === "SUBMITTED" ? "Đã nộp" : "Chưa nộp"}
                  </div>
                </div>
              </div>

              {/* Tóm tắt số liệu */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-medium">Được giao</div>
                  <div className="text-sm font-bold text-slate-800">{stats.totalAssignees}</div>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <div className="text-[10px] text-emerald-600 font-medium">Đã tham gia</div>
                  <div className="text-sm font-bold text-emerald-700">{stats.totalSubmitted}</div>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <div className="text-[10px] text-amber-600 font-medium">Nộp muộn</div>
                  <div className="text-sm font-bold text-amber-700">{stats.totalLate}</div>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg">
                  <div className="text-[10px] text-rose-600 font-medium">Chưa nộp</div>
                  <div className="text-sm font-bold text-rose-700">{stats.totalNotSubmitted}</div>
                </div>
              </div>
            </div>

            {/* Bảng chi tiết */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2 px-2.5 font-bold w-10 text-center">STT</th>
                  {columns.fullName && <th className="py-2 px-2.5 font-bold">Họ và Tên</th>}
                  {columns.department && <th className="py-2 px-2.5 font-bold">Tổ Bộ Môn</th>}
                  {columns.submissionStatus && <th className="py-2 px-2.5 font-bold text-center">Trạng Thái</th>}
                  {columns.submitTime && <th className="py-2 px-2.5 font-bold">Thời Gian Nộp</th>}
                  {columns.evidenceLink && <th className="py-2 px-2.5 font-bold text-center">Minh Chứng</th>}
                  {columns.note && <th className="py-2 px-2.5 font-bold">Ghi Chú</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r, i) => (
                  <tr key={r.teacherId} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-2 px-2.5 text-center font-medium text-slate-400">{i + 1}</td>
                    {columns.fullName && <td className="py-2 px-2.5 font-semibold text-slate-800">{r.teacherName}</td>}
                    {columns.department && <td className="py-2 px-2.5 text-slate-600">{r.department}</td>}
                    {columns.submissionStatus && (
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.submissionStatus === "ĐÚNG HẠN"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.submissionStatus === "NỘP MUỘN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {r.submissionStatus}
                        </span>
                      </td>
                    )}
                    {columns.submitTime && (
                      <td className="py-2 px-2.5 text-slate-500 font-mono text-[11px]">
                        {r.submitTime ? formatDateTime(r.submitTime) : "---"}
                      </td>
                    )}
                    {columns.evidenceLink && (
                      <td className="py-2 px-2.5 text-center">
                        {r.isSubmitted ? (
                          <span className="text-emerald-600 font-medium">Có ảnh</span>
                        ) : (
                          <span className="text-slate-300">Chưa có</span>
                        )}
                      </td>
                    )}
                    {columns.note && <td className="py-2 px-2.5 text-slate-500 italic">{r.note || "---"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nút hành động xuất file */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Số lượng xuất: <b>{filteredRows.length}</b> giáo viên
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? "Đang xuất..." : "Tải File Excel (.xlsx)"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isExportingPng ? "Đang tạo ảnh..." : "Tải Ảnh PNG (.png)"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép! Dán Zalo ngay</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép ảnh (Dán Zalo)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
