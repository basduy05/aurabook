"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  ShoppingBag,
  Star,
  RefreshCw,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  cover_url?: string;
  format: "PHYSICAL" | "EBOOK" | "BOTH";
  sale_price: number;
  original_price: number;
  average_rating: number;
  total_reviews: number;
  description?: string;
  rrf_score?: number;
  match_type?: string;
}

const SEED_BOOKS: BookItem[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
    slug: "thiet-ke-he-thong-da-tac-tu-ai-rag",
    author: "AuraBook Lab",
    cover_url:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    format: "BOTH",
    sale_price: 199000,
    original_price: 250000,
    average_rating: 4.9,
    total_reviews: 48,
    description:
      "Cẩm nang toàn diện về kiến trúc Multi-Agent Systems, RAG vector hybrid search và ứng dụng thực tiễn.",
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    title: "Clean Architecture: Kiến Trúc Phần Mềm Hiện Đại",
    slug: "clean-architecture-kien-truc-phan-mem-hien-dai",
    author: "Robert C. Martin",
    cover_url:
      "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
    format: "PHYSICAL",
    sale_price: 275000,
    original_price: 320000,
    average_rating: 4.8,
    total_reviews: 35,
    description:
      "Các nguyên tắc vàng để thiết kế hệ thống phần mềm có khả năng kiểm thử độc lập, linh hoạt và trường tồn.",
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    title: "Học Máy & Deep Learning Thực Chiến",
    slug: "hoc-may-va-deep-learning-thuc-chien",
    author: "Auriel Vance",
    cover_url:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    format: "EBOOK",
    sale_price: 168000,
    original_price: 210000,
    average_rating: 5.0,
    total_reviews: 29,
    description:
      "Hướng dẫn lập trình mô hình học sâu từ cơ bản đến nâng cao với PyTorch, Transformers và các giải pháp thực tế.",
  },
  {
    id: "b1000000-0000-0000-0000-000000000004",
    title: "Lập Trình Web Hiện Đại Với Next.js 15 & React 19",
    slug: "lap-trinh-web-hien-dai-nextjs-15-react-19",
    author: "Guillermo Rauch & Vercel Team",
    cover_url:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    format: "BOTH",
    sale_price: 219000,
    original_price: 280000,
    average_rating: 4.9,
    total_reviews: 31,
    description:
      "Làm chủ App Router, Server Actions, tối ưu hóa Core Web Vitals và triển khai Full-Stack Next.js 15 chuyên nghiệp.",
  },
];

function BooksContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const { addToCart } = useCart();

  const [books, setBooks] = useState<BookItem[]>(SEED_BOOKS);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [useHybridSearch, setUseHybridSearch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useHybridSearch && searchTerm.trim()) {
        const res = await fetch(
          `http://localhost:8000/api/v1/books/search/hybrid?q=${encodeURIComponent(
            searchTerm.trim()
          )}&limit=12`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setBooks(data);
            setIsLoading(false);
            return;
          }
        }
      } else {
        const formatQuery = formatFilter !== "ALL" ? `&format=${formatFilter}` : "";
        const searchQuery = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
        const res = await fetch(
          `http://localhost:8000/api/v1/books?limit=12${formatQuery}${searchQuery}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setBooks(data.items);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch {
      // Fallback to local filter
    }

    // Local in-memory filter fallback
    let filtered = SEED_BOOKS;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q))
      );
    }
    if (formatFilter !== "ALL") {
      filtered = filtered.filter(
        (b) => b.format === formatFilter || b.format === "BOTH"
      );
    }
    setBooks(filtered);
    setIsLoading(false);
  }, [searchTerm, formatFilter, useHybridSearch]);

  useEffect(() => {
    startTransition(() => {
      fetchBooks();
    });
  }, [fetchBooks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 bg-white border border-sky-100 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Tìm Kiếm Thông Minh RRF k=60 (UC02)
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-sky-950 tracking-tight">
            Danh Mục Sách Chuyên Sâu & Bản Quyền Số
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Hệ thống tra cứu kép kết hợp từ vựng Lexical BM25 và ngữ nghĩa vector 768 chiều L2-normalized, giúp bạn tìm ra chính xác ấn phẩm công nghệ phù hợp nhất.
          </p>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Input Search */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên sách, tác giả hoặc câu hỏi kỹ thuật (vd: RAG, Clean Architecture, Next.js)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          {/* Format Filters & Hybrid Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Format buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFormatFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  formatFilter === "ALL"
                    ? "bg-white text-sky-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất Cả
              </button>
              <button
                onClick={() => setFormatFilter("PHYSICAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  formatFilter === "PHYSICAL"
                    ? "bg-white text-sky-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sách In
              </button>
              <button
                onClick={() => setFormatFilter("EBOOK")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  formatFilter === "EBOOK"
                    ? "bg-white text-sky-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                E-Book DRM
              </button>
            </div>

            {/* Hybrid Search Toggle Button */}
            <button
              onClick={() => setUseHybridSearch(!useHybridSearch)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                useHybridSearch
                  ? "bg-sky-50 border-sky-300 text-sky-800 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${useHybridSearch ? "text-amber-500" : "text-slate-400"}`} />
              <span>RRF Hybrid Search</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${useHybridSearch ? "bg-sky-200 text-sky-900" : "bg-slate-200 text-slate-600"}`}>
                {useHybridSearch ? "BẬT" : "TẮT"}
              </span>
            </button>
          </div>
        </div>

        {useHybridSearch && (
          <div className="flex items-center gap-2 text-[11px] text-sky-800 bg-sky-50 p-2.5 rounded-xl border border-sky-200/80">
            <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              Đang áp dụng thuật toán <strong>Reciprocal Rank Fusion (k=60)</strong>: Xếp hạng tự động dựa trên độ tương đồng ngữ nghĩa 768 chiều & từ khóa chính xác.
            </span>
          </div>
        )}
      </div>

      {/* Book Grid */}
      {isLoading || isPending ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tính toán vector và tìm kiếm ấn phẩm...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-3 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">Không tìm thấy ấn phẩm phù hợp</h3>
          <p className="text-xs text-slate-500">
            Hãy thử tìm bằng từ khóa khác hoặc tắt chế độ tìm kiếm lai để xem toàn bộ danh mục.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setFormatFilter("ALL");
            }}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-full"
          >
            Hiển Thị Toàn Bộ Sách
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-xl card-3d-hover flex flex-col justify-between group transition-all"
            >
              <div>
                {/* Book Cover */}
                <Link href={`/books/${book.slug}`} className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 shadow-inner">
                  {book.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-mono text-xs">
                      BÌA SÁCH
                    </div>
                  )}

                  {/* Format Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      className={`text-[10px] font-bold shadow-sm ${
                        book.format === "EBOOK"
                          ? "bg-amber-400 text-amber-950 font-bold border border-amber-500/30"
                          : book.format === "PHYSICAL"
                          ? "bg-sky-600 text-white"
                          : "bg-gradient-to-r from-sky-600 to-amber-600 text-white"
                      }`}
                    >
                      {book.format === "EBOOK"
                        ? "E-Book DRM"
                        : book.format === "PHYSICAL"
                        ? "Sách in"
                        : "In & E-Book"}
                    </Badge>
                  </div>

                  {book.match_type && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-sky-950/80 backdrop-blur-sm text-sky-300 border border-sky-400/30 text-[9px]">
                        {book.match_type}
                      </Badge>
                    </div>
                  )}
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {book.average_rating || 5.0}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({book.total_reviews || 0})
                  </span>
                </div>

                {/* Title & Author */}
                <Link href={`/books/${book.slug}`}>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 hover:text-sky-600 transition-colors line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-[11px] text-slate-500 truncate mb-3">
                  {book.author}
                </p>

                {/* Pricing */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-base font-black text-sky-700">
                    {Number(book.sale_price).toLocaleString("vi-VN")} đ
                  </span>
                  {book.original_price > book.sale_price && (
                    <span className="text-xs text-slate-400 line-through">
                      {Number(book.original_price).toLocaleString("vi-VN")} đ
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Link href={`/books/${book.slug}`} className="w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-8"
                  >
                    Chi tiết
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() =>
                    addToCart({
                      bookId: book.id,
                      title: book.title,
                      slug: book.slug,
                      author: book.author,
                      coverUrl: book.cover_url,
                      price: Number(book.sale_price),
                      format: book.format === "EBOOK" ? "EBOOK" : "PHYSICAL",
                    })
                  }
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl h-8 shadow-sm flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3" /> Thêm
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BooksPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-xs">Đang tải danh mục sách...</div>}>
      <BooksContent />
    </React.Suspense>
  );
}
