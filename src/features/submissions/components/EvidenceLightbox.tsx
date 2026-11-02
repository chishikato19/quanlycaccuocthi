"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ExternalLink,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  FileSpreadsheet,
  FolderArchive,
  File as FileIcon,
  FileType as FileTypeIcon,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { getFileTypeInfo } from "@/lib/utils";

export interface LightboxItem {
  id: string; // teacherId
  submissionId?: string | null;
  teacherName: string;
  department: string;
  status: "ON_TIME" | "LATE";
  submittedAt: string;
  imageUrl?: string;
  driveFileUrl?: string | null;
  imageFileName?: string | null;
  note?: string | null;
}

interface EvidenceLightboxProps {
  competitionId?: string;
  items: LightboxItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const EvidenceLightbox: React.FC<EvidenceLightboxProps> = ({
  competitionId,
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  // Bộ nhớ đệm minh chứng đã tải theo yêu cầu (Lazy Loading Cache)
  const [evidenceCache, setEvidenceCache] = useState<Record<string, string>>({});
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");

  const currentItem = items[currentIndex];
  const effectiveImageUrl = (currentItem && evidenceCache[currentItem.id]) || currentItem?.imageUrl || "";

  const resetTransform = useCallback(() => {
    setRotation(0);
    setScale(1);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      resetTransform();
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, items.length, onNavigate, resetTransform]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      resetTransform();
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate, resetTransform]);

  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  // Cơ chế Tải Minh Chứng Theo Nhu Cầu (Lazy Loading on demand)
  useEffect(() => {
    if (!isOpen || !currentItem) return;

    // Nếu đã có ảnh trong cache hoặc đã có url
    if (evidenceCache[currentItem.id] || currentItem.imageUrl) {
      setIsLoadingEvidence(false);
      setEvidenceError("");
      return;
    }

    let isMounted = true;
    setIsLoadingEvidence(true);
    setEvidenceError("");

    const fetchEvidence = async () => {
      try {
        const query = currentItem.submissionId
          ? `submissionId=${currentItem.submissionId}`
          : `competitionId=${competitionId || ""}&teacherId=${currentItem.id}`;

        const res = await fetch(`/api/submissions/evidence?${query}`);
        const json = await res.json();

        if (isMounted) {
          if (res.ok && json.success && json.data.imageUrl) {
            setEvidenceCache(prev => ({
              ...prev,
              [currentItem.id]: json.data.imageUrl,
            }));
          } else {
            setEvidenceError(json.error || "Không tìm thấy file minh chứng");
          }
        }
      } catch (err) {
        if (isMounted) {
          setEvidenceError("Lỗi kết nối máy chủ khi tải minh chứng");
        }
      } finally {
        if (isMounted) {
          setIsLoadingEvidence(false);
        }
      }
    };

    fetchEvidence();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentItem, competitionId, evidenceCache]);

  // Hỗ trợ phím tắt bàn phím
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentItem) return null;

  const fileInfo = getFileTypeInfo(currentItem.imageFileName, effectiveImageUrl);
  const isImage = fileInfo.category === "IMAGE";
  const safeFileName = currentItem.imageFileName || `minh_chung_${currentItem.teacherName}.${fileInfo.ext.toLowerCase()}`;

