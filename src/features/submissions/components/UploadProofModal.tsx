"use client";

import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Camera, Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Cấu hình nén ảnh tại client
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
      setError("Không thể xử lý ảnh, vui lòng thử ảnh khác");
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageBase64) {
      setError("Vui lòng chụp hoặc chọn ảnh minh chứng");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Báo Cáo & Nộp Minh Chứng</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{competition.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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

          {/* Khu vực chọn / chụp ảnh */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Ảnh minh chứng (Chứng nhận / Màn hình hoàn thành)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedImageBase64 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Chụp ảnh từ camera hoặc tải từ máy</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tự động nén ảnh tối ưu dung lượng và tốc độ</p>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
                >
                  Chọn tập tin ảnh
                </button>
              </div>
            ) : (
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
                  title="Chọn lại ảnh khác"
                >
                  <X className="w-4 h-4" />
                </button>
                {fileSizeInfo && (
                  <div className="p-2 bg-white/90 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Đã nén tối ưu: <b>{fileSizeInfo.compressed}</b> (Gốc: {fileSizeInfo.original})</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sky-600 font-medium hover:underline"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                )}
              </div>
            )}

            {isCompressing && (
              <div className="flex items-center gap-2 mt-2 text-xs text-sky-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý và nén ảnh...</span>
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
              className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!selectedImageBase64 || isSubmitting || isCompressing}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
