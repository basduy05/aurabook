"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  BookOpen,
  User as UserIcon,
  LogOut,
  Sparkles,
  Layers,
  Compass,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export function Navbar() {
  const router = useRouter();
  const { totalItems, setIsCartOpen, user, logoutUser } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm transition-all">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-amber-500 text-white text-[11px] font-medium py-1 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
        <span>
          Đại Tiệc Sách Công Nghệ & AI 2026: Nhập mã <strong className="text-amber-200 underline font-bold">AURA2026</strong> giảm ngay 15% & Miễn phí vận chuyển toàn quốc!
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-sky-950 flex items-center">
              Aura<span className="text-amber-500">Book</span>
            </span>
            <span className="text-[9px] font-semibold text-sky-600 tracking-wider -mt-1 uppercase">
              Sàn Sách Bản Quyền & AI
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative items-center"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tựa sách, tác giả, chủ đề AI, RAG..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-sky-200/80 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-sky-500 absolute left-3.5 pointer-events-none" />
          {searchTerm && (
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-[11px] font-semibold transition-colors"
            >
              Tìm
            </button>
          )}
        </form>

        {/* Nav Links & Actions */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/books"
            className="text-xs font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-sky-50"
          >
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>Khám Phá Sách</span>
          </Link>

          <Link
            href="/intro"
            className="text-xs font-semibold text-slate-700 hover:text-sky-600 transition-colors hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-sky-50"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Công Nghệ DRM & AI</span>
          </Link>

          <Link
            href="/library"
            className="text-xs font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-sky-50"
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Tủ Sách Số</span>
          </Link>

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-slate-50 border border-sky-200/70 text-slate-700 hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50 transition-all shadow-sm"
            title="Mở giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-pulse">
                {totalItems}
              </Badge>
            )}
          </button>

          {/* User Auth Section - Note: Admin links are intentionally hidden */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-xs text-sky-900 hover:bg-sky-100 transition-colors shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
                <span className="font-semibold max-w-[100px] truncate hidden sm:inline">
                  {user.fullName || user.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-sky-100 rounded-2xl shadow-xl py-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 text-slate-500">
                    <p className="font-bold text-slate-900 text-sm">{user.fullName}</p>
                    <p className="text-[11px] truncate text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      Độc Giả Thân Thiết
                    </span>
                  </div>

                  <Link
                    href="/library"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors font-medium"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    Tủ sách E-book của tôi
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors font-medium"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    Giỏ hàng & Đơn mua
                  </Link>

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
                  variant="outline"
                  className="border-sky-200 text-sky-800 hover:bg-sky-50 hover:text-sky-900 text-xs font-semibold rounded-full px-3.5"
                >
                  Đăng Nhập
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-block">
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-full px-3.5 shadow-md shadow-amber-500/20"
                >
                  Đăng Ký
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
