"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Clock,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EbookItem {
  book_id: string;
  title: string;
  slug: string;
  author: string;
  cover_url?: string;
  format: string;
  granted_at: string;
  current_page: number;
  total_pages: number;
  progress_percent: number;
  last_read_at?: string;
}

export default function DigitalLibraryPage() {
  const [books, setBooks] = useState<EbookItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const token = localStorage.getItem("aurabook_access_token") || "demo_token";
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(`${apiBase}/api/v1/ebooks/my-library`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setBooks(data);
        } else {
          // Demo fallback
          setBooks([
            {
              book_id: "c84b42b6-a51b-4f9e-a89c-486a41f64923",
              title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
              slug: "thiet-ke-he-thong-da-tac-tu-ai-rag",
              author: "AuraBook Lab",
              cover_url:
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
              format: "EBOOK",
              granted_at: new Date().toISOString(),
              current_page: 1,
              total_pages: 3,
              progress_percent: 33.3,
              last_read_at: new Date().toISOString(),
            },
            {
              book_id: "f91a27e8-b23c-41ad-89ef-312c98234ab1",
              title: "Tư Duy Độc Lập Trong Kỷ Nguyên Trí Tuệ Nhân Tạo",
              slug: "tu-duy-doc-lap-trong-ky-nguyen-ai",
              author: "Nguyễn Văn Minh",
              cover_url:
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
              format: "EBOOK",
              granted_at: new Date().toISOString(),
              current_page: 2,
              total_pages: 5,
              progress_percent: 40.0,
              last_read_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Thư Viện Số Cá Nhân
            </h1>
            <p className="text-xs text-slate-400">
              Các ấn phẩm E-book được bảo vệ bản quyền DRM WebAssembly
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1 text-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Bản Quyền Số Hợp Lệ
        </Badge>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Sách Đang Đọc ({books.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Nhấn &quot;Mở đọc sách&quot; để khởi tạo Canvas bảo mật WebAssembly
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-sm">
            Đang tải dữ liệu bản quyền sách...
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl p-8 space-y-4">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">
              Bạn chưa có sách điện tử nào trong Thư viện số.
            </p>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs mt-2">
                Khám phá sách tại Cửa Hàng
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((b) => (
              <Card
                key={b.book_id}
                className="bg-slate-900/60 border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-purple-950/60 text-purple-300 border-purple-800/40 text-[10px]"
                    >
                      DRM WASM Protected
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      {Math.round(b.progress_percent)}% hoàn thành
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                    {b.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Tác giả: {b.author}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, b.progress_percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>
                      Trang {b.current_page} / {b.total_pages}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Đã lưu
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-800/60">
                  <Link href={`/reader/${b.book_id}`} className="w-full">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 gap-2">
                      <BookOpen className="w-4 h-4" /> Mở Đọc Sách
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
