"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TeacherDto, GroupDto } from "@/types";
import { normalizeVietnamese } from "@/lib/utils";
import {
  X,
  Tags,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export const GROUP_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Đỏ (Đảng viên)" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", label: "Xanh dương (Đoàn viên)" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", label: "Hồng (Nữ công)" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", label: "Tím (Quản lý / BGH)" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Vàng cam (Công đoàn)" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Xanh lục" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500", label: "Chàm" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", label: "Xanh mòng két" },
};

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherDto[];
  onRefresh: () => void;
}

export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onRefresh,
}) => {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Điều hướng: null là xem danh sách nhóm; có giá trị là đang xem chi tiết thành viên của nhóm đó
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);

  // Form tạo / sửa nhóm
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupColor, setGroupColor] = useState("blue");
  const [formError, setFormError] = useState("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Modal thêm thành viên vào nhóm đang chọn
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState("");
  const [selectedCandidatesToAdd, setSelectedCandidatesToAdd] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // Tìm kiếm trong danh sách thành viên hiện có của nhóm
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [removingTeacherId, setRemovingTeacherId] = useState<string | null>(null);

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

  // Tải danh sách nhóm từ API
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups(data.data || []);
      }
    } catch {
      console.error("Không thể tải danh sách nhóm");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setSelectedGroup(null);
      setIsGroupFormOpen(false);
      setIsAddMembersOpen(false);
    }
  }, [isOpen, loadGroups]);

  // Cập nhật lại thông tin selectedGroup khi danh sách nhóm thay đổi
  useEffect(() => {
    if (selectedGroup) {
      const fresh = groups.find((g) => g.id === selectedGroup.id);
      if (fresh) setSelectedGroup(fresh);
    }
  }, [groups, selectedGroup]);

  // Danh sách thành viên HIỆN CÓ trong nhóm đang chọn
  const currentGroupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return schoolTeachers.filter((t) => {
      return (
        t.groups?.some((g) => g.id === selectedGroup.id) ||
        t.groupIds?.includes(selectedGroup.id)
      );
    });
  }, [selectedGroup, schoolTeachers]);

  // Lọc thành viên hiện có theo từ khóa tìm kiếm
  const filteredCurrentMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return currentGroupMembers;
    const q = normalizeVietnamese(memberSearchQuery);
    return currentGroupMembers.filter(
      (t) =>
        normalizeVietnamese(t.name).includes(q) ||
        normalizeVietnamese(t.department).includes(q) ||
        (t.phone && t.phone.includes(memberSearchQuery.trim()))
    );
  }, [currentGroupMembers, memberSearchQuery]);

  // Danh sách các giáo viên CHƯA thuộc nhóm này (Ứng viên để thêm vào)
  const candidateTeachers = useMemo(() => {
    if (!selectedGroup) return [];
    const currentMemberIds = new Set(currentGroupMembers.map((t) => t.id));
    return schoolTeachers.filter((t) => !currentMemberIds.has(t.id));
  }, [selectedGroup, schoolTeachers, currentGroupMembers]);

  // Lọc ứng viên theo tìm kiếm
  const filteredCandidates = useMemo(() => {
    if (!candidateSearchQuery.trim()) return candidateTeachers;
    const q = normalizeVietnamese(candidateSearchQuery);
    return candidateTeachers.filter(
      (t) =>
        normalizeVietnamese(t.name).includes(q) ||
        normalizeVietnamese(t.department).includes(q) ||
        (t.phone && t.phone.includes(candidateSearchQuery.trim()))
    );
  }, [candidateTeachers, candidateSearchQuery]);

  // ==================== CÁC HÀNH ĐỘNG VỚI NHÓM ====================

  // Mở form tạo nhóm mới
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupDescription("");
    setGroupColor("blue");
    setFormError("");
    setIsGroupFormOpen(true);
  };

  // Mở form sửa nhóm
  const handleOpenEditGroup = (g: GroupDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupDescription(g.description || "");
    setGroupColor(g.color || "blue");
    setFormError("");
    setIsGroupFormOpen(true);
  };

  // Lưu tạo / sửa nhóm
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setFormError("Vui lòng nhập tên nhóm");
      return;
    }

    setIsSubmittingGroup(true);
    setFormError("");

    try {
      const isEdit = !!editingGroupId;
      const url = isEdit ? `/api/groups/${editingGroupId}` : "/api/groups";
      const method = isEdit ? "PUT" : "POST";
      const body = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        color: groupColor,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsGroupFormOpen(false);
        await loadGroups();
        onRefresh();
      } else {
        setFormError(data.error || "Không thể lưu thông tin nhóm");
      }
    } catch {
      setFormError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Xóa nhóm
  const handleDeleteGroup = async (g: GroupDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa nhóm "${g.name}"?\n(Toàn bộ tài khoản giáo viên và các cuộc thi được giữ nguyên 100%).`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${g.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadGroups();
        if (selectedGroup?.id === g.id) setSelectedGroup(null);
        onRefresh();
      } else {
        alert(data.error || "Không thể xóa nhóm");
      }
    } catch {
      alert("Lỗi máy chủ khi xóa nhóm");
    }
  };

  // Khởi tạo nhóm gợi ý
  const handleSeedDefaults = async () => {
    if (!confirm("Tạo nhanh các nhóm thông dụng (Đảng viên, Đoàn viên, Nữ công, Cán bộ quản lý...). Bạn có muốn tiếp tục?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_DEFAULTS" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadGroups();
        onRefresh();
      } else {
        alert(data.error || "Không thể tạo nhóm mẫu");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== CÁC HÀNH ĐỘNG VỚI THÀNH VIÊN ====================

  // Xóa thành viên khỏi nhóm
  const handleRemoveMember = async (teacher: TeacherDto) => {
    if (!selectedGroup) return;
    if (!confirm(`Bạn có chắc muốn gỡ "${teacher.name}" khỏi nhóm "${selectedGroup.name}"?`)) return;

    setRemovingTeacherId(teacher.id);
    try {
      const existingGroupIds = teacher.groups?.map((g) => g.id) || teacher.groupIds || [];
      const newGroupIds = existingGroupIds.filter((id) => id !== selectedGroup.id);

      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: teacher.id,
          name: teacher.name,
          department: teacher.department,
          phone: teacher.phone,
          groupIds: newGroupIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onRefresh();
        await loadGroups();
      } else {
        alert(data.error || "Không thể gỡ thành viên");
      }
    } catch {
      alert("Lỗi kết nối khi gỡ thành viên");
    } finally {
      setRemovingTeacherId(null);
    }
  };

  // Toggle tick chọn ứng viên để thêm
  const handleToggleCandidate = (id: string) => {
    if (selectedCandidatesToAdd.includes(id)) {
      setSelectedCandidatesToAdd(selectedCandidatesToAdd.filter((i) => i !== id));
    } else {
      setSelectedCandidatesToAdd([...selectedCandidatesToAdd, id]);
    }
  };

  // Chọn hoặc bỏ chọn tất cả ứng viên đang lọc
  const handleToggleSelectAllCandidates = () => {
    const candidateIds = filteredCandidates.map((t) => t.id);
    const allSelected = candidateIds.every((id) => selectedCandidatesToAdd.includes(id));
    if (allSelected) {
      setSelectedCandidatesToAdd(selectedCandidatesToAdd.filter((id) => !candidateIds.includes(id)));
    } else {
      setSelectedCandidatesToAdd(Array.from(new Set([...selectedCandidatesToAdd, ...candidateIds])));
    }
  };

  // Lưu thêm các thành viên đã chọn vào nhóm
  const handleConfirmAddMembers = async () => {
    if (!selectedGroup || selectedCandidatesToAdd.length === 0) return;

    setIsAddingMembers(true);
    try {
      for (const tId of selectedCandidatesToAdd) {
        const teacher = schoolTeachers.find((t) => t.id === tId);
        if (!teacher) continue;
        const existingGroupIds = teacher.groups?.map((g) => g.id) || teacher.groupIds || [];
        if (!existingGroupIds.includes(selectedGroup.id)) {
          await fetch("/api/teachers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: teacher.id,
              name: teacher.name,
              department: teacher.department,
              phone: teacher.phone,
              groupIds: [...existingGroupIds, selectedGroup.id],
            }),
          });
        }
      }

      setSelectedCandidatesToAdd([]);
      setIsAddMembersOpen(false);
      onRefresh();
      await loadGroups();
    } catch {
      alert("Lỗi khi thêm thành viên vào nhóm");
    } finally {
      setIsAddingMembers(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* ========================================================= */}
        {/* HEADER MODAL */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-sky-50 via-white to-purple-50">
          <div className="flex items-center gap-3">
            {selectedGroup ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup(null);
                  setMemberSearchQuery("");
                }}
                className="p-2 hover:bg-white rounded-xl text-slate-600 hover:text-sky-600 border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                title="Quay lại danh sách nhóm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Danh sách nhóm</span>
              </button>
            ) : (
              <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-xs">
                <Tags className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  {selectedGroup ? selectedGroup.name : "Quản Lý Nhóm & Vai Trò"}
                </h2>
                {selectedGroup && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      (GROUP_COLOR_MAP[selectedGroup.color || "blue"] || GROUP_COLOR_MAP.blue).bg
                    } ${
                      (GROUP_COLOR_MAP[selectedGroup.color || "blue"] || GROUP_COLOR_MAP.blue).text
                    } ${
                      (GROUP_COLOR_MAP[selectedGroup.color || "blue"] || GROUP_COLOR_MAP.blue).border
                    }`}
                  >
                    {currentGroupMembers.length} thành viên
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {selectedGroup
                  ? selectedGroup.description || "Danh sách cán bộ, giáo viên thuộc nhóm này"
                  : "Danh sách các nhóm đối tượng (Đảng viên, Đoàn viên, Nữ công...) trong trường"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* NỘI DUNG CHÍNH (2 MÀN HÌNH: DANH SÁCH NHÓM / CHI TIẾT THÀNH VIÊN) */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {!selectedGroup ? (
            /* ========================================================= */
            /* MÀN HÌNH 1: HIỆN DANH SÁCH CÁC NHÓM & SỐ LƯỢNG + NÚT THÊM NHÓM */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Thanh điều khiển trên cùng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Hiện có <span className="text-sky-600 font-bold">{groups.length}</span> nhóm đối tượng
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {groups.length === 0 && (
                    <button
                      type="button"
                      onClick={handleSeedDefaults}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tạo nhóm mẫu</span>
                    </button>
                  )}

                  {/* NÚT THÊM NHÓM */}
                  <button
                    type="button"
                    onClick={handleOpenCreateGroup}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Nhóm Mới</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các nhóm */}
              {isLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  <span>Đang tải danh sách nhóm...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-3">
                  <Tags className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">Chưa có nhóm nào được tạo</p>
                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-700 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors border border-sky-200"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo nhanh các nhóm mẫu (Đảng viên, Đoàn viên...)</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groups.map((g) => {
                    const colorConfig = GROUP_COLOR_MAP[g.color || "blue"] || GROUP_COLOR_MAP.blue;
                    const memberCount = g.teacherCount ?? 0;

                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGroup(g)}
                        className="group relative p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        {/* Header của thẻ nhóm */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full ${colorConfig.dot} shrink-0`} />
                            <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                              {g.name}
                            </h3>
                          </div>

                          {/* Nút sửa / xóa nhóm */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditGroup(g, e)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                              title="Sửa tên / màu sắc nhóm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteGroup(g, e)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Xóa nhóm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mô tả ngắn nếu có */}
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                          {g.description || <span className="italic text-slate-300">Không có mô tả</span>}
                        </p>

                        {/* Footer của thẻ: Số lượng và nút vào xem */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                          >
                            <Users className="w-3.5 h-3.5 inline mr-1" />
                            {memberCount} người
                          </span>

                          <span className="text-xs font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>Xem thành viên</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* MÀN HÌNH 2: KHI NHẤN VÀO 1 NHÓM -> HIỆN THÀNH VIÊN & NÚT THÊM THÀNH VIÊN */
            /* ========================================================= */
            <div className="space-y-4">
              {/* Thanh điều khiển của nhóm đang chọn */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Tìm thành viên trong nhóm..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* NÚT THÊM THÀNH VIÊN VÀO NHÓM */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidatesToAdd([]);
                    setCandidateSearchQuery("");
                    setIsAddMembersOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm Thành Viên</span>
                </button>
              </div>

              {/* Bảng danh sách thành viên trong nhóm */}
              {filteredCurrentMembers.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-3">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">
                    {memberSearchQuery.trim()
                      ? "Không tìm thấy thành viên nào khớp từ khóa"
                      : "Nhóm này chưa có thành viên nào"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCandidatesToAdd([]);
                      setCandidateSearchQuery("");
                      setIsAddMembersOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-700 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors border border-sky-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Thêm thành viên ngay</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center font-bold">STT</th>
                          <th className="py-2.5 px-3 font-bold">Họ và Tên</th>
                          <th className="py-2.5 px-3 font-bold">Tổ Chuyên Môn</th>
                          <th className="py-2.5 px-3 font-bold">Số Điện Thoại</th>
                          <th className="py-2.5 px-3 text-right font-bold w-24">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCurrentMembers.map((t, idx) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {t.name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-semibold">
                                {t.department}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {t.phone || "---"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(t)}
                                disabled={removingTeacherId === t.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Gỡ khỏi nhóm này"
                              >
                                {removingTeacherId === t.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserMinus className="w-3 h-3" />
                                )}
                                <span>Gỡ</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER MODAL */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Việc gán nhóm hoặc đổi nhóm <b>không làm ảnh hưởng</b> đến các cuộc thi đang diễn ra.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP: FORM TẠO HOẶC SỬA NHÓM */}
      {/* ========================================================= */}
      {isGroupFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {editingGroupId ? <Edit2 className="w-4 h-4 text-sky-600" /> : <Plus className="w-4 h-4 text-sky-600" />}
                <span>{editingGroupId ? "Chỉnh Sửa Nhóm" : "Thêm Nhóm Mới"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên nhóm / vai trò *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Đảng viên, Đoàn viên, Nữ công..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả ngắn (tùy chọn)
                </label>
                <input
                  type="text"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Ví dụ: Cán bộ, giáo viên thuộc Chi bộ nhà trường"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                />
              </div>

              {/* Bảng chọn màu sắc huy hiệu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu sắc huy hiệu hiển thị:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(GROUP_COLOR_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGroupColor(key)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        groupColor === key
                          ? `${val.bg} ${val.text} ring-2 ring-sky-500 font-bold border-transparent`
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                      <span>{val.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingGroup && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGroupId ? "Cập Nhật" : "Tạo Nhóm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP: CHỌN THÊM THÀNH VIÊN VÀO NHÓM */}
      {/* ========================================================= */}
      {isAddMembersOpen && selectedGroup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Popup thêm thành viên */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Thêm thành viên vào nhóm:{" "}
                  <span className="text-sky-600">{selectedGroup.name}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMembersOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thanh tìm kiếm & chọn tất cả */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên giáo viên hoặc tổ..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">
                  Đã chọn: <b className="text-sky-600">{selectedCandidatesToAdd.length}</b> người
                </span>
                {filteredCandidates.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAllCandidates}
                    className="text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    {filteredCandidates.every((t) => selectedCandidatesToAdd.includes(t.id))
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả đang lọc"}
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách giáo viên chưa thuộc nhóm để tick chọn */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredCandidates.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {candidateSearchQuery.trim()
                    ? "Không tìm thấy giáo viên nào phù hợp"
                    : "Tất cả giáo viên trong trường đã thuộc nhóm này"}
                </div>
              ) : (
                filteredCandidates.map((t) => {
                  const isChecked = selectedCandidatesToAdd.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleCandidate(t.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-sky-50 border-sky-300 shadow-2xs"
                          : "bg-white hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-sky-600">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {t.department} {t.phone ? `• ${t.phone}` : ""}
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 shrink-0">
                          Sẽ thêm
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer popup thêm thành viên */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddMembersOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAddMembers}
                disabled={isAddingMembers || selectedCandidatesToAdd.length === 0}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAddingMembers ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Xác nhận thêm ({selectedCandidatesToAdd.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
