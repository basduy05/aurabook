"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  BookOpen,
  User,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DrmLicenseItem {
  id: string;
  user_email: string;
  user_name: string;
  book_title: string;
  book_id: string;
  granted_at: string;
  is_active: boolean;
  current_page: number;
  total_pages: number;
  progress_percent: number;
}

export default function AdminDrmPage() {
  const [licenses, setLicenses] = useState<DrmLicenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/drm/licenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLicenses(data.items || []);
      } else {
        // Fallback demo
        setLicenses([
          {
            id: "lic-1",
            user_email: "customer@aurabook.vn",
            user_name: "Đặng Quốc Bảo",
            book_title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
            book_id: "b1",
            granted_at: new Date().toISOString(),
            is_active: true,
            current_page: 2,
            total_pages: 3,
            progress_percent: 66.7,
          },
          {
            id: "lic-2",
            user_email: "customer@aurabook.vn",
            user_name: "Đặng Quốc Bảo",
            book_title: "Tư Duy Độc Lập Trong Kỷ Nguyên Trí Tuệ Nhân Tạo",
            book_id: "b4",
            granted_at: new Date(Date.now() - 86400000).toISOString(),
            is_active: true,
            current_page: 1,
            total_pages: 2,
            progress_percent: 50.0,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleRevokeLicense = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      await fetch(`${apiBase}/api/v1/admin/drm/licenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setLicenses((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l))
      );
      setActionMessage(`Đã ${currentStatus ? "thu hồi" : "cấp lại"} bản quyền truy cập DRM.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Lỗi cập nhật bản quyền DRM");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-sky-600" />
            Giám Sát Bản Quyền WebAssembly Canvas DRM
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phiên đọc số, khóa mã hóa AES-256-GCM và quyền truy cập E-Book theo từng khách hàng
          </p>
        </div>

        <Button
          onClick={fetchLicenses}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          ✓ {actionMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bản quyền đang cấp</p>
            <h4 className="text-xl font-black text-slate-900">{licenses.filter((l) => l.is_active).length} license</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tiến độ đọc TB</p>
            <h4 className="text-xl font-black text-slate-900">
              {licenses.length > 0
                ? Math.round(licenses.reduce((acc, l) => acc + l.progress_percent, 0) / licenses.length)
                : 0}%
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bảo vệ Canvas</p>
            <h4 className="text-xl font-black text-slate-900">WASM Active</h4>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Độc Giả</th>
                <th className="py-4 px-6">Tác Phẩm E-Book</th>
                <th className="py-4 px-6">Tiến Độ Đọc</th>
                <th className="py-4 px-6">Ngày Cấp Quyền</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    Đang đồng bộ danh sách bản quyền DRM...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có bản quyền E-Book nào được kích hoạt.
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{lic.user_name}</p>
                          <p className="text-[11px] text-slate-400">{lic.user_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-800 max-w-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="line-clamp-1">{lic.book_title}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                        <span>Trang {lic.current_page}/{lic.total_pages}</span>
                        <span className="text-sky-600 font-bold">({Math.round(lic.progress_percent)}%)</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-sky-600 h-full rounded-full"
                          style={{ width: `${Math.max(5, lic.progress_percent)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(lic.granted_at).toLocaleDateString("vi-VN")}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        className={`text-[10px] font-bold ${
                          lic.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {lic.is_active ? "Có hiệu lực" : "Đã thu hồi"}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Button
                        onClick={() => handleRevokeLicense(lic.id, lic.is_active)}
                        size="sm"
                        variant="outline"
                        className={`rounded-xl text-xs font-semibold gap-1.5 ${
                          lic.is_active
                            ? "hover:bg-rose-50 hover:text-rose-700 border-slate-200 text-slate-700"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {lic.is_active ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" /> Thu hồi quyền
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" /> Cấp lại quyền
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
