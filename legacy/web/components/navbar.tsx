"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  BookOpen,
  LogOut,
  Sparkles,
  Layers,
  Compass,
  ShieldCheck,
  ArrowRight,
  Users,
  Tag,
  Shield,
  Star,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, setIsCartOpen, user, logoutUser } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || user.email.toLowerCase().includes("admin"))
  );

  // Do not render storefront navbar in admin portal or reader canvas
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/reader")) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top micro banner */}
      <div className="bg-[#0F172A] text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center gap-2 border-b border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
        <span>
          Đại Tiệc Sách Công Nghệ & AI 2026: Nhập mã <strong className="text-amber-400 font-bold">AURA2026</strong> giảm ngay 15% & Miễn phí vận chuyển toàn quốc!
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Pure Image without container or text */}
        <Link href="/" className="flex items-center flex-shrink-0 group">
          <Image
            src="/logo.png"
            alt="AuraBook"
            width={180}
            height={40}
            priority
            className="h-9 sm:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Search Bar with ⌘K Badge */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative items-center"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tựa sách, tác giả, chủ đề AI, RAG... ⌘K"
            className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
            {searchTerm && (
              <button
                type="submit"
                className="px-2.5 py-0.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full text-[10px] font-semibold transition-colors"
              >
                Tìm
              </button>
            )}
          </div>
        </form>

        {/* Nav Links & Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/books"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            <span>Danh Mục Sách</span>
          </Link>

          <Link
            href="/intro"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Công Nghệ DRM & AI</span>
          </Link>

          <Link
            href="/library"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Tủ Sách Số</span>
          </Link>

          {/* Admin Direct Quick Access Button */}
          {isAdmin && (
            <Link href="/admin">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-md border border-amber-500/40 transition-all hover:scale-105">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Cổng Quản Trị</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono font-extrabold">ADMIN</span>
              </button>
            </Link>
          )}

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-400 hover:bg-slate-100 transition-all shadow-xs"
            title="Mở giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-pulse">
                {totalItems}
              </Badge>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 hover:bg-slate-100 transition-colors shadow-xs"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  isAdmin ? "bg-amber-600" : "bg-sky-600"
                }`}>
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
                <span className="font-semibold max-w-[100px] truncate hidden sm:inline">
                  {user.fullName || user.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{user.fullName}</p>
                    <p className="text-[11px] truncate text-slate-500">{user.email}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isAdmin
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-sky-100 text-sky-800"
                    }`}>
                      {isAdmin ? "👑 Quản Trị Viên (Admin)" : "Độc Giả Thân Thiết"}
                    </span>
                  </div>

                  {/* Admin Direct Links */}
                  {isAdmin && (
                    <div className="p-1 space-y-0.5 bg-amber-50/50 border-b border-amber-100">
                      <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-amber-800">
                        Cổng Quản Trị Hệ Thống
                      </div>
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg text-amber-900 hover:bg-amber-100 font-bold transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Bảng Điều Khiển Admin</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-amber-600" />
                      </Link>
                      <Link
                        href="/admin/ai"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sky-700 hover:bg-sky-50 font-bold transition-colors"
                      >
                        <Cpu className="w-3.5 h-3.5 text-sky-600" />
                        <span>Quản Lý AI & Hiệu Năng</span>
                      </Link>
                      <Link
                        href="/admin/books"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Quản trị Sách & OCR</span>
                      </Link>
                      <Link
                        href="/admin/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        <span>Vòng đời Đơn hàng FSM</span>
                      </Link>
                      <Link
                        href="/admin/users"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>Quản lý Người dùng</span>
                      </Link>
                      <Link
                        href="/admin/vouchers"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mã Khuyến Mãi Voucher</span>
                      </Link>
                      <Link
                        href="/admin/drm"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bản Quyền Số DRM</span>
                      </Link>
                      <Link
                        href="/admin/reviews"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kiểm Duyệt Nhận Xét</span>
                      </Link>
                    </div>
                  )}

                  {/* Customer Links */}
                  <Link
                    href="/library"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors font-medium"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    Tủ sách E-book của tôi
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors font-medium"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    Giỏ hàng & Đơn mua
                  </Link>

                  {isAdmin && (
                    <div className="p-1 border-t border-slate-100 bg-amber-50/50">
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg text-amber-900 hover:bg-amber-100 font-bold transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cổng Quản Trị Admin</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-amber-600" />
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logoutUser();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-full px-3.5"
                >
                  Đăng Nhập
                </Button>
              </Link>
              {/* LottieFiles Style Primary Pill Button */}
              <Link href="/books">
                <button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm shadow-sky-600/25 transition-all hover:scale-105 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Khám Phá Sách</span>
                </button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
