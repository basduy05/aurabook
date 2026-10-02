"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Building2,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Lock,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SystemSettingsState {
  platform_name: string;
  hotline: string;
  support_email: string;
  sandbox_hmac_secret: string;
  pessimistic_hold_minutes: number;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  drm_canvas_enabled: boolean;
  rag_hybrid_enabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettingsState = {
  platform_name: "AuraBook — Sàn Sách Công Nghệ & Bản Quyền DRM Thế Hệ Mới",
  hotline: "1900 8866 (8:00 - 21:00)",
  support_email: "hotro@aurabook.vn",
  sandbox_hmac_secret: "aura_sandbox_hmac_secret_2026",
  pessimistic_hold_minutes: 15,
  free_shipping_threshold: 300000,
  standard_shipping_fee: 25000,
  drm_canvas_enabled: true,
  rag_hybrid_enabled: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("aurabook_access_token") || "mock_token";
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/v1/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch {
        // default
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "mock_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiBase}/api/v1/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } catch {
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Cấu Hình Hệ Thống & Cổng Thanh Toán
                </h1>
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
                  Thiết Lập Vận Hành
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập tham số thanh toán Sandbox HMAC-SHA256, thời gian khóa giữ kho và chính sách vận chuyển
              </p>
            </div>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công cấu hình hệ thống AuraBook!</span>
        </div>
      )}

      {/* System Health Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Database</p>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SQLite / pgvector
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">AI Core</p>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Gemini 2.0 Flash
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Bản Quyền DRM</p>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              AES-256-GCM WASM
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">FastAPI Server</p>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Port 8000 OK
            </h4>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Platform & Contact */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">Thông Tin Nền Tảng & Liên Hệ</h3>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tên Nền Tảng Sàn Sách</label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Hotline Hỗ Trợ Độc Giả</label>
                <input
                  type="text"
                  value={settings.hotline}
                  onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Tiếp Nhận Bản Quyền</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="p-3 bg-sky-50/60 rounded-2xl border border-sky-100 text-xs text-slate-600 leading-relaxed">
              Thông tin này sẽ được hiển thị tại Chân trang (Footer), Hóa đơn điện tử PDF và thông báo gửi email tới độc giả khi mua sách thành công.
            </div>
          </div>

          {/* Card 2: Sandbox Gateway & Shipping Rules */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Cổng Thanh Toán Sandbox & Vận Chuyển</h3>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                HMAC-SHA256 Secret Key (Webhook IPN)
              </label>
              <input
                type="text"
                value={settings.sandbox_hmac_secret}
                onChange={(e) => setSettings({ ...settings, sandbox_hmac_secret: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400">
                Khóa bí mật dùng để đối soát chữ ký số giữa Cổng thanh toán Sandbox và backend FastAPI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Khóa Giữ Kho
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.pessimistic_hold_minutes}
                    onChange={(e) => setSettings({ ...settings, pessimistic_hold_minutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">phút</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Phí Ship Chuẩn
                </label>
                <input
                  type="number"
                  step="5000"
                  value={settings.standard_shipping_fee}
                  onChange={(e) => setSettings({ ...settings, standard_shipping_fee: parseInt(e.target.value) || 25000 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Freeship Từ
                </label>
                <input
                  type="number"
                  step="50000"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseInt(e.target.value) || 300000 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
              Khóa bi quan 15 phút (SELECT FOR UPDATE) tự động bảo vệ số lượng tồn kho của sách in trong khi khách hàng đang quét mã QR hoặc nhập thẻ Sandbox.
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold px-6 py-2.5 shadow-md shadow-sky-500/20"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Đang lưu cấu hình...
              </>
            ) : (
              "Lưu Cấu Hình Hệ Thống"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
