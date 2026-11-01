"use client";

import React, { useState } from "react";
import { TeacherDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

interface TeacherTableProps {
  teachers: TeacherDto[];
  onOpenAdd: () => void;
  onOpenEdit: (teacher: TeacherDto) => void;
  onOpenResetPin: (teacher: TeacherDto) => void;
  onOpenExcelPaste: () => void;
  onDelete: (teacher: TeacherDto) => void;
  onRoleChange?: (teacher: TeacherDto, newRole: "ADMIN" | "USER") => void;
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  onOpenAdd,
  onOpenEdit,
  onOpenResetPin,
  onOpenExcelPaste,
  onDelete,
  onRoleChange,
}) => {
  const { isSuperAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  // Lấy danh sách các tổ duy nhất
  const departments = Array.from(new Set(teachers.map(t => t.department || "Khác"))).sort();

  const filteredTeachers = teachers.filter(t => {
    // Loại trừ Super Admin khỏi bảng danh sách nhân sự trường
    if (t.role === "SUPER_ADMIN") return false;

    // Lọc theo tổ
    if (departmentFilter !== "ALL" && t.department !== departmentFilter) {
      return false;
    }
    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      const q = normalizeVietnamese(searchQuery);
      return (
        normalizeVietnamese(t.name).includes(q) ||
        normalizeVietnamese(t.department).includes(q) ||
        (t.phone && t.phone.includes(searchQuery.trim()))
      );
    }
    return true;
  });

  // Xử lý Tổng Admin cấp hoặc hủy quyền Admin trực tiếp 1 chạm
  const handleToggleAdminRole = async (teacher: TeacherDto) => {
    if (!isSuperAdmin) {
      alert("Chỉ Tổng Quản Trị (Super Admin) mới có quyền phân công Admin!");
      return;
    }

    const newRole = teacher.role === "ADMIN" ? "USER" : "ADMIN";
    const actionText = newRole === "ADMIN" ? "cấp quyền Admin cho" : "thu hồi quyền Admin của";

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} giáo viên "${teacher.name}"?`)) return;

    setIsUpdatingRole(teacher.id);
    try {
      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: teacher.id,
          name: teacher.name,
          department: teacher.department,
          phone: teacher.phone,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onRoleChange) onRoleChange(teacher, newRole);
        else window.location.reload();
      } else {
        alert(data.error || "Không thể cập nhật phân quyền");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner thông báo quyền Super Admin */}
      {isSuperAdmin && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs text-purple-900 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
            <span>
              <b>Chế độ Tổng Quản Trị (Super Admin):</b> Bạn có đặc quyền phân công hoặc thu hồi quyền Admin của từng giáo viên trong trường.
            </span>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full hidden sm:inline">
            Toàn Quyền
          </span>
        </div>
      )}

      {/* Thanh công cụ tìm kiếm & Nút hành động */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, tổ, SĐT..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />
          </div>

          {/* Lọc theo tổ bộ môn */}
          <div className="w-full sm:w-auto">
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700"
            >
              <option value="ALL">Tất cả tổ chuyên môn ({filteredTeachers.length})</option>
              {departments.map(dept => {
                const count = teachers.filter(t => t.department === dept && t.role !== "SUPER_ADMIN").length;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Nút thao tác (Dành cho Quản trị viên) */}
        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <button
            type="button"
            onClick={onOpenExcelPaste}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all min-h-[38px]"
            title="Nhập nhanh bằng cách bôi đen copy/paste từ Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Dán Từ Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all min-h-[38px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Giáo Viên</span>
          </button>
        </div>
      </div>

      {/* GIAO DIỆN BẢNG TRÊN MÁY TÍNH & TABLET */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-3 px-3.5 w-12 text-center font-bold">STT</th>
                <th className="py-3 px-3.5 font-bold">Họ và Tên</th>
                <th className="py-3 px-3.5 font-bold">Tổ Chuyên Môn</th>
                <th className="py-3 px-3.5 font-bold">Số Điện Thoại</th>
                <th className="py-3 px-3.5 font-bold text-center">Vai Trò / Phân Quyền</th>
                <th className="py-3 px-3.5 text-center font-bold">Mã PIN</th>
                <th className="py-3 px-3.5 text-right font-bold w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy giáo viên nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {t.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-mono">
                      {t.phone || "---"}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {/* Nút phân quyền dành riêng cho Super Admin */}
                      {isSuperAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleAdminRole(t)}
                          disabled={isUpdatingRole === t.id}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border ${
                            t.role === "ADMIN"
                              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                          title="Bấm vào đây để cấp hoặc hủy quyền Admin"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t.role === "ADMIN" ? "Admin (Bấm để gỡ)" : "Giáo viên (Bấm để cấp Admin)"}</span>
                        </button>
                      ) : (
                        t.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <Shield className="w-3 h-3" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Giáo viên
                          </span>
                        )
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenResetPin(t)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        title="Đặt lại mã PIN về mặc định (1234)"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset PIN</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEdit(t)}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(t)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Xóa giáo viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
