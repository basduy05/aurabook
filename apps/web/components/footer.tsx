import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                A
              </div>
              <span className="text-xl font-black text-slate-900">
                Aura<span className="text-amber-500">Book</span>
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Hệ thống xuất bản & phân phối sách in, sách điện tử bản quyền WebAssembly Canvas DRM (AES-256-GCM) tích hợp trợ lý AI RAG đa tác tử.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] font-semibold">
                Next.js 15
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold">
                Gemini 768d
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Khám Phá Sách
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/books" className="hover:text-sky-600 transition-colors">
                  Toàn bộ danh mục sách
                </Link>
              </li>
              <li>
                <Link href="/books?q=AI" className="hover:text-sky-600 transition-colors">
                  Sách Trí Tuệ Nhân Tạo & LLM
                </Link>
              </li>
              <li>
                <Link href="/books?q=Architecture" className="hover:text-sky-600 transition-colors">
                  Sách Kiến Trúc Phần Mềm
                </Link>
              </li>
              <li>
                <Link href="/books?format=EBOOK" className="hover:text-sky-600 transition-colors">
                  Sách điện tử E-Book DRM
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Research */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Nền Tảng Công Nghệ
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/intro" className="hover:text-sky-600 transition-colors flex items-center gap-1">
                  <span>Kiến trúc WebAssembly Canvas DRM</span>
                </Link>
              </li>
              <li>
                <Link href="/intro" className="hover:text-sky-600 transition-colors">
                  Thuật toán RRF k=60 Hybrid Search
                </Link>
              </li>
              <li>
                <Link href="/intro" className="hover:text-sky-600 transition-colors">
                  Trợ lý Voice AI & Function Calling
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-600 transition-colors flex items-center gap-1 text-sky-600 font-semibold"
                >
                  <span>Tài liệu Swagger API RESTful</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>Hotline: <strong className="text-slate-800">1900 2026 (Miễn phí)</strong></li>
              <li>Email: <span className="text-sky-600">hotro@aurabook.vn</span></li>
              <li>Địa chỉ: Khu Công Nghệ Cao Hòa Lạc, Hà Nội</li>
              <li className="pt-1 text-[11px] text-amber-700 font-medium">
                Voucher ưu đãi tháng 9: <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">AURA2026</code>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            © 2026 AuraBook Ecosystem. Bản quyền phần mềm & nghiên cứu khoa học.
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Thiết kế hiện đại với công nghệ</span>
            <Heart className="w-3 h-3 text-red-500 fill-current" />
            <span>Next.js 15 & Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
