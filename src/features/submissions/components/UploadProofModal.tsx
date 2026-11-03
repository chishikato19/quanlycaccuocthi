"use client";

import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import {
  Camera,
  FolderUp,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  FileSpreadsheet,
  FolderArchive,
  File as FileIcon,
  FileType as FileTypeIcon,
} from "lucide-react";
import { CompetitionDto, SubmissionDto } from "@/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import { isOverdue, formatFileSize, getFileTypeInfo, getMimeTypeFromFileName } from "@/lib/utils";

interface UploadProofModalProps {
  competition: CompetitionDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubmission?: SubmissionDto) => void;
}

export const UploadProofModal: React.FC<UploadProofModalProps> = ({
  competition,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [fileSizeInfo, setFileSizeInfo] = useState<{ original: string; compressed?: string } | null>(null);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !competition || !currentUser) return null;

  const overdue = isOverdue(competition.deadline);
  const fileInfo = getFileTypeInfo(fileName, selectedFileBase64 || mimeType);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsProcessing(true);

    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);

    try {
      if (isImage) {
        // Tự động nén ảnh nếu là định dạng ảnh
        const origSize = formatFileSize(file.size);
        try {
          const options = {
            maxSizeMB: 1, // Tối đa 1MB
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          };

          const compressedFile = await imageCompression(file, options);
          const compSize = formatFileSize(compressedFile.size);
          setFileSizeInfo({ original: origSize, compressed: compSize });
          setFileName(file.name);
          setMimeType(compressedFile.type || file.type || "image/jpeg");

          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onloadend = () => {
            setSelectedFileBase64(reader.result as string);
            setIsProcessing(false);
          };
        } catch (compressErr) {
          console.warn("Fallback: đọc ảnh gốc không nén:", compressErr);
          setFileSizeInfo({ original: origSize });
          setFileName(file.name);
          setMimeType(file.type || "image/jpeg");

          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => {
            setSelectedFileBase64(reader.result as string);
            setIsProcessing(false);
          };
        }
      } else {
        // Tệp tài liệu (Word, PDF, Excel, PowerPoint, ZIP...) -> Đọc trực tiếp không nén
        // Giới hạn an toàn 3.5MB để không vượt trần 4.5MB Payload của Vercel Serverless
        if (file.size > 3.5 * 1024 * 1024) {
          setError("Dung lượng tệp vượt quá 3.5MB (giới hạn tải lên an toàn của hệ thống). Vui lòng chọn tệp nhỏ hơn hoặc xuất ảnh chụp màn hình.");
          setIsProcessing(false);
          return;
        }

        const detectedMime = file.type || getMimeTypeFromFileName(file.name);
        setFileSizeInfo({ original: formatFileSize(file.size) });
        setFileName(file.name);
        setMimeType(detectedMime);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setSelectedFileBase64(reader.result as string);
          setIsProcessing(false);
        };
        reader.onerror = () => {
          setError("Không thể đọc tệp tài liệu, vui lòng thử lại.");
          setIsProcessing(false);
        };
      }
    } catch (err) {
      console.error("File processing error:", err);
      setError("Không thể xử lý tệp, vui lòng thử lại hoặc chọn tệp khác.");
      setIsProcessing(false);
    } finally {
      e.target.value = "";
    }
  };

  const handleResetFile = () => {
    setSelectedFileBase64("");
    setFileName("");
    setMimeType("");
    setFileSizeInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileBase64) {
      setError("Vui lòng chụp hoặc chọn tệp minh chứng (ảnh, Word, PDF, Excel...)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const finalMime = mimeType || getMimeTypeFromFileName(fileName);
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: competition.id,
          teacherId: currentUser.id,
          base64Image: selectedFileBase64,
          fileName: fileName || "minh_chung.jpg",
          mimeType: finalMime,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Nộp minh chứng thành công!");
        setTimeout(() => {
          onSuccess(data.data);
          onClose();
          setSuccessMsg("");
          handleResetFile();
          setNote("");
        }, 1200);
      } else {
        setError(data.error || "Không thể nộp minh chứng");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Icon phù hợp với loại tài liệu
  const renderDocumentIcon = () => {
    switch (fileInfo.category) {
      case "PDF":
        return <FileText className="w-10 h-10 text-rose-500" />;
      case "WORD":
        return <FileText className="w-10 h-10 text-blue-500" />;
      case "EXCEL":
        return <FileSpreadsheet className="w-10 h-10 text-emerald-500" />;
      case "POWERPOINT":
        return <FileTypeIcon className="w-10 h-10 text-amber-500" />;
      case "ARCHIVE":
        return <FolderArchive className="w-10 h-10 text-purple-500" />;
      default:
        return <FileIcon className="w-10 h-10 text-slate-500" />;
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

          {/* INPUT ẨN: CAMERA & FILE PICKER ĐA ĐỊNH DẠNG */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* KHU VỰC CHỌN TỆP */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Chọn hoặc chụp minh chứng (Ảnh, Word, PDF, Excel...)
            </label>

            {!selectedFileBase64 ? (
              <div className="space-y-3">
                {/* 2 Lựa chọn tải: Camera hoặc Chọn Tệp/Tài liệu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nút 1: Chụp ảnh bằng Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[96px] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-sky-900">Chụp Ảnh Trực Tiếp</div>
                      <div className="text-[11px] text-sky-600 font-normal">Mở camera điện thoại</div>
                    </div>
                  </button>

                  {/* Nút 2: Chọn tệp đa định dạng */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-center transition-all flex flex-col items-center justify-center gap-2 min-h-[96px] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <FolderUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-900">Chọn Tệp / Tài Liệu</div>
                      <div className="text-[11px] text-emerald-600 font-normal">Ảnh, Word, PDF, Excel...</div>
                    </div>
                  </button>
                </div>

                {/* Huy hiệu định dạng hỗ trợ */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    🖼️ Ảnh JPG/PNG
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    📕 PDF
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    📘 Word (.docx)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    📗 Excel (.xlsx)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    📙 PowerPoint
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    🗂️ ZIP/RAR
                  </span>
                </div>
              </div>
            ) : (
              /* Đã chọn tệp: Hiển thị xem trước */
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 relative">
                {fileInfo.category === "IMAGE" ? (
                  /* Xem trước Ảnh */
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedFileBase64}
                      alt="Minh chứng đã chọn"
                      className="w-full max-h-56 object-contain bg-slate-900/5"
                    />
                    <button
                      type="button"
                      onClick={handleResetFile}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                      title="Xóa để chọn lại"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fileInfo.badgeBg} ${fileInfo.badgeText}`}>
                          {fileInfo.label}
                        </span>
                        {fileSizeInfo?.compressed ? (
                          <span className="text-[11px]">
                            Đã nén: <b className="text-emerald-600">{fileSizeInfo.compressed}</b> (Gốc: {fileSizeInfo.original})
                          </span>
                        ) : (
                          <span className="text-[11px]">Dung lượng: <b>{fileSizeInfo?.original}</b></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-sky-600 font-semibold hover:underline"
                        >
                          Đổi tệp khác
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Xem trước Tài liệu (Word, PDF, Excel...) */
                  <div className="p-4 sm:p-5 bg-white">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl border ${fileInfo.badgeBg} ${fileInfo.borderColor} shrink-0`}>
                        {renderDocumentIcon()}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${fileInfo.badgeBg} ${fileInfo.badgeText}`}>
                            {fileInfo.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {fileSizeInfo?.original}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 break-all line-clamp-2">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tài liệu sẵn sàng nộp & lưu vào Google Drive</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetFile}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Xóa tệp này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Định dạng: {fileInfo.ext}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-sky-600 font-semibold hover:underline"
                      >
                        Chọn tệp khác
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 mt-2 text-xs text-sky-600 p-2.5 bg-sky-50 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Đang xử lý tệp...</span>
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
              placeholder="Ví dụ: Đạt giải Ba, điểm số 95/100, mã số dự thi, link bổ sung..."
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
              disabled={!selectedFileBase64 || isSubmitting || isProcessing}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi bài & tải lên Drive...</span>
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
