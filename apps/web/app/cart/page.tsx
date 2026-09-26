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

    const ok = applyVoucher(inputVoucher.trim());
    if (ok) {
      setVoucherMsg({
        type: "success",
        text: "Áp dụng mã AURA2026 thành công! Giảm 15% tổng giá trị đơn hàng.",
      });
      setInputVoucher("");
    } else {
      setVoucherMsg({
        type: "error",
        text: "Mã giảm giá không hợp lệ hoặc đã hết hạn. Hãy thử mã 'AURA2026'.",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Giỏ Hàng Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kiểm tra các ấn phẩm sách giấy và sách số E-book trước khi tiến hành thanh toán.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">
              Chưa có sản phẩm nào trong giỏ
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Bạn có thể tìm kiếm và thêm các tác phẩm sách yêu thích từ danh mục AuraBook.
            </p>
          </div>
          <Link href="/books">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6">
              Khám Phá Sách Ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items list */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2">
              <span>Danh sách ấn phẩm ({items.length})</span>
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            {items.map((item) => (
              <div
                key={`${item.bookId}-${item.format}`}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs font-mono">Aura</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Link href={`/books/${item.slug}`}>
                      <h3 className="text-sm font-bold text-slate-100 hover:text-purple-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400">{item.author}</p>
                    <Badge
                      variant="secondary"
                      className="bg-purple-950/60 text-purple-300 border-purple-500/30 text-[10px]"
                    >
                      {item.format === "EBOOK" ? "E-Book DRM" : "Sách in bìa cứng"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                  {/* Quantity */}
                  <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950">
                    <button
                      onClick={() =>
                        updateQuantity(item.bookId, item.format, item.quantity - 1)
                      }
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.bookId, item.format, item.quantity + 1)
                      }
                      className="px-2.5 py-1 text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-sm font-extrabold text-purple-300 font-mono">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeFromCart(item.bookId, item.format)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Col: Summary & Checkout */}
          <div className="lg:col-span-4 space-y-4">
            {/* Voucher Box */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>Mã Giảm Giá Voucher</span>
              </div>

              {voucherCode ? (
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold">{voucherCode}</span>
                    <span className="text-[11px] text-slate-400">(-15%)</span>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    Gỡ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    value={inputVoucher}
                    onChange={(e) => setInputVoucher(e.target.value)}
                    placeholder="Nhập mã 'AURA2026'..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                  >
                    Áp dụng
                  </Button>
                </form>
              )}

              {voucherMsg && (
                <div
                  className={`text-[11px] flex items-center gap-1.5 ${
                    voucherMsg.type === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {voucherMsg.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{voucherMsg.text}</span>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-slate-100">Tóm Tắt Đơn Hàng</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tạm tính:</span>
                  <span className="font-mono text-slate-200">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {voucherCode && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Giảm giá ({voucherCode}):</span>
                    <span className="font-mono">
                      -{discountAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Phí vận chuyển:</span>
                  <span className="text-emerald-400 font-medium">Miễn phí</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold text-slate-100">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-lg text-purple-300 font-mono">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="block pt-2">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs h-11 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
                  Tiến Hành Thanh Toán <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Bảo mật giao dịch với mã hóa SSL & HMAC-SHA256</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
