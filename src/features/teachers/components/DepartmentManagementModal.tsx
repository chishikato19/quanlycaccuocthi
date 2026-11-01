"use client";

import React, { useState, useMemo } from "react";
import { TeacherDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import {
  X,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  FolderPlus,
  ArrowRight,
  UserCheck,
  UserPlus
} from "lucide-react";

interface DepartmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherDto[];
  onRefresh: () => void;
}

export const DepartmentManagementModal: React.FC<DepartmentManagementModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onRefresh,
}) => {
  // Lọc chỉ giáo viên trường (loại trừ Super Admin)
  const schoolTeachers = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.role !== "SUPER_ADMIN" &&
        t.phone !== "admin" &&
        t.department !== "Hệ Thống" &&
        !t.name.toLowerCase().includes("quản trị")
    );
  }, [teachers]);

  // Nhóm giáo viên theo tổ
  const departmentGroups = useMemo(() => {
    const groups: Record<string, TeacherDto[]> = {};
    for (const t of schoolTeachers) {
      const dept = t.department || "Chung";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(t);
    }
    return groups;
  }, [schoolTeachers]);

  const departments = useMemo(() => {
    return Object.keys(departmentGroups).sort((a, b) => {
      if (a === "Chung") return 1;
      if (b === "Chung") return -1;
      return a.localeCompare(b, "vi");
    });
  }, [departmentGroups]);

  // Tab tổ đang chọn để xem thành viên
  const [activeDepartment, setActiveDepartment] = useState<string>(departments[0] || "Chung");

  // State tạo tổ mới
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");

  // State đổi tên tổ
  const [renamingDept, setRenamingDept] = useState<string | null>(null);
  const [renamedName, setRenamedName] = useState("");

  // State mở chọn thêm thành viên vào tổ đang active
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedTeacherIdsToAdd, setSelectedTeacherIdsToAdd] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  // Thành viên của tổ hiện tại
  const currentDeptTeachers = departmentGroups[activeDepartment] || [];

  // Danh sách các giáo viên CHƯA thuộc tổ này
  const candidateTeachers = schoolTeachers.filter(
    (t) => t.department !== activeDepartment
  );

  const filteredCandidates = candidateTeachers.filter((t) => {
    if (!memberSearchQuery.trim()) return true;
    const q = normalizeVietnamese(memberSearchQuery);
    return (
      normalizeVietnamese(t.name).includes(q) ||
      normalizeVietnamese(t.department).includes(q)
    );
  });

  // 1. Tạo tổ mới
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDepartmentName.trim();
    if (!name) return;

    if (departments.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setMessage({ type: "error", text: `Tổ "${name}" đã tồn tại!` });
      return;
    }

    setActiveDepartment(name);
    setIsCreatingNew(false);
    setNewDepartmentName("");
    setIsAddingMembers(true);
    setMessage({
      type: "success",
      text: `Đã tạo tổ "${name}". Hãy chọn thành viên đưa vào tổ này!`,
    });
  };

  // 2. Đổi tên tổ
  const handleRenameDepartment = async (oldName: string) => {
    const toName = renamedName.trim();
    if (!toName || toName === oldName) {
      setRenamingDept(null);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teachers/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RENAME", oldName, newName: toName }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setActiveDepartment(toName);
        setRenamingDept(null);
        onRefresh();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Xóa / Giải tán tổ (chuyển về Chung)
  const handleDeleteDepartment = async (deptName: string) => {
    if (deptName === "Chung") {
      alert("Không thể xóa tổ mặc định 'Chung'!");
      return;
    }
    const count = (departmentGroups[deptName] || []).length;
    if (
      !confirm(
        `Bạn có chắc chắn muốn giải tán tổ "${deptName}" (${count} giáo viên)? Tất cả thành viên sẽ được chuyển về tổ "Chung".`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teachers/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", departmentName: deptName }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setActiveDepartment("Chung");
        onRefresh();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Lưu danh sách giáo viên được thêm vào tổ hiện tại
  const handleSaveAddMembers = async () => {
    if (selectedTeacherIdsToAdd.length === 0) {
      setIsAddingMembers(false);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teachers/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN",
          department: activeDepartment,
          teacherIds: selectedTeacherIdsToAdd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setIsAddingMembers(false);
        setSelectedTeacherIdsToAdd([]);
        onRefresh();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi kết nối máy chủ" });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Xóa 1 giáo viên ra khỏi tổ này (chuyển về Chung)
  const handleRemoveMember = async (teacher: TeacherDto) => {
    if (
      !confirm(
        `Xóa giáo viên "${teacher.name}" khỏi tổ "${activeDepartment}" và chuyển về tổ "Chung"?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/teachers/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN",
          department: "Chung",
          teacherIds: [teacher.id],
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Quản Lý Tổ Chuyên Môn
              </h2>
              <p className="text-xs text-slate-500">
                Thêm tổ bộ môn và phân công thành viên giáo viên vào từng tổ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo Message */}
        {message && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-100"
                : "bg-red-50 text-red-800 border-b border-red-100"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body 2 cột: Cột trái danh sách các tổ | Cột phải thành viên của tổ đang chọn */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* CỘT TRÁI: DANH SÁCH TỔ (4 cols) */}
          <div className="md:col-span-5 flex flex-col max-h-[40vh] md:max-h-none overflow-hidden bg-slate-50/30">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Danh Sách Tổ ({departments.length})
              </span>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Tổ Mới</span>
                </button>
              )}
            </div>

            {/* Form tạo tổ mới */}
            {isCreatingNew && (
              <form
                onSubmit={handleCreateDepartment}
                className="p-3 bg-purple-50/60 border-b border-purple-100 flex flex-col gap-2"
              >
                <div className="text-xs font-bold text-purple-900">
                  Tên tổ chuyên môn mới:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="VD: Tổ Tiếng Anh, Tổ Toán - Tin..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newDepartmentName.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewDepartmentName("");
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách các tổ */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {departments.map((dept) => {
                const count = (departmentGroups[dept] || []).length;
                const isActive = activeDepartment === dept;
                const isEditingThis = renamingDept === dept;

                return (
                  <div
                    key={dept}
                    onClick={() => {
                      if (!isEditingThis) {
                        setActiveDepartment(dept);
                        setIsAddingMembers(false);
                      }
                    }}
                    className={`group w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-purple-600 text-white font-bold shadow-xs"
                        : "hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    {isEditingThis ? (
                      <div
                        className="flex items-center gap-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={renamedName}
                          onChange={(e) => setRenamedName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white text-slate-800 border border-slate-300 rounded focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameDepartment(dept)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingDept(null)}
                          className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <Building2
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-purple-200" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate text-xs sm:text-sm">{dept}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-slate-200/80 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                          {/* Nút sửa / xóa tổ */}
                          {dept !== "Chung" && (
                            <div
                              className="hidden group-hover:flex items-center gap-0.5 ml-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingDept(dept);
                                  setRenamedName(dept);
                                }}
                                className={`p-1 rounded hover:bg-black/10 ${
                                  isActive ? "text-white" : "text-slate-400 hover:text-slate-600"
                                }`}
                                title="Đổi tên tổ"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDepartment(dept)}
                                className={`p-1 rounded hover:bg-red-500 hover:text-white ${
                                  isActive ? "text-white" : "text-slate-400 hover:text-red-600"
                                }`}
                                title="Xóa tổ (chuyển về Chung)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT THÀNH VIÊN TRONG TỔ (7 cols) */}
          <div className="md:col-span-7 flex flex-col flex-1 overflow-hidden bg-white">
            {/* Header của tổ đang chọn */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>{activeDepartment}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({currentDeptTeachers.length} thành viên)
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingMembers(!isAddingMembers);
                  setSelectedTeacherIdsToAdd([]);
                  setMemberSearchQuery("");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-2xs ${
                  isAddingMembers
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {isAddingMembers ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Đóng Chọn</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm Thành Viên Vào Tổ</span>
                  </>
                )}
              </button>
            </div>

            {/* GIAO DIỆN CHỌN THÊM THÀNH VIÊN VÀO TỔ NÀY */}
            {isAddingMembers ? (
              <div className="flex-1 flex flex-col overflow-hidden p-3 bg-emerald-50/30">
                <div className="mb-2 text-xs font-semibold text-emerald-900 flex items-center justify-between">
                  <span>
                    Chọn giáo viên để đưa vào tổ <strong>"{activeDepartment}"</strong>:
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Đã chọn: <strong>{selectedTeacherIdsToAdd.length}</strong>
                  </span>
                </div>

                {/* Tìm kiếm thành viên để thêm */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Tìm tên giáo viên hoặc tổ hiện tại..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Danh sách ứng viên */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl">
                  {filteredCandidates.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Không tìm thấy giáo viên nào khác để thêm
                    </div>
                  ) : (
                    filteredCandidates.map((t) => {
                      const isSelected = selectedTeacherIdsToAdd.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTeacherIdsToAdd(
                                selectedTeacherIdsToAdd.filter((id) => id !== t.id)
                              );
                            } else {
                              setSelectedTeacherIdsToAdd([
                                ...selectedTeacherIdsToAdd,
                                t.id,
                              ]);
                            }
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50/80 text-emerald-950 font-semibold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span>{t.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Tổ hiện tại: {t.department}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Thanh nút bấm xác nhận thêm */}
                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredCandidates.map((c) => c.id);
                      const allSelected = allIds.every((id) =>
                        selectedTeacherIdsToAdd.includes(id)
                      );
                      if (allSelected) {
                        setSelectedTeacherIdsToAdd(
                          selectedTeacherIdsToAdd.filter(
                            (id) => !allIds.includes(id)
                          )
                        );
                      } else {
                        setSelectedTeacherIdsToAdd(
                          Array.from(new Set([...selectedTeacherIdsToAdd, ...allIds]))
                        );
                      }
                    }}
                    className="text-xs text-slate-600 hover:text-emerald-700 font-medium"
                  >
                    Chọn / Bỏ chọn tất cả ({filteredCandidates.length})
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingMembers(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={selectedTeacherIdsToAdd.length === 0 || isLoading}
                      onClick={handleSaveAddMembers}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Chuyển {selectedTeacherIdsToAdd.length} giáo viên vào tổ
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* DANH SÁCH THÀNH VIÊN HIỆN CÓ CỦA TỔ NÀY */
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {currentDeptTeachers.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Users className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">
                      Tổ này hiện chưa có giáo viên nào.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddingMembers(true)}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm thành viên ngay</span>
                    </button>
                  </div>
                ) : (
                  currentDeptTeachers.map((t, idx) => (
                    <div
                      key={t.id}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium w-6">
                          {idx + 1}.
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.role === "ADMIN" && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          {t.phone && (
                            <div className="text-[11px] text-slate-400">
                              SĐT: {t.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {activeDepartment !== "Chung" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(t)}
                          className="text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Bỏ khỏi tổ này (chuyển về Chung)"
                        >
                          Xóa khỏi tổ
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
