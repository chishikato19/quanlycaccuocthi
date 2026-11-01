"use client";

import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Camera, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { CompetitionDto } from "@/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import { isOverdue } from "@/lib/utils";

interface UploadProofModalProps {
  competition: CompetitionDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadProofModal: React.FC<UploadProofModalProps> = ({
  competition,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedImageBase64, setSelectedImageBase64] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [fileSizeInfo, setFileSizeInfo] = useState<{ original: string; compressed: string } | null>(null);
  const [note, setNote] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !competition || !currentUser) return null;

  const overdue = isOverdue(competition.deadline);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsCompressing(true);

    try {
      const origSize = (file.size / 1024).toFixed(1) + " KB";

      // Cấu hình nén ảnh tự động tại client
      const options = {
        maxSizeMB: 1, // Tối đa 1MB
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const compSize = (compressedFile.size / 1024).toFixed(1) + " KB";
      setFileSizeInfo({ original: origSize, compressed: compSize });
      setFileName(file.name);

      // Chuyển sang Base64 để gửi API
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setSelectedImageBase64(reader.result as string);
        setIsCompressing(false);
      };
    } catch (err) {
      console.error("Compression error:", err);
      setError("Không thể xử lý ảnh, vui lòng thử lại hoặc chọn ảnh khác");
      setIsCompressing(false);
    } finally {
      // Reset input value để có thể chọn lại cùng 1 file nếu muốn
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageBase64) {
      setError("Vui lòng chụp hoặc chọn ảnh minh chứng từ điện thoại/máy tính");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: competition.id,
          teacherId: currentUser.id,
          base64Image: selectedImageBase64,
          fileName: fileName || "minh_chung.jpg",
          mimeType: "image/jpeg",
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Nộp minh chứng thành công!");
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccessMsg("");
          setSelectedImageBase64("");
          setNote("");
        }, 1500);
      } else {
        setError(data.error || "Không thể nộp minh chứng");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Báo Cáo & Nộp Minh Chứng</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{competition.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {overdue && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b>Thông báo quá hạn:</b> Cuộc thi đã qua thời hạn chót.
                {competition.allowLateSubmission ? (
                  <span> Hệ thống vẫn tiếp nhận bài nộp của thầy/cô nhưng sẽ được ghi nhận là <b>Nộp muộn</b>.</span>
                ) : (
                  <span> Cuộc thi này đã khóa nộp.</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ẨN 2 INPUTS: 1 DÀNH CHO CAMERA, 1 DÀNH CHO THƯ VIỆN ẢNH */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* KHU VỰC TẢI ẢNH: 2 LỰA CHỌN RÕ RÀNG */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Chọn hoặc chụp ảnh minh chứng
            </label>

            {!selectedImageBase64 ? (
              <div className="space-y-2.5">
                {/* 2 Nút bấm riêng biệt: Chụp Camera HOẶC Lấy từ Bộ sưu tập */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nút 1: Chụp ảnh trực tiếp bằng Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[90px] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-sky-900">Chụp Ảnh Trực Tiếp</div>
                      <div className="text-[11px] text-sky-600 font-normal">Mở camera điện thoại</div>
                    </div>
                  </button>

                  {/* Nút 2: Chọn từ Thư viện / Bộ sưu tập / Máy tính */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[90px] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-900">Lấy Từ Thư Viện Ảnh</div>
                      <div className="text-[11px] text-emerald-600 font-normal">Ảnh chụp màn hình / File có sẵn</div>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Hệ thống tự động nén tối ưu kích thước ảnh giúp tải nhanh và tiết kiệm dung lượng 3G/4G
                </p>
              </div>
            ) : (
              /* Đã chọn ảnh: Hiển thị xem trước */
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImageBase64}
                  alt="Minh chứng đã chọn"
                  className="w-full max-h-56 object-contain bg-slate-900/5"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageBase64("");
                    setFileSizeInfo(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  title="Xóa để chọn lại ảnh khác"
                >
                  <X className="w-4 h-4" />
                </button>

                {fileSizeInfo && (
                  <div className="p-2.5 bg-white border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px]">
                      Đã nén tối ưu: <b className="text-emerald-600">{fileSizeInfo.compressed}</b> (Gốc: {fileSizeInfo.original})
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="text-[11px] text-sky-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Chụp lại</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Đổi từ thư viện</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCompressing && (
              <div className="flex items-center gap-2 mt-2 text-xs text-sky-600 p-2 bg-sky-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Đang xử lý và nén ảnh cho điện thoại...</span>
              </div>
            )}
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú thêm (Tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ví dụ: Đạt giải Ba, điểm số 95/100, mã số dự thi..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedImageBase64 || isSubmitting || isCompressing}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi bài...</span>
                </>
              ) : (
                <span>Xác Nhận Nộp Minh Chứng</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
