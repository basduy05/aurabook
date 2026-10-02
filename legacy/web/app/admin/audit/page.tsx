"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  User,
  FileText,
  Clock,
  Globe,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLogItem {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

const SEED_LOGS: AuditLogItem[] = [
  {
    id: "aud-001",
    user_id: "admin-user-id",
    user_email: "admin@aurabook.vn",
    action: "UPDATE_AI_CONFIG",
    entity_type: "AI_SYSTEM",
    entity_id: "gemini-2.0-flash",
    details: {
      temperature: 0.2,
      chunk_size_tokens: 512,
      similarity_threshold: 0.7,
      note: "Điều chỉnh tham số RAG chuẩn k=60",
    },
    ip_address: "192.168.1.10",
    created_at: "2026-09-30 10:45:12",
  },
  {
    id: "aud-002",
    user_id: "admin-user-id",
    user_email: "admin@aurabook.vn",
    action: "CANCEL_ORDER_AND_RESTOCK",
    entity_type: "ORDER",
    entity_id: "AURA-260902",
    details: {
      reason: "Khách hàng đổi ý, tự động hoàn kho +1 cuốn Sách in",
      status_before: "PENDING",
      status_after: "CANCELLED",
    },
    ip_address: "192.168.1.10",
    created_at: "2026-09-30 10:30:00",
  },
  {
    id: "aud-003",
    user_id: "admin-user-id",
    user_email: "admin@aurabook.vn",
    action: "GRANT_DRM_LICENSE",
    entity_type: "DRM",
    entity_id: "lic-202609-001",
    details: {
      customer: "customer@aurabook.vn",
      book: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
      cipher: "AES-256-GCM Ephemeral",
    },
    ip_address: "127.0.0.1",
    created_at: "2026-09-30 09:15:40",
  },
  {
    id: "aud-004",
    user_id: "admin-user-id",
    user_email: "admin@aurabook.vn",
    action: "CATALOG_VISION_OCR_AUTOFILL",
    entity_type: "BOOK",
    entity_id: "b1000000-0000-0000-0000-000000000001",
    details: {
      model: "gemini-2.0-flash",
      extracted_isbn: "978-604-0-12345-6",
      confidence: 0.98,
    },
    ip_address: "127.0.0.1",
    created_at: "2026-09-29 16:22:18",
  },
  {
    id: "aud-005",
    user_id: "admin-user-id",
    user_email: "admin@aurabook.vn",
    action: "TOGGLE_USER_STATUS",
    entity_type: "USER",
    entity_id: "u-9912",
    details: {
      target_email: "spam_bot@example.com",
      status: "LOCKED",
      reason: "Spam bình luận thô tục nhiều lần",
    },
    ip_address: "192.168.1.15",
    created_at: "2026-09-28 14:10:05",
  },
];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>(SEED_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "mock_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/admin/audit-logs?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLogs(data);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = entityFilter === "ALL" || log.entity_type === entityFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEntity && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("CANCEL") || action.includes("DELETE") || action.includes("LOCKED")) {
      return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">{action}</Badge>;
    }
    if (action.includes("UPDATE") || action.includes("AI")) {
      return <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">{action}</Badge>;
    }
    if (action.includes("GRANT") || action.includes("PAID") || action.includes("RESTOCK")) {
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">{action}</Badge>;
    }
    return <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">{action}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
                </h1>
                <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                  Bảo Mật & Tuân Thủ
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi vết minh bạch mọi thao tác quản trị: hoàn kho FSM, chỉnh sửa cấu hình AI, cấp quyền DRM và khóa tài khoản
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={fetchLogs}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hành vi (CANCEL, UPDATE...), email người thực hiện, mã đối tượng..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Phân hệ:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-500 w-full sm:w-auto"
          >
            <option value="ALL">Tất cả phân hệ ({logs.length})</option>
            <option value="AI_SYSTEM">Trí tuệ nhân tạo (AI_SYSTEM)</option>
            <option value="ORDER">Đơn hàng FSM (ORDER)</option>
            <option value="BOOK">Ấn phẩm sách (BOOK)</option>
            <option value="DRM">Bản quyền số (DRM)</option>
            <option value="USER">Người dùng (USER)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6">Thời Gian</th>
                <th className="py-4 px-6">Người Thực Hiện</th>
                <th className="py-4 px-6">Hành Vi (Action)</th>
                <th className="py-4 px-6">Phân Hệ & Mã Đối Tượng</th>
                <th className="py-4 px-6">Địa Chỉ IP</th>
                <th className="py-4 px-6 text-right">Chi Tiết Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy bản ghi kiểm toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.created_at}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="font-bold text-slate-900">{log.user_email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-700">{log.entity_type}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{log.entity_id}</span>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{log.ip_address}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-xl text-[11px] font-bold border-slate-200 text-slate-700 hover:text-sky-600 hover:bg-sky-50 h-7"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Xem JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Chi Tiết Nhật Ký: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">ID: </span>
                  <span className="text-slate-700">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-400">IP: </span>
                  <span className="text-slate-700">{selectedLog.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-400">Đối Tượng: </span>
                  <span className="text-slate-700">{selectedLog.entity_type} / {selectedLog.entity_id}</span>
                </div>
                <div>
                  <span className="text-slate-400">Thời Điểm: </span>
                  <span className="text-slate-700">{selectedLog.created_at}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payload Chi Tiết (JSON)
                </label>
                <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setSelectedLog(null)}
                size="sm"
                className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
              >
                Đóng Cửa Sổ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
