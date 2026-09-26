import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Cpu, Headphones, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-100 tracking-tight">
                AuraBook
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Nền tảng thương mại điện tử & đọc sách số bảo mật DRM WebAssembly
              tích hợp trí tuệ nhân tạo đa tác tử RAG và Voice Telephony AI.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bảo vệ bản quyền số AES-256-GCM</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">
              Khám Phá Nền Tảng
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/books" className="hover:text-purple-400 transition-colors">
                  Toàn bộ danh mục ấn phẩm
                </Link>
              </li>
              <li>
                <Link href="/books?format=EBOOK" className="hover:text-purple-400 transition-colors">
                  Tủ sách số E-Book bản quyền
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-purple-400 transition-colors">
                  Trình đọc E-book Canvas DRM
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-purple-400 transition-colors">
                  Giỏ hàng & Khuyến mãi (AURA2026)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: AI Technology Stack */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">
              Công Nghệ Lõi Tích Hợp
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Tìm kiếm lai RRF k=60 (BM25 + 768d Vector)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-pink-400" />
                <span>DRM WebAssembly RAM Zero-out</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Headphones className="w-3 h-3 text-indigo-400" />
                <span>AI Audio Teaser 60s & Voice Agent</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Gemini 2.0 Flash Function Calling</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment & Security */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold text-xs tracking-wider uppercase">
              Thanh Toán & Bảo Mật
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hỗ trợ Cổng thanh toán Sandbox, VNPay, MoMo và chữ ký bảo mật HMAC-SHA256
              xác thực tức thì.
            </p>
            <div className="flex gap-2 pt-2">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300">
                SANDBOX IPN
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-pink-300">
                AES-GCM AEAD
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
          <div>
            &copy; {new Date().getFullYear()} AuraBook. Toàn bộ bản quyền thuộc về basduy05.
          </div>
          <div className="flex gap-4">
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              FastAPI Swagger Docs
            </a>
            <span>•</span>
            <a href="http://localhost:8000/health" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              System Health
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
