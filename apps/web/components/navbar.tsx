"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Search,
  BookOpen,
  User as UserIcon,
  LogOut,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export function Navbar() {
  const router = useRouter();
  const { totalItems, setIsCartOpen, user, logoutUser } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
              AuraBook
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1">
              AI & DRM PLATFORM
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-md hidden md:flex items-center relative"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sách theo tựa đề, tác giả hoặc ngữ nghĩa AI..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        </form>

        {/* Nav Links & Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/books"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Khám Phá Sách</span>
          </Link>

          <Link
            href="/library"
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60"
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Thư Viện Số</span>
          </Link>

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 transition-all"
            title="Mở giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono text-[10px] flex items-center justify-center rounded-full p-0">
                {totalItems}
              </Badge>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-purple-500/30 text-xs text-purple-300 hover:bg-slate-800 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="font-medium max-w-[100px] truncate">
                  {user.fullName || user.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs space-y-1">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-slate-400">
                    <p className="font-semibold text-slate-200">{user.fullName}</p>
                    <p className="text-[11px] truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/library"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-1.5 hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Tủ sách E-book của tôi
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-1.5 hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Giỏ hàng & Đơn mua
                  </Link>
                  <button
                    onClick={() => {
                      logoutUser();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3 h-3" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 h-8"
                >
                  Đăng Nhập
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-block">
                <Button
                  size="sm"
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8"
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
