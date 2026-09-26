/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Users,
  Tag,
  ShieldCheck,
  Star,
  ArrowLeft,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

const NAV_ITEMS = [
  {
    label: "Bảng Điều Khiển",
    href: "/admin",
    icon: LayoutDashboard,
    badge: "Realtime",
  },
  {
    label: "Kho Sách & OCR AI",
    href: "/admin/books",
    icon: BookOpen,
    badge: "Vision OCR",
  },
  {
    label: "Vòng Đời Đơn Hàng",
    href: "/admin/orders",
    icon: ShoppingBag,
    badge: "FSM",
  },
  {
    label: "Quản Lý Người Dùng",
    href: "/admin/users",
    icon: Users,
    badge: "Phân quyền",
  },
  {
    label: "Mã Giảm Giá & Voucher",
    href: "/admin/vouchers",
    icon: Tag,
    badge: "Ưu đãi",
  },
  {
    label: "Bản Quyền Số DRM",
    href: "/admin/drm",
    icon: ShieldCheck,
    badge: "WASM AES",
  },
  {
    label: "Đánh Giá Độc Giả",
    href: "/admin/reviews",
    icon: Star,
    badge: "Kiểm duyệt",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Luxury Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-72 bg-white border-r border-slate-200/80 shadow-xl md:shadow-none flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header with Official Logo */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="AuraBook"
                className="h-8 w-auto object-contain hover:opacity-90 transition-opacity"
              />
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] font-black px-1.5 py-0.5 ml-1">
                ADMIN
              </Badge>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quản Trị Nghiệp Vụ
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white font-bold"
                          : "bg-slate-100 text-slate-500 border border-slate-200/60"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer of Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs border border-sky-200">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.fullName || "Quản Trị Viên"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || "admin@aurabook.vn"}
              </p>
            </div>
          </div>

          <Link href="/" className="w-full block">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs text-slate-600 hover:text-sky-600 border-slate-200 bg-white shadow-xs flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Về Trang Khách Hàng
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Cổng Quản Trị</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-800 font-semibold">
                {NAV_ITEMS.find((n) =>
                  n.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(n.href)
                )?.label || "Trung Tâm Điều Hành"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống hoạt động ổn định (Local SQLite DB)
            </div>

            <Link href="/books" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span>Xem Cửa Hàng</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/60">
          {children}
        </main>
      </div>
    </div>
  );
}
