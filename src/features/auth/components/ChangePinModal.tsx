"use client";

import React, { useState } from "react";
import { KeyRound, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPin.trim().length < 4) {
      setError("Mã PIN mới phải có ít nhất 4 số");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Mã PIN mới và xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: currentUser.id,
          oldPin: oldPin.trim(),
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Đổi mã PIN thành công!");
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "Không thể đổi mã PIN");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-sm">Đổi Mã PIN Cá Nhân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mã PIN hiện tại</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={oldPin}
              onChange={e => setOldPin(e.target.value)}
              placeholder="Nhập mã PIN cũ"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mã PIN mới</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="Nhập mã PIN mới (4 - 6 số)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Xác nhận mã PIN mới</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              placeholder="Gõ lại mã PIN mới"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu Mã PIN Mới"}
          </button>
        </form>
      </div>
    </div>
  );
};
