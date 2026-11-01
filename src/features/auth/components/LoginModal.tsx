"use client";

import React, { useState, useEffect } from "react";
import { TeacherDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import { Lock, UserCheck, Search, KeyRound, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess }) => {
  const { setCurrentUser } = useAuth();
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      setPinCode("");
      setError("");
    }
  }, [isOpen]);

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const res = await fetch("/api/teachers");
      const json = await res.json();
      if (json.success) {
        setTeachers(json.data);
      }
    } catch (e) {
      console.error(e);
      setError("Không thể tải danh sách giáo viên");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery.trim()) return true;
    const queryNorm = normalizeVietnamese(searchQuery);
    return (
      normalizeVietnamese(t.name).includes(queryNorm) ||
      normalizeVietnamese(t.department).includes(queryNorm)
    );
  });

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setError("Vui lòng chọn tên giáo viên");
      return;
    }
    if (!pinCode.trim()) {
      setError("Vui lòng nhập mã PIN");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          pinCode: pinCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        onSuccess();
      } else {
        setError(data.error || "Mã PIN không chính xác");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-sky-100">Chọn tên giáo viên và nhập mã PIN để tiếp tục</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn giáo viên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              1. Chọn tên giáo viên / nhân viên
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Gõ tên hoặc tổ bộ môn để tìm..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              {isLoadingTeachers ? (
                <div className="p-4 text-center text-xs text-slate-500">Đang tải danh sách...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy giáo viên nào</div>
              ) : (
                filteredTeachers.map(t => {
                  const isSelected = t.id === selectedTeacherId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId(t.id);
                        setError("");
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-sky-50 text-sky-900 font-semibold border-l-4 border-sky-600"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-slate-500 font-normal">{t.department}</div>
                      </div>
                      {t.role === "SUPER_ADMIN" && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                          Tổng Admin
                        </span>
                      )}
                      {t.role === "ADMIN" && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Nhập mã PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Nhập mã PIN cá nhân
              </label>
              <span className="text-[11px] text-slate-500">Mặc định: <b>1234</b></span>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="Nhập mã PIN (4 - 6 số)"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-widest"
              />
            </div>
          </div>

          {selectedTeacher && (
            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-sky-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Đang chọn: <b>{selectedTeacher.name}</b> ({selectedTeacher.department})
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedTeacherId || !pinCode || isSubmitting}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Đang xác thực..." : "Xác Nhận Đăng Nhập"}
          </button>
        </form>
      </div>
    </div>
  );
};
