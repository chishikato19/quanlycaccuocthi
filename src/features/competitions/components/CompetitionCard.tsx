"use client";

import React from "react";
import { CompetitionDto } from "@/types";
import { formatDateTime, getRemainingTimeText, isOverdue } from "@/lib/utils";
import {
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  BarChart3,
  Edit,
  FastForward,
  StopCircle,
  Trash2,
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

interface CompetitionCardProps {
  competition: CompetitionDto;
  onOpenSubmit: (comp: CompetitionDto) => void;
  onOpenReport: (comp: CompetitionDto) => void;
  onEdit: (comp: CompetitionDto) => void;
  onExtend: (comp: CompetitionDto) => void;
  onCloseEarly: (comp: CompetitionDto) => void;
  onDelete: (comp: CompetitionDto) => void;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onOpenSubmit,
  onOpenReport,
  onEdit,
  onExtend,
  onCloseEarly,
  onDelete,
}) => {
  const { currentUser, isAdmin } = useAuth();

  const overdue = isOverdue(competition.deadline);
  const remaining = getRemainingTimeText(competition.deadline);
  const isClosed = competition.status === "CLOSED_EARLY";

  const totalAssignees = competition.totalAssignees || 0;
  const totalSubmissions = competition.totalSubmissions || 0;
  const percent = totalAssignees > 0 ? Math.round((totalSubmissions / totalAssignees) * 100) : 0;

  const userSub = competition.userSubmission;
  const hasUserSubmitted = !!userSub;

  const folderUrl = competition.driveFolderUrl || (competition.driveFolderId ? `https://drive.google.com/drive/folders/${competition.driveFolderId}` : null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Top Banner & Status */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Huy hiệu trạng thái */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isClosed ? (
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Đã kết thúc sớm
              </span>
            ) : overdue ? (
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {remaining.text}
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {remaining.text}
              </span>
            )}

            {competition.allowLateSubmission && overdue && !isClosed && (
              <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Cho phép nộp muộn
              </span>
            )}
          </div>

          {/* Menu thao tác Admin */}
          {isAdmin && (
            <div className="flex items-center gap-0.5">
              {folderUrl && (
                <a
                  href={folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                  title="Mở thư mục cuộc thi này trên Google Drive"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => onEdit(competition)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                title="Chỉnh sửa cuộc thi"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onExtend(competition)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-lg transition-colors"
                title="Gia hạn thời gian"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
              {!isClosed && (
                <button
                  type="button"
                  onClick={() => onCloseEarly(competition)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                  title="Kết thúc sớm"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(competition)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Xóa cuộc thi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tiêu đề cuộc thi */}
        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
          {competition.title}
        </h3>

        {/* Mô tả */}
        {competition.description && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {competition.description}
          </p>
        )}

        {/* Link tham gia nếu có */}
        {competition.link && (
          <a
            href={competition.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-medium mt-2 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Mở liên kết tham gia dự thi</span>
          </a>
        )}
      </div>

      {/* Thông tin Hạn chót & Tiến độ */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 mt-auto space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Hạn nộp:</span>
          </span>
          <span className="font-medium text-slate-700">{formatDateTime(competition.deadline)}</span>
        </div>

        {/* Tiến độ hoàn thành */}
        {(isAdmin || competition.allowViewProgress) && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500">Tiến độ nộp:</span>
              <span className="font-bold text-slate-800">
                {totalSubmissions}/{totalAssignees} người ({percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Trạng thái bài nộp cá nhân của Giáo viên */}
        {!isAdmin && currentUser && (
          <div className="pt-1">
            {hasUserSubmitted ? (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold truncate mr-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {userSub?.status === "LATE" ? "Đã nộp (Muộn)" : "Đã hoàn thành nộp"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSubmit(competition)}
                  className="text-[11px] text-emerald-700 underline font-medium hover:text-emerald-900 shrink-0"
                >
                  Nộp lại ảnh
                </button>
              </div>
            ) : (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-rose-800 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Chưa nộp minh chứng</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hành động dưới cùng */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Nút xem báo cáo (Dành cho Admin) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onOpenReport(competition)}
            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[42px]"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            <span>Xem Báo Cáo & Minh Chứng</span>
          </button>
        )}

        {/* Nút nộp minh chứng */}
        {(!overdue || competition.allowLateSubmission) && !isClosed && (
          <button
            type="button"
            onClick={() => onOpenSubmit(competition)}
            className={`py-2.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs min-h-[42px] ${
              isAdmin
                ? "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                : "flex-1 bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{hasUserSubmitted ? "Cập Nhật Minh Chứng" : "Nộp Minh Chứng Ngay"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
