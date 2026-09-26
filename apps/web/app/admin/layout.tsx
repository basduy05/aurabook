"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

const NAV_ITEMS = [
  {
    label: "Bảng Điều Khiển (UC12)",
    href: "/admin",
    icon: LayoutDashboard,
    badge: "Realtime",
  },
  {
    label: "Quản Lý Sách & OCR (UC09, UC10)",
    href: "/admin/books",
    icon: BookOpen,
    badge: "Gemini Vision",
  },
  {
    label: "Quản Lý Đơn Hàng FSM (UC11)",
    href: "/admin/orders",
    icon: ShoppingBag,
    badge: "FSM",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loginUser } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleGrantAdmin = () => {
    loginUser("jwt_mock_admin_token_aura2026", {
      id: "usr-admin-001",
      email: "admin@aurabook.vn",
      fullName: "Quản Trị Viên Hệ Thống",
      role: "ADMIN",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-bold text-white text-sm">
            AuraBook <span className="text-cyan-400">Admin</span>
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
              A
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white">
                Aura<span className="text-cyan-400">Book</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">
                Admin Operation Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Quản trị hệ thống
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-cyan-600/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 border-none ${
                      isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Khách hàng & Cửa hàng
            </div>
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Về Sàn Sách Storefront</span>
            </Link>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>Swagger API Docs</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                v1
              </Badge>
            </a>
          </div>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold">
                {isAdmin ? "AD" : "GU"}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate max-w-[120px]">
                  {user?.fullName || "Khách Vãng Lai"}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email || "Chưa đăng nhập"}
                </div>
              </div>
            </div>
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className={`text-[9px] px-1.5 py-0 ${
                isAdmin
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {isAdmin ? "ADMIN" : "GUEST"}
            </Badge>
          </div>

          {!isAdmin && (
            <Button
              size="sm"
              onClick={handleGrantAdmin}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] h-7 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Kích Hoạt Quyền Admin
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
