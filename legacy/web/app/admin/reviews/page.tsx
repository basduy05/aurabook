"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Trash2,
  RefreshCw,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewItem {
  id: string;
  user_name: string;
  user_email: string;
  book_title: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiBase}/api/v1/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(data.items || []);
      } else {
        // Fallback demo
        setReviews([
          {
            id: "rev-1",
            user_name: "Đặng Quốc Bảo",
            user_email: "customer@aurabook.vn",
            book_title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
            rating: 5,
            comment: "Sách viết cực kỳ thực tế và sâu sắc! Phần thiết kế RAG Hybrid Search giải thích rất cặn kẽ thuật toán RRF.",
            created_at: new Date().toISOString(),
          },
          {
            id: "rev-2",
            user_name: "Nguyễn Thúy Quỳnh",
            user_email: "reader@aurabook.vn",
            book_title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
            rating: 5,
            comment: "Một ấn phẩm công nghệ đỉnh cao của tác giả Việt. Tác tử tự trị và Function Calling được triển khai bám sát thực tế.",
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này khỏi hệ thống?")) return;
    try {
      const token = localStorage.getItem("aurabook_access_token") || "demo_token";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      await fetch(`${apiBase}/api/v1/admin/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews((prev) => prev.filter((r) => r.id !== id));
      setActionMessage("Đã xóa đánh giá thành công.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      setActionMessage("Lỗi xóa đánh giá");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            Kiểm Duyệt & Quản Lý Đánh Giá Độc Giả
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi phản hồi về chất lượng sách, hỗ trợ kiểm duyệt nội dung phản cảm hoặc spam
          </p>
        </div>

        <Button
          onClick={fetchReviews}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs flex items-center gap-1.5 border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          ✓ {actionMessage}
        </div>
      )}

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            Đang tải dữ liệu đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-400">
            Chưa có đánh giá nào từ độc giả.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {r.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{r.user_name}</p>
                      <p className="text-[11px] text-slate-400">{r.user_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span className="font-bold text-xs text-amber-800">{r.rating}/5</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-2xl text-xs text-slate-700 leading-relaxed italic border border-slate-100 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>&quot;{r.comment || "Độc giả không để lại bình luận chi tiết."}&quot;</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[240px]">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="font-medium truncate">{r.book_title}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">
                    {new Date(r.created_at).toLocaleDateString("vi-VN")}
                  </span>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa đánh giá này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
