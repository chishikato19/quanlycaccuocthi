"use client";

import React, { useState } from "react";
import { CompetitionDto } from "@/types";
import { X, Clock, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";

interface TaskActionModalProps {
  competition: CompetitionDto | null;
  mode: "EXTEND" | "CLOSE" | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskActionModal: React.FC<TaskActionModalProps> = ({
  competition,
  mode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newDeadline, setNewDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !competition || !mode) return null;

  const handleExtend = async () => {
    if (!newDeadline) {
      setError("Vui lòng chọn thời hạn mới");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/competitions/${competition.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDeadline: new Date(newDeadline).toISOString() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Không thể gia hạn cuộc thi");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEarly = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/competitions/${competition.id}/close`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Không thể kết thúc sớm cuộc thi");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-4">
        {mode === "EXTEND" ? (
          <>
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Gia Hạn Cuộc Thi</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{competition.title}</p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn mốc thời gian hạn chót mới:
              </label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

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
                onClick={handleExtend}
                disabled={isSubmitting || !newDeadline}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "Xác Nhận Gia Hạn"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Kết Thúc Sớm Cuộc Thi?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn có chắc chắn muốn kết thúc sớm cuộc thi <b>"{competition.title}"</b>?
                  Hệ thống sẽ ngay lập tức khóa nút nộp minh chứng đối với tất cả giáo viên.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
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
                onClick={handleCloseEarly}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "Đồng Ý Kết Thúc Sớm"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
