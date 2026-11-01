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
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileText
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface LightboxItem {
  id: string;
  teacherName: string;
  department: string;
  status: "ON_TIME" | "LATE";
  submittedAt: string;
  imageUrl: string;
  driveFileUrl?: string | null;
  imageFileName?: string | null;
  note?: string | null;
}

interface EvidenceLightboxProps {
  items: LightboxItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const EvidenceLightbox: React.FC<EvidenceLightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  const currentItem = items[currentIndex];

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 text-white z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{currentItem.teacherName}</span>
              <span className="text-xs text-slate-400">({currentItem.department})</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentItem.status === "LATE"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {currentItem.status === "LATE" ? "Nộp muộn" : "Đúng hạn"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDateTime(currentItem.submittedAt)}
              </span>
              <span>•</span>
              <span>
                Minh chứng {currentIndex + 1} / {items.length}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh công cụ xem ảnh */}
        <div className="flex items-center gap-2">
          {currentItem.driveFileUrl && (
            <a
              href={currentItem.driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-400 bg-sky-950/60 hover:bg-sky-900 border border-sky-800/50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở trên Google Drive</span>
            </a>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

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

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors ml-2"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Nút Trước */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-800/70 hover:bg-slate-700/90 rounded-full backdrop-blur-md shadow-lg transition-all z-20"
            title="Người trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Khung hiển thị ảnh */}
        <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem.imageUrl}
            alt={`Minh chứng của ${currentItem.teacherName}`}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-all duration-150"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Nút Tiếp theo */}
        {currentIndex < items.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-800/70 hover:bg-slate-700/90 rounded-full backdrop-blur-md shadow-lg transition-all z-20"
            title="Người tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      {currentItem.note && (
        <div className="px-6 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
          <span><b>Ghi chú của giáo viên:</b> {currentItem.note}</span>
        </div>
      )}
    </div>
  );
};
