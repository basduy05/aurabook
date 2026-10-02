"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  RefreshCw,
  FolderTree,
  Cpu,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

interface NavGroup {
  groupName: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupName: "Quản Trị Nghiệp Vụ",
    items: [
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
        label: "Thể Loại & Danh Mục",
        href: "/admin/categories",
        icon: FolderTree,
        badge: "Danh mục",
      },
      {
        label: "Vòng Đời Đơn Hàng",
        href: "/admin/orders",
        icon: ShoppingBag,
        badge: "FSM",
      },
      {
        label: "Mã Giảm Giá & Voucher",
        href: "/admin/vouchers",
        icon: Tag,
        badge: "Ưu đãi",
      },
    ],
  },
  {
    groupName: "Khách Hàng & Bản Quyền",
    items: [
      {
        label: "Quản Lý Người Dùng",
        href: "/admin/users",
        icon: Users,
        badge: "Phân quyền",
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
    ],
  },
  {
    groupName: "Điều Hành AI & Hệ Thống",
    items: [
      {
        label: "Quản Lý AI & Hiệu Năng",
        href: "/admin/ai",
        icon: Cpu,
        badge: "Gemini 2.0",
      },
      {
        label: "Nhật Ký Kiểm Toán",
        href: "/admin/audit",
        icon: ShieldAlert,
        badge: "Audit Logs",
      },
      {
        label: "Cấu Hình Hệ Thống",
        href: "/admin/settings",
        icon: Settings,
        badge: "Cấu hình",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, loginUser } = useCart();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = Boolean(
    user && (user.role === "ADMIN" || user.email.toLowerCase().includes("admin"))
  );

  const handleActivateAdmin = () => {
    loginUser("demo_jwt_token_light_2026", {
      id: "admin-user-id",
      email: "admin@aurabook.vn",
      fullName: "Quản Trị Viên AuraBook",
      role: "ADMIN",
    });
  };

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
              <Image
                src="/logo.png"
                alt="AuraBook"
                width={140}
                height={32}
                priority
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

          {/* Navigation Items Grouped */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
            {NAV_GROUPS.map((group) => (
              <div key={group.groupName} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.groupName}
                </div>
                {group.items.map((item) => {
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
              </div>
            ))}
          </nav>
        </div>

        {/* Footer of Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {!isAdmin ? (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Chế độ Demo Khách</span>
              </div>
              <p className="text-[10px] text-amber-700 leading-tight">
                Bấm bên dưới để kích hoạt tài khoản Admin đầy đủ quyền truy cập.
              </p>
              <Button
                onClick={handleActivateAdmin}
                size="sm"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold py-1.5 h-auto shadow-xs"
              >
                Kích Hoạt Quyền Admin
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
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
          )}

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

            <Link href="/admin" className="md:hidden flex items-center">
              <Image
                src="/logo.png"
                alt="AuraBook"
                width={110}
                height={26}
                className="h-6.5 w-auto object-contain"
                priority
              />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Cổng Quản Trị</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-800 font-semibold">
                {ALL_NAV_ITEMS.find((n) =>
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
          {!isMounted ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                <span>Đang tải thông tin quản trị AuraBook...</span>
              </div>
            </div>
          ) : !isAdmin ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Cổng Giới Hạn Quản Trị Viên (Admin Only)
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Phân hệ quản trị này chỉ dành cho người dùng có quyền Quản trị viên (vai trò ADMIN).
                  {user ? (
                    <span className="block mt-1 font-medium text-slate-700">
                      Tài khoản hiện tại: <strong>{user.email}</strong> (vai trò: {user.role || "CUSTOMER"})
                    </span>
                  ) : (
                    <span className="block mt-1 font-medium text-slate-700">
                      Bạn hiện chưa đăng nhập vào hệ thống.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={`/login?role=admin&redirect=${encodeURIComponent(pathname)}`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-xs font-bold py-2.5 px-5 shadow-md shadow-sky-500/20">
                    Đăng Nhập Quản Trị Viên
                  </Button>
                </Link>

                <Button
                  onClick={handleActivateAdmin}
                  variant="outline"
                  className="w-full sm:w-auto border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold py-2.5 px-5"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-600" />
                  Kích Hoạt Quyền Admin Demo (1 Chạm)
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link href="/" className="text-xs text-slate-400 hover:text-sky-600 font-medium inline-flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Trở về trang cửa hàng độc giả
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
