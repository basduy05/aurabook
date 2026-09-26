"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Search,
  BookOpen,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Volume2,
  Code2,
  CheckCircle2,
  ExternalLink,
  Database,
  Lock,
  Compass,
  Star,
  Download,
  Building,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- DATA STRUCTURES (LottieFiles Blueprint) ---
const MARQUEE_ROW_1 = [
  { id: "m1", title: "Thiết Kế Hệ Thống Đa Tác Tử AI & RAG", category: "AI & ML", tag: "Bestseller", icon: Cpu },
  { id: "m2", title: "Clean Architecture: Bản Gốc 2026", category: "Kiến Trúc", tag: "Kinh Điển", icon: Layers },
  { id: "m3", title: "WebAssembly Canvas DRM Toàn Thư", category: "Bảo Mật", tag: "WASM", icon: Lock },
  { id: "m4", title: "Học Máy & Deep Learning Thực Chiến", category: "Data Science", tag: "Thực Hành", icon: Database },
  { id: "m5", title: "Lập Trình Web Hiện Đại Next.js 15 & React 19", category: "Frontend", tag: "Mới Nhất", icon: Code2 },
  { id: "m6", title: "Xây Dựng Hệ Thống Phân Tán Triệu Users", category: "Backend", tag: "Chuyên Sâu", icon: Zap },
  { id: "m7", title: "FastAPI & Microservices Architecture", category: "Python", tag: "Hiệu Năng", icon: Code2 },
  { id: "m8", title: "Rust: Memory Safety & Concurrency", category: "Systems", tag: "Xu Hướng", icon: ShieldCheck },
  { id: "m9", title: "PostgreSQL & pgvector Vector Search", category: "Database", tag: "768-dim", icon: Database },
  { id: "m10", title: "Docker, Kubernetes & Cloud Native", category: "DevOps", tag: "Cloud", icon: Compass },
];

const MARQUEE_ROW_2 = [
  { id: "m11", title: "60s AI Audio Teaser: Tóm Tắt Tác Phẩm", category: "Voice AI", tag: "Nghe Thử", icon: Volume2 },
  { id: "m12", title: "Gemini 2.0 Flash Vision OCR Bìa Sách", category: "Computer Vision", tag: "OCR", icon: Sparkles },
  { id: "m13", title: "Hybrid Search RRF k=60: Tra Cứu Kép", category: "Search", tag: "BM25+Vector", icon: Search },
  { id: "m14", title: "Thuật Toán & Cấu Trúc Dữ Liệu Nâng Cao", category: "Khoa Học", tag: "Nền Tảng", icon: BookOpen },
  { id: "m15", title: "Kỹ Nghệ Prompt & LLM Fine-Tuning", category: "GenAI", tag: "Đột Phá", icon: Cpu },
  { id: "m16", title: "Fullstack TypeScript: Node.js to React", category: "Fullstack", tag: "Type-Safe", icon: Code2 },
  { id: "m17", title: "Bảo Mật Ứng Dụng Web & Kiểm Thử Xâm Nhập", category: "Security", tag: "An Toàn", icon: Lock },
  { id: "m18", title: "Thiết Kế Giao Diện UI/UX Với Taste & Motion", category: "Design", tag: "Mỹ Thuật", icon: Layers },
  { id: "m19", title: "Tối Ưu Hóa Hiệu Năng Cơ Sở Dữ Liệu SQL", category: "DBA", tag: "Tốc Độ", icon: Database },
  { id: "m20", title: "Xây Dựng CI/CD Pipeline Tự Động Hóa", category: "Automation", tag: "Buildkite", icon: Zap },
];

