"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VoucherItem {
  id: string;
  code: string;
  discount_percent: number;
  min_order_value: number;
  max_discount: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [minOrderValue, setMinOrderValue] = useState(150000);
  const [maxDiscount, setMaxDiscount] = useState(50000);
  const [usageLimit, setUsageLimit] = useState(500);
  const [daysValid, setDaysValid] = useState(30);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVouchers(data || []);
      } else {
        // Demo fallback
        setVouchers([
          {
            id: "v1",
            code: "AURA2026",
            discount_percent: 15,
            min_order_value: 150000,
            max_discount: 60000,
            usage_limit: 1000,
            used_count: 42,
            is_active: true,
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 365 * 86400000).toISOString(),
          },
          {
            id: "v2",
            code: "VIPAURA",
            discount_percent: 20,
            min_order_value: 300000,
            max_discount: 100000,
            usage_limit: 200,
            used_count: 18,
            is_active: true,
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 180 * 86400000).toISOString(),
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
    fetchVouchers();
  }, []);

  const handleToggleVoucher = async (id: string, currentStatus: boolean, vCode: string) => {
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      await fetch(`${apiBase}/api/v1/admin/vouchers/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_active: !currentStatus } : v))
      );
      setActionMessage(`Đã ${currentStatus ? "vô hiệu hóa" : "kích hoạt"} mã ${vCode}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Lỗi cập nhật voucher");
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/vouchers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          discount_percent: discountPercent,
          min_order_value: minOrderValue,
          max_discount: maxDiscount,
          usage_limit: usageLimit,
          days_valid: daysValid,
        }),
      });

      if (res.ok) {
        setActionMessage(`Đã tạo thành công voucher ${code.toUpperCase()}`);
        setShowCreateModal(false);
        setCode("");
        fetchVouchers();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Không thể tạo voucher");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-amber-500" />
            Quản Lý Mã Giảm Giá & Chiến Dịch Ưu Đãi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập chương trình khuyến mãi, hạn mức sử dụng và tỷ lệ chiết khấu cho khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchVouchers}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Tạo Mã Voucher Mới
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          ✓ {actionMessage}
        </div>
      )}

      {/* Vouchers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Mã Voucher</th>
                <th className="py-4 px-6">Mức Giảm</th>
                <th className="py-4 px-6">Điều Kiện Đơn Hàng</th>
                <th className="py-4 px-6">Lượt Đã Dùng</th>
                <th className="py-4 px-6">Hạn Sử Dụng</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có mã giảm giá nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 font-mono font-black text-xs tracking-wider">
                          {v.code}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-black text-sky-700 text-sm">
                        -{v.discount_percent}%
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      <p>Đơn tối thiểu: <b>{Number(v.min_order_value).toLocaleString("vi-VN")}đ</b></p>
                      <p className="text-[11px] text-slate-400">Tối đa: {Number(v.max_discount).toLocaleString("vi-VN")}đ</p>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{v.used_count}</span>
                        <span className="text-slate-400">/ {v.usage_limit}</span>
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (v.used_count / v.usage_limit) * 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(v.valid_to).toLocaleDateString("vi-VN")}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <Badge
                        className={`text-[10px] font-bold ${
                          v.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {v.is_active ? "Đang áp dụng" : "Tạm ngưng"}
                      </Badge>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleVoucher(v.id, v.is_active, v.code)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title={v.is_active ? "Tắt voucher" : "Bật voucher"}
                      >
                        {v.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Voucher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Tạo Mã Giảm Giá Mới
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Voucher (In hoa)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: HELLOSUMMER"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giảm (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số ngày có hiệu lực
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={daysValid}
                    onChange={(e) => setDaysValid(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giới hạn số lượt dùng
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs border-slate-200"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Đang lưu...
                    </>
                  ) : (
                    "Hoàn tất tạo voucher"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
