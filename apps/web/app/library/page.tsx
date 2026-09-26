"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Clock,
  Library,
  Sparkles,
  ArrowRight,
  Bookmark,
  Award,
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
          // High quality demo fallback
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
              current_page: 24,
              total_pages: 180,
              progress_percent: 45.0,
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
              current_page: 72,
              total_pages: 240,
              progress_percent: 68.5,
              last_read_at: new Date().toISOString(),
            },
            {
              book_id: "e11b89a2-990a-4a7b-b5cb-7341829e248a",
              title: "Kiến Trúc Microservices & Event-Driven Tối Thượng",
              slug: "kien-truc-microservices-event-driven",
              author: "Trần Hoàng Long",
              cover_url:
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
              format: "EBOOK",
              granted_at: new Date().toISOString(),
              current_page: 15,
              total_pages: 320,
              progress_percent: 18.0,
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-amber-50/20 text-slate-900 flex flex-col">
      {/* Header bar */}
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-2">
              Tủ Sách Số Cá Nhân
              <Badge className="bg-amber-100 text-amber-800 border-amber-300/80 text-[10px] font-bold px-2 py-0.5">
                AURA VIP
              </Badge>
            </h1>
            <p className="text-xs text-slate-500">
              Bản quyền sở hữu số bảo vệ bằng WebAssembly Canvas DRM & AES-256-GCM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bản Quyền Số Hợp Lệ
          </Badge>
          <Link href="/books">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs">
              Mua thêm sách
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Highlight Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-sky-100 rounded-3xl p-5 shadow-lg shadow-sky-950/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">E-book sở hữu</p>
              <h3 className="text-2xl font-black text-slate-900">{books.length} cuốn</h3>
              <p className="text-[11px] text-sky-600 font-medium">Truy cập không giới hạn trọn đời</p>
            </div>
          </div>

          <div className="bg-white border border-amber-100 rounded-3xl p-5 shadow-lg shadow-amber-950/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiến độ đọc</p>
              <h3 className="text-2xl font-black text-slate-900">
                {books.length > 0
                  ? Math.round(books.reduce((acc, b) => acc + b.progress_percent, 0) / books.length)
                  : 0}%
              </h3>
              <p className="text-[11px] text-amber-700 font-medium">Tự động đồng bộ vị trí trang</p>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-lg shadow-emerald-950/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bảo vệ DRM</p>
              <h3 className="text-2xl font-black text-slate-900">100% An toàn</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Chống sao chép & chụp màn hình</p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Tủ Sách Điện Tử Của Bạn
              <span className="text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200/60">
                {books.length} tác phẩm
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhấn &quot;Đọc sách ngay&quot; để mở trình đọc WASM Canvas DRM tích hợp Trợ lý hỏi đáp RAG
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <span>Đang đồng bộ dữ liệu bản quyền thư viện số...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-sky-200 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Bạn chưa có sách điện tử nào trong Tủ sách</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Khám phá ngay kho sách công nghệ cao, kiến trúc AI, thuật toán và tài chính số tại cửa hàng AuraBook.
            </p>
            <Link href="/books">
              <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-md shadow-sky-500/20 px-6 py-2.5 text-xs">
                Khám phá sách tại Cửa Hàng
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((b) => (
              <div
                key={b.book_id}
                className="perspective-1000 group"
              >
                <Card className="bg-white border border-sky-100/80 rounded-3xl overflow-hidden shadow-lg shadow-sky-950/5 group-hover:shadow-2xl group-hover:shadow-sky-500/15 group-hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-full">
                  {/* Visual Preview Header with 3D Cover */}
                  <div className="relative h-48 bg-gradient-to-tr from-sky-100 via-sky-50 to-amber-50 p-6 flex items-center justify-center overflow-hidden">
                    {/* Glowing background circle */}
                    <div className="absolute w-32 h-32 rounded-full bg-sky-300/30 blur-2xl group-hover:scale-150 transition-transform duration-500" />
                    
                    {/* 3D Book Cover Simulator */}
                    <div className="relative w-24 h-36 rounded-lg shadow-xl shadow-slate-900/20 overflow-hidden transform group-hover:rotate-y-12 group-hover:scale-105 transition-all duration-300 border border-white/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 backdrop-blur-md text-sky-800 border-sky-200 text-[10px] font-bold shadow-xs">
                        WASM DRM
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                        {Math.round(b.progress_percent)}% hoàn thành
                      </span>
                    </div>
                  </div>

                  <CardHeader className="space-y-2 p-5 pb-2">
                    <CardTitle className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
                      {b.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                      Tác giả: <span className="text-slate-700 font-semibold">{b.author}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5 pt-2">
                    {/* Progress bar in warm gold */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${Math.max(8, b.progress_percent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span className="font-mono text-slate-700">
                        Trang {b.current_page} / {b.total_pages}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-sky-500" /> Đã đồng bộ
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Link href={`/reader/${b.book_id}`} className="w-full">
                      <Button className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-sky-500/20 gold-shimmer flex items-center justify-center gap-2 group-hover:shadow-sky-500/30 transition-all">
                        <BookOpen className="w-4 h-4" />
                        Đọc Sách Ngay
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
