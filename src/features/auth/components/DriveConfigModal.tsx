"use client";

import React, { useState, useEffect } from "react";
import {
  FolderSync,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  parseDriveConfig,
  serializeDriveConfig,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from "@/lib/google-drive-shared";

interface DriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DriveConfigModal: React.FC<DriveConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, setCurrentUser } = useAuth();
  const [folderInput, setFolderInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.phone === "admin" ||
    currentUser?.name?.toLowerCase().includes("quản trị");

  useEffect(() => {
    if (currentUser?.driveFolderId) {
      const parsed = parseDriveConfig(currentUser.driveFolderId);
      setFolderInput(parsed.folderUrl || parsed.folderId || "");
      setWebhookInput(parsed.webhookUrl || "");
    } else {
      setFolderInput("");
      setWebhookInput("");
    }
    setError("");
    setSuccess("");
    setSyncResult(null);
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentParsed = parseDriveConfig(currentUser.driveFolderId);
  const hasFolder = Boolean(currentParsed.folderId);
  const hasWebhook = Boolean(currentParsed.webhookUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const serialized = serializeDriveConfig({
        folderUrlOrId: folderInput.trim() || null,
        webhookUrl: webhookInput.trim() || null,
      });

      const res = await fetch("/api/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          department: currentUser.department,
          phone: currentUser.phone,
          role: currentUser.role,
          driveFolderId: serialized,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(
          isSuperAdmin
            ? "Đã lưu thành công cấu hình Google Drive Nhà Trường!"
            : "Đã lưu cấu hình Google Drive cá nhân!"
        );
        setCurrentUser(data.data);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Không thể cập nhật cấu hình");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncToDrive = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError("");

    try {
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult(data.message || `Đã đồng bộ ${data.syncedCount} bài nộp lên Google Drive!`);
      } else {
        setError(data.error || "Lỗi khi đồng bộ lên Google Drive");
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi đồng bộ");
    } finally {
      setIsSyncing(false);
    }
  };

  const copyScriptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      setError("Không thể sao chép tự động, vui lòng chọn văn bản thủ công");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 p-5 sm:p-6 space-y-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {isSuperAdmin
                  ? "Cấu Hình Google Drive Nhà Trường"
                  : "Cấu Hình Google Drive Cá Nhân"}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuperAdmin
                  ? "Quản lý thư mục lưu trữ chung & Tự động chia thư mục từng cuộc thi"
                  : "Dành cho quản trị viên tạo cuộc thi"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông báo lỗi / thành công */}
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {syncResult && (
          <div className="p-3 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncResult}</span>
          </div>
        )}

        {/* Nội dung cuộn được */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Card trạng thái kết nối hiện tại */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Trạng thái thư mục:</span>
              {hasFolder ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối Drive trường
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> Chưa cài đặt thư mục
                </span>
              )}
            </div>

            {hasFolder && currentParsed.folderUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500 truncate max-w-[260px]">
                  ID: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">{currentParsed.folderId}</code>
                </span>
                <a
                  href={currentParsed.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold hover:underline"
                >
                  Mở Thư Mục <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-700">Tự động tải ảnh vào Drive:</span>
              {hasWebhook ? (
                <span className="text-emerald-700 font-medium text-[11px]">
                  🟢 Đang hoạt động (Apps Script)
                </span>
              ) : (
                <span className="text-slate-500 font-medium text-[11px]">
                  ⚪ Lưu an toàn trong Database
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: Thư mục chung */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Đường dẫn hoặc ID Thư mục Google Drive của Nhà Trường
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={folderInput}
                  onChange={e => setFolderInput(e.target.value)}
                  placeholder="Dán link thư mục Google Drive của trường vào đây..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                * Mở Google Drive của trường &rarr; Tạo thư mục (VD: <i>BAO_CAO_CUOC_THI</i>) &rarr; Bấm <b>Chia sẻ</b> &rarr; Chọn <i>&quot;Bất kỳ ai có đường liên kết đều có thể chỉnh sửa&quot;</i> &rarr; Dán link vào đây.
              </p>
            </div>

            {/* Input 2: Google Apps Script Webhook URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  2. Webhook Google Apps Script (Tự động tải ảnh & chia thư mục)
                </label>
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-medium flex items-center gap-0.5"
                >
                  <HelpCircle className="w-3 h-3" />
                  {showScriptGuide ? "Ẩn hướng dẫn" : "Cách cài đặt 2 phút"}
                  {showScriptGuide ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <input
                type="text"
                value={webhookInput}
                onChange={e => setWebhookInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-700"
              />

              {/* Hướng dẫn cài đặt Apps Script chi tiết */}
              {showScriptGuide && (
                <div className="mt-2.5 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-2.5">
                  <div className="font-bold text-purple-900">
                    🚀 Hướng dẫn 3 bước cực dễ để tự động đưa ảnh vào Drive:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-slate-700">
                    <li>
                      Mở Google Drive của trường &rarr; Bấm nút <b>Mới (+)</b> ở góc trái &rarr; Chọn <b>Ứng dụng khác</b> &rarr; <b>Google Apps Script</b>.
                    </li>
                    <li>
                      Xóa toàn bộ mã mặc định có sẵn, bấm nút dưới đây để sao chép mã và dán vào:
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={copyScriptToClipboard}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold flex items-center gap-1.5 text-[11px] shadow-sm transition-all"
                        >
                          {copiedScript ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Đã sao chép mã!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Sao chép mã Apps Script
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                    <li>
                      Bấm nút xanh <b>Triển khai (Deploy)</b> ở góc trên bên phải &rarr; <b>Tùy chọn triển khai mới (New deployment)</b>:
                      <ul className="list-disc pl-4 pt-1 space-y-0.5 text-slate-600">
                        <li>Chọn loại: <b>Ứng dụng web (Web app)</b>.</li>
                        <li>Người thực hiện: <b>Tôi (Me)</b>.</li>
                        <li>Ai có quyền truy cập: <b>Bất kỳ ai (Anyone)</b>.</li>
                      </ul>
                      Bấm <b>Triển khai</b> và dán đường link kết thúc bằng <code>/exec</code> vào ô số 2 ở trên!
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Nút bấm lưu */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSyncToDrive}
                disabled={isSyncing || !hasFolder}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-40"
                title="Đẩy tất cả minh chứng giáo viên đã nộp trong Database lên Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-purple-600" : ""}`} />
                {isSyncing ? "Đang đồng bộ..." : "⚡ Đẩy ảnh đã nộp lên Drive"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-700/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Cấu Hình Drive"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
