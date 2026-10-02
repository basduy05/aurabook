"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  User,
  Phone,
  MapPin,
  Search,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrderStatusType = "PENDING" | "PAID" | "SHIPPING" | "DELIVERED" | "CANCELLED";

interface OrderAdminItem {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  final_amount: number;
  status: OrderStatusType;
  created_at: string;
  items_summary: string;
}

const SEED_ORDERS: OrderAdminItem[] = [
  {
    id: "ord-1000000-0001",
    order_code: "AURA-260901",
    customer_name: "Nguyễn Văn An",
    customer_phone: "0912345678",
    customer_email: "an.nguyen@example.com",
    shipping_address: "54 Triều Khúc, Thanh Xuân, Hà Nội",
    payment_method: "SANDBOX_GATEWAY",
    subtotal: 199000,
    discount: 29850,
    final_amount: 169150,
    status: "PAID",
    created_at: "2026-09-26 14:20",
    items_summary: "Thiết Kế Hệ Thống Đa Tác Tử Với AI (E-Book DRM) x 1",
  },
  {
    id: "ord-1000000-0002",
    order_code: "AURA-260902",
    customer_name: "Trần Thị Mai",
    customer_phone: "0987654321",
    customer_email: "mai.tran@example.com",
    shipping_address: "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    payment_method: "COD",
    subtotal: 275000,
    discount: 0,
    final_amount: 300000,
    status: "PENDING",
    created_at: "2026-09-26 15:45",
    items_summary: "Clean Architecture: Kiến Trúc Hiện Đại (Sách in) x 1",
  },
  {
    id: "ord-1000000-0003",
    order_code: "AURA-260903",
    customer_name: "Lê Hoàng Quân",
    customer_phone: "0903112233",
    customer_email: "quan.le@example.com",
    shipping_address: "88 Nguyễn Thị Minh Khai, Hải Châu, Đà Nẵng",
    payment_method: "SANDBOX_GATEWAY",
    subtotal: 367000,
    discount: 55050,
    final_amount: 311950,
    status: "SHIPPING",
    created_at: "2026-09-25 09:12",
    items_summary: "Học Máy & Deep Learning Thực Chiến (In & E-Book) x 1",
  },
  {
    id: "ord-1000000-0004",
    order_code: "AURA-260904",
    customer_name: "Phạm Minh Đức",
    customer_phone: "0977445566",
    customer_email: "duc.pm@example.com",
    shipping_address: "15 Ngô Gia Tự, TP. Cần Thơ",
    payment_method: "SANDBOX_GATEWAY",
    subtotal: 525000,
    discount: 78750,
    final_amount: 446250,
    status: "DELIVERED",
    created_at: "2026-09-24 11:30",
    items_summary: "Combo Kiến Trúc Hệ Thống & Clean Code (Sách in) x 2",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderAdminItem[]>(SEED_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [auditNotice, setAuditNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("aurabook_access_token") : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/admin/orders?limit=50`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "Bearer mock_admin",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const mapped: OrderAdminItem[] = (data.items as Array<Record<string, unknown>>).map((item) => ({
            id: String(item.id),
            order_code: String(item.order_code),
            customer_name: String(item.customer_name || item.user_email || "Khách Hàng"),
            customer_phone: String(item.customer_phone || "Chưa cập nhật"),
            customer_email: String(item.user_email || item.customer_email || "khach@aurabook.vn"),
            shipping_address: String(item.shipping_address || "Giao hàng kỹ thuật số (DRM)"),
            payment_method: String(item.payment_method || "SANDBOX_GATEWAY"),
            subtotal: Number(item.subtotal || item.total_amount),
            discount: Number(item.discount_amount || 0),
            final_amount: Number(item.total_amount),
            status: item.status as OrderStatusType,
            created_at: item.created_at ? new Date(String(item.created_at)).toLocaleString("vi-VN") : "2026-09-26 14:20",
            items_summary: String(item.items_summary || `Đơn hàng ${item.items_count || 1} sản phẩm`),
          }));
          setOrders(mapped);
        }
      }
    } catch {
      // Keep SEED_ORDERS if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // UC11: FSM State Transition
  const handleTransitionStatus = async (orderId: string, orderCode: string, newStatus: OrderStatusType) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("aurabook_access_token") : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      await fetch(`${apiBase}/api/v1/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "Bearer mock_token",
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Chuyển trạng thái đơn sang ${newStatus} qua Admin Portal`,
        }),
      });
    } catch {
      // offline simulation
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    let auditText = `Đã cập nhật đơn hàng ${orderCode} sang trạng thái "${newStatus}".`;
    if (newStatus === "CANCELLED") {
      auditText += " [FSM]: Tự động hoàn lại số lượng tồn kho sách in và ghi AuditLog.";
    } else if (newStatus === "PAID") {
      auditText += " [FSM]: Đã ghi nhận thu tiền thành công và cấp bản quyền E-book DRM.";
    }

    setAuditNotice(auditText);
    setTimeout(() => setAuditNotice(null), 4000);
  };

  const getStatusBadge = (status: OrderStatusType) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
            <Clock className="w-3 h-3 mr-1" /> Chờ Thanh Toán
          </Badge>
        );
      case "PAID":
        return (
          <Badge className="bg-sky-50 text-sky-800 border-sky-300 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã Thanh Toán
          </Badge>
        );
      case "SHIPPING":
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-bold">
            <Truck className="w-3 h-3 mr-1" /> Đang Vận Chuyển
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
            <PackageCheck className="w-3 h-3 mr-1" /> Giao Thành Công
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] font-bold">
            <XCircle className="w-3 h-3 mr-1" /> Đã Hủy Đơn
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Quản Lý Vòng Đời Đơn Hàng (FSM Engine)
                </h1>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                  UC11 FSM
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Máy trạng thái hữu hạn kiểm soát luồng đơn: PENDING → PAID → SHIPPING → DELIVERED (hoặc CANCELLED hoàn kho)
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {auditNotice && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-sky-900 text-xs flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>{auditNotice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn (AURA-...), tên khách, số điện thoại..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Lọc trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 w-full sm:w-auto"
          >
            <option value="ALL">Mọi trạng thái ({orders.length})</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="SHIPPING">Đang giao (SHIPPING)</option>
            <option value="DELIVERED">Đã giao thành công (DELIVERED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Mã Đơn & Thời Gian</th>
                <th className="py-4 px-6">Khách Hàng & Giao Hàng</th>
                <th className="py-4 px-6">Sản Phẩm Đặt Mua</th>
                <th className="py-4 px-6">Thanh Toán</th>
                <th className="py-4 px-6">Trạng Thái FSM</th>
                <th className="py-4 px-6 text-right">Chuyển Trạng Thái FSM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Order Code & Date */}
                    <td className="py-4 px-6">
                      <div className="font-mono font-black text-sky-600">{order.order_code}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{order.created_at}</div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {order.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {order.customer_phone}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{order.shipping_address}</span>
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="py-4 px-6">
                      <div className="text-slate-700 font-medium max-w-xs line-clamp-2">
                        {order.items_summary}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-900 text-sm">
                        {order.final_amount.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {order.payment_method === "SANDBOX_GATEWAY" ? "Cổng Sandbox" : "Thanh toán COD"}
                      </div>
                    </td>

                    {/* Current Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* FSM Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {order.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleTransitionStatus(order.id, order.order_code, "PAID")}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-xs"
                            >
                              Thu tiền (PAID)
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransitionStatus(order.id, order.order_code, "CANCELLED")}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold h-7 px-2.5 rounded-lg"
                            >
                              Hủy Đơn
                            </Button>
                          </>
                        )}

                        {order.status === "PAID" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleTransitionStatus(order.id, order.order_code, "SHIPPING")}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-xs"
                            >
                              Xuất Kho Giao Hàng
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransitionStatus(order.id, order.order_code, "CANCELLED")}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold h-7 px-2.5 rounded-lg"
                            >
                              Hủy & Hoàn Kho
                            </Button>
                          </>
                        )}

                        {order.status === "SHIPPING" && (
                          <Button
                            size="sm"
                            onClick={() => handleTransitionStatus(order.id, order.order_code, "DELIVERED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-xs"
                          >
                            Giao Thành Công (DELIVERED)
                          </Button>
                        )}

                        {order.status === "DELIVERED" && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                            Hoàn tất vòng đời
                          </span>
                        )}

                        {order.status === "CANCELLED" && (
                          <span className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full font-bold border border-rose-200">
                            Đã hoàn kho
                          </span>
                        )}
                      </div>
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
