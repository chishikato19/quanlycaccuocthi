"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  LayoutGrid,
  List,
  UploadCloud,
  Eye,
  Building2,
  Sparkles,
  Shield,
  GraduationCap,
  ArrowRight,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Check,
  Percent,
  FolderOpen
} from "lucide-react";

// Dữ liệu mẫu phong phú dành riêng cho bản Demo Phương án A
const DEMO_COMPETITIONS = [
  {
    id: "demo-01",
    title: "Cuộc thi Trực tuyến Tìm hiểu An toàn Giao thông & Văn hóa Học đường 2026",
    category: "Phổ biến Pháp luật",
    department: "Toàn trường",
    deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 giờ nữa (Gấp)
    totalAssignees: 30,
    totalSubmissions: 24,
    status: "ACTIVE",
    isUrgent: true,
    userSubmitted: true,
    userSubmitTime: "10:30 Hôm qua",
    driveUrl: "https://drive.google.com",
    assigneeSample: [
      { name: "Nguyễn Văn An", dept: "BGH", avatar: "NA" },
      { name: "Lê Hoàng Cường", dept: "Toán - Tin", avatar: "LC" },
      { name: "Phạm Thị Dung", dept: "Ngữ Văn", avatar: "PD" },
      { name: "Lý Quốc Phúc", dept: "Ngoại Ngữ", avatar: "LP" },
    ],
    description: "Giáo viên hoàn thành 30 câu hỏi trắc nghiệm trên cổng giao dục, chụp ảnh chứng nhận đạt loại Giỏi trở lên để nộp báo cáo."
  },
  {
    id: "demo-02",
    title: "Hội thi Sáng tạo Thiết bị Dạy học Số & Ứng dụng AI trong Giảng dạy",
    category: "Chuyên môn - Công nghệ",
    department: "Toán - Tin, KHTN",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignees: 14,
    totalSubmissions: 11,
    status: "ACTIVE",
    isUrgent: false,
    userSubmitted: false,
    driveUrl: "https://drive.google.com",
    assigneeSample: [
      { name: "Vũ Đức Em", dept: "Toán - Tin", avatar: "VE" },
      { name: "Cao Thị Vân", dept: "KHTN", avatar: "CV" },
      { name: "Đỗ Thị Giang", dept: "Toán - Tin", avatar: "DG" },
    ],
    description: "Nộp đường link video demo sản phẩm dạy học số hoặc bài giảng tương tác e-Learning kèm tệp thuyết minh tóm tắt."
  },
  {
    id: "demo-03",
    title: "Cuộc thi Viết 'Thầy cô trong mắt em' & Kỷ niệm Ngày Nhà giáo Việt Nam",
    category: "Phong trào - Công đoàn",
    department: "Ngữ Văn, KHXH",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignees: 10,
    totalSubmissions: 4,
    status: "ACTIVE",
    isUrgent: false,
    userSubmitted: false,
    driveUrl: "https://drive.google.com",
    assigneeSample: [
      { name: "Hoàng Thị Lan", dept: "Ngữ Văn", avatar: "HL" },
      { name: "Trịnh Minh Long", dept: "Ngữ Văn", avatar: "TL" },
    ],
    description: "Khuyến khích giáo viên hướng dẫn học sinh và tự sáng tác các bài tản văn, phóng sự ngắn hoặc thơ ca truyền thống."
  },
  {
    id: "demo-04",
    title: "Tập huấn & Đánh giá Năng lực Số Cán bộ Quản lý & Giáo viên Cốt cán",
    category: "Đào tạo Bồi dưỡng",
    department: "Toàn trường",
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignees: 30,
    totalSubmissions: 30,
    status: "COMPLETED",
    isUrgent: false,
    userSubmitted: true,
    userSubmitTime: "3 ngày trước",
    driveUrl: "https://drive.google.com",
    assigneeSample: [
      { name: "Thầy An", dept: "BGH", avatar: "TA" },
      { name: "Cô Bích", dept: "BGH", avatar: "CB" },
      { name: "Thầy Cường", dept: "Toán", avatar: "TC" },
    ],
    description: "100% cán bộ giáo viên đã hoàn thành và nhận chứng chỉ bồi dưỡng của Sở GD&ĐT."
  },
  {
    id: "demo-05",
    title: "Khảo sát Đổi mới Phương pháp Kiểm tra Đánh giá theo Chương trình GDPT 2018",
    category: "Chuyên đề Khảo sát",
    department: "Tổ Văn Phòng, KHXH",
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    totalAssignees: 8,
    totalSubmissions: 8,
    status: "CLOSED",
    isUrgent: false,
    userSubmitted: true,
    userSubmitTime: "Tuần trước",
    driveUrl: "https://drive.google.com",
    assigneeSample: [
      { name: "Lâm Văn Tài", dept: "Văn thư", avatar: "LT" },
      { name: "Đinh Thị Loan", dept: "Kế toán", avatar: "DL" },
    ],
    description: "Đã tổng hợp số liệu và đóng tiếp nhận hồ sơ khảo sát."
  }
];