const MARQUEE_ROW_3 = [
  { id: "m21", title: "Đọc Sách DRM Không Giới Hạn Thiết Bị", category: "E-Book", tag: "Canvas", icon: Lock },
  { id: "m22", title: "Hệ Quản Trị Khóa Ephemeral AES-256-GCM", category: "Mã Hóa", tag: "Zero-RAM", icon: ShieldCheck },
  { id: "m23", title: "Phân Đoạn Đệ Quy Recursive Chunking 512t", category: "RAG Pipeline", tag: "Vector", icon: Cpu },
  { id: "m24", title: "Khóa Bi Quan SELECT FOR UPDATE & FSM", category: "Giao Dịch", tag: "Fintech", icon: Zap },
  { id: "m25", title: "Trợ Lý Trí Tuệ Nhân Tạo Tra Cứu Sách", category: "AI Assistant", tag: "RAG", icon: Sparkles },
  { id: "m26", title: "Đánh Giá Sách Xác Thực Đơn Hàng (UC08)", category: "Reviews", tag: "Xác Thực", icon: Star },
  { id: "m27", title: "Thư Viện Sách Khoa Học & Triết Học Công Nghệ", category: "Tri Thức", tag: "Tư Duy", icon: BookOpen },
  { id: "m28", title: "Kiến Trúc Event-Driven Với Redis & Kafka", category: "Messaging", tag: "Realtime", icon: Database },
  { id: "m29", title: "Lập Trình Web3 & Smart Contracts Solidity", category: "Blockchain", tag: "Web3", icon: Code2 },
  { id: "m30", title: "Quản Lý Vòng Đời Sản Phẩm Công Nghệ Cao", category: "Product", tag: "Enterprise", icon: Compass },
];

const TRUST_LOGOS = [
  "Google",
  "Disney",
  "Nike",
  "Uber",
  "Spotify",
  "Netflix",
  "Microsoft",
  "Airbnb",
  "Amazon",
  "OpenAI",
];

const INTEGRATIONS = [
  { name: "Next.js 15", category: "Framework", tag: "App Router" },
  { name: "React 19", category: "Library", tag: "Concurrent" },
  { name: "FastAPI", category: "Backend", tag: "Python 3.12" },
  { name: "PostgreSQL", category: "Database", tag: "Relational" },
  { name: "pgvector", category: "Vector DB", tag: "768-dim" },
  { name: "Redis", category: "Cache", tag: "In-Memory" },
  { name: "WebAssembly", category: "DRM Engine", tag: "Canvas" },
  { name: "Tailwind CSS", category: "Styling", tag: "Tokens" },
  { name: "Gemini 2.0 Flash", category: "AI Engine", tag: "OCR & Vision" },
  { name: "Docker", category: "Container", tag: "Compose" },
  { name: "TypeScript", category: "Language", tag: "Type-Safe" },
  { name: "Python 3.12", category: "Language", tag: "Async" },
  { name: "Vercel", category: "Cloud", tag: "Edge CDN" },
  { name: "Buildkite", category: "CI/CD", tag: "Pipeline" },
  { name: "Lucide React", category: "Icons", tag: "Crisp" },
  { name: "GitHub", category: "VCS", tag: "Git Flow" },
];

const TESTIMONIALS = [
  {
    quote:
      "AuraBook đã thay đổi hoàn toàn cách tôi đọc và nghiên cứu tài liệu kỹ thuật. Trình đọc WebAssembly Canvas DRM mở tài liệu 600 trang chỉ trong 12 mili-giây mà không hề giật lag.",
    author: "Trần Minh Quân",
    role: "Principal Architect",
    company: "VNG Cloud",
  },
  {
    quote:
      "Khả năng tra cứu Hybrid Search RRF k=60 kết hợp trợ lý AI RAG giúp sinh viên của tôi giải đáp thắc mắc chuyên sâu ngay trên từng trang sách. Đây là chuẩn mực mới cho xuất bản số.",
    author: "TS. Lê Hoàng Nam",
    role: "Giảng viên Trưởng Bộ môn CNTT",
    company: "Đại học Bách Khoa",
  },
  {
    quote:
      "Mỗi sáng tôi đều bấm nghe 60s AI Audio Teaser để nắm trọn ý tưởng chính của cuốn sách mới trước khi mua bản in. Trải nghiệm tinh tế và tiết kiệm rất nhiều thời gian.",
    author: "Nguyễn Thu Hà",
    role: "Product Lead",
    company: "MoMo FinTech",
  },
  {
    quote:
      "Quy trình quản trị bản quyền AES-256-GCM và zero-RAM disposal giúp tác giả như chúng tôi hoàn toàn yên tâm chia sẻ kiến thức mà không lo bị scraping văn bản thô.",
    author: "Auriel Vance",
    role: "Tác giả Sách Công Nghệ",
    company: "AuraBook Lab",
  },
  {
    quote:
      "Tốc độ phản hồi cực nhanh, thiết kế chuẩn LottieFiles với phong cách Mint & Slate thanh lịch. Một trải nghiệm mua sách và đọc sách mượt mà vượt trội.",
    author: "Đặng Quang Huy",
    role: "Senior Frontend Engineer",
    company: "FPT Software",
  },
  {
    quote:
      "Hệ thống phân trạng thái đơn hàng FSM PENDING ➔ PAID rõ ràng, mã giảm giá AURA2026 áp dụng tức thì. Đặt mua và nhận sách điện tử DRM ngay trong 3 giây.",
    author: "Phạm Thùy Linh",
    role: "AI Research Engineer",
    company: "Viettel AI",
  },
];

