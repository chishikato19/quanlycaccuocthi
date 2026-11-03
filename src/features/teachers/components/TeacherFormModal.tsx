"use client";

import React, { useState, useEffect } from "react";
import { TeacherDto } from "@/types";
import { X, UserPlus, Edit3, AlertCircle } from "lucide-react";

interface TeacherFormModalProps {
  teacher: TeacherDto | null; // null nếu là tạo mới, có dữ liệu nếu là sửa
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  teacher,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN" | "SUPER_ADMIN">("USER");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name);
      setDepartment(teacher.department);
      setPhone(teacher.phone || "");
      setRole(teacher.role);
    } else {
      setName("");
      setDepartment("Toán - Tin");
      setPhone("");
      setRole("USER");
    }
    setError("");
  }, [teacher, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!teacher;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !department.trim()) {
      setError("Họ tên và tổ chuyên môn là bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const url = "/api/teachers";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing
        ? { id: teacher.id, name, department, phone, role }
        : { name, department, phone, role };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Không thể lưu thông tin giáo viên");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            {isEditing ? <Edit3 className="w-4 h-4 text-sky-600" /> : <UserPlus className="w-4 h-4 text-sky-600" />}
            <h3 className="font-bold text-slate-800 text-sm">
              {isEditing ? "Chỉnh Sửa Thông Tin Giáo Viên" : "Thêm Giáo Viên Mới"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tổ chuyên môn *</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="Ví dụ: Toán - Tin, Ngữ Văn, Tiếng Anh, KHTN..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phân quyền</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as "USER" | "ADMIN" | "SUPER_ADMIN")}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="USER">Giáo viên thường (Chỉ xem việc & nộp minh chứng)</option>
              <option value="ADMIN">Quản trị viên (Tạo việc, xem báo cáo, xuất Excel)</option>
              {teacher?.role === "SUPER_ADMIN" && (
                <option value="SUPER_ADMIN">Tổng Admin (Toàn quyền hệ thống)</option>
              )}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
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
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập Nhật" : "Thêm Mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
