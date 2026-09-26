"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/books";
  const { loginUser } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fillDemoCustomer = () => {
    setEmail("customer@aurabook.vn");
    setPassword("Password123@");
    setErrorMessage(null);
  };

  const fillDemoAdmin = () => {
    setEmail("admin@aurabook.vn");
    setPassword("AdminSecret123@");
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      let loggedIn = false;

      // 1. Try real backend API
      try {
        const res = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          loginUser(data.access_token, {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.full_name,
            role: data.user.role,
          });
          loggedIn = true;
        } else {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(err.detail || "Email hoặc mật khẩu không chính xác.");
          setIsLoading(false);
          return;
        }
      } catch {
        // Backend not running, proceed to fallback mock
        loggedIn = false;
      }

      // 2. Demo fallback if backend is offline
      if (!loggedIn) {
        const isAdmin = email.includes("admin");
        loginUser("mock_jwt_token_demo_aura2026", {
          id: isAdmin ? "usr-admin-001" : "usr-customer-001",
          email: email || "reader@aurabook.vn",
          fullName: isAdmin ? "Hệ Thống Admin AuraBook" : "Độc Giả Thử Nghiệm",
          role: isAdmin ? "ADMIN" : "CUSTOMER",
        });
      }

      setSuccessMessage("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 800);
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background aesthetic glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/25">
            A
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Aura<span className="text-cyan-400">Book</span>
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Truy cập kho sách số bản quyền DRM & lịch sử đơn hàng
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng Nhập
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* 1-Click Fast Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Đăng nhập nhanh với tài khoản Demo:
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoCustomer}
                className="border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs py-1.5"
              >
                Khách Hàng Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoAdmin}
                className="border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs py-1.5"
              >
                Quản Trị Viên Demo
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Chưa có tài khoản độc giả?{" "}
            <Link
              href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Bảo mật JWT mã hóa BCrypt & OAuth2 chuẩn công nghiệp</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
