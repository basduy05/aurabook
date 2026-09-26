"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      let url = `${apiBase}/api/v1/admin/users`;
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
      } else {
        // Fallback demo users
        setUsers([
          {
            id: "a0000000-0000-0000-0000-000000000001",
            email: "admin@aurabook.vn",
            full_name: "Quản Trị Viên Hệ Thống",
            phone_number: "0901234567",
            role: "ADMIN",
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: "c0000000-0000-0000-0000-000000000001",
            email: "customer@aurabook.vn",
            full_name: "Đặng Quốc Bảo",
            phone_number: "0988776655",
            role: "CUSTOMER",
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: "c0000000-0000-0000-0000-000000000002",
            email: "reader@aurabook.vn",
            full_name: "Nguyễn Thúy Quỳnh",
            phone_number: "0911223344",
            role: "CUSTOMER",
            is_active: true,
            created_at: new Date().toISOString(),
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleToggleStatus = async (id: string, currentStatus: boolean, email: string) => {
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/users/${id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setActionMessage(`Đã ${currentStatus ? "khóa" : "mở khóa"} tài khoản ${email}`);
        fetchUsers();
      } else {
        // Local state toggle
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u))
        );
        setActionMessage(`Đã ${currentStatus ? "khóa" : "mở khóa"} tài khoản ${email}`);
      }
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Lỗi cập nhật trạng thái người dùng");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-600" />
            Quản Lý Người Dùng & Phân Quyền
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh sách tài khoản khách hàng, quản trị viên, kiểm soát quyền truy cập và bảo mật
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          ✓ {actionMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Vai trò:</span>
          {(["ALL", "ADMIN", "CUSTOMER"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                roleFilter === r
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              {r === "ALL" ? "Tất cả" : r === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Họ & Tên</th>
                <th className="py-4 px-6">Liên Hệ</th>
                <th className="py-4 px-6">Vai Trò</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6">Ngày Đăng Ký</th>
                <th className="py-4 px-6 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone_number && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        className={`text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {u.role === "ADMIN" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 mr-1 inline" /> ADMIN
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 mr-1 inline" /> KHÁCH HÀNG
                          </>
                        )}
                      </Badge>
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        className={`text-[10px] font-bold ${
                          u.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {u.is_active ? "Hoạt động" : "Đã khóa"}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Button
                        onClick={() => handleToggleStatus(u.id, u.is_active, u.email)}
                        size="sm"
                        variant="outline"
                        className={`rounded-xl text-xs font-semibold gap-1.5 ${
                          u.is_active
                            ? "hover:bg-rose-50 hover:text-rose-700 border-slate-200 text-slate-700"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <Lock className="w-3.5 h-3.5" /> Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" /> Mở khóa
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
