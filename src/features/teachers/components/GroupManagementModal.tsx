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
  ShieldAlert,
  Loader2,
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
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Form tạo / sửa nhóm
  const [isEditing, setIsEditing] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupColor, setGroupColor] = useState("blue");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tìm kiếm giáo viên trong tab thành viên
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);

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

  // Tải danh sách nhóm
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups(data.data || []);
        if (data.data?.length > 0 && !activeGroupId) {
          setActiveGroupId(data.data[0].id);
        }
      }
    } catch {
      console.error("Không thể tải danh sách nhóm");
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setFormError("");
      setIsEditing(false);
      setEditingGroupId(null);
    }
  }, [isOpen, loadGroups]);

  // Nhóm đang được chọn
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  }, [groups, activeGroupId]);

  // Danh sách giáo viên thuộc nhóm đang chọn
  const currentGroupMemberIds = useMemo(() => {
    if (!activeGroup) return new Set<string>();
    const set = new Set<string>();
    for (const t of schoolTeachers) {
      const inGroup = t.groups?.some((g) => g.id === activeGroup.id) || t.groupIds?.includes(activeGroup.id);
      if (inGroup) set.add(t.id);
    }
    return set;
  }, [activeGroup, schoolTeachers]);

  // Xử lý tạo / sửa nhóm
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setFormError("Vui lòng nhập tên nhóm / vai trò");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const url = isEditing && editingGroupId ? `/api/groups/${editingGroupId}` : "/api/groups";
      const method = isEditing ? "PUT" : "POST";
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
        setGroupName("");
        setGroupDescription("");
        setGroupColor("blue");
        setIsEditing(false);
        setEditingGroupId(null);
        await loadGroups();
        if (data.data?.id) setActiveGroupId(data.data.id);
        onRefresh();
      } else {
        setFormError(data.error || "Không thể lưu thông tin nhóm");
      }
    } catch {
      setFormError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khởi tạo nhóm gợi ý
  const handleSeedDefaults = async () => {
    if (!confirm("Hệ thống sẽ thêm các nhóm thông dụng (Đảng viên, Đoàn viên, Nữ công, Cán bộ quản lý...). Bạn có muốn tiếp tục?")) {
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
        alert(data.error || "Không thể khởi tạo nhóm mặc định");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // Chuẩn bị sửa nhóm
  const handleStartEdit = (g: GroupDto) => {
    setIsEditing(true);
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupDescription(g.description || "");
    setGroupColor(g.color || "blue");
    setFormError("");
  };

  // Hủy sửa nhóm
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingGroupId(null);
    setGroupName("");
    setGroupDescription("");
    setGroupColor("blue");
    setFormError("");
  };

  // Xóa nhóm
  const handleDeleteGroup = async (g: GroupDto) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa nhóm "${g.name}"?\n(Lưu ý: Chỉ xóa danh mục nhóm, toàn bộ tài khoản giáo viên và các cuộc thi đang diễn ra được giữ nguyên 100%).`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${g.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadGroups();
        if (activeGroupId === g.id) setActiveGroupId(null);
        onRefresh();
      } else {
        alert(data.error || "Không thể xóa nhóm");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi xóa nhóm");
    }
  };

  // Bật/tắt thành viên khỏi nhóm trực tiếp từ modal
  const handleToggleMember = async (teacher: TeacherDto) => {
    if (!activeGroup || isUpdatingMembers) return;

    const isMember = currentGroupMemberIds.has(teacher.id);
    const existingGroupIds = teacher.groups?.map((g) => g.id) || teacher.groupIds || [];

    let newGroupIds: string[];
    if (isMember) {
      newGroupIds = existingGroupIds.filter((id) => id !== activeGroup.id);
    } else {
      newGroupIds = Array.from(new Set([...existingGroupIds, activeGroup.id]));
    }

    setIsUpdatingMembers(true);
    try {
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
        // Cập nhật count cục bộ
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === activeGroup.id) {
              return {
                ...g,
                teacherCount: Math.max(0, (g.teacherCount || 0) + (isMember ? -1 : 1)),
              };
            }
            return g;
          })
        );
      } else {
        alert(data.error || "Không thể cập nhật thành viên");
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  // Thêm tất cả giáo viên đang hiển thị vào nhóm
  const handleAddAllFilteredToGroup = async (teacherIdsToAdd: string[]) => {
    if (!activeGroup || teacherIdsToAdd.length === 0 || isUpdatingMembers) return;
    setIsUpdatingMembers(true);
    try {
      for (const tId of teacherIdsToAdd) {
        const teacher = schoolTeachers.find((t) => t.id === tId);
        if (!teacher) continue;
        const existingGroupIds = teacher.groups?.map((g) => g.id) || teacher.groupIds || [];
        if (!existingGroupIds.includes(activeGroup.id)) {
          await fetch("/api/teachers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: teacher.id,
              name: teacher.name,
              department: teacher.department,
              phone: teacher.phone,
              groupIds: [...existingGroupIds, activeGroup.id],
            }),
          });
        }
      }
      onRefresh();
      await loadGroups();
    } catch {
      alert("Lỗi khi gán hàng loạt");
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  // Lọc danh sách giáo viên trong tab thành viên
  const filteredTeachersForMemberTab = useMemo(() => {
    if (!memberSearchQuery.trim()) return schoolTeachers;
    const q = normalizeVietnamese(memberSearchQuery);
    return schoolTeachers.filter(
      (t) =>
        normalizeVietnamese(t.name).includes(q) ||
        normalizeVietnamese(t.department).includes(q) ||
        (t.phone && t.phone.includes(memberSearchQuery.trim()))
    );
  }, [schoolTeachers, memberSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-sky-50 via-white to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-xs">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Quản Lý Nhóm & Vai Trò Giáo Viên
              </h2>
              <p className="text-xs text-slate-500">
                Tạo nhóm nghiệp vụ (Đảng viên, Đoàn viên, Nữ công...) để phân loại và chọn nhanh khi tạo cuộc thi
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

        {/* Nội dung Modal (2 Cột) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* CỘT TRÁI (5/12): Danh sách nhóm & Form tạo mới */}
          <div className="md:col-span-5 border-r border-slate-100 flex flex-col bg-slate-50/60 overflow-hidden">
            {/* Form tạo / sửa nhóm */}
            <form onSubmit={handleSaveGroup} className="p-3.5 sm:p-4 bg-white border-b border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  {isEditing ? <Edit2 className="w-3.5 h-3.5 text-amber-600" /> : <Plus className="w-3.5 h-3.5 text-sky-600" />}
                  {isEditing ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}
                </span>
                {groups.length === 0 && !isEditing && (
                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg transition-colors border border-sky-200"
                    title="Tự động thêm Đảng viên, Đoàn viên, Nữ công..."
                  >
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Gợi ý mẫu</span>
                  </button>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Tên nhóm (ví dụ: Đảng viên, Nữ công...)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Mô tả ngắn (tùy chọn)..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                />
              </div>

              {/* Chọn màu sắc huy hiệu */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Màu sắc hiển thị:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(GROUP_COLOR_MAP).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGroupColor(key)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
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

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isEditing ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{isEditing ? "Lưu thay đổi" : "Thêm nhóm"}</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* Danh sách các nhóm đã có */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Danh sách nhóm ({groups.length})
                </span>
                {groups.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    className="text-[10px] text-sky-600 hover:text-sky-800 font-semibold"
                  >
                    + Khôi phục nhóm mẫu
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Đang tải danh sách nhóm...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="p-4 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-2">
                  <Tags className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Chưa có nhóm nào được tạo</p>
                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 text-xs font-semibold rounded-xl hover:bg-sky-100 transition-colors border border-sky-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo nhanh nhóm mẫu</span>
                  </button>
                </div>
              ) : (
                groups.map((g) => {
                  const colorConfig = GROUP_COLOR_MAP[g.color || "blue"] || GROUP_COLOR_MAP.blue;
                  const isSelected = activeGroup?.id === g.id;
                  const memberCount = g.teacherCount ?? 0;

                  return (
                    <div
                      key={g.id}
                      onClick={() => setActiveGroupId(g.id)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-white border-sky-500 shadow-md ring-1 ring-sky-500"
                          : "bg-white hover:bg-slate-50/80 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.dot} shrink-0`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {g.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${colorConfig.bg} ${colorConfig.text} border ${colorConfig.border}`}
                            >
                              {memberCount} người
                            </span>
                          </div>
                          {g.description && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {g.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(g);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                          title="Sửa nhóm"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(g);
                          }}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Xóa nhóm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (7/12): Quản lý thành viên của nhóm đang chọn */}
          <div className="md:col-span-7 flex flex-col bg-white overflow-hidden">
            {activeGroup ? (
              <>
                {/* Header cột phải */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Thành viên nhóm:{" "}
                        <span className="text-sky-600">{activeGroup.name}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                        ({currentGroupMemberIds.size} / {schoolTeachers.length} người)
                      </span>
                    </div>
                  </div>

                  {/* Nút hành động nhanh */}
                  <div className="flex items-center gap-2">
                    {filteredTeachersForMemberTab.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAddAllFilteredToGroup(
                            filteredTeachersForMemberTab
                              .filter((t) => !currentGroupMemberIds.has(t.id))
                              .map((t) => t.id)
                          )
                        }
                        disabled={isUpdatingMembers}
                        className="text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        + Thêm tất cả đang lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Ô tìm kiếm thành viên */}
                <div className="p-3 border-b border-slate-100 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Tìm giáo viên để tick chọn vào nhóm..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Danh sách giáo viên với checkbox tick chọn vào nhóm */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {filteredTeachersForMemberTab.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Không tìm thấy giáo viên nào khớp với từ khóa
                    </div>
                  ) : (
                    filteredTeachersForMemberTab.map((t) => {
                      const isMember = currentGroupMemberIds.has(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleMember(t)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isMember
                              ? "bg-sky-50/70 border-sky-200 shadow-2xs"
                              : "bg-white hover:bg-slate-50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 text-sky-600">
                              {isMember ? (
                                <CheckSquare className="w-4 h-4 text-sky-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {t.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {t.department} {t.phone ? `• ${t.phone}` : ""}
                              </p>
                            </div>
                          </div>

                          <div>
                            {isMember ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                                Đã thuộc nhóm
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                                Bấm để thêm
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                <Tags className="w-12 h-12 text-slate-200 mb-2" />
                <p>Hãy chọn một nhóm ở cột bên trái hoặc tạo nhóm mới</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <b>An toàn dữ liệu:</b> Việc thêm/sửa/xóa nhóm không ảnh hưởng đến các cuộc thi đang diễn ra.
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
    </div>
  );
};
