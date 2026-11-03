"use client";

import React, { useState, useEffect } from "react";
import { TeacherDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import { Lock, UserCheck, Search, KeyRound, AlertCircle, ShieldAlert, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (user?: TeacherDto) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess }) => {
  const { setCurrentUser } = useAuth();

  // Tab đăng nhập: TEACHER (giáo viên trường) hoặc SUPER_ADMIN (quản trị cấp cao riêng biệt)
  const [loginTab, setLoginTab] = useState<"TEACHER" | "SUPER_ADMIN">("TEACHER");

  // Dành cho giáo viên
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Dành cho Super Admin
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      setPinCode("");
      setAdminPassword("");
      setError("");
    }
  }, [isOpen]);

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      // Gọi API mặc định (đã loại trừ Super Admin khỏi danh sách giáo viên trường)
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

  // Xử lý đăng nhập giáo viên
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setError("Vui lòng chọn tên giáo viên trong danh sách");
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
        onSuccess(data.user);
      } else {
        setError(data.error || "Mã PIN không chính xác");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý đăng nhập Tổng Quản Trị (Super Admin)
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật mã");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuperAdminLogin: true,
          username: adminUsername.trim(),
          pinCode: adminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        onSuccess(data.user);
      } else {
        setError(data.error || "Tài khoản hoặc mật mã Tổng Quản Trị không đúng");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header có 2 Tab chuyển đổi */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
              {loginTab === "TEACHER" ? <Users className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 text-purple-200" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-sky-100">Cổng báo cáo cuộc thi giáo viên</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-black/20 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginTab("TEACHER");
                setError("");
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                loginTab === "TEACHER" ? "bg-white text-sky-900 shadow-xs" : "text-sky-100 hover:text-white"
              }`}
            >
              Giáo Viên / Nhân Viên
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab("SUPER_ADMIN");
                setError("");
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                loginTab === "SUPER_ADMIN" ? "bg-white text-purple-900 shadow-xs" : "text-sky-100 hover:text-white"
              }`}
            >
              Tổng Quản Trị (Super Admin)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: FORM GIÁO VIÊN */}
          {loginTab === "TEACHER" ? (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  1. Chọn tên của thầy/cô trong danh sách
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

                <div className="max-h-44 sm:max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                  {isLoadingTeachers ? (
                    <div className="p-4 text-center text-xs text-slate-500">Đang tải danh sách giáo viên...</div>
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
                            <div className="font-medium text-xs sm:text-sm">{t.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{t.department}</div>
                          </div>
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
                    2. Nhập mã PIN
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
                    placeholder="Mã PIN (4 - 6 số)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono tracking-widest"
                  />
                </div>
              </div>

              {selectedTeacher && (
                <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="truncate">
                    Đang chọn: <b>{selectedTeacher.name}</b>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedTeacherId || !pinCode || isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all min-h-[44px]"
              >
                {isSubmitting ? "Đang xác thực..." : "Đăng Nhập Giáo Viên"}
              </button>
            </form>
          ) : (
            /* TAB 2: FORM TỔNG QUẢN TRỊ RIÊNG BIỆT (SUPER ADMIN) */
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
                <b>Khu vực Quản trị cấp cao:</b> Dành riêng cho Tổng Quản Trị để phân công Admin và quản lý toàn bộ hệ thống (tách biệt khỏi danh sách trường).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đăng nhập Quản Trị
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mật mã Quản Trị
                  </label>
                  <span className="text-[11px] text-slate-500">Mặc định: <b>1234</b></span>
                </div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Nhập mật mã"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-purple-700/20 disabled:opacity-50 transition-all min-h-[44px]"
              >
                {isSubmitting ? "Đang xác thực..." : "Đăng Nhập Tổng Quản Trị"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
