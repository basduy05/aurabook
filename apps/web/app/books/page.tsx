"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Sparkles,
  ShoppingBag,
  Star,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    total_reviews: 62,
    description:
      "Quy chuẩn thiết kế phần mềm sạch, tách rời ranh giới và kiểm thử độc lập.",
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    title: "Tư Duy Độc Lập Trong Kỷ Nguyên Trí Tuệ Nhân Tạo",
    slug: "tu-duy-doc-lap-trong-ky-nguyen-ai",
    author: "Nguyễn Văn Minh",
    cover_url:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    format: "EBOOK",
    sale_price: 89000,
    original_price: 120000,
    average_rating: 5.0,
    total_reviews: 31,
    description:
      "Phát triển năng lực tư duy phản biện và khả năng hợp tác người - máy.",
  },
];

function BooksContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialFormat = searchParams.get("format") || "ALL";

  const { addToCart } = useCart();
  const [, startTransition] = useTransition();

  const [books, setBooks] = useState<BookItem[]>(SEED_BOOKS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [formatFilter, setFormatFilter] = useState<string>(initialFormat);
  const [isHybridRrfMode, setIsHybridRrfMode] = useState(true);
  const [totalFound, setTotalFound] = useState(SEED_BOOKS.length);

  const fetchBooks = async (query = searchTerm, format = formatFilter, useRrf = isHybridRrfMode) => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      if (query.trim() && useRrf) {
        // UC02: Hybrid RRF Search endpoint
        const res = await fetch(
          `${apiBase}/api/v1/books/search/hybrid?q=${encodeURIComponent(query.trim())}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setBooks(data.items);
            setTotalFound(data.total_results);
            setLoading(false);
            return;
          }
        }
      }

      // Standard list endpoint
      const params = new URLSearchParams();
      if (query.trim()) params.append("search", query.trim());
      if (format !== "ALL") params.append("format", format);

      const res = await fetch(`${apiBase}/api/v1/books?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.items || []);
        setTotalFound(data.total || (data.items ? data.items.length : 0));
      } else {
        // Fallback filter locally
        let filtered = SEED_BOOKS;
        if (query.trim()) {
          filtered = filtered.filter(
            (b) =>
              b.title.toLowerCase().includes(query.toLowerCase()) ||
              b.author.toLowerCase().includes(query.toLowerCase())
          );
        }
        if (format !== "ALL") {
          filtered = filtered.filter((b) => b.format === format || b.format === "BOTH");
        }
        setBooks(filtered);
        setTotalFound(filtered.length);
      }
    } catch {
      // Local fallback
      let filtered = SEED_BOOKS;
      if (query.trim()) {
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.author.toLowerCase().includes(query.toLowerCase())
        );
      }
      setBooks(filtered);
      setTotalFound(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(initialQuery, initialFormat, isHybridRrfMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      fetchBooks(searchTerm, formatFilter, isHybridRrfMode);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>DANH MỤC ẤN PHẨM TOÀN DIỆN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
            Khám Phá Sách & Thư Viện Tri Thức
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tìm kiếm bằng thuật toán lai RRF k=60 kết hợp từ vựng và ngữ nghĩa véc-tơ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-purple-500/40 text-purple-300 bg-purple-950/40 text-xs px-3 py-1 font-mono"
          >
            {totalFound} ấn phẩm khả dụng
          </Badge>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên sách, tác giả hoặc mô tả ngữ cảnh bạn muốn tìm..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Tìm kiếm"}
          </Button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Định dạng:</span>
            {["ALL", "EBOOK", "PHYSICAL"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setFormatFilter(fmt);
                  fetchBooks(searchTerm, fmt, isHybridRrfMode);
                }}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  formatFilter === fmt
                    ? "bg-purple-600 text-white font-semibold shadow-md"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {fmt === "ALL"
                  ? "Tất cả"
                  : fmt === "EBOOK"
                  ? "Sách Số E-Book"
                  : "Sách In Bìa Cứng"}
              </button>
            ))}
          </div>

          {/* Toggle RRF Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextMode = !isHybridRrfMode;
                setIsHybridRrfMode(nextMode);
                fetchBooks(searchTerm, formatFilter, nextMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-colors ${
                isHybridRrfMode
                  ? "border-purple-500/40 bg-purple-950/60 text-purple-300"
                  : "border-slate-800 bg-slate-900 text-slate-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chế độ Tìm Kiếm Lai RRF k=60: {isHybridRrfMode ? "BẬT" : "TẮT"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-purple-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium text-slate-300">
            Đang truy vấn kho dữ liệu ấn phẩm và véc-tơ ngữ nghĩa...
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-slate-300 font-semibold">Không tìm thấy ấn phẩm phù hợp</p>
          <p className="text-xs text-slate-500">
            Hãy thử tìm với từ khóa tổng quát hơn hoặc tắt bộ lọc định dạng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Card
              key={book.id}
              className="bg-slate-900/60 border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group shadow-lg"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/80">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-slate-600 font-mono text-sm">AuraBook</div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <Badge
                    variant="secondary"
                    className="bg-slate-950/80 backdrop-blur-md text-[10px] font-mono border-slate-700 text-purple-300"
                  >
                    {book.format === "EBOOK"
                      ? "E-Book DRM"
                      : book.format === "PHYSICAL"
                      ? "Sách in"
                      : "In & E-Book"}
                  </Badge>

                  {/* RRF score indicator badge if returned from RRF search */}
                  {book.rrf_score && (
                    <Badge className="bg-purple-900/80 text-purple-200 border border-purple-500/40 text-[10px] font-mono">
                      RRF: {book.rrf_score.toFixed(4)} ({book.match_type || "HYBRID"})
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{book.average_rating || 5.0}</span>
                    <span className="text-slate-500 text-[11px]">
                      ({book.total_reviews || 20} đánh giá)
                    </span>
                  </div>

                  <Link href={`/books/${book.slug}`}>
                    <h3 className="font-bold text-sm sm:text-base text-slate-100 hover:text-purple-300 transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400">{book.author}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-base font-extrabold text-purple-300 font-mono">
                    {Number(book.sale_price).toLocaleString("vi-VN")} đ
                  </div>

                  <div className="flex gap-1.5">
                    <Link href={`/books/${book.slug}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
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
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-1 font-semibold"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Thêm
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


export default function BooksPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Đang tải danh mục sách...</div>}>
      <BooksContent />
    </React.Suspense>
  );
}
