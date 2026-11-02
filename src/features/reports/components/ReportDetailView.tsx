"use client";

import React, { useState, useEffect } from "react";
import { CompetitionDto } from "@/types";
import { formatDateTime, getFileTypeInfo } from "@/lib/utils";
import {
  ArrowLeft,
  FileSpreadsheet,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Search,
  Filter,
  FolderOpen,
  FileText,
  FolderArchive,
  Download,
  Crown,
} from "lucide-react";
import { ExportModal } from "./ExportModal";
import { EvidenceLightbox, LightboxItem } from "@/features/submissions/components/EvidenceLightbox";
import { ReportRowData } from "../services/exportExcel";

interface ReportDetailViewProps {
  competitionId: string;
  onBack: () => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  competitionId,
  onBack,
}) => {
  const [reportData, setReportData] = useState<{
    competition: CompetitionDto;
    stats: {
      totalAssignees: number;
      totalSubmitted: number;
      totalOnTime: number;
      totalLate: number;
      totalNotSubmitted: number;
      completionRate: number;
    };
    rows: ReportRowData[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedZaloReminder, setCopiedZaloReminder] = useState(false);
  const [copiedBghReminder, setCopiedBghReminder] = useState(false);

  // Bộ lọc bảng
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "NOT_SUBMITTED">("ALL");

  // Lightbox
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    loadReport();
  }, [competitionId]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/${competitionId}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);

        const validLightboxItems: LightboxItem[] = [];
        for (const r of json.data.rows) {
          if (r.isSubmitted) {
            validLightboxItems.push({
              id: r.teacherId,
              submissionId: r.submissionId,
              teacherName: r.teacherName,
              department: r.department,
              status: r.submissionStatus === "NỘP MUỘN" ? "LATE" : "ON_TIME",
              submittedAt: r.submitTime || new Date().toISOString(),
              imageUrl: "",
              driveFileUrl: r.driveFileUrl,
              imageFileName: r.imageFileName,
              note: r.note,
            });
          }
        }
        setLightboxItems(validLightboxItems);
      } else {
        setError(json.error || "Không thể tải báo cáo");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLightbox = (teacherId: string) => {
    const idx = lightboxItems.findIndex(item => item.id === teacherId);
    if (idx !== -1) {
      setLightboxIndex(idx);
      setIsLightboxOpen(true);
    }
  };

  // Kiểm tra hàng có phải Ban Giám Hiệu
  const checkIsBgh = (r: ReportRowData) => {
    return Boolean(r.isBgh) || (r.department || "").toLowerCase().includes("ban giám hiệu") || (r.department || "").toLowerCase() === "bgh";
  };

  // Sao chép nhanh danh sách giáo viên chưa nộp để gửi vào nhóm Zalo chung
  const handleCopyZaloReminder = () => {
    if (!reportData) return;
    const shouldExcludeBgh = reportData.competition.excludeBghFromReports !== false;

    const safeRows = reportData.rows.filter(r => {
      if (r.department === "Hệ Thống") return false;
      if (r.teacherName.toLowerCase().includes("quản trị") || r.teacherName.toLowerCase().includes("super admin")) return false;
      // Nếu bật tùy chọn loại bỏ BGH khỏi danh sách đôn đốc chung
      if (shouldExcludeBgh && checkIsBgh(r)) return false;
      return true;
    });

    const notSubmittedRows = safeRows.filter(r => !r.isSubmitted);
    if (notSubmittedRows.length === 0) {
      alert("Tất cả giáo viên trong danh sách đôn đốc đã hoàn thành nộp minh chứng!");
      return;
    }

    let text = `📢 [ĐÔN ĐỐC] CUỘC THI: ${reportData.competition.title}\n`;
    text += `⏰ Hạn chót: ${formatDateTime(reportData.competition.deadline)}\n`;
    text += `Danh sách còn (${notSubmittedRows.length} đồng chí) chưa nộp minh chứng:\n`;

    notSubmittedRows.forEach((r, idx) => {
      text += `${idx + 1}. ${r.teacherName} (${r.department})\n`;
    });

    text += `\nKính đề nghị các đồng chí khẩn trương hoàn thành báo cáo. Trân trọng!`;

    navigator.clipboard.writeText(text);
    setCopiedZaloReminder(true);
    setTimeout(() => setCopiedZaloReminder(false), 2500);
  };

  // Sao chép tin nhắn nhắc riêng kính cẩn gửi cho Ban Giám Hiệu
  const handleCopyBghReminder = () => {
    if (!reportData) return;
    const bghNotSubmitted = reportData.rows.filter(r => checkIsBgh(r) && !r.isSubmitted);

    if (bghNotSubmitted.length === 0) {
      alert("Toàn bộ Thầy/Cô trong Ban Giám Hiệu đã hoàn thành nộp minh chứng!");
      return;
    }

    let text = `Dạ kính gửi Ban Giám Hiệu nhà trường!\n\n`;
    text += `Bộ phận văn thư xin phép kính báo về tiến độ cuộc thi:\n`;
    text += `📋 Cuộc thi / Nhiệm vụ: ${reportData.competition.title}\n`;
    text += `⏰ Hạn chót hoàn thành: ${formatDateTime(reportData.competition.deadline)}\n\n`;
    text += `Hiện tại hệ thống ghi nhận Thầy/Cô chưa hoàn tất việc nộp minh chứng:\n`;
    bghNotSubmitted.forEach((r) => {
      text += `  - ${r.teacherName}\n`;
    });
    text += `\nKính đề nghị Thầy/Cô bớt chút thời gian hoàn thành báo cáo trên hệ thống để bộ phận văn thư kịp tổng hợp số liệu chung của toàn trường.\n\n`;
    text += `Bộ phận văn thư xin trân trọng cảm ơn Thầy/Cô!`;

    navigator.clipboard.writeText(text);
    setCopiedBghReminder(true);
    setTimeout(() => setCopiedBghReminder(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
        Đang tổng hợp báo cáo chi tiết...
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-red-600 border border-red-200">
        <p>{error || "Không tìm thấy dữ liệu báo cáo"}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { competition, stats, rows } = reportData;
  const bghRows = rows.filter(checkIsBgh);
  const bghNotSubmittedCount = bghRows.filter(r => !r.isSubmitted).length;

  const folderUrl = competition.driveFolderUrl || (competition.driveFolderId ? `https://drive.google.com/drive/folders/${competition.driveFolderId}` : null);

  const safeRows = rows.filter(r => {
    if (r.department === "Hệ Thống") return false;
    if (r.teacherName.toLowerCase().includes("quản trị") || r.teacherName.toLowerCase().includes("super admin")) return false;
    return true;
  });

  const filteredRows = safeRows.filter(r => {
    if (statusFilter === "SUBMITTED" && !r.isSubmitted) return false;
    if (statusFilter === "NOT_SUBMITTED" && r.isSubmitted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.teacherName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header & Navigation */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors shrink-0 mt-0.5"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Báo cáo tiến độ
              </span>
              <span className="text-xs text-slate-400">
                Hạn chót: {formatDateTime(competition.deadline)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {competition.title}
            </h2>
          </div>
        </div>

        {/* Nút hành động Xuất Báo Cáo & Mở Folder Google Drive */}
        <div className="flex flex-wrap items-center gap-2">
          {folderUrl && (
            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl shadow-xs transition-all"
              title="Mở thư mục con của cuộc thi này trên Google Drive để xem trọn bộ file ảnh gốc"
            >
              <FolderOpen className="w-4 h-4 text-purple-600" />
              <span>Mở Thư Mục Drive</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopyZaloReminder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            title="Sao chép văn bản danh sách giáo viên chưa nộp để gửi vào nhóm Zalo chung"
          >
            {copiedZaloReminder ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép DS Zalo!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy DS Chưa Nộp</span>
              </>
            )}
          </button>

          {/* Nút Nhắc Riêng Ban Giám Hiệu */}
          {bghNotSubmittedCount > 0 ? (
            <button
              type="button"
              onClick={handleCopyBghReminder}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all border border-purple-600"
              title="Sao chép tin nhắn nhắc riêng kính cẩn gửi riêng cho Ban Giám Hiệu"
            >
              {copiedBghReminder ? (
                <>
                  <Check className="w-4 h-4 text-purple-200" />
                  <span className="text-purple-200">Đã chép tin BGH!</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Nhắc Riêng BGH ({bghNotSubmittedCount})</span>
                </>
              )}
            </button>
          ) : bghRows.length > 0 ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>BGH: Đã nộp 100%</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Báo Cáo (Excel / Ảnh)</span>
          </button>
        </div>
      </div>

      {/* Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Được phân công</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.totalAssignees}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-medium text-emerald-600">Đã tham gia</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.totalSubmitted}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-sky-100 shadow-xs bg-sky-50/20">
          <div className="text-[11px] font-medium text-sky-600">Đúng hạn</div>
          <div className="text-xl font-bold text-sky-700 mt-1">{stats.totalOnTime}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs bg-amber-50/20">
          <div className="text-[11px] font-medium text-amber-600">Nộp muộn</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{stats.totalLate}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-medium text-rose-600">Chưa nộp</div>
          <div className="text-xl font-bold text-rose-700 mt-1">{stats.totalNotSubmitted}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Tỷ lệ hoàn thành</div>
          <div className="text-xl font-bold text-sky-600 mt-1">{stats.completionRate}%</div>
        </div>
      </div>

      {/* Bảng chi tiết danh sách từng giáo viên */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Thanh lọc trên bảng */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tất cả ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "SUBMITTED"
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Đã tham gia ({stats.totalSubmitted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("NOT_SUBMITTED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "NOT_SUBMITTED"
                  ? "bg-rose-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Chưa nộp ({stats.totalNotSubmitted})
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên giáo viên..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center font-bold">STT</th>
                <th className="py-3 px-3.5 font-bold">Họ và Tên</th>
                <th className="py-3 px-3.5 font-bold">Tổ Chuyên Môn</th>
                <th className="py-3 px-3.5 font-bold text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 font-bold">Thời Gian Nộp</th>
                <th className="py-3 px-3.5 font-bold">Minh Chứng</th>
                <th className="py-3 px-3.5 font-bold">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không có giáo viên nào trong bộ lọc này
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.teacherId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                      {r.teacherName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {checkIsBgh(r) ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{r.department}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {r.department}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          r.submissionStatus === "ĐÚNG HẠN"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : r.submissionStatus === "NỘP MUỘN"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {r.submissionStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                      {r.submitTime ? formatDateTime(r.submitTime) : "---"}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {r.isSubmitted ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(() => {
                            const info = getFileTypeInfo(r.imageFileName, r.localImageUrl || r.driveFileUrl);
                            let actionText = "Xem tệp";
                            if (info.category === "IMAGE") actionText = "Xem ảnh";
                            else if (info.category === "PDF") actionText = "Xem PDF";
                            else if (info.category === "WORD") actionText = "Xem Word";
                            else if (info.category === "EXCEL") actionText = "Xem Excel";
                            else if (info.category === "POWERPOINT") actionText = "Xem PPT";
                            else if (info.category === "ARCHIVE") actionText = "File nén";

                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenLightbox(r.teacherId)}
                                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${info.badgeBg} ${info.badgeText} ${info.borderColor} hover:opacity-85 shadow-2xs`}
                                title={`Mở xem ${info.label} (${r.imageFileName || info.ext})`}
                              >
                                {info.category === "IMAGE" && <ImageIcon className="w-3.5 h-3.5" />}
                                {info.category === "PDF" && <FileText className="w-3.5 h-3.5" />}
                                {info.category === "WORD" && <FileText className="w-3.5 h-3.5" />}
                                {info.category === "EXCEL" && <FileSpreadsheet className="w-3.5 h-3.5" />}
                                {info.category === "ARCHIVE" && <FolderArchive className="w-3.5 h-3.5" />}
                                {(info.category === "OTHER" || info.category === "POWERPOINT") && <Eye className="w-3.5 h-3.5" />}
                                <span>{actionText}</span>
                              </button>
                            );
                          })()}

                          {r.driveFileUrl && !r.driveFileUrl.includes("drive-mock") && !r.driveFileUrl.includes("mock") && (
                            <a
                              href={r.driveFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-purple-600 rounded-md transition-colors"
                              title="Mở file trên Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px]">Chưa nộp</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 text-[11px] italic">
                      {r.note || "---"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Modal Xem Ảnh Nhanh (Lazy Loading Siêu Tốc) */}
      <EvidenceLightbox
        competitionId={competitionId}
        items={lightboxItems}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />

      {/* Modal Xuất Báo Cáo */}
      <ExportModal
        competitionTitle={competition.title}
        rows={rows}
        stats={stats}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
