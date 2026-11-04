"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TeacherDto, GroupDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import { Check, CheckSquare, Square, Search, Users, ChevronDown, ChevronUp, Tags } from "lucide-react";
import { GROUP_COLOR_MAP } from "@/features/teachers/components/GroupManagementModal";

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
  const [groups, setGroups] = useState<GroupDto[]>([]);

  // Tải danh sách nhóm / vai trò
  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGroups(data.data || []);
      })
      .catch(() => {});
  }, []);

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
    const dGroups: Record<string, TeacherDto[]> = {};
    for (const t of eligibleTeachers) {
      const dept = t.department || "Khác";
      if (!dGroups[dept]) dGroups[dept] = [];
      dGroups[dept].push(t);
    }
    return dGroups;
  }, [eligibleTeachers]);

  const departments = Object.keys(departmentGroups).sort();

  // Mặc định mở rộng tất cả các tổ
  const isDeptExpanded = (dept: string) => {
    return expandedDepartments[dept] !== false; // Mặc định mở
  };

  const toggleDeptExpand = (dept: string) => {
    setExpandedDepartments((prev) => ({
      ...prev,
      [dept]: !isDeptExpanded(dept),
    }));
  };

  // Chọn toàn bộ hoặc bỏ chọn toàn bộ một tổ
  const toggleSelectDepartment = (dept: string) => {
    const deptTeachers = departmentGroups[dept] || [];
    const deptTeacherIds = deptTeachers.map((t) => t.id);
    const allSelected = deptTeacherIds.every((id) => selectedTeacherIds.includes(id));

    if (allSelected) {
      // Bỏ chọn toàn bộ tổ này
      onChange(selectedTeacherIds.filter((id) => !deptTeacherIds.includes(id)));
    } else {
      // Chọn tất cả tổ này (kết hợp với các id đã chọn khác)
      const newSet = new Set([...selectedTeacherIds, ...deptTeacherIds]);
      onChange(Array.from(newSet));
    }
  };

  // Chọn nhanh hoặc bỏ chọn một Nhóm / Vai trò (ví dụ: Đảng viên, Đoàn viên...)
  const toggleSelectGroup = (group: GroupDto) => {
    // Lấy tất cả giáo viên thuộc nhóm này
    const groupTeacherIds = eligibleTeachers
      .filter(
        (t) =>
          t.groups?.some((g) => g.id === group.id) ||
          t.groupIds?.includes(group.id)
      )
      .map((t) => t.id);

    if (groupTeacherIds.length === 0) return;

    const allGroupSelected = groupTeacherIds.every((id) =>
      selectedTeacherIds.includes(id)
    );

    if (allGroupSelected) {
      // Bỏ chọn các giáo viên thuộc nhóm này
      onChange(selectedTeacherIds.filter((id) => !groupTeacherIds.includes(id)));
    } else {
      // Thêm toàn bộ giáo viên nhóm này vào danh sách chọn
      const newSet = new Set([...selectedTeacherIds, ...groupTeacherIds]);
      onChange(Array.from(newSet));
    }
  };

  // Chọn lẻ từng giáo viên
  const toggleTeacher = (teacherId: string) => {
    if (selectedTeacherIds.includes(teacherId)) {
      onChange(selectedTeacherIds.filter((id) => id !== teacherId));
    } else {
      onChange([...selectedTeacherIds, teacherId]);
    }
  };

  // Chọn tất cả toàn trường
  const selectAll = () => {
    onChange(eligibleTeachers.map((t) => t.id));
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
            Đã chọn:{" "}
            <span className="text-sky-600 text-sm font-bold">
              {selectedTeacherIds.length}
            </span>{" "}
            / {eligibleTeachers.length} người
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

      {/* CHỌN NHANH THEO NHÓM / VAI TRÒ */}
      {groups.length > 0 && (
        <div className="p-2.5 bg-sky-50/60 border border-sky-100 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Tags className="w-3.5 h-3.5 text-sky-600" />
              <span>Chọn nhanh theo Nhóm đối tượng dự thi:</span>
            </span>
            <span className="text-[10px] text-slate-400">
              (Bấm để tự động tích chọn cả nhóm)
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => {
              const groupTeacherIds = eligibleTeachers
                .filter(
                  (t) =>
                    t.groups?.some((grp) => grp.id === g.id) ||
                    t.groupIds?.includes(g.id)
                )
                .map((t) => t.id);

              const totalInGroup = groupTeacherIds.length;
              if (totalInGroup === 0) return null;

              const selectedInGroupCount = groupTeacherIds.filter((id) =>
                selectedTeacherIds.includes(id)
              ).length;
              const isAllSelected = selectedInGroupCount === totalInGroup;
              const isPartiallySelected =
                selectedInGroupCount > 0 && !isAllSelected;

              const colorConfig =
                GROUP_COLOR_MAP[g.color || "blue"] || GROUP_COLOR_MAP.blue;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleSelectGroup(g)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isAllSelected
                      ? `${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} ring-2 ring-sky-500/50 shadow-2xs`
                      : isPartiallySelected
                      ? "bg-white text-sky-700 border-sky-300 ring-1 ring-sky-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  title={`Bấm để chọn/bỏ chọn nhóm ${g.name}`}
                >
                  <span className={`w-2 h-2 rounded-full ${colorConfig.dot}`} />
                  <span>{g.name}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                      isAllSelected
                        ? "bg-white/80"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selectedInGroupCount}/{totalInGroup}
                  </span>
                  {isAllSelected && <Check className="w-3 h-3 text-sky-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Ô tìm kiếm nhanh */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên giáo viên hoặc tên tổ bộ môn..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
        />
      </div>

      {/* Danh sách từng Tổ chuyên môn */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {departments.map((dept) => {
          const deptTeachers = departmentGroups[dept] || [];
          const filteredTeachers = deptTeachers.filter((t) => {
            if (!searchQuery.trim()) return true;
            const queryNorm = normalizeVietnamese(searchQuery);
            return (
              normalizeVietnamese(t.name).includes(queryNorm) ||
              normalizeVietnamese(dept).includes(queryNorm)
            );
          });

          if (filteredTeachers.length === 0) return null;

          const deptTeacherIds = deptTeachers.map((t) => t.id);
          const selectedInDeptCount = deptTeacherIds.filter((id) =>
            selectedTeacherIds.includes(id)
          ).length;
          const isAllDeptSelected =
            selectedInDeptCount === deptTeachers.length &&
            deptTeachers.length > 0;
          const isPartiallySelected =
            selectedInDeptCount > 0 && !isAllDeptSelected;
          const expanded = isDeptExpanded(dept);

          return (
            <div
              key={dept}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all"
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
                    {expanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Danh sách giáo viên cá nhân trong tổ */}
              {expanded && (
                <div className="p-2.5 flex flex-wrap gap-1.5 bg-white">
                  {filteredTeachers.map((t) => {
                    const isSelected = selectedTeacherIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeacher(t.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-sky-50 border-sky-300 text-sky-800 font-medium shadow-2xs"
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
                          {isSelected && (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          )}
                        </div>
                        <span>{t.name}</span>

                        {/* Badges nhóm nhỏ gọn cạnh tên */}
                        {t.groups && t.groups.length > 0 && (
                          <div className="flex items-center gap-1 ml-1">
                            {t.groups.slice(0, 2).map((g) => {
                              const c =
                                GROUP_COLOR_MAP[g.color || "blue"] ||
                                GROUP_COLOR_MAP.blue;
                              return (
                                <span
                                  key={g.id}
                                  className={`w-1.5 h-1.5 rounded-full ${c.dot}`}
                                  title={g.name}
                                />
                              );
                            })}
                            {t.groups.length > 2 && (
                              <span className="text-[9px] text-slate-400">
                                +{t.groups.length - 2}
                              </span>
                            )}
                          </div>
                        )}
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
