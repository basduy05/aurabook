"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    totalAmount,
    voucherCode,
    applyVoucher,
    removeVoucher,
  } = useCart();

  const [inputVoucher, setInputVoucher] = useState("");
  const [voucherMsg, setVoucherMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVoucher.trim()) return;

    const success = applyVoucher(inputVoucher);
    if (success) {
      setVoucherMsg({
        type: "success",
        text: "Áp dụng thành công mã AURA2026! Giảm 15% tổng đơn hàng.",
      });
      setInputVoucher("");
    } else {
      setVoucherMsg({
        type: "error",
        text: "Mã ưu đãi không hợp lệ. Vui lòng thử lại với mã AURA2026.",
      });
    }
  };

  const hasPhysical = items.some((i) => i.format === "PHYSICAL" || i.format === "BOTH");
  const shippingFee = hasPhysical ? (subtotal > 300000 ? 0 : 25000) : 0;
  const grandTotal = totalAmount + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-white py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Giỏ hàng của bạn đang trống</h1>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Hãy khám phá các đầu sách xuất sắc về Trí tuệ nhân tạo, Kiến trúc phần mềm và bản quyền số E-book DRM.
          </p>
          <Link href="/books">
            <Button className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 px-6 rounded-full shadow-md shadow-sky-600/20">
              Khám Phá Sách Ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/30 via-white to-white text-slate-800 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight">
            Giỏ Hàng Mua Sách
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý ấn phẩm, áp dụng mã khuyến mãi và tiến hành thanh toán an toàn
          </p>
        </div>

        <Link
          href="/books"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Tiếp tục chọn sách
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span>Danh sách sản phẩm ({items.length})</span>
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Xóa toàn bộ
              </button>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {items.map((item) => (
                <div
                  key={`${item.bookId}-${item.format}`}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-20 bg-slate-100 border border-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center font-mono text-[9px] text-slate-400 overflow-hidden shadow-sm">
                      {item.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        "BÌA"
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/books/${item.slug}`}>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 hover:text-sky-600 truncate transition-colors">
                          {item.title}
                        </h3>
                      </Link>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.author}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 border-none ${
                            item.format === "EBOOK"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {item.format === "EBOOK" ? "E-Book DRM" : "Sách in giấy"}
                        </Badge>
                        <span className="text-xs font-bold text-sky-700">
                          {item.price.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.bookId, item.format, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs font-bold shadow-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.bookId, item.format, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center text-xs font-bold shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="font-black text-xs sm:text-sm text-slate-900">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.bookId, item.format)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Voucher & Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Voucher Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-500" />
              Mã Ưu Đãi / Khuyến Mãi
            </h3>

            {voucherCode ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-amber-900">Voucher: {voucherCode}</div>
                  <div className="text-[11px] text-amber-700">Đã áp dụng giảm 15%</div>
                </div>
                <button
                  onClick={removeVoucher}
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={inputVoucher}
                  onChange={(e) => setInputVoucher(e.target.value)}
                  placeholder="Nhập AURA2026..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-sky-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl px-4"
                >
                  Áp Dụng
                </Button>
              </form>
            )}

            {voucherMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  voucherMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {voucherMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span>{voucherMsg.text}</span>
              </div>
            )}
          </div>

          {/* Cost Breakdown & Checkout CTA */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-semibold text-slate-800">{subtotal.toLocaleString("vi-VN")} đ</span>
              </div>

              {voucherCode && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Mã giảm giá ({voucherCode}):</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  ) : (
                    `${shippingFee.toLocaleString("vi-VN")} đ`
                  )}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Tổng thanh toán:</span>
                <div className="text-right">
                  <div className="text-xl font-black text-sky-700">
                    {grandTotal.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-[10px] text-slate-400">(Đã bao gồm thuế VAT)</div>
                </div>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm h-12 rounded-2xl shadow-lg shadow-amber-500/25 transition-all mt-2">
                Tiến Hành Thanh Toán
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo vệ quyền lợi độc giả & giữ kho sách in 15 phút</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