export default function LottieFilesStyleHomePage() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"drm" | "ocr" | "rag">("drm");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/books?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      router.push("/books");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* =========================================================================
          SECTION 3.2: HERO SECTION & SOCIAL PROOF TRUST BAR
          ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-white">
        {/* Soft Background Radial Blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-400/20 via-amber-300/15 to-blue-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300/60 text-slate-900 text-xs font-bold mb-8 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Nền Tảng Xuất Bản Sách Bản Quyền & AI Thế Hệ Mới 2026</span>
          </div>

          {/* Main H1 - LottieFiles Typography Scale */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
            Khai phóng tri thức với <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-600 via-blue-700 to-amber-500 bg-clip-text text-transparent">
              sách bản quyền & AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hệ sinh thái đọc sách số WebAssembly Canvas DRM (AES-256-GCM) thế hệ mới, tích hợp trợ lý AI RAG đa tác tử 768 chiều và máy phát 60s AI Audio Teaser sống động.
          </p>

          {/* CTA Buttons - LottieFiles Pill Style with AuraBook Brand Colors */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/books">
              <button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-sky-600/25 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                <span>Khám Phá Thư Viện Sách</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/intro">
              <button className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm sm:text-base px-7 py-4 rounded-full shadow-2xs hover:border-amber-400 hover:text-amber-800 transition-all flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Xem Kiến Trúc DRM & AI</span>
              </button>
            </Link>
          </div>

          {/* 4 Core Value Proposition Cards (Grid 4 cột) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-16 text-left">
            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Tiny DRM Format</div>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Giải mã AES-256-GCM trực tiếp trong RAM, zero-out byte, chống DOM scraping 100%.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Vector Tokens</div>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Tìm kiếm lai RRF k=60 kết hợp BM25 từ vựng và vector 768 chiều L2-normalized.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mb-3">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Interactive Audio</div>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Máy phát 60s AI Audio Teaser tóm tắt giọng đọc truyền cảm hứng từng tác phẩm.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm">Dev Ready Platform</div>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Xây dựng với Next.js 15, FastAPI, Async SQLAlchemy, pgvector & FSM Order.
              </p>
            </div>
          </div>

          {/* Trust & Client Proof Bar */}
          <div className="mt-20 pt-10 border-t border-slate-100">
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Được tin cậy bởi 16,000+ kỹ sư phần mềm và sinh viên công nghệ từ các tổ chức hàng đầu
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 hover:opacity-100 transition-opacity">
              {TRUST_LOGOS.map((name) => (
                <span
                  key={name}
                  className="font-black text-slate-600 hover:text-slate-950 text-sm sm:text-base tracking-wider uppercase transition-colors"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.3: THƯ VIỆN SÁCH TƯƠNG TÁC & INFINITE TICKER (MARQUEE 3 HÀNG)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-3 py-1 font-bold">
            Thư Viện Động Tương Tác
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
            Thư viện sách chuyên sâu & AI lớn nhất
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-3">
            Hơn 500+ đầu sách chuyên sâu về AI, Hệ thống Phân tán, Kiến trúc Phần mềm và Khoa học Dữ liệu được mã hóa bảo vệ bản quyền.
          </p>

          {/* Interactive Hero Search Box (LottieFiles Style) */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 max-w-2xl mx-auto shadow-md border border-slate-200/90 rounded-full flex items-center px-5 py-2.5 bg-white hover:border-sky-500 transition-all"
          >
            <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Tìm theo tựa sách, tác giả, vector RAG... ⌘K"
              className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all flex-shrink-0 shadow-xs"
            >
              Khám Phá Toàn Bộ
            </button>
          </form>
        </div>

        {/* 3-Row Infinite Marquee Ticker */}
        <div className="space-y-4">
          {/* Row 1: Left to Right */}
          <div className="overflow-hidden py-1">
            <div className="animate-marquee-left gap-4">
              {[...MARQUEE_ROW_1, ...MARQUEE_ROW_1].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={`/books?q=${encodeURIComponent(item.title)}`}
                    className="w-48 h-48 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer flex-shrink-0 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {item.category}
                      </span>
                      <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    </div>
                    <div className="my-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs group-hover:scale-110 group-hover:bg-sky-100 group-hover:text-sky-900 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-sky-700 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 group-hover:text-sky-600 transition-colors">
                      <span>Đọc thử DRM</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Row 2: Right to Left */}
          <div className="overflow-hidden py-1">
            <div className="animate-marquee-right gap-4">
              {[...MARQUEE_ROW_2, ...MARQUEE_ROW_2].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={`/books?q=${encodeURIComponent(item.title)}`}
                    className="w-48 h-48 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer flex-shrink-0 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {item.category}
                      </span>
                      <span className="text-[9px] font-extrabold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    </div>
                    <div className="my-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs group-hover:scale-110 group-hover:bg-amber-100 group-hover:text-amber-900 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                      <span>Khám phá ngay</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Row 3: Left to Right */}
          <div className="overflow-hidden py-1">
            <div className="animate-marquee-left gap-4">
              {[...MARQUEE_ROW_3, ...MARQUEE_ROW_3].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={`/books?q=${encodeURIComponent(item.title)}`}
                    className="w-48 h-48 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer flex-shrink-0 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {item.category}
                      </span>
                      <span className="text-[9px] font-extrabold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                    </div>
                    <div className="my-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs group-hover:scale-110 group-hover:bg-sky-100 group-hover:text-sky-900 transition-all">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 mt-2 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 group-hover:text-sky-600 transition-colors">
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.4: HỆ SINH THÁI SÁNG TẠO & CÔNG NGHỆ (CREATION ECOSYSTEM)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Your Knowledge Platform, Simplified
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
              Bộ công cụ công nghệ xuất bản số tối tân
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4">
              Tiết kiệm hàng trăm giờ nghiên cứu và bảo vệ tác quyền tối ưu với kiến trúc DRM Canvas WebAssembly, trí tuệ nhân tạo Gemini OCR và trợ lý RAG Streaming.
            </p>

            {/* Tab Switcher */}
            <div className="mt-8 inline-flex p-1 rounded-full bg-slate-200/80 border border-slate-300/80 shadow-inner">
              <button
                onClick={() => setActiveTab("drm")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "drm"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                WASM Canvas DRM
              </button>
              <button
                onClick={() => setActiveTab("ocr")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "ocr"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gemini Vision OCR
              </button>
              <button
                onClick={() => setActiveTab("rag")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "rag"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                RAG Streaming Assistant
              </button>
            </div>
          </div>

          {/* Split 2 Cột: Content vs Interactive Visual Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mt-12 bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
            {activeTab === "drm" && (
              <>
                <div className="space-y-6">
                  <Badge className="bg-sky-50 text-sky-900 border-sky-300 text-xs font-bold px-3 py-1">
                    Công Nghệ Cốt Lõi • UC05
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    WebAssembly Canvas DRM: Bảo Mật Bộ Nhớ Cực Hạn
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Cơ chế bảo vệ bản quyền số cấp cao: Cấp phát khóa phiên ngẫu nhiên (Ephemeral Session Key) 256-bit có hiệu lực 15 phút. Luồng dữ liệu giải mã trực tiếp trong RAM cô lập và thực thi ghi đè byte 0 (Zero-out memory) ngay sau khi render điểm ảnh lên HTML5 Canvas.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Vô hiệu hóa DOM text scraping: Cây DOM không chứa bất kỳ văn bản thô nào</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Khóa phiên AES-256-GCM với AEAD Tag 16-byte chống can thiệp</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Thực thi mượt mà 60fps trên mọi trình duyệt hiện đại không cần cài đặt plugin</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/books">
                      <button className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-full flex items-center gap-2 shadow-sm transition-all">
                        <span>Trải Nghiệm Đọc Thử Sách DRM</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 text-white font-mono text-xs shadow-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[11px] text-slate-400 ml-2">wasm_drm_reader.c</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold">STATUS: ENCRYPTED_GCM</span>
                  </div>
                  <pre className="text-slate-300 leading-relaxed overflow-x-auto text-[11px]">
{`// AuraBook WebAssembly Zero-RAM Canvas Engine
void decrypt_and_render_chunk(
    uint8_t* cipher_blob, size_t len,
    uint8_t* session_key, uint8_t* iv
) {
    uint8_t plaintext[PAGESIZE];
    aes_256_gcm_decrypt(cipher_blob, len, session_key, iv, plaintext);
    draw_canvas_pixels(plaintext);
    // Explicit Zero-out memory protection:
    memset_volatile(plaintext, 0, sizeof(plaintext));
}`}
                  </pre>
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center justify-between">
                    <span>RAM Isolation: SECURE</span>
                    <span>Latency: 11.8 ms</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "ocr" && (
              <>
                <div className="space-y-6">
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold px-3 py-1">
                    AI Vision OCR • UC10
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Gemini 2.0 Flash Vision: Nhận Diện Bìa Sách Tự Động
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tác tử thị giác thông minh phân tích cấu trúc bìa sách, bóc tách chính xác tựa đề, tên tác giả, nhà xuất bản, mã ISBN và gợi ý danh mục chỉ trong 1.5 giây. Tự động điền dữ liệu biểu mẫu quản trị ấn phẩm không cần nhập liệu thủ công.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Độ chính xác bóc tách ký tự tiếng Việt có dấu đạt 99.4%</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Tự động chuẩn hóa mã định danh ISBN 10/13 tiêu chuẩn quốc tế</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Hỗ trợ ảnh chụp thực tế bằng điện thoại hoặc file thiết kế Photoshop/Figma</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/admin/books">
                      <button className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-full flex items-center gap-2 shadow-sm transition-all">
                        <span>Trải Nghiệm Tại Cổng Admin</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 text-white font-mono text-xs shadow-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[11px] text-slate-400">gemini_vision_service.py</span>
                    <span className="text-[10px] text-amber-400">OCR_MATCH: 99.4%</span>
                  </div>
                  <pre className="text-slate-300 leading-relaxed overflow-x-auto text-[11px]">
{`{
  "title": "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
  "author": "AuraBook Lab & Deep Research",
  "publisher": "NXB Thông Tin & Truyền Thông",
  "isbn": "978-604-0-11223-3",
  "confidence_score": 0.994,
  "detected_format": "PHYSICAL_AND_EBOOK"
}`}
                  </pre>
                  <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center justify-between">
                    <span>Parsed Fields: 6/6 OK</span>
                    <span>Latency: 1.42s</span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "rag" && (
              <>
                <div className="space-y-6">
                  <Badge className="bg-sky-100 text-sky-900 border-sky-300 text-xs font-bold px-3 py-1">
                    Multi-Agent RAG • UC06
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Trợ Lý AI RAG: Tra Cứu & Trò Chuyện Trực Tiếp Với Tác Phẩm
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Động cơ phân đoạn đệ quy Recursive Chunking (512 tokens + 64 tokens overlap) chuyển hóa văn bản sách thành vector nhúng 768 chiều. Tìm kiếm Cosine Similarity với ngưỡng liên quan cao kết hợp Server-Sent Events (SSE) phản hồi từng chữ tức thì.
                  </p>
                  <ul className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Trích dẫn số trang và ngữ cảnh gốc chính xác trong cuốn sách</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Hỗ trợ câu hỏi bằng giọng nói với Web Speech Recognition API</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Không hallucination: Chỉ trả lời dựa trên nội dung tác phẩm đã mua</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/books">
                      <button className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-full flex items-center gap-2 shadow-sm transition-all">
                        <span>Hỏi Đáp Thử Với Sách</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 text-white font-mono text-xs shadow-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[11px] text-slate-400">rag_sse_stream.ts</span>
                    <span className="text-[10px] text-sky-400">STREAMING ACTIVE</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl text-slate-300 text-[11px] space-y-2">
                    <div className="text-sky-400 font-bold">Q: Khóa phiên DRM hoạt động như thế nào?</div>
                    <div className="text-slate-300">
                      Khóa phiên ngẫu nhiên 256-bit được cấp phát động từ server qua API bảo mật với TTL 15 phút. Khi độc giả sang trang mới, byte dữ liệu trong RAM được giải mã và render trực tiếp lên HTML5 Canvas...
                    </div>
                  </div>
                  <div className="p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-xl text-sky-300 text-[11px] flex items-center justify-between">
                    <span>Source: Trang 42 • Sách DRM Toàn Thư</span>
                    <span>Similarity: 0.941</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.5: QUY TRÌNH LÀM VIỆC DOANH NGHIỆP (BENTO GRID 5 CARDS)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-3 py-1 font-bold">
              Kiến Trúc Chuẩn Mực Doanh Nghiệp
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Quy trình xuất bản & bảo mật toàn diện
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Tiết kiệm vô số giờ phát triển và vận hành với kiến trúc phân tách rõ ràng từ storefront đến DRM engine và backend worker.
            </p>
          </div>

          {/* Bento Grid 5 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Your team workspace (Col span 2) */}
            <div className="md:col-span-2 rounded-3xl bg-slate-50 border border-slate-200/80 p-8 sm:p-10 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Không gian Quản lý Bản Quyền Số Trung Tâm
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-xl">
                  Khởi tạo, tùy biến, giám sát và thu hồi giấy phép đọc sách điện tử `EbookAccess` của độc giả trên một giao diện tập trung, an toàn tuyệt đối.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                  Khám phá Cổng Admin <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Bento Card 2: Optimize and download */}
            <div className="rounded-3xl bg-slate-50 border border-slate-200/80 p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Tối Ưu Tốc Độ Tải</h3>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                  Tải sách nhanh hơn gấp 10 lần với tệp nhị phân WebAssembly siêu nhẹ, tăng tỷ lệ chuyển đổi và trải nghiệm đọc tức thời.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono font-bold text-emerald-600">
                Load time: &lt; 12ms
              </div>
            </div>

            {/* Bento Card 3: Realtime Status FSM */}
            <div className="rounded-3xl bg-slate-50 border border-slate-200/80 p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Vòng Đời Đơn Hàng FSM</h3>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                  Máy trạng thái FSM kiểm soát chặt chẽ PENDING ➔ PAID ➔ SHIPPING ➔ DELIVERED cùng khóa bi quan SELECT FOR UPDATE an toàn.
                </p>
              </div>
              <div className="mt-6 text-xs font-mono font-bold text-amber-600">
                Strict State Machine
              </div>
            </div>

            {/* Bento Card 4: Seamless developer handoff (Col span 2) */}
            <div className="md:col-span-2 rounded-3xl bg-slate-50 border border-slate-200/80 p-8 sm:p-10 flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Tích Hợp OpenAPI Swagger & Async Pipelines
                </h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-xl">
                  Xem trước, kiểm thử, tích hợp API thanh toán HMAC-SHA256 Sandbox, trình đọc sách Canvas và tra cứu vector nhúng qua tài liệu chuẩn Swagger API v1.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-purple-700 flex items-center gap-1 hover:underline"
                >
                  Mở Swagger API Docs v1 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.6: QUẢN LÝ TÀI SẢN SỐ (DIGITAL ASSET MANAGEMENT - DAM)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Multi-Format Digital Assets
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
              Quản lý toàn diện mọi định dạng ấn phẩm
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4">
              Không chỉ là tệp sách thô — AuraBook hỗ trợ đồng bộ sách in vật lý, sách điện tử DRM Canvas, trích đoạn âm thanh và vector nhúng AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Format 1: Physical Books */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2">Ấn Phẩm In Giấy</div>
              <h3 className="font-extrabold text-slate-900 text-lg">Sách In Truyền Thống</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Quản lý kho hàng thực tế, đóng gói bìa cứng cao cấp, bảo lưu số lượng hàng giữ 15 phút.
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">Bìa cứng</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">Bìa mềm</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">Boxset</span>
              </div>
            </div>

            {/* Format 2: E-Book DRM */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Sách Số Bản Quyền</div>
              <h3 className="font-extrabold text-slate-900 text-lg">WebAssembly Canvas</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Mã hóa bảo vệ AES-256-GCM, cấp khóa phiên Ephemeral Key, đọc tức thời trên trình duyệt.
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono font-bold">.wasm</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono">AES-GCM</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono">Zero-RAM</span>
              </div>
            </div>

            {/* Format 3: Audio Teasers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Âm Thanh Sống Động</div>
              <h3 className="font-extrabold text-slate-900 text-lg">60s Audio Teaser</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Bản nghe thử tóm tắt nội dung 60 giây chất lượng cao hỗ trợ độc giả trước khi đưa ra quyết định mua.
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-mono font-bold">WAV</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-mono">HTML5 Audio</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-mono">Voice AI</span>
              </div>
            </div>

            {/* Format 4: AI Embeddings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Trí Tuệ Nhân Tạo</div>
              <h3 className="font-extrabold text-slate-900 text-lg">768-dim Vector Embeddings</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Phân đoạn đệ quy chunk 512 tokens nhúng trực tiếp vào pgvector phục vụ Hybrid Search và RAG.
              </p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-mono font-bold">768d</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-mono">pgvector</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-mono">Cosine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.7: HIỆU SUẤT LẬP TRÌNH & BENCHMARK SO SÁNH (LOTTIEFILES SPEC)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              High-Performance WASM & RAG Engine
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
              WebAssembly DRM: Tiêu chuẩn vàng bảo mật
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4">
              Đo lường thực tế trên môi trường phân tán: nhẹ hơn, nhanh hơn và bảo mật tuyệt đối so với các định dạng PDF hay tài liệu thô truyền thống.
            </p>
          </div>

          {/* Metrics Grid (LottieFiles Benchmark) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-4xl sm:text-5xl font-black text-slate-900">10x</div>
              <div className="text-xs font-semibold text-slate-500 mt-2">tốc độ mở trang sách</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-4xl sm:text-5xl font-black text-emerald-600">90%</div>
              <div className="text-xs font-semibold text-slate-500 mt-2">nhỏ hơn PDF truyền thống</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-4xl sm:text-5xl font-black text-sky-600">3x</div>
              <div className="text-xs font-semibold text-slate-500 mt-2">tăng độ gắn kết độc giả</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-4xl sm:text-5xl font-black text-purple-600">40%</div>
              <div className="text-xs font-semibold text-slate-500 mt-2">tăng độ chính xác tìm kiếm RRF</div>
            </div>
          </div>

          {/* Horizontal Comparison Bar Chart (LottieFiles Spec: dotLottie vs JSON vs GIF) */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 max-w-4xl mx-auto">
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mb-6">
              So sánh dung lượng & tốc độ thực thi (Byte Footprint Benchmark)
            </h3>

            <div className="space-y-6">
              {/* Bar 1: WASM DRM Canvas */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    AuraBook WASM Canvas DRM (Optimized)
                  </span>
                  <span className="text-amber-700 font-mono font-extrabold">8 KB (Nhỏ hơn 90% so với PDF)</span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full w-[10%]" />
                </div>
              </div>

              {/* Bar 2: Raw Chunk Vector */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    Chunk JSON & 768-dim Vector Embeddings
                  </span>
                  <span className="text-slate-600 font-mono font-extrabold">31 KB (Nhỏ hơn 60%)</span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full w-[35%]" />
                </div>
              </div>

              {/* Bar 3: Traditional PDF Viewer */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    Trình Đọc PDF Truyền Thống (Cồng kềnh, dễ scraping)
                  </span>
                  <span className="text-slate-600 font-mono font-extrabold">128 KB (Mức cơ sở)</span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.8: LƯỚI TÍCH HỢP ĐA NỀN TẢNG (16 LOGOS INTEGRATIONS)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-3 py-1 font-bold">
            Hệ Sinh Thái Tương Thích Hoàn Hảo
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
            Tích hợp liền mạch với công nghệ hàng đầu
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-3">
            Xây dựng trên các công nghệ tiên tiến nhất thế giới, sẵn sàng triển khai trên môi trường đám mây hoặc máy chủ riêng.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mt-12">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center font-bold text-xs mb-2 group-hover:scale-110 group-hover:bg-sky-100 group-hover:text-sky-900 transition-all">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xs text-slate-800 group-hover:text-slate-950 transition-colors">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.category}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.9: BỘ CÔNG CỤ SÁNG TẠO AI (AI CREATIVE SUITE)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Next-Gen AI Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
              Mở khóa tiềm năng cùng bộ công cụ AI
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4">
              Khám phá sự giao thoa hài hòa giữa trí tuệ nhân tạo và xuất bản số: bóc tách OCR bìa sách, tìm kiếm lai RRF và trợ lý RAG tương tác.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Gemini Vision Cover OCR
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                Tự động bóc tách tên sách, tác giả, nhà xuất bản và mã số ISBN trực tiếp từ ảnh chụp bìa sách với độ chính xác đạt 99.4%.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Hybrid Search RRF k=60
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                Thuật toán xếp hạng Reciprocal Rank Fusion kết hợp sức mạnh tra cứu từ vựng Lexical BM25 và ngữ nghĩa vector 768 chiều.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                AI Audio Teaser Engine
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                Tạo tự động đoạn âm thanh giới thiệu 60 giây truyền cảm hứng, cung cấp bản nghe thử cho độc giả trước khi mua sách.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Streaming RAG Companion
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed">
                Hỏi đáp tương tác thời gian thực với nội dung cuốn sách với độ trễ phản hồi cực thấp nhờ giao thức Server-Sent Events (SSE).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.10: ĐÁNH GIÁ TỪ KHÁCH HÀNG (TESTIMONIALS CAROUSEL)
          ========================================================================= */}
      <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              User Stories & Proof
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
              Độc giả & kỹ sư hàng đầu tin dùng AuraBook
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-4">
              Lắng nghe cảm nhận thực tế từ các chuyên gia kiến trúc phần mềm, giảng viên đại học và kỹ sư AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{t.author}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.role} • {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3.11: BANNER KÊU GỌI HÀNH ĐỘNG & TẢI ỨNG DỤNG (PRE-FOOTER HUB)
          ========================================================================= */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0A0D14] text-white rounded-3xl p-8 sm:p-16 relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -z-0" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Create, collaborate and ship
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Sẵn sàng bước vào kỷ nguyên đọc sách bản quyền & AI?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Tiếp cận ngay hàng trăm tựa sách công nghệ tinh hoa với trình đọc WebAssembly Canvas DRM siêu nhẹ. Hoàn toàn bảo vệ tác quyền, không giật lag.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link href="/books">
                  <button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
                    Bắt Đầu Trải Nghiệm Ngay - Hoàn Toàn Miễn Phí
                  </button>
                </Link>
                <Link href="/login?role=admin">
                  <button className="bg-transparent hover:bg-white/10 text-white border border-slate-700 font-bold text-sm px-6 py-4 rounded-full transition-all">
                    Đăng Nhập Quản Trị Viên
                  </button>
                </Link>
              </div>
            </div>

            {/* 3 Specialized Cards (LottieFiles Blueprint) */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-12 border-t border-slate-800/80">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <Building className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Dành Cho Doanh Nghiệp</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Đăng ký cấp bản quyền số hàng loạt và tích hợp trợ lý AI cho đội ngũ R&D.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <GraduationCap className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Dành Cho Tác Giả & NXB</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Phát hành ấn phẩm với cơ chế chống sao chép DRM AES-256-GCM bảo vệ tuyệt đối.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <Download className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-bold text-sm text-white">Cổng Đọc Đa Nền Tảng</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Đọc mượt mà trên Desktop Web, iPad, Android Tablet và Apple Vision Pro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
