"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    totalAmount,
    voucherCode,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-900">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Giỏ Hàng Của Bạn ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="text-slate-800 font-bold text-sm">Giỏ hàng của bạn đang trống</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Khám phá các đầu sách hay về Trí tuệ nhân tạo, Kiến trúc phần mềm và công nghệ hiện đại.
                </p>
                <Link href="/books" onClick={() => setIsCartOpen(false)}>
                  <Button className="bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-full font-bold px-5">
                    Mua Sách Ngay
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.bookId}-${item.format}`}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 relative group shadow-sm hover:border-sky-300 transition-colors"
                >
                  <div className="w-14 h-18 bg-white border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 font-mono text-[9px] overflow-hidden">
                    {item.coverUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      "BÌA"
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.bookId, item.format)}
                          className="text-slate-400 hover:text-red-500 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate">{item.author}</div>

                      <div className="mt-1">
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
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                      <div className="text-xs font-bold text-sky-700">
                        {item.price.toLocaleString("vi-VN")} đ
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-mono font-bold px-1.5 text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.bookId, item.format, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                {voucherCode && (
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Voucher ({voucherCode}):
                    </span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-base text-sky-700">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link href="/cart" onClick={() => setIsCartOpen(false)}>
                  <Button variant="outline" className="w-full border-sky-200 text-sky-800 hover:bg-sky-50 text-xs font-semibold h-10 rounded-xl">
                    Xem Giỏ Hàng
                  </Button>
                </Link>
                <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold h-10 rounded-xl shadow-md shadow-amber-500/20">
                    Thanh Toán
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Bảo mật giao dịch & khóa giữ kho 15 phút</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