  const renderDocumentIcon = () => {
    switch (fileInfo.category) {
      case "PDF":
        return <FileText className="w-16 h-16 text-rose-400" />;
      case "WORD":
        return <FileText className="w-16 h-16 text-blue-400" />;
      case "EXCEL":
        return <FileSpreadsheet className="w-16 h-16 text-emerald-400" />;
      case "POWERPOINT":
        return <FileTypeIcon className="w-16 h-16 text-amber-400" />;
      case "ARCHIVE":
        return <FolderArchive className="w-16 h-16 text-purple-400" />;
      default:
        return <FileIcon className="w-16 h-16 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none touch-manipulation">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-white z-10 gap-2">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-slate-100">{currentItem.teacherName}</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    currentItem.status === "LATE"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {currentItem.status === "LATE" ? "Nộp muộn" : "Đúng hạn"}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md ${fileInfo.badgeBg} ${fileInfo.badgeText}`}>
                  {fileInfo.label}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{currentItem.department}</span>
                <span>•</span>
                <span>{currentIndex + 1} / {items.length}</span>
              </div>
            </div>
          </div>

          {/* Nút đóng trên mobile */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-2 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Thanh công cụ xem file */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t border-slate-800 sm:border-0">
          {/* Nút Tải Về Máy */}
          {effectiveImageUrl && (
            <a
              href={effectiveImageUrl}
              download={safeFileName}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/50 rounded-lg transition-colors"
              title="Tải tệp này về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tải về</span>
            </a>
          )}

          {/* Nút Mở Google Drive */}
          {currentItem.driveFileUrl && (
            <a
              href={currentItem.driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-400 bg-sky-950/60 hover:bg-sky-900 border border-sky-800/50 rounded-lg transition-colors"
              title="Mở tệp trên Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[11px]">Drive</span>
            </a>
          )}

          {/* Các nút xoay/phóng to chỉ dành cho Ảnh */}
          {isImage && effectiveImageUrl && (
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Xoay ảnh 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setScale(s => Math.min(s + 0.25, 3))}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nút đóng trên máy tính */}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors ml-1"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Nút Trước */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full backdrop-blur-md shadow-lg transition-all z-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Người trước"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Khung hiển thị: Đang tải, Lỗi, Ảnh hoặc Thẻ Tài Liệu */}
        {isLoadingEvidence ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3.5 shadow-2xl animate-in fade-in">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-white">
                Đang tải minh chứng của {currentItem.teacherName}...
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tải siêu tốc riêng lẻ theo yêu cầu &bull; Tiết kiệm dữ liệu
              </p>
            </div>
          </div>
        ) : evidenceError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3 shadow-2xl text-center max-w-sm animate-in fade-in">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="text-xs text-rose-200">{evidenceError}</p>
            {currentItem.driveFileUrl && (
              <a
                href={currentItem.driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở Trên Google Drive</span>
              </a>
            )}
          </div>
        ) : isImage && effectiveImageUrl ? (
          <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={effectiveImageUrl}
              alt={`Minh chứng của ${currentItem.teacherName}`}
              className="max-h-[70vh] sm:max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all duration-150"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        ) : (
          /* Khung hiển thị Thẻ Tài Liệu (Word, PDF, Excel...) */
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-800/80 flex items-center justify-center border border-slate-700/80 shadow-inner">
              {renderDocumentIcon()}
            </div>

            <div>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${fileInfo.badgeBg} ${fileInfo.badgeText} mb-2`}>
                {fileInfo.label} ({fileInfo.ext})
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white break-all px-2">
                {safeFileName}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Người nộp: <b>{currentItem.teacherName}</b> &bull; {currentItem.department}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {/* Tải về */}
              {effectiveImageUrl && (
                <a
                  href={effectiveImageUrl}
                  download={safeFileName}
                  className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all min-h-[42px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Tệp Về Máy</span>
                </a>
              )}

              {/* Mở xem PDF hoặc link */}
              {fileInfo.category === "PDF" && effectiveImageUrl && (
                <a
                  href={effectiveImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all min-h-[42px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Xem Trực Tiếp</span>
                </a>
              )}

              {/* Mở Google Drive */}
              {currentItem.driveFileUrl && (
                <a
                  href={currentItem.driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all min-h-[42px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Google Drive</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Nút Tiếp theo */}
        {currentIndex < items.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full backdrop-blur-md shadow-lg transition-all z-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Người tiếp theo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      {currentItem.note && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate"><b>Ghi chú:</b> {currentItem.note}</span>
        </div>
      )}
    </div>
  );
};
