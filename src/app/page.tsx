"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CompetitionDto, TeacherDto } from "@/types";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  Trophy,
  Users,
  Plus,
  KeyRound,
  LogOut,
  UserCheck,
  Shield,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  RefreshCw,
  FolderSync,
  Search,
  Filter
} from "lucide-react";

// Modals & Components
import { LoginModal } from "@/features/auth/components/LoginModal";
import { ChangePinModal } from "@/features/auth/components/ChangePinModal";
import { DriveConfigModal } from "@/features/auth/components/DriveConfigModal";
import { CompetitionCard } from "@/features/competitions/components/CompetitionCard";
import { CompetitionFormModal } from "@/features/competitions/components/CompetitionFormModal";
import { TaskActionModal } from "@/features/competitions/components/TaskActionModal";
import { UploadProofModal } from "@/features/submissions/components/UploadProofModal";
import { TeacherTable } from "@/features/teachers/components/TeacherTable";
import { TeacherFormModal } from "@/features/teachers/components/TeacherFormModal";
import { ExcelPasteModal } from "@/features/teachers/components/ExcelPasteModal";
import { ResetPinModal } from "@/features/teachers/components/ResetPinModal";
import { ReportDetailView } from "@/features/reports/components/ReportDetailView";

export default function HomePage() {
  const { currentUser, logout, isAdmin, isSuperAdmin, isLoading: isAuthLoading } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"COMPETITIONS" | "TEACHERS">("COMPETITIONS");
  const [competitionSubFilter, setCompetitionSubFilter] = useState<"ALL" | "ACTIVE" | "OVERDUE" | "DONE">("ALL");

  // Data State
  const [competitions, setCompetitions] = useState<CompetitionDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Selected for Report View
  const [viewingReportCompId, setViewingReportCompId] = useState<string | null>(null);

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false);

  // Competition modals
  const [selectedCompForSubmit, setSelectedCompForSubmit] = useState<CompetitionDto | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const [selectedCompForEdit, setSelectedCompForEdit] = useState<CompetitionDto | null>(null);
  const [isCompFormOpen, setIsCompFormOpen] = useState(false);

  const [selectedCompForAction, setSelectedCompForAction] = useState<CompetitionDto | null>(null);
  const [actionModalMode, setActionModalMode] = useState<"EXTEND" | "CLOSE" | null>(null);

  // Teacher modals
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<TeacherDto | null>(null);
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isExcelPasteOpen, setIsExcelPasteOpen] = useState(false);
  const [selectedTeacherForResetPin, setSelectedTeacherForResetPin] = useState<TeacherDto | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 0. Kiểm tra trạng thái cơ sở dữ liệu
      fetch("/api/status")
        .then((r) => r.json())
        .then((s) => {
          if (!s.isDatabaseConfigured) {
            setIsDemoMode(true);
          }
        })
        .catch(() => {});

      // 1. Tải danh sách cuộc thi
      const compUrl = currentUser
        ? `/api/competitions?teacherId=${currentUser.id}&role=${currentUser.role}`
        : "/api/competitions";
      const compRes = await fetch(compUrl);
      const compJson = await compRes.json();
      if (compJson.success) {
        setCompetitions(compJson.data);
      }

      // 2. Tải danh sách giáo viên trường
      const teacherRes = await fetch("/api/teachers");
      const teacherJson = await teacherRes.json();
      if (teacherJson.success) {
        setTeachers(teacherJson.data);
      }
    } catch (err) {
      console.error("Load data error:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tự động mở LoginModal nếu chưa đăng nhập và đã load xong
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setIsLoginModalOpen(true);
    }
  }, [isAuthLoading, currentUser]);

  // Handlers for competitions
  const handleDeleteCompetition = async (comp: CompetitionDto) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cuộc thi "${comp.title}"?`)) return;
    try {
      const res = await fetch(`/api/competitions/${comp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        loadData();
      } else {
        alert(data.error || "Không thể xóa cuộc thi");
      }
    } catch {
      alert("Lỗi máy chủ");
    }
  };

  // Handlers for teachers
  const handleDeleteTeacher = async (teacher: TeacherDto) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giáo viên "${teacher.name}"?`)) return;
    try {
      const res = await fetch(`/api/teachers?id=${teacher.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        loadData();
      } else {
        alert(data.error || "Không thể xóa giáo viên");
      }
    } catch {
      alert("Lỗi máy chủ");
    }
  };

  const handleTeacherRoleChange = () => {
    loadData();
  };

  // Filtered competitions
  const filteredCompetitions = competitions.filter(comp => {
    const isOverdue = new Date() > new Date(comp.deadline);
    const hasSubmitted = !!comp.userSubmission;

    if (competitionSubFilter === "ACTIVE") {
      return !isOverdue && comp.status === "ACTIVE";
    }
    if (competitionSubFilter === "OVERDUE") {
      return isOverdue && comp.status === "ACTIVE";
    }
    if (competitionSubFilter === "DONE") {
      return hasSubmitted;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & School Title */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <h1 className="text-xs sm:text-base font-bold text-slate-900 leading-tight truncate">
                Quản Lý Cuộc Thi
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block truncate">
                Báo cáo & Minh chứng giáo viên
              </p>
            </div>
          </div>

          {/* User Account / Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs font-bold text-slate-800 max-w-[100px] sm:max-w-none truncate">
                      {currentUser.name}
                    </span>
                    {isSuperAdmin ? (
                      <span className="text-[9px] sm:text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        Tổng Admin
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">{currentUser.department}</div>
                </div>

                {/* Cấu hình Google Drive Nhà Trường / Admin */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsDriveConfigOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors shadow-sm"
                    title={isSuperAdmin ? "Cấu hình Google Drive Nhà Trường" : "Cấu hình Google Drive cá nhân"}
                  >
                    <FolderSync className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="hidden sm:inline">{isSuperAdmin ? "Drive Trường" : "Drive"}</span>
                    {currentUser.driveFolderId && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đã liên kết Drive" />
                    )}
                  </button>
                )}

                {/* Đổi mã PIN */}
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(true)}
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Đổi mã PIN cá nhân"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                {/* Đổi người / Đăng xuất */}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsLoginModalOpen(true);
                  }}
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Đổi người dùng / Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Banner thông báo chế độ Xem trước nếu chưa kết nối Database */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 max-w-4xl">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span>
              <strong>Chế độ Xem trước (Demo Mode):</strong> Dữ liệu đang hiển thị từ bộ nhớ mẫu do chưa kết nối PostgreSQL. Để lưu trữ vĩnh viễn trên Vercel: Vào Vercel Dashboard ➔ tab <strong>Storage</strong> ➔ bấm <strong>Create Database</strong> (chọn Neon Postgres).
            </span>
          </div>
          <span className="shrink-0 bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-semibold hidden sm:inline-block">
            Tự động đồng bộ
          </span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {viewingReportCompId ? (
          <ReportDetailView
            competitionId={viewingReportCompId}
            onBack={() => setViewingReportCompId(null)}
          />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Thanh điều hướng Tab chính */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("COMPETITIONS")}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                    activeTab === "COMPETITIONS"
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Danh Sách Cuộc Thi</span>
                  <span
                    className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full ${
                      activeTab === "COMPETITIONS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {competitions.length}
                  </span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("TEACHERS")}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                      activeTab === "TEACHERS"
                        ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Danh Sách Giáo Viên ({teachers.length})</span>
                  </button>
                )}
              </div>

              {/* Nút Tạo Việc Mới (Dành cho Admin / Super Admin) */}
              {isAdmin && activeTab === "COMPETITIONS" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompForEdit(null);
                    setIsCompFormOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Cuộc Thi Mới</span>
                </button>
              )}
            </div>

            {/* TAB 1: DANH SÁCH CUỘC THI */}
            {activeTab === "COMPETITIONS" && (
              <div className="space-y-4">
                {/* Bộ lọc phụ */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { key: "ALL", label: `Tất cả (${competitions.length})` },
                      { key: "ACTIVE", label: "Đang diễn ra" },
                      { key: "OVERDUE", label: "Quá hạn" },
                      { key: "DONE", label: "Đã nộp bài" },
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setCompetitionSubFilter(f.key as typeof competitionSubFilter)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          competitionSubFilter === f.key
                            ? "bg-slate-800 text-white"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={loadData}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs ml-auto"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Làm mới</span>
                  </button>
                </div>

                {/* Danh sách thẻ cuộc thi */}
                {isLoadingData ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    Đang tải danh sách cuộc thi...
                  </div>
                ) : filteredCompetitions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium">Chưa có cuộc thi nào trong mục này</p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompForEdit(null);
                          setIsCompFormOpen(true);
                        }}
                        className="text-xs text-sky-600 hover:underline font-semibold"
                      >
                        + Bấm vào đây để tạo cuộc thi đầu tiên
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredCompetitions.map(comp => (
                      <CompetitionCard
                        key={comp.id}
                        competition={comp}
                        onOpenSubmit={c => {
                          setSelectedCompForSubmit(c);
                          setIsSubmitModalOpen(true);
                        }}
                        onOpenReport={c => setViewingReportCompId(c.id)}
                        onEdit={c => {
                          setSelectedCompForEdit(c);
                          setIsCompFormOpen(true);
                        }}
                        onExtend={c => {
                          setSelectedCompForAction(c);
                          setActionModalMode("EXTEND");
                        }}
                        onCloseEarly={c => {
                          setSelectedCompForAction(c);
                          setActionModalMode("CLOSE");
                        }}
                        onDelete={handleDeleteCompetition}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUẢN LÝ GIÁO VIÊN */}
            {activeTab === "TEACHERS" && isAdmin && (
              <TeacherTable
                teachers={teachers}
                onRefresh={loadData}
                onOpenAdd={() => {
                  setSelectedTeacherForEdit(null);
                  setIsTeacherFormOpen(true);
                }}
                onOpenEdit={t => {
                  setSelectedTeacherForEdit(t);
                  setIsTeacherFormOpen(true);
                }}
                onOpenResetPin={t => setSelectedTeacherForResetPin(t)}
                onOpenExcelPaste={() => setIsExcelPasteOpen(true)}
                onDelete={handleDeleteTeacher}
                onRoleChange={handleTeacherRoleChange}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 mt-auto">
        Hệ Thống Báo Cáo Cuộc Thi &bull; Tự động lưu Google Drive &bull; Phiên bản 1.7.0
      </footer>

      {/* MODALS */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          loadData();
        }}
      />

      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      <DriveConfigModal
        isOpen={isDriveConfigOpen}
        onClose={() => setIsDriveConfigOpen(false)}
        onSuccess={loadData}
      />

      <UploadProofModal
        competition={selectedCompForSubmit}
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedCompForSubmit(null);
        }}
        onSuccess={loadData}
      />

      <CompetitionFormModal
        competition={selectedCompForEdit}
        teachers={teachers}
        isOpen={isCompFormOpen}
        onClose={() => {
          setIsCompFormOpen(false);
          setSelectedCompForEdit(null);
        }}
        onSuccess={loadData}
      />

      <TaskActionModal
        competition={selectedCompForAction}
        mode={actionModalMode}
        isOpen={!!actionModalMode}
        onClose={() => {
          setActionModalMode(null);
          setSelectedCompForAction(null);
        }}
        onSuccess={loadData}
      />

      <TeacherFormModal
        teacher={selectedTeacherForEdit}
        isOpen={isTeacherFormOpen}
        onClose={() => {
          setIsTeacherFormOpen(false);
          setSelectedTeacherForEdit(null);
        }}
        onSuccess={loadData}
      />

      <ExcelPasteModal
        isOpen={isExcelPasteOpen}
        onClose={() => setIsExcelPasteOpen(false)}
        onSuccess={loadData}
      />

      <ResetPinModal
        teacher={selectedTeacherForResetPin}
        isOpen={!!selectedTeacherForResetPin}
        onClose={() => setSelectedTeacherForResetPin(null)}
        onSuccess={loadData}
      />
    </div>
  );
}
