"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export function Footer() {
  const pathname = usePathname();
  const { user } = useCart();

  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || user.email.toLowerCase().includes("admin"))
  );

  // Do not render storefront footer on admin portal or reader canvas
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/reader")) {
    return null;
  }
  return (
    <footer className="bg-[#0A0D14] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Brand Showcase & Tagline */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-slate-800/80">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="AuraBook"
              width={180}
              height={40}
              className="h-9 sm:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-900 text-sky-400 border-slate-700 text-[10px] font-bold">
              Next.js 15
            </Badge>
            <Badge className="bg-slate-900 text-amber-400 border-slate-700 text-[10px] font-bold">
              WASM Canvas DRM
            </Badge>
            <Badge className="bg-slate-900 text-sky-400 border-slate-700 text-[10px] font-bold">
              Gemini 2.0 Flash
            </Badge>
            <Badge className="bg-slate-900 text-amber-400 border-slate-700 text-[10px] font-bold">
              Hybrid Search RRF k=60
            </Badge>
          </div>
        </div>

        {/* 6-Column Mega Footer Navigation (LottieFiles Blueprint) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-12">
          {/* Col 1: Products */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Sản Phẩm
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <Link href="/books" className="hover:text-amber-400 transition-colors">
                  Toàn Bộ Danh Mục
                </Link>
              </li>
              <li>
                <Link href="/books?format=EBOOK" className="hover:text-amber-400 transition-colors">
                  Sách Điện Tử DRM
                </Link>
              </li>
              <li>
                <Link href="/books?format=PHYSICAL" className="hover:text-amber-400 transition-colors">
                  Sách In Bìa Cứng
                </Link>
              </li>
              <li>
                <Link href="/books?q=AI" className="hover:text-amber-400 transition-colors">
                  AI & Machine Learning
                </Link>
              </li>
              <li>
                <Link href="/books?q=Architecture" className="hover:text-amber-400 transition-colors">
                  Kiến Trúc Phần Mềm
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Integrations & Tools */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Công Nghệ & DRM
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <Link href="/intro" className="hover:text-amber-400 transition-colors">
                  WebAssembly Canvas
                </Link>
              </li>
              <li>
                <Link href="/intro" className="hover:text-amber-400 transition-colors">
                  Khóa Phiên AES-256-GCM
                </Link>
              </li>
              <li>
                <Link href="/intro" className="hover:text-amber-400 transition-colors">
                  Gemini Vision OCR Bìa
                </Link>
              </li>
              <li>
                <Link href="/intro" className="hover:text-amber-400 transition-colors">
                  60s AI Audio Teaser
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <span>OpenAPI Swagger v1</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Customers */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Độc Giả & Thư Viện
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <Link href="/library" className="hover:text-amber-400 transition-colors">
                  Tủ Sách Số Cá Nhân
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-amber-400 transition-colors">
                  Giỏ Hàng & Mã Ưu Đãi
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-amber-400 transition-colors">
                  Cổng Thanh Toán Sandbox
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors">
                  Đăng Nhập Khách Hàng
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-400 transition-colors">
                  Đăng Ký Thành Viên Mới
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources / Admin (Only if Admin is logged in) */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              {isAdmin ? "Quản Trị Hệ Thống" : "Hỗ Trợ & Chính Sách"}
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              {isAdmin ? (
                <>
                  <li>
                    <Link href="/admin" className="hover:text-amber-400 transition-colors font-bold text-amber-300">
                      Cổng Quản Trị (Admin)
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/books" className="hover:text-amber-400 transition-colors">
                      Quản Trị Sách & OCR
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/orders" className="hover:text-amber-400 transition-colors">
                      Vòng Đời Đơn Hàng FSM
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/users" className="hover:text-amber-400 transition-colors">
                      Quản Lý Người Dùng
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/vouchers" className="hover:text-amber-400 transition-colors">
                      Mã Giảm Giá Voucher
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/drm" className="hover:text-amber-400 transition-colors">
                      Bản Quyền Số DRM
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/intro" className="hover:text-amber-400 transition-colors">
                      Hướng Dẫn Mua & Đọc Sách
                    </Link>
                  </li>
                  <li>
                    <Link href="/intro" className="hover:text-amber-400 transition-colors">
                      Bản Quyền & Công Nghệ DRM
                    </Link>
                  </li>
                  <li>
                    <Link href="/intro" className="hover:text-amber-400 transition-colors">
                      Chính Sách Giao Hàng & Đổi Trả
                    </Link>
                  </li>
                  <li>
                    <Link href="/intro" className="hover:text-amber-400 transition-colors">
                      Điều Khoản Dịch Vụ
                    </Link>
                  </li>
                  <li>
                    <Link href="/intro" className="hover:text-amber-400 transition-colors">
                      Câu Hỏi Thường Gặp (FAQ)
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Col 5: Company */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Về AuraBook
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <Link href="/intro" className="hover:text-amber-400 transition-colors">
                  Đề Tài Luận Văn Tốt Nghiệp
                </Link>
              </li>
              <li>
                <span className="text-slate-500">filev45.tex Specification</span>
              </li>
              <li>
                <span className="text-slate-500">AuraBook Lab Research</span>
              </li>
              <li>
                <span className="text-slate-500">Đội Ngũ Kỹ Thuật</span>
              </li>
              <li>
                <span className="text-slate-500">Hợp Tác Xuất Bản</span>
              </li>
            </ul>
          </div>

          {/* Col 6: Terms and Policies */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Điều Khoản & Bảo Mật
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <span className="text-slate-500">Chính Sách Bản Quyền DRM</span>
              </li>
              <li>
                <span className="text-slate-500">Bảo Mật Bộ Nhớ Zero-RAM</span>
              </li>
              <li>
                <span className="text-slate-500">Điều Khoản Mua Hàng</span>
              </li>
              <li>
                <span className="text-slate-500">Xác Thực HMAC-SHA256</span>
              </li>
              <li>
                <span className="text-slate-500">Quyền Riêng Tư Độc Giả</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar (LottieFiles Blueprint) */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>© 2026 AuraBook Inc. Tất cả quyền được bảo lưu.</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Thiết kế theo chuẩn mực mỹ thuật</span>
            <span className="text-amber-400 font-bold">LottieFiles & Taste-Skill</span>
            <span>dành cho Độc giả & Kỹ sư</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
