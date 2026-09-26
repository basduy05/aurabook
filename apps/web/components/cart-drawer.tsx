"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
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
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-slate-100">
                Giỏ Hàng Của Bạn ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Giỏ hàng đang trống</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hãy khám phá các tác phẩm sách xuất sắc trên AuraBook
                  </p>
                </div>
                <Link href="/books" onClick={() => setIsCartOpen(false)}>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                    Khám phá sách ngay
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.bookId}-${item.format}`}
                  className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 items-center"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-18 bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center px-1 font-mono">
                        AuraBook
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs font-semibold text-slate-100 truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.author}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 bg-purple-950/60 text-purple-300 border-purple-500/30"
                      >
                        {item.format === "EBOOK" ? "E-Book DRM" : "Sách in"}
                      </Badge>
                      <span className="text-xs font-semibold text-purple-300">
                        {item.price.toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center border border-slate-700 rounded-md bg-slate-900">
                        <button
                          onClick={() =>
                            updateQuantity(item.bookId, item.format, item.quantity - 1)
                          }
                          className="px-2 py-0.5 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.bookId, item.format, item.quantity + 1)
                          }
                          className="px-2 py-0.5 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.bookId, item.format)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tạm tính:</span>
                  <span className="font-mono text-slate-200">
                    {subtotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                {voucherCode && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Mã giảm giá ({voucherCode}):</span>
                    <span className="font-mono">
                      -{discountAmount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-100 pt-1 border-t border-slate-800">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono text-purple-300">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-700 bg-slate-900 text-xs hover:bg-slate-800"
                  >
                    Xem Giỏ Hàng
                  </Button>
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full"
                >
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs flex items-center justify-center gap-1"
                  >
                    Thanh Toán <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