export default function DemoPage() {
  // State điều khiển Demo
  const [role, setRole] = useState<"ADMIN" | "TEACHER">("ADMIN");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [previewComp, setPreviewComp] = useState<typeof DEMO_COMPETITIONS[0] | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Tính toán số liệu thống kê thời gian thực cho Bento KPI Bar
  const stats = useMemo(() => {
    const total = DEMO_COMPETITIONS.length;
    const active = DEMO_COMPETITIONS.filter(c => c.status === "ACTIVE").length;
    const urgent = DEMO_COMPETITIONS.filter(c => c.isUrgent).length;
    const totalAssigned = DEMO_COMPETITIONS.reduce((acc, c) => acc + c.totalAssignees, 0);
    const totalSubmitted = DEMO_COMPETITIONS.reduce((acc, c) => acc + c.totalSubmissions, 0);
    const overallRate = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0;
    const mySubmissions = DEMO_COMPETITIONS.filter(c => c.userSubmitted).length;

    return { total, active, urgent, totalAssigned, totalSubmitted, overallRate, mySubmissions };
  }, []);

  // Bộ lọc danh sách cuộc thi
  const filteredCompetitions = useMemo(() => {
    return DEMO_COMPETITIONS.filter(c => {
      // Tìm kiếm từ khóa
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Lọc trạng thái
      let matchFilter = true;
      if (activeFilter === "ACTIVE") matchFilter = c.status === "ACTIVE";
      if (activeFilter === "URGENT") matchFilter = c.isUrgent;
      if (activeFilter === "MINE") matchFilter = c.userSubmitted;
      if (activeFilter === "COMPLETED") matchFilter = c.status === "COMPLETED";

      // Lọc tổ bộ môn
      let matchDept = true;
      if (selectedDept !== "ALL") {
        matchDept = c.department.includes(selectedDept) || c.department === "Toàn trường";
      }

      return matchSearch && matchFilter && matchDept;
    });
  }, [searchQuery, activeFilter, selectedDept]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. THANH ĐIỀU KHIỂN BẢN DEMO (Top Control Bar) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-wide uppercase text-indigo-200 bg-indigo-900/60 px-2 py-0.5 rounded-md border border-indigo-700/50">
              Bản Demo Trực Quan
            </span>
            <span className="text-slate-300 hidden md:inline">
              Phương án A: Modern Educational Dashboard (Bento Grid + Data-Dense)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Vai trò người dùng để trải nghiệm */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                  role === "ADMIN"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Xem dạng Admin / Văn thư</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("TEACHER")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                  role === "TEACHER"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Xem dạng Giáo viên</span>
              </button>
            </div>

            {/* Nút thoát về trang thực tế */}
            <Link
              href="/"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>Về trang gốc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. HEADER CHÍNH CỦA HỆ THỐNG (School Educational Header) */}
      <header className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Cổng Quản Lý Báo Cáo Cuộc Thi
                </h1>
                <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                  Năm học 2025 - 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống theo dõi tiến độ nộp minh chứng & tổng hợp báo cáo văn thư
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center">
            {role === "ADMIN" ? (
              <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="font-semibold text-indigo-900">Văn thư Trường</span>
                <span className="text-indigo-400">|</span>
                <span className="text-indigo-700">Đã kết nối Google Drive Trường</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="font-semibold text-emerald-900">Thầy Lê Hoàng Cường</span>
                <span className="text-emerald-500">Tổ Toán - Tin</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. KHỐI NỘI DUNG CHÍNH (MAIN WORKSPACE) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* === BENTO KPI STRIP (HÀNG THỐNG KÊ TỔNG QUAN ĐIỀU HÀNH) === */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Cuộc thi đang chạy */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-100 transition-colors" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang Diễn Ra</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.active}</span>
              <span className="text-xs font-semibold text-slate-400">/ {stats.total} cuộc thi</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
              <span>Tiến độ đang vận hành trơn tru</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Báo động hạn chót < 48h */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-xs hover:shadow-md transition-all relative overflow-hidden group bg-gradient-to-br from-white to-amber-50/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Gấp: Hạn Dưới 48H
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-900">{stats.urgent}</span>
              <span className="text-xs font-semibold text-amber-700">cuộc thi cần đôn đốc</span>
            </div>
            <div className="mt-3 text-xs text-amber-800 font-medium truncate">
              ⚠️ Thi ATGT & Văn hóa Học đường (còn 18h)
            </div>
          </div>

          {/* Card 3: Tỷ lệ nộp bài toàn trường */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Hoàn Thành</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{stats.overallRate}%</span>
              <span className="text-xs font-semibold text-slate-500">
                ({stats.totalSubmitted}/{stats.totalAssigned} lượt nộp)
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.overallRate}%` }}
              />
            </div>
          </div>

          {/* Card 4: Góc cá nhân của bạn / Đơn vị tích cực */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {role === "ADMIN" ? "Tổ Dẫn Đầu Tiến Độ" : "Nhiệm Vụ Của Bạn"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            {role === "ADMIN" ? (
              <div>
                <div className="text-lg font-bold text-slate-900 truncate">Tổ Toán - Tin (100%)</div>
                <p className="text-xs text-slate-500 mt-1">Đã nộp đủ 100% minh chứng các đợt thi</p>
                <div className="mt-2 text-[11px] text-purple-700 font-semibold">Tổ Ngữ Văn theo sát: 85%</div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-600">{stats.mySubmissions}</span>
                  <span className="text-xs font-semibold text-slate-500">đã nộp</span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Không có cuộc thi quá hạn
                </p>
              </div>
            )}
          </div>
        </section>

        {/* === SMART FILTER & TOOLBAR === */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Thanh Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên cuộc thi, thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tổ bộ môn & Nút Chuyển đổi View Mode */}
            <div className="flex items-center gap-2 self-end md:self-center">
              {/* Dropdown Bộ môn */}
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">🏛️ Tất cả Tổ bộ môn</option>
                  <option value="Toán - Tin">Toán - Tin</option>
                  <option value="Ngữ Văn">Ngữ Văn</option>
                  <option value="Ngoại Ngữ">Ngoại Ngữ</option>
                  <option value="KHTN">Khoa Học Tự Nhiên</option>
                  <option value="KHXH">Khoa Học Xã Hội</option>
                  <option value="Tổ Văn Phòng">Tổ Văn Phòng</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Switcher: Bento Grid ↔ Table */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "GRID"
                      ? "bg-white text-indigo-600 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Chế độ Lưới Bento"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "TABLE"
                      ? "bg-white text-indigo-600 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Chế độ Bảng Rút Gọn"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Nút Tạo Cuộc Thi Mới (Nếu là Admin) */}
              {role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => alert("Tính năng thêm cuộc thi mới trên bản Demo")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-indigo-500/25 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Phát Động Thi Mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px] shrink-0">Lọc nhanh:</span>
            {[
              { id: "ALL", label: "Tất cả cuộc thi", count: stats.total },
              { id: "ACTIVE", label: "Đang diễn ra", count: stats.active },
              { id: "URGENT", label: "Hạn < 48h", count: stats.urgent, highlight: true },
              { id: "MINE", label: "Đã nộp bài", count: stats.mySubmissions },
              { id: "COMPLETED", label: "Đã hoàn thành", count: 1 },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : tab.highlight
                    ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* === DANH SÁCH CUỘC THI: 2 CHẾ ĐỘ HIỂN THỊ === */}
        {viewMode === "GRID" ? (
          /* CHẾ ĐỘ 1: BENTO GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompetitions.map((comp) => {
              const percent = Math.round((comp.totalSubmissions / comp.totalAssignees) * 100);
              return (
                <div
                  key={comp.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:shadow-lg ${
                    comp.isUrgent
                      ? "border-amber-300 ring-2 ring-amber-100/80 hover:border-amber-400"
                      : comp.status === "COMPLETED"
                      ? "border-emerald-200 bg-emerald-50/10"
                      : "border-slate-200/90 hover:border-indigo-300"
                  }`}
                >
                  {/* Card Header & Status Badges */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        {comp.category}
                      </span>
                      {comp.isUrgent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                          <Clock className="w-3 h-3" />
                          Hạn chót 18h tới
                        </span>
                      ) : comp.status === "COMPLETED" ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          100% Hoàn thành
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Đang diễn ra
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>

                  {/* Card Middle: Thông tin đối tượng & Tiến độ nộp bài */}
                  <div className="px-5 py-3 bg-slate-50/60 border-y border-slate-100 space-y-3">
                    {/* Đối tượng phân công */}
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Đối tượng:
                      </span>
                      <span className="font-semibold text-slate-800">{comp.department}</span>
                    </div>

                    {/* Tiến độ nộp bài kiểu Bento hiện đại */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">Tiến độ nộp minh chứng</span>
                        <span className="font-extrabold text-indigo-700">
                          {comp.totalSubmissions}/{comp.totalAssignees} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden p-0.5 flex items-center">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent === 100
                              ? "bg-emerald-500"
                              : comp.isUrgent
                              ? "bg-gradient-to-r from-amber-500 to-rose-500"
                              : "bg-gradient-to-r from-indigo-500 to-sky-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Avatar Stack giáo viên đã nộp gần nhất */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center -space-x-1.5">
                        {comp.assigneeSample.map((a, i) => (
                          <div
                            key={i}
                            title={`${a.name} (${a.dept})`}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white shadow-2xs"
                          >
                            {a.avatar}
                          </div>
                        ))}
                        {comp.totalSubmissions > comp.assigneeSample.length && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
                            +{comp.totalSubmissions - comp.assigneeSample.length}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {comp.userSubmitted ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Bạn đã nộp
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium">Bạn chưa nộp</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Action buttons linh hoạt */}
                  <div className="p-4 bg-white flex items-center justify-between gap-2">
                    {/* Nút Xem Chi Tiết Báo Cáo */}
                    <button
                      type="button"
                      onClick={() => setPreviewComp(comp)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Báo Cáo</span>
                    </button>

                    {/* Nút Nộp Minh Chứng (Dành cho Giáo viên) hoặc Mở Drive (Admin) */}
                    {role === "TEACHER" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewComp(comp);
                          setIsSubmitModalOpen(true);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          comp.userSubmitted
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{comp.userSubmitted ? "Nộp Lại / Sửa" : "Nộp Minh Chứng"}</span>
                      </button>
                    ) : (
                      <a
                        href={comp.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        title="Mở thư mục lưu trữ Google Drive"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CHẾ ĐỘ 2: COMPACT TABLE VIEW (TỐI ƯU CHO VĂN THƯ & QUẢN TRỊ VIÊN) */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tên Cuộc Thi & Chuyên Mục</th>
                    <th className="py-3 px-4">Đối Tượng</th>
                    <th className="py-3 px-4">Hạn Nộp</th>
                    <th className="py-3 px-4">Tiến Độ Toàn Trường</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác Nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredCompetitions.map((comp) => {
                    const percent = Math.round((comp.totalSubmissions / comp.totalAssignees) * 100);
                    return (
                      <tr key={comp.id} className="hover:bg-indigo-50/40 transition-colors group">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                              {comp.category}
                            </span>
                          </div>
                          <div className="mt-1 font-bold group-hover:text-indigo-600 transition-colors">
                            {comp.title}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {comp.department}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {comp.isUrgent ? (
                            <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" /> Còn 18 giờ
                            </span>
                          ) : (
                            <span className="text-slate-500">4 ngày nữa</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 min-w-[160px]">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span>{comp.totalSubmissions}/{comp.totalAssignees}</span>
                            <span className="text-indigo-600">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {comp.userSubmitted ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                              Đã nộp bài
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                              Chưa nộp
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewComp(comp)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                            >
                              Xem Báo Cáo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewComp(comp);
                                setIsSubmitModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                            >
                              Nộp Bài
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* 4. MODAL XEM NHANH THÔNG TIN CHI TIẾT (QUICK PREVIEW MODAL) */}
      {previewComp && !isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setPreviewComp(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {previewComp.category}
              </span>
              <span className="text-xs text-slate-500">Chi tiết cuộc thi</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {previewComp.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {previewComp.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-slate-500 block mb-0.5">Tiến độ nộp:</span>
                <span className="text-base font-extrabold text-indigo-700">
                  {previewComp.totalSubmissions}/{previewComp.totalAssignees} giáo viên
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Trạng thái của bạn:</span>
                <span className={`text-sm font-bold ${previewComp.userSubmitted ? "text-emerald-600" : "text-amber-700"}`}>
                  {previewComp.userSubmitted ? "✅ Đã nộp thành công" : "⏳ Chưa nộp bài"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewComp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                Mở Màn Hình Nộp Bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL MÔ PHỎNG NỘP MINH CHỨNG (UPLOAD PROOF PREVIEW) */}
      {isSubmitModalOpen && previewComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Nộp Minh Chứng Cuộc Thi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Đang nộp cho: <strong className="text-slate-800">{previewComp.title}</strong>
            </div>

            {/* Vùng kéo thả tệp ảnh minh chứng */}
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all">
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-700">Kéo thả ảnh chụp kết quả hoặc bấm để chọn tệp</p>
              <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ JPG, PNG (Tự động nén ảnh & đồng bộ Drive)</p>
            </div>

            {/* Ô ghi chú */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú kèm theo (tùy chọn):</label>
              <textarea
                rows={2}
                placeholder="Nhập số điểm đạt được hoặc lưu ý nếu có..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Đã gửi minh chứng thành công trên bản Demo!");
                  setIsSubmitModalOpen(false);
                  setPreviewComp(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                Xác Nhận Nộp Minh Chứng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BANNER GỢI Ý THỬ NGHIỆM DƯỚI CHÂN TRANG */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center border-t border-slate-200 mt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs text-slate-500 shadow-2xs">
          <span>💡 Bạn đang ở chế độ xem thử nghiệm giao diện Phương án A.</span>
          <Link href="/" className="font-bold text-indigo-600 hover:underline">
            Quay lại trang chính
          </Link>
        </div>
      </footer>
    </div>
  );
}
