"use client";

import React, { useState, useEffect } from "react";
import { FolderSync, X, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DriveConfigModal: React.FC<DriveConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, setCurrentUser } = useAuth();
  const [driveFolderInput, setDriveFolderInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.driveFolderId) {
      setDriveFolderInput(currentUser.driveFolderId);
    } else {
      setDriveFolderInput("");
    }
    setError("");
    setSuccess("");
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          department: currentUser.department,
          phone: currentUser.phone,
          role: currentUser.role,
          driveFolderId: driveFolderInput.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Đã lưu cấu hình Google Drive cá nhân!");
        setCurrentUser(data.data);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Không thể cập nhật cấu hình");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Cấu Hình Google Drive Cá Nhân
              </h3>
              <p className="text-xs text-slate-500">Dành cho tài khoản Quản trị viên (Admin)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đường link hoặc ID thư mục Google Drive của bạn
            </label>
            <input
              type="text"
              value={driveFolderInput}
              onChange={e => setDriveFolderInput(e.target.value)}
              placeholder="Dán link thư mục Google Drive của bạn..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900 space-y-1.5 leading-relaxed">
            <div className="font-bold">Cách kết nối thư mục cá nhân:</div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-purple-800">
              <li>Mở Google Drive của bạn &rarr; Tạo một thư mục (VD: <i>Minh_Chung_To_Toan</i>).</li>
              <li>Chuột phải vào thư mục &rarr; Chọn <b>Chia sẻ (Share)</b>.</li>
              <li>Chọn quyền: <b>"Bất kỳ ai có đường liên kết đều có thể chỉnh sửa"</b>.</li>
              <li>Sao chép đường link và dán vào ô trên.</li>
            </ol>
            <div className="text-[10px] text-slate-500 pt-1 italic">
              * Nếu để trống, hệ thống sẽ tự động lưu vào Google Drive chung của Super Admin (Nhà trường).
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-700/20 disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Cấu Hình"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
