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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none touch-manipulation">
      {/* Top Bar - Tối ưu trên cả điện thoại và máy tính */}
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
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{currentItem.department}</span>
                <span>•</span>
                <span>{currentIndex + 1} / {items.length}</span>
              </div>
            </div>
          </div>

          {/* Nút đóng trên mobile ở góc phải */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden p-2 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Thanh công cụ xem ảnh */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t border-slate-800 sm:border-0">
          {currentItem.driveFileUrl && (
            <a
              href={currentItem.driveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-400 bg-sky-950/60 hover:bg-sky-900 border border-sky-800/50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[11px]">Mở Drive</span>
            </a>
          )}

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
      </div>

      {/* Main Image View Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
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

        {/* Khung hiển thị ảnh */}
        <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentItem.imageUrl}
            alt={`Minh chứng của ${currentItem.teacherName}`}
            className="max-h-[70vh] sm:max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all duration-150"
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
