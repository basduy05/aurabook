"use client";

import React, { useState } from "react";
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

    try {
      await fetch(`http://localhost:8000/api/v1/admin/orders/${orderId}/status`, {
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
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
            <Clock className="w-3 h-3 mr-1" /> Chờ Thanh Toán
          </Badge>
        );
      case "PAID":
        return (
          <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã Thanh Toán
          </Badge>
        );
      case "SHIPPING":
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
            <Truck className="w-3 h-3 mr-1" /> Đang Vận Chuyển
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
            <PackageCheck className="w-3 h-3 mr-1" /> Giao Thành Công
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
            <XCircle className="w-3 h-3 mr-1" /> Đã Hủy Đơn
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Quản Lý Vòng Đời Đơn Hàng (FSM Engine)
            </h1>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
              UC11 FSM
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Máy trạng thái hữu hạn kiểm soát luồng đơn: PENDING → PAID → SHIPPING → DELIVERED (hoặc CANCELLED hoàn kho)
          </p>
        </div>
      </div>

      {auditNotice && (
        <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{auditNotice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn (AURA-...), tên khách, số điện thoại..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3 px-4">Mã đơn & Thời gian</th>
                <th className="py-3 px-4">Khách hàng & Nhận hàng</th>
                <th className="py-3 px-4">Sản phẩm mua</th>
                <th className="py-3 px-4">Thanh toán</th>
                <th className="py-3 px-4">Trạng thái FSM</th>
                <th className="py-3 px-4 text-right">Chuyển trạng thái FSM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Order Code & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-cyan-400">{order.order_code}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{order.created_at}</div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      {order.customer_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-slate-500" />
                      {order.customer_phone}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{order.shipping_address}</span>
                    </div>
                  </td>

                  {/* Items Summary */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-300 text-[11px] max-w-xs truncate">
                      {order.items_summary}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">
                      {order.final_amount.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {order.payment_method === "SANDBOX_GATEWAY" ? "Cổng Sandbox" : "Thanh toán COD"}
                    </div>
                  </td>

                  {/* Current Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* FSM Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {order.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleTransitionStatus(order.id, order.order_code, "PAID")}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] h-6 px-2"
                          >
                            Xác nhận Thu tiền (PAID)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransitionStatus(order.id, order.order_code, "CANCELLED")}
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-[10px] h-6 px-2"
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
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] h-6 px-2"
                          >
                            Xuất Kho Giao Hàng
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransitionStatus(order.id, order.order_code, "CANCELLED")}
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-[10px] h-6 px-2"
                          >
                            Hủy & Hoàn Kho
                          </Button>
                        </>
                      )}

                      {order.status === "SHIPPING" && (
                        <Button
                          size="sm"
                          onClick={() => handleTransitionStatus(order.id, order.order_code, "DELIVERED")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-6 px-2"
                        >
                          Giao Thành Công (DELIVERED)
                        </Button>
                      )}

                      {order.status === "DELIVERED" && (
                        <span className="text-[10px] text-emerald-400 font-medium">Hoàn tất vòng đời</span>
                      )}

                      {order.status === "CANCELLED" && (
                        <span className="text-[10px] text-red-400 font-medium">Đã hoàn kho</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
