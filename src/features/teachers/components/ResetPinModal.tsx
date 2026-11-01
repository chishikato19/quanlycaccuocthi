"use client";

import React, { useState } from "react";
import { TeacherDto } from "@/types";
import { KeyRound, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

interface ResetPinModalProps {
  teacher: TeacherDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPinModal: React.FC<ResetPinModalProps> = ({
  teacher,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen || !teacher || !currentUser) return null;

  const handleReset = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTeacherId: teacher.id,
          requesterId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || "Đã reset mã PIN về mặc định (1234)!");
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "Không thể reset mã PIN");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Xác Nhận Khôi Phục Mã PIN</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mã PIN của giáo viên <b>{teacher.name}</b> sẽ được đặt lại về mặc định là:{" "}
              <b className="text-sky-600 font-mono text-sm">1234</b>.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-amber-600/20 disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Đồng Ý Reset PIN"}
          </button>
        </div>
      </div>
    </div>
  );
};
