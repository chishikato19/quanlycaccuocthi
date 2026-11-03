"use client";

import React, { useState, useMemo } from "react";
import { TeacherDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import { Check, CheckSquare, Square, Search, Users, ChevronDown, ChevronUp } from "lucide-react";

interface DepartmentSelectorProps {
  teachers: TeacherDto[];
  selectedTeacherIds: string[];
  onChange: (newSelectedIds: string[]) => void;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  teachers,
  selectedTeacherIds,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<Record<string, boolean>>({});

  // Lọc danh sách giáo viên hợp lệ (Loại bỏ hoàn toàn tài khoản Super Admin)
  const eligibleTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.role !== "SUPER_ADMIN" &&
        t.phone !== "admin" &&
        t.department !== "Hệ Thống" &&
        !t.name.toLowerCase().includes("quản trị") &&
        !t.name.toLowerCase().includes("super admin")
    );
  }, [teachers]);

  // Nhóm giáo viên theo tổ bộ môn
  const departmentGroups = useMemo(() => {
    const groups: Record<string, TeacherDto[]> = {};
    for (const t of eligibleTeachers) {
      const dept = t.department || "Khác";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(t);
    }
    return groups;
  }, [eligibleTeachers]);

  const departments = Object.keys(departmentGroups).sort();

  // Mặc định mở rộng tất cả các tổ
  const isDeptExpanded = (dept: string) => {
    return expandedDepartments[dept] !== false; // Mặc định mở
  };

  const toggleDeptExpand = (dept: string) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [dept]: !isDeptExpanded(dept),
    }));
  };

  // Chọn toàn bộ hoặc bỏ chọn toàn bộ một tổ
  const toggleSelectDepartment = (dept: string) => {
    const deptTeachers = departmentGroups[dept] || [];
    const deptTeacherIds = deptTeachers.map(t => t.id);
    const allSelected = deptTeacherIds.every(id => selectedTeacherIds.includes(id));

    if (allSelected) {
      // Bỏ chọn toàn bộ tổ này
      onChange(selectedTeacherIds.filter(id => !deptTeacherIds.includes(id)));
    } else {
      // Chọn tất cả tổ này (kết hợp với các id đã chọn khác)
      const newSet = new Set([...selectedTeacherIds, ...deptTeacherIds]);
      onChange(Array.from(newSet));
    }
  };

  // Chọn lẻ từng giáo viên
  const toggleTeacher = (teacherId: string) => {
    if (selectedTeacherIds.includes(teacherId)) {
      onChange(selectedTeacherIds.filter(id => id !== teacherId));
    } else {
      onChange([...selectedTeacherIds, teacherId]);
    }
  };

  // Chọn tất cả toàn trường
  const selectAll = () => {
    onChange(eligibleTeachers.map(t => t.id));
  };

  // Bỏ chọn tất cả
  const deselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Thanh điều khiển nhanh */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-semibold text-slate-700">
            Đã chọn: <span className="text-sky-600 text-sm font-bold">{selectedTeacherIds.length}</span> / {eligibleTeachers.length} người
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline px-2 py-1 rounded bg-sky-50"
          >
            Chọn tất cả
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline px-2 py-1 rounded"
          >
            Bỏ chọn hết
          </button>
        </div>
      </div>

      {/* Ô tìm kiếm nhanh */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên giáo viên hoặc tên tổ bộ môn..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        />
      </div>

      {/* Danh sách từng Tổ chuyên môn */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {departments.map(dept => {
          const deptTeachers = departmentGroups[dept] || [];
          const filteredTeachers = deptTeachers.filter(t => {
            if (!searchQuery.trim()) return true;
            const queryNorm = normalizeVietnamese(searchQuery);
            return (
              normalizeVietnamese(t.name).includes(queryNorm) ||
              normalizeVietnamese(dept).includes(queryNorm)
            );
          });

          if (filteredTeachers.length === 0) return null;

          const deptTeacherIds = deptTeachers.map(t => t.id);
          const selectedInDeptCount = deptTeacherIds.filter(id => selectedTeacherIds.includes(id)).length;
          const isAllDeptSelected = selectedInDeptCount === deptTeachers.length && deptTeachers.length > 0;
          const isPartiallySelected = selectedInDeptCount > 0 && !isAllDeptSelected;
          const expanded = isDeptExpanded(dept);

          return (
            <div
              key={dept}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs transition-all"
            >
              {/* Header của Tổ */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectDepartment(dept)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-sky-600 transition-colors"
                  >
                    {isAllDeptSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 fill-sky-100" />
                    ) : isPartiallySelected ? (
                      <div className="w-4 h-4 rounded border border-sky-600 bg-sky-100 flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-sky-600" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{dept}</span>
                  </button>

                  <span className="text-[11px] font-medium text-slate-400">
                    ({selectedInDeptCount}/{deptTeachers.length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSelectDepartment(dept)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                      isAllDeptSelected
                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                    }`}
                  >
                    {isAllDeptSelected ? "Bỏ chọn tổ" : "Chọn cả tổ"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDeptExpand(dept)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Danh sách giáo viên cá nhân trong tổ */}
              {expanded && (
                <div className="p-2.5 flex flex-wrap gap-1.5 bg-white">
                  {filteredTeachers.map(t => {
                    const isSelected = selectedTeacherIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeacher(t.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-sky-50 border-sky-300 text-sky-800 font-medium shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            isSelected
                              ? "bg-sky-600 border-sky-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
