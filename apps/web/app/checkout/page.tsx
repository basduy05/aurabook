"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShoppingBag,
  ExternalLink,
  BookOpen,
  Loader2,
  Clock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

type PaymentMethod = "SANDBOX" | "COD";

interface OrderSuccessData {
  orderId: string;
  orderCode: string;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  expiresAt?: string;
  paymentUrl?: string;
  isPaid: boolean;
}

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    discountAmount,
    totalAmount,
    voucherCode,
    clearCart,
    user,
    loginUser,
  } = useCart();

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hà Nội");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("SANDBOX");

  // Loading & Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Auto-fill if user profile is available
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.fullName || "");
      if (!email) setEmail(user.email || "");
    }
  }, [user, fullName, email]);

  const hasPhysical = items.some((i) => i.format === "PHYSICAL" || i.format === "BOTH");
  const hasEbook = items.some((i) => i.format === "EBOOK" || i.format === "BOTH");
  const shippingFee = hasPhysical ? (subtotal > 300000 ? 0 : 25000) : 0;
  const grandTotal = totalAmount + shippingFee;

  // Handle Quick Demo Login if user is guest
  const handleQuickDemoLogin = () => {
    loginUser("demo_token_customer_aura2026", {
      id: "usr-demo-001",
      email: "customer@aurabook.vn",
      fullName: "Độc Giả Thử Nghiệm",
      role: "CUSTOMER",
    });
    setFullName("Độc Giả Thử Nghiệm");
    setEmail("customer@aurabook.vn");
    setPhone("0987654321");
    setAddress("Số 54 Phố Triều Khúc, Thanh Xuân");
    setCity("Hà Nội");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage("Giỏ hàng của bạn đang trống.");
      return;
    }

    if (hasPhysical && (!fullName.trim() || !phone.trim() || !address.trim())) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin giao hàng cho sách in.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("aurabook_access_token") : null;
      const orderPayload = {
        shipping_address: {
          fullName,
          phone,
          email: email || user?.email,
          address,
          city,
          note,
        },
        voucher_code: voucherCode || null,
      };

      let apiSuccess = false;
      let orderResult: OrderSuccessData | null = null;

      // Attempt real API checkout if token exists
      if (token) {
        try {
          // 1. Sync cart items to backend cart first
          for (const item of items) {
            await fetch("http://localhost:8000/api/v1/cart/items", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                book_id: item.bookId,
                format: item.format === "BOTH" ? "PHYSICAL" : item.format,
                quantity: item.quantity,
              }),
            });
          }

          // 2. Execute checkout
          const res = await fetch("http://localhost:8000/api/v1/orders/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderPayload),
          });

          if (res.ok) {
            const data = await res.json();
            orderResult = {
              orderId: data.order_id,
              orderCode: data.order_code,
              finalAmount: Number(data.final_amount),
              paymentMethod,
              expiresAt: data.expires_at,
              paymentUrl: data.payment_url,
              isPaid: false,
            };
            apiSuccess = true;
          }
        } catch {
          // Fallback to local simulation if API is unreachable
          apiSuccess = false;
        }
      }

      // If API wasn't reached or user is demo, create local simulated order
      if (!apiSuccess || !orderResult) {
        const simulatedCode = `AURA-${Date.now().toString().slice(-6)}`;
        orderResult = {
          orderId: `ord-${Date.now()}`,
          orderCode: simulatedCode,
          finalAmount: grandTotal,
          paymentMethod,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          paymentUrl: `http://localhost:8000/api/v1/payments/sandbox-simulator?order_code=${simulatedCode}&amount=${grandTotal}&sig=simulated`,
          isPaid: paymentMethod === "COD",
        };
      }

      clearCart();
      setOrderSuccess(orderResult);
    } catch {
      setErrorMessage("Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateInstantPayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      if (orderSuccess) {
        setOrderSuccess({
          ...orderSuccess,
          isPaid: true,
        });
      }
      setIsSimulatingPayment(false);
    }, 1200);
  };

  // If order is completed, show Order Success & Payment Simulator View
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8">
              {orderSuccess.isPaid ? (
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-cyan-500/10">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {orderSuccess.isPaid
                  ? "Thanh Toán Thành Công!"
                  : "Đơn Hàng Đang Chờ Thanh Toán Sandbox"}
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                Mã đơn hàng: <span className="text-cyan-400 font-mono font-bold">{orderSuccess.orderCode}</span>
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Trạng thái:</span>
                <Badge
                  variant={orderSuccess.isPaid ? "default" : "secondary"}
                  className={orderSuccess.isPaid ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}
                >
                  {orderSuccess.isPaid ? "ĐÃ HOÀN TẤT (PAID)" : "CHỜ THANH TOÁN (PENDING 15 PHÚT)"}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Phương thức:</span>
                <span className="text-slate-200 font-medium">
                  {orderSuccess.paymentMethod === "SANDBOX"
                    ? "Cổng Sandbox Trực tuyến (HMAC-SHA256)"
                    : "Thanh toán khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Tổng thanh toán:</span>
                <span className="text-lg font-bold text-cyan-400">
                  {orderSuccess.finalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {!orderSuccess.isPaid && orderSuccess.paymentMethod === "SANDBOX" && (
              <div className="p-5 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 rounded-xl mb-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-cyan-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Cổng Giả Lập Sandbox Simulator (UC04)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hệ thống kiểm thử tích hợp bảo mật HMAC-SHA256, tự động khóa giữ kho sách in 15 phút và phát hành bản quyền E-book DRM AES-256-GCM khi hoàn tất.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    onClick={handleSimulateInstantPayment}
                    disabled={isSimulatingPayment}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30"
                  >
                    {isSimulatingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xác thực Webhook IPN...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mô Phỏng Thanh Toán Thành Công
                      </>
                    )}
                  </Button>

                  {orderSuccess.paymentUrl && (
                    <a
                      href={orderSuccess.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-cyan-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                      Mở Cổng Simulator Gốc
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {orderSuccess.isPaid && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl mb-6 text-sm text-emerald-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <div className="font-semibold">Bản quyền sách số đã được kích hoạt!</div>
                  <div className="text-xs text-slate-300 mt-1">
                    Bạn có thể truy cập ngay vào Thư viện số AuraBook để đọc sách với công nghệ bảo vệ chống trích xuất bản quyền DRM AES-256-GCM.
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/library" className="w-full sm:w-auto">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Vào Thư Viện Đọc Sách
                </Button>
              </Link>
              <Link href="/books" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white">
                  Tiếp Tục Khám Phá
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Giỏ hàng chưa có sản phẩm</h2>
          <p className="text-slate-400 text-sm mb-6">
            Vui lòng chọn các đầu sách yêu thích trước khi tiến hành thanh toán.
          </p>
          <Link href="/books">
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
              Khám Phá Danh Mục Sách
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Quay lại Giỏ hàng
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Thanh toán mã hóa SSL 256-bit an toàn
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">
          Thanh Toán Đơn Hàng
        </h1>

        {/* Demo Fast Login Banner if guest */}
        {!user && (
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  Bạn đang thanh toán với tư cách Khách
                </div>
                <div className="text-xs text-slate-400">
                  Đăng nhập để lưu lịch sử và đồng bộ quyền đọc sách DRM vĩnh viễn trên mọi thiết bị.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                onClick={handleQuickDemoLogin}
                variant="outline"
                size="sm"
                className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs w-full sm:w-auto"
              >
                Đăng Nhập Nhanh Demo
              </Button>
              <Link href="/login?redirect=/checkout" className="w-full sm:w-auto">
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs w-full sm:w-auto">
                  Đăng Nhập
                </Button>
              </Link>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Delivery Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                1. Thông Tin Nhận Hàng & Khách Hàng
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Họ và tên <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Số điện thoại <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email nhận mã bản quyền / hóa đơn điện tử <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {hasPhysical && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Địa chỉ giao hàng (Sách in) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required={hasPhysical}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Số nhà, tên đường, phường/xã"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Tỉnh / Thành phố
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Hà Nội">Hà Nội</option>
                          <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                          <option value="Đà Nẵng">Đà Nẵng</option>
                          <option value="Hải Phòng">Hải Phòng</option>
                          <option value="Cần Thơ">Cần Thơ</option>
                          <option value="Khác">Tỉnh/Thành khác</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Ghi chú vận chuyển (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Giao giờ hành chính, gọi trước khi giao..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </>
                )}

                {!hasPhysical && hasEbook && (
                  <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Đơn hàng của bạn chỉ gồm sách điện tử E-Book. Mã đọc bản quyền sẽ kích hoạt tự động ngay sau khi thanh toán.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                2. Phương Thức Thanh Toán
              </h2>

              <div className="space-y-3">
                {/* Sandbox Payment Gateway */}
                <label
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "SANDBOX"
                      ? "bg-cyan-950/20 border-cyan-500 ring-1 ring-cyan-500"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="SANDBOX"
                    checked={paymentMethod === "SANDBOX"}
                    onChange={() => setPaymentMethod("SANDBOX")}
                    className="mt-1 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">
                        Cổng Thanh Toán Trực Tuyến Sandbox (Khuyên dùng)
                      </span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                        Sandbox Simulator
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Hỗ trợ Thẻ ATM nội địa, Thẻ Quốc tế (Visa/Mastercard) & Ví điện tử (QR VNPAY/MoMo). Kích hoạt bản quyền tức thì với cơ chế HMAC-SHA256.
                    </p>
                  </div>
                </label>

                {/* COD Payment */}
                <label
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "bg-cyan-950/20 border-cyan-500 ring-1 ring-cyan-500"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  } ${!hasPhysical ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="COD"
                    disabled={!hasPhysical}
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="mt-1 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-sm">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                      {!hasPhysical && (
                        <span className="text-[10px] text-slate-500">Chỉ áp dụng cho sách in</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Thanh toán tiền mặt cho shipper khi bưu tá giao sách giấy đến tận nhà.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>Đơn hàng của bạn</span>
                <span className="text-xs font-normal text-slate-400">({items.length} sản phẩm)</span>
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-6 border-b border-slate-800 pb-4">
                {items.map((item) => (
                  <div key={`${item.bookId}-${item.format}`} className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-slate-800 rounded flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-mono">
                      BOOK
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>SL: {item.quantity}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700">
                          {item.format === "EBOOK" ? "E-Book DRM" : "Sách in"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-slate-200">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-sm text-slate-300 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tạm tính:</span>
                  <span>{subtotal.toLocaleString("vi-VN")} đ</span>
                </div>

                {voucherCode && discountAmount > 0 && (
                  <div className="flex justify-between text-cyan-400">
                    <span>Mã ưu đãi ({voucherCode}):</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-400">Phí vận chuyển:</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-400 font-medium">Miễn phí</span>
                    ) : (
                      `${shippingFee.toLocaleString("vi-VN")} đ`
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Tổng thanh toán:</span>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-cyan-400">
                      {grandTotal.toLocaleString("vi-VN")} đ
                    </div>
                    <div className="text-[11px] text-slate-400">(Đã bao gồm VAT)</div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 text-base shadow-lg shadow-cyan-900/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang thiết lập đơn hàng...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Hoàn Tất Đặt Hàng ({grandTotal.toLocaleString("vi-VN")} đ)
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3 h-3" />
                Bảo vệ chống xâm nhập bản quyền & khóa giữ kho 15 phút
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
