"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Lock,
  Headphones,
  Search,
  Star,
  ShoppingBag,
  Play,
  Pause,
  BookOpen,
  Volume2,
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
}

const FALLBACK_FEATURED_BOOKS: BookItem[] = [
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

export default function HomePage() {
  const { addToCart } = useCart();
  const [featuredBooks, setFeaturedBooks] = useState<BookItem[]>(FALLBACK_FEATURED_BOOKS);
  const [searchKey, setSearchKey] = useState("");
  const [isPlayingTeaser, setIsPlayingTeaser] = useState(false);
  const [audioTeaserScript, setAudioTeaserScript] = useState<string | null>(null);

  // Fetch live books from API if backend is running
  useEffect(() => {
    async function loadBooks() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/v1/books?limit=6`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setFeaturedBooks(data.items);
          }
        }
      } catch {
        // Fallback to initial seed books
      }
    }
    loadBooks();
  }, []);

  const handlePlayTeaserSample = async () => {
    if (isPlayingTeaser) {
      setIsPlayingTeaser(false);
      return;
    }
    setIsPlayingTeaser(true);
    setAudioTeaserScript(
      "Chào mừng bạn đến với chuyên mục tóm tắt sách AI AuraBook! Cuốn sách 'Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG' là cẩm nang tiên phong giúp bạn làm chủ quy trình xây dựng kiến trúc phân tán kết hợp mô hình ngôn ngữ lớn..."
    );
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100 overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[400px] bg-pink-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[1600px] left-0 w-[500px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* 1. Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ & SÁCH SỐ THẾ HỆ MỚI
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Khai Phá Tri Thức Cùng{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
            Sách Số Bảo Mật
          </span>{" "}
          & Đa Tác Tử AI
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed">
          Đọc E-book Canvas DRM chống sao chép, đối thoại RAG trích dẫn trang thời
          gian thực, tìm kiếm lai RRF $k=60$ và điều phối đơn hàng bằng giọng nói tiếng Việt.
        </p>

        {/* Quick Search in Hero */}
        <div className="w-full max-w-xl flex items-center gap-2 p-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-md">
          <div className="pl-4 text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchKey.trim()) {
                window.location.href = `/books?q=${encodeURIComponent(searchKey.trim())}`;
              }
            }}
            placeholder="Tìm sách AI, kinh tế, công nghệ hoặc tác giả..."
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <Link href={`/books${searchKey ? `?q=${encodeURIComponent(searchKey)}` : ""}`}>
            <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs px-5 h-9">
              Tìm Ngay
            </Button>
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/books">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Khám Phá Danh Mục Sách
            </Button>
          </Link>
          <Link href="/library">
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm px-6 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-purple-400" /> Mở Tủ Sách DRM
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Key Pillars / Tech Architecture */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/60 border-slate-800 hover:border-purple-500/40 transition-all p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">
              Bảo Mật DRM Canvas WASM
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Giải mã AES-256-GCM trong RAM, thẻ AEAD 128-bit phát hiện can thiệp,
              vẽ trực tiếp HTML5 Canvas ngăn scraping DOM.
            </p>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 hover:border-pink-500/40 transition-all p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-950/60 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">
              Tác Tử RAG Đồng Hành
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Truy vấn ngữ nghĩa vector 768 chiều, Server-Sent Events streaming và
              dẫn chứng chính xác số trang sách đang đọc.
            </p>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 transition-all p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">
              AI Audio Teaser 60 Giây
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kịch bản tóm tắt hấp dẫn được biên soạn tự động kèm luồng âm thanh
              ngũ cung phát trực tiếp trên trình duyệt.
            </p>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 transition-all p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">
              Thanh Toán Khóa Bi Quan
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Khóa SELECT FOR UPDATE giữ kho 15 phút, cổng Sandbox IPN xác thực
              chữ ký HMAC-SHA256 cấp quyền tức thì.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. Featured Books Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full z-10 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs text-purple-400 font-mono font-semibold uppercase tracking-wider">
              ẤN PHẨM TIÊU BIỂU
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">
              Sách Bán Chạy & Khuyên Đọc
            </h2>
          </div>
          <Link
            href="/books"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            Xem tất cả ấn phẩm <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBooks.map((book) => (
            <Card
              key={book.id}
              className="bg-slate-900/70 border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group shadow-xl"
            >
              {/* Cover Image */}
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
                  {book.original_price > book.sale_price && (
                    <Badge className="bg-pink-600 text-white text-[10px] font-bold">
                      -
                      {Math.round(
                        ((book.original_price - book.sale_price) /
                          book.original_price) *
                          100
                      )}
                      %
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{book.average_rating || 5.0}</span>
                    <span className="text-slate-500 text-[11px]">
                      ({book.total_reviews || 24} đánh giá)
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

                {/* Price and Add button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-base font-extrabold text-purple-300 font-mono">
                      {Number(book.sale_price).toLocaleString("vi-VN")} đ
                    </div>
                    {book.original_price > book.sale_price && (
                      <div className="text-xs text-slate-500 line-through font-mono">
                        {Number(book.original_price).toLocaleString("vi-VN")} đ
                      </div>
                    )}
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
      </section>

      {/* 4. Audio Teaser Spotlight */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full z-10">
        <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
          <div className="max-w-2xl space-y-4">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs px-3 py-1">
              <Volume2 className="w-3.5 h-3.5 mr-1" /> TÍNH NĂNG ĐỘC BẢN AI AUDIO TEASER
            </Badge>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
              Bận rộn? Nghe tóm tắt cốt lõi cuốn sách chỉ trong 60 giây.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Trí tuệ nhân tạo Gemini tự động tổng hợp những luận điểm tinh hoa nhất,
              chuyển đổi thành giọng đọc tự nhiên chuẩn bị cho trải nghiệm đọc sâu sắc.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                onClick={handlePlayTeaserSample}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs sm:text-sm px-6 h-11 flex items-center gap-2 rounded-full shadow-xl shadow-purple-600/30"
              >
                {isPlayingTeaser ? (
                  <>
                    <Pause className="w-4 h-4" /> Đang phát Audio Teaser...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Nghe Thử Demo 60s
                  </>
                )}
              </Button>

              <span className="text-xs text-slate-400 font-mono">
                Chuẩn hóa AI Audio Engine
              </span>
            </div>

            {/* Audio Script Drawer */}
            {isPlayingTeaser && audioTeaserScript && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-xs text-slate-200 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-purple-300 font-semibold text-[11px]">
                  <span>Kịch bản giọng đọc tóm tắt AI:</span>
                  <span className="font-mono">Thời lượng: 60s</span>
                </div>
                <p className="italic leading-relaxed text-slate-300">
                  &ldquo;{audioTeaserScript}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
