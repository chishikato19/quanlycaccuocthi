"use client";

import React, { useState, useEffect } from "react";
import { CompetitionDto, TeacherDto } from "@/types";
import {
  X,
  Trophy,
  Calendar,
  Link as LinkIcon,
  Check,
  Users,
  AlertCircle,
  Clock,
  FolderSync,
  HelpCircle
} from "lucide-react";
import { DepartmentSelector } from "./DepartmentSelector";
import { useAuth } from "@/features/auth/context/AuthContext";

interface CompetitionFormModalProps {
  competition: CompetitionDto | null; // null nếu là tạo mới
  teachers: TeacherDto[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompetitionFormModal: React.FC<CompetitionFormModalProps> = ({
  competition,
  teachers,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const isEditing = !!competition;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [deadline, setDeadline] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [allowViewProgress, setAllowViewProgress] = useState(true);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // Tùy chọn lưu trữ Google Drive: "DEFAULT" (chung của Super Admin) hoặc "CUSTOM" (Drive riêng của Admin)
  const [driveOption, setDriveOption] = useState<"DEFAULT" | "CUSTOM">("DEFAULT");
  const [customDriveFolder, setCustomDriveFolder] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (competition) {
      setTitle(competition.title);
      setDescription(competition.description || "");
      setLink(competition.link || "");

      const d = new Date(competition.deadline);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setDeadline(localISOTime);
      setAllowLateSubmission(competition.allowLateSubmission);
      setAllowViewProgress(competition.allowViewProgress);

      if (competition.driveFolderId) {
        setDriveOption("CUSTOM");
        setCustomDriveFolder(competition.driveFolderId);
      } else {
        setDriveOption("DEFAULT");
        setCustomDriveFolder("");
      }

      if (competition.assignees) {
        setSelectedTeacherIds(competition.assignees.map(a => a.teacherId));
      } else {
        setSelectedTeacherIds(teachers.map(t => t.id));
      }
    } else {
      setTitle("");
      setDescription("");
      setLink("");

      const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      defaultDate.setHours(23, 59, 0, 0);
      const tzOffset = defaultDate.getTimezoneOffset() * 60000;
      setDeadline(new Date(defaultDate.getTime() - tzOffset).toISOString().slice(0, 16));
      setAllowLateSubmission(true);
      setAllowViewProgress(true);

      // Cấu hình Drive mặc định cho cuộc thi mới
      const isSuper = currentUser?.role === "SUPER_ADMIN" || currentUser?.phone === "admin";
      if (isSuper) {
        setDriveOption("DEFAULT");
        setCustomDriveFolder("");
      } else if (currentUser?.driveFolderId) {
        setDriveOption("CUSTOM");
        setCustomDriveFolder(currentUser.driveFolderId);
      } else {
        setDriveOption("DEFAULT");
        setCustomDriveFolder("");
      }

      setSelectedTeacherIds(teachers.map(t => t.id));
    }
    setError("");
  }, [competition, teachers, isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      setError("Vui lòng nhập tên cuộc thi và hạn chót hoàn thành");
      return;
    }
    if (selectedTeacherIds.length === 0) {
      setError("Vui lòng chọn ít nhất một giáo viên thực hiện");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const url = isEditing ? `/api/competitions/${competition.id}` : "/api/competitions";
      const method = isEditing ? "PUT" : "POST";
      const payload = {
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        deadline: new Date(deadline).toISOString(),
        allowLateSubmission,
        allowViewProgress,
        // Nếu chọn CUSTOM thì gửi ID thư mục, nếu chọn DEFAULT thì để null để fallback về Drive chung của Super Admin
        driveFolderId: driveOption === "CUSTOM" && customDriveFolder.trim() ? customDriveFolder.trim() : null,
        creatorId: currentUser.id,
        assigneeIds: selectedTeacherIds,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Không thể lưu thông tin cuộc thi");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {isEditing ? "Chỉnh Sửa Cuộc Thi / Công Việc" : "Tạo Cuộc Thi & Giao Việc"}
              </h3>
              <p className="text-xs text-slate-500">Thiết lập thời hạn, nơi lưu Drive và chọn người thực hiện</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tên cuộc thi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên cuộc thi / Nhiệm vụ *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Cuộc thi Tìm hiểu An toàn Giao thông 2026..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              required
            />
          </div>

          {/* Thời hạn & Đường link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Hạn chót hoàn thành *</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Đường dẫn dự thi (Nếu có)</span>
              </label>
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Mô tả & Hướng dẫn */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả & Hướng dẫn minh chứng
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Yêu cầu giáo viên chụp màn hình kết quả hoặc giấy chứng nhận hoàn thành..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* CẤU HÌNH NƠI LƯU GOOGLE DRIVE: CHUNG CỦA SUPER ADMIN HOẶC RIÊNG CỦA ADMIN */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-sky-600" />
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nơi lưu trữ ảnh minh chứng (Google Drive)
              </label>
            </div>

            <div className="space-y-2">
              {/* Lựa chọn 1: Lưu trên Drive chung của Nhà Trường */}
              <label
                onClick={() => setDriveOption("DEFAULT")}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  driveOption === "DEFAULT"
                    ? "bg-sky-50 border-sky-400 text-sky-900 font-semibold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="driveOption"
                  checked={driveOption === "DEFAULT"}
                  onChange={() => setDriveOption("DEFAULT")}
                  className="mt-0.5 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Lưu trên Google Drive chung của Nhà Trường</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">
                    Hệ thống sẽ tự động tạo thư mục con <code className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono text-[10px]">[Cuộc thi] {title || "Tên cuộc thi"}</code> bên trong thư mục chung của trường để gom ảnh tập trung.
                  </div>
                </div>
              </label>

              {/* Lựa chọn 2: Chỉ định thư mục Drive riêng */}
              <label
                onClick={() => setDriveOption("CUSTOM")}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  driveOption === "CUSTOM"
                    ? "bg-purple-50 border-purple-400 text-purple-900 font-semibold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="driveOption"
                  checked={driveOption === "CUSTOM"}
                  onChange={() => setDriveOption("CUSTOM")}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Chỉ định một Thư mục Google Drive riêng cho cuộc thi này</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Tùy chọn: Dán link một thư mục Google Drive riêng biệt nếu bạn không muốn lưu vào thư mục chung của trường.
                  </div>

                  {driveOption === "CUSTOM" && (
                    <div className="mt-2.5 space-y-1.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={customDriveFolder}
                        onChange={e => setCustomDriveFolder(e.target.value)}
                        placeholder="Dán đường link chia sẻ thư mục Drive hoặc ID thư mục vào đây..."
                        className="w-full px-3 py-1.5 text-xs border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                      <p className="text-[10px] text-purple-700">
                        * Mẹo: Mở Google Drive &rarr; Tạo thư mục cuộc thi &rarr; Bấm <b>Chia sẻ</b> &rarr; Chọn <i>&quot;Bất kỳ ai có đường liên kết đều có thể chỉnh sửa&quot;</i> &rarr; Sao chép link dán vào ô trên.
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Các tùy chọn thiết lập */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowLateSubmission}
                onChange={e => setAllowLateSubmission(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Cho phép nộp khi quá hạn</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Vẫn tiếp nhận nhưng tự động gắn cờ "Nộp muộn"
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowViewProgress}
                onChange={e => setAllowViewProgress(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Hiện tiến độ cho giáo viên</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Cho phép người dùng xem bao nhiêu người đã nộp
                </span>
              </div>
            </label>
          </div>

          {/* Chọn người thực hiện (Có chọn nhanh theo tổ chuyên môn) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Phân công người thực hiện (Chọn nhanh theo tổ hoặc chọn lẻ cá nhân)
            </label>
            <DepartmentSelector
              teachers={teachers}
              selectedTeacherIds={selectedTeacherIds}
              onChange={setSelectedTeacherIds}
            />
          </div>

          {/* Nút lưu */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl min-h-[42px]"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 disabled:opacity-50 min-h-[42px]"
            >
              {isSubmitting ? "Đang xử lý..." : isEditing ? "Lưu Thay Đổi" : "Tạo Cuộc Thi & Giao Việc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
