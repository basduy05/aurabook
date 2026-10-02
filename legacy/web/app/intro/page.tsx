"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Cpu,
  Search,
  Mic,
  ArrowRight,
  ExternalLink,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function IntroTechnologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/30 to-white text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center mb-2">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Image
                src="/logo.png"
                alt="AuraBook"
                width={200}
                height={48}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>
          <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs px-3 py-1 font-semibold">
            Đề Tài Luận Văn Tốt Nghiệp • filev45.tex
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-sky-950 tracking-tight leading-tight">
            Kiến Trúc Nền Tảng <span className="text-sky-600">AuraBook</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Hệ sinh thái thương mại điện tử xuất bản số thế hệ mới kết hợp bảo vệ bản quyền E-book WebAssembly Canvas DRM (AES-256-GCM) và trợ lý trí tuệ nhân tạo đa tác tử RAG 768 chiều.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/">
              <Button className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 px-5 shadow-lg shadow-sky-600/20 rounded-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Vào Sàn Mua Sách Ngay
              </Button>
            </Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
              <Button variant="outline" className="border-sky-300 text-sky-800 hover:bg-sky-50 text-xs h-10 px-5 rounded-full font-semibold">
                <ExternalLink className="w-4 h-4 mr-2 text-sky-600" />
                Swagger API Docs v1
              </Button>
            </a>
          </div>
        </div>

        {/* 4 Core Technology Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1: WASM Canvas DRM */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-100/50 card-3d-hover relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-sky-950">1. WebAssembly Canvas DRM (UC05)</h2>
              <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">AES-256-GCM</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Cơ chế bảo vệ bản quyền số cấp cao: Cấp phát khóa phiên ngẫu nhiên (Ephemeral Session Key) 256-bit có hiệu lực 15 phút. Luồng dữ liệu giải mã trực tiếp trong RAM cô lập và thực thi ghi đè byte 0 (Zero-out memory) ngay sau khi render điểm ảnh lên HTML5 Canvas.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Vô hiệu hóa DOM text scraping: Cây DOM không chứa văn bản thô</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Chống chụp màn hình, vô hiệu hóa chuột phải & bôi đen copy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Hình mờ bản quyền động (Dynamic Watermark) bảo vệ tác quyền</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: AI Multi-modal RAG Companion */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-100/50 card-3d-hover relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-sky-950">2. Trợ Lý RAG Đa Phương Thức (UC06)</h2>
              <Badge className="bg-sky-100 text-sky-800 border-none text-[10px]">Gemini 768d</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Động cơ truy xuất tăng cường sinh sinh (Retrieval-Augmented Generation): Băm nhỏ nội dung sách 512 tokens (overlap 64), nhúng vector đặc trưng 768 chiều và tìm kiếm độ tương đồng Cosine kết hợp Server-Sent Events (SSE) streaming phản hồi thời gian thực.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Trích xuất chính xác số trang trích dẫn làm chứng cứ</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Hỗ trợ tóm tắt ý chính, giải thích thuật ngữ chuyên sâu ngay khi đọc</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Giao diện Sidebar gắn liền với trình đọc sách WASM</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: RRF Hybrid Search Engine */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-100/50 card-3d-hover relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-sky-950">3. Tìm Kiếm Lai RRF k=60 (UC02)</h2>
              <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">BM25 + Vector</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Thuật toán hợp nhất xếp hạng đối xứng Reciprocal Rank Fusion kết hợp song song hai nhánh: Truy vấn từ vựng Lexical BM25 và Ngữ nghĩa Semantic 768d Vector Cosine, nâng cao độ chính xác truy tìm tài liệu kỹ thuật lên vượt trội.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-sky-900 text-center">
              RRF(d) = Σ [ 1 / (60 + rank_m(d)) ]
            </div>
          </div>

          {/* Pillar 4: Telephony Voice AI Agent */}
          <div className="bg-white border border-sky-100 rounded-3xl p-8 shadow-xl shadow-sky-100/50 card-3d-hover relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-sky-950">4. Trợ Lý Thoại Voice AI Agent (UC07)</h2>
              <Badge className="bg-sky-100 text-sky-800 border-none text-[10px]">Function Calling</Badge>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Nhận diện giọng nói tiếng Việt rảnh tay qua Web Speech API và Gemini Function Calling Dispatcher: Tự động tra cứu tiến trình đơn hàng, hủy đơn hoàn tồn kho tự động và kiểm tra số lượng sách in còn lại trong kho.
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Ghi vết kiểm toán bảo mật đầy đủ vào AuditLog</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Tự động phản hồi bằng giọng nói tiếng Việt chuẩn xác</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Khám Phá Toàn Diện Sàn Sách AuraBook</h3>
            <p className="text-sky-100 text-xs sm:text-sm max-w-xl">
              Trải nghiệm mua sách in giao tận nơi, sở hữu bản quyền số đọc trực tiếp trên trình duyệt cùng các tính năng AI đỉnh cao.
            </p>
          </div>
          <Link href="/">
            <Button className="bg-white hover:bg-slate-100 text-sky-900 font-extrabold text-sm h-11 px-8 rounded-full shadow-lg flex-shrink-0">
              Mua Sách Ngay
              <ArrowRight className="w-4 h-4 ml-2 text-amber-500" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
