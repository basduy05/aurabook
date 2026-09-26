"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowRight,
  Flame,
  Volume2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  BookOpen,
  Cpu,
  Layers,
  Code2,
  Database,
  Lock,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

interface BookCardItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  cover_url: string;
  format: "PHYSICAL" | "EBOOK" | "BOTH";
  original_price: number;
  sale_price: number;
  rating: number;
  reviews_count: number;
  category: string;
  badge?: string;
  audio_teaser_url?: string;
  sold_percent?: number;
}

const FEATURED_BOOKS: BookCardItem[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
    slug: "thiet-ke-he-thong-da-tac-tu-ai-rag",
    author: "AuraBook Lab",
    cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    format: "BOTH",
    original_price: 250000,
    sale_price: 199000,
    rating: 4.9,
    reviews_count: 58,
    category: "AI & Machine Learning",
    badge: "BÁN CHẠY NHẤT",
    sold_percent: 85,
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    title: "Clean Architecture: Kiến Trúc Phần Mềm Hiện Đại",
    slug: "clean-architecture-kien-truc-phan-mem-hien-dai",
    author: "Robert C. Martin",
    cover_url: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
    format: "PHYSICAL",
    original_price: 320000,
    sale_price: 275000,
    rating: 4.8,
    reviews_count: 42,
    category: "Kiến Trúc Phần Mềm",
    badge: "GIẢM 15%",
    sold_percent: 62,
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    title: "Học Máy & Deep Learning Thực Chiến",
    slug: "hoc-may-va-deep-learning-thuc-chien",
    author: "Auriel Vance",
    cover_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    format: "EBOOK",
    original_price: 210000,
    sale_price: 168000,
    rating: 5.0,
    reviews_count: 36,
    category: "Khoa Học Dữ Liệu",
    badge: "E-BOOK DRM",
    sold_percent: 91,
  },
  {
    id: "b1000000-0000-0000-0000-000000000004",
    title: "Lập Trình Web Hiện Đại Với Next.js 15 & React 19",
    slug: "lap-trinh-web-hien-dai-nextjs-15-react-19",
    author: "Guillermo Rauch & Vercel Team",
    cover_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    format: "BOTH",
    original_price: 280000,
    sale_price: 219000,
    rating: 4.9,
    reviews_count: 29,
    category: "Lập Trình Web",
    badge: "MỚI XUẤT BẢN",
    sold_percent: 45,
  },
];

const CATEGORIES = [
  {
    name: "Trí Tuệ Nhân Tạo & LLM",
    icon: Cpu,
    count: "42 tựa sách",
    query: "AI",
    bg: "from-sky-50 to-blue-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  {
    name: "Kiến Trúc Phần Mềm",
    icon: Layers,
    count: "28 tựa sách",
    query: "Architecture",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  {
    name: "Lập Trình Web & Mobile",
    icon: Code2,
    count: "35 tựa sách",
    query: "Web",
    bg: "from-blue-50 to-indigo-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
  {
    name: "Khoa Học Dữ Liệu",
    icon: Database,
    count: "19 tựa sách",
    query: "Data",
    bg: "from-teal-50 to-cyan-50",
    border: "border-teal-200",
    text: "text-teal-800",
  },
  {
    name: "An Toàn Thông Tin & DRM",
    icon: Lock,
    count: "15 tựa sách",
    query: "Security",
    bg: "from-sky-50 to-amber-50",
    border: "border-sky-200",
    text: "text-sky-800",
  },
  {
    name: "Kỹ Năng & Khởi Nghiệp",
    icon: Compass,
    count: "24 tựa sách",
    query: "Skills",
    bg: "from-amber-50 to-yellow-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
];

const PROMO_SLIDES = [
  {
    id: 1,
    tag: "ĐẠI TIỆC SÁCH CÔNG NGHỆ 2026",
    title: "Bứt Phá Giới Hạn Với Sách AI & Kiến Trúc Phần Mềm",
    subtitle: "Nhập mã voucher AURA2026 giảm thêm 15% cho mọi giỏ hàng. Tặng kèm bản quyền đọc E-book DRM vĩnh viễn trên trình duyệt.",
    buttonText: "Khám Phá Sách Ngay",
    badge: "GIẢM 15% MÃ AURA2026",
    accentColor: "from-sky-600 to-blue-700",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    tag: "CÔNG NGHỆ BẢN QUYỀN SỐ DRM",
    title: "Kỷ Nguyên Đọc Sách WebAssembly Canvas Siêu Bảo Mật",
    subtitle: "Mã hóa AES-256-GCM với khóa phiên ngẫu nhiên. Trải nghiệm trợ lý RAG 768 chiều trả lời câu hỏi và dẫn chứng trang tức thì.",
    buttonText: "Trải Nghiệm Thư Viện Số",
    badge: "BẢN QUYỀN SỐ WASM",
    accentColor: "from-blue-700 via-sky-600 to-amber-500",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    tag: "CHÍNH SÁCH ĐỒNG HÀNH",
    title: "Miễn Phí Vận Chuyển Toàn Quốc Cho Đơn Từ 300.000đ",
    subtitle: "Giao sách in tận tay bọc màng co chuyên dụng trong 48 giờ. Hỗ trợ kích hoạt bản quyền sách số ngay lập tức sau khi thanh toán.",
    buttonText: "Xem Danh Mục Khuyến Mãi",
    badge: "FREESHIP TOÀN QUỐC",
    accentColor: "from-amber-600 to-sky-700",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=1000&auto=format&fit=crop&q=80",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlayingTeaser, setIsPlayingTeaser] = useState(false);
  const [teaserNotice, setTeaserNotice] = useState<string | null>(null);

  // Auto carousel rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleTeaser = () => {
    setIsPlayingTeaser(!isPlayingTeaser);
    if (!isPlayingTeaser) {
      setTeaserNotice("Đang phát bản tóm tắt âm thanh 60s AI Audio Teaser (Acoustic Intro Chime)...");
    } else {
      setTeaserNotice(null);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* 1. Hero Promotional Banner Carousel */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 via-white to-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-sky-900 via-blue-900 to-sky-950 rounded-3xl overflow-hidden shadow-2xl min-h-[420px] sm:min-h-[480px] flex items-center">
            {/* Background elements */}
            <div className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay" style={{ backgroundImage: `url(${PROMO_SLIDES[currentSlide].image})` }} />
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Slide Content */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-14 w-full">
              <div className="lg:col-span-7 space-y-5 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  {PROMO_SLIDES[currentSlide].tag}
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                  {PROMO_SLIDES[currentSlide].title}
                </h1>

                <p className="text-sky-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
                  {PROMO_SLIDES[currentSlide].subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/books">
                    <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm h-12 px-7 rounded-full shadow-lg shadow-amber-500/30 transition-all hover:scale-105">
                      {PROMO_SLIDES[currentSlide].buttonText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  <Link href="/intro">
                    <Button variant="outline" className="border-sky-300/40 text-white hover:bg-white/10 text-sm h-12 px-6 rounded-full font-semibold">
                      Tìm Hiểu Công Nghệ DRM
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 3D Visual Book Mockup */}
              <div className="lg:col-span-5 hidden lg:flex justify-center perspective-1000">
                <div className="relative w-64 h-88 rounded-2xl bg-white p-3 shadow-2xl card-3d-hover transform rotate-y-6">
                  <div className="w-full h-full rounded-xl overflow-hidden relative shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={PROMO_SLIDES[currentSlide].image}
                      alt="Banner Book"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                        {PROMO_SLIDES[currentSlide].badge}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1))}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5 px-2">
                {PROMO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${currentSlide === idx ? "w-6 bg-amber-400" : "w-2 bg-white/40"}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Category Showcase (Danh Mục Sách 3D) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Danh Mục Chuyên Sâu
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-sky-950 mt-1">
              Khám Phá Các Tủ Sách Kỹ Thuật & AI
            </h2>
          </div>
          <Link
            href="/books"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
          >
            Xem tất cả ấn phẩm <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                onClick={() => router.push(`/books?q=${encodeURIComponent(cat.query)}`)}
                className={`p-5 rounded-2xl bg-gradient-to-b ${cat.bg} border ${cat.border} cursor-pointer card-3d-hover flex flex-col items-center text-center group shadow-sm`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${cat.text}`} />
                </div>
                <h3 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight mb-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {cat.count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Golden Flash Sale Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-md border border-amber-200">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-900">
                  GIỜ VÀNG SÁCH CÔNG NGHỆ
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Flash Sale Sách Trí Tuệ Nhân Tạo & Kiến Trúc
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Kết thúc sau:</span>
              <div className="flex gap-1.5 font-mono font-black text-xs">
                <span className="px-2.5 py-1 bg-white text-amber-700 font-mono font-black rounded-xl shadow-sm border border-amber-200">08</span>
                <span className="text-slate-950">:</span>
                <span className="px-2.5 py-1 bg-white text-amber-700 font-mono font-black rounded-xl shadow-sm border border-amber-200">42</span>
                <span className="text-slate-950">:</span>
                <span className="px-2.5 py-1 bg-white text-amber-700 font-mono font-black rounded-xl shadow-sm border border-amber-200">19</span>
              </div>
            </div>
          </div>

          {/* Flash Sale Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_BOOKS.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl p-4 shadow-md border border-amber-200/80 card-3d-hover flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[10px] shadow">
                      {book.badge}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-sky-600 font-semibold mb-1">
                    {book.category}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 mb-2 truncate">
                    {book.author}
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-black text-sky-700">
                      {book.sale_price.toLocaleString("vi-VN")} đ
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      {book.original_price.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  {book.sold_percent && (
                    <div className="space-y-1 mb-3">
                      <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${book.sold_percent}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold text-right">
                        Đã bán {book.sold_percent}%
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() =>
                    addToCart({
                      bookId: book.id,
                      title: book.title,
                      slug: book.slug,
                      author: book.author,
                      coverUrl: book.cover_url,
                      price: book.sale_price,
                      format: book.format === "EBOOK" ? "EBOOK" : "PHYSICAL",
                    })
                  }
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 rounded-xl shadow"
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Thêm Vào Giỏ
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive 60s AI Audio Teaser Showcase (UC03) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50/40 border border-sky-200/80 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
                <Volume2 className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                Tính Năng Độc Quyền (UC03)
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-sky-950">
                Nghe Thử 60 Giây Tóm Tắt Tác Phẩm Bằng AI Audio Teaser
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Trước khi quyết định mua sách, bạn có thể lắng nghe bản hòa âm tóm tắt nội dung 60 giây do hệ thống biên soạn tự động từ siêu dữ liệu xuất bản và tổng hợp qua thuật toán âm thanh RIFF/WAV.
              </p>

              {teaserNotice && (
                <div className="p-3 bg-sky-100 text-sky-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <Headphones className="w-4 h-4 text-sky-600 animate-bounce" />
                  <span>{teaserNotice}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={handleToggleTeaser}
                  className={`font-bold text-xs h-11 px-6 rounded-full shadow-lg transition-all ${
                    isPlayingTeaser
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-sky-600 hover:bg-sky-500 text-white"
                  }`}
                >
                  {isPlayingTeaser ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" /> Dừng Nghe Thử
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" /> Nghe Teaser 60s Tác Phẩm Tiêu Biểu
                    </>
                  )}
                </Button>

                <Link href="/books">
                  <Button variant="outline" className="border-sky-300 text-sky-800 hover:bg-sky-50 text-xs h-11 px-5 rounded-full font-semibold">
                    Xem Thêm Danh Sách
                  </Button>
                </Link>
              </div>
            </div>

            {/* Waveform Animation 3D Visualizer */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white border border-sky-100 rounded-2xl shadow-md">
              <div className="flex items-center gap-1.5 h-20 w-full justify-center px-4">
                {[40, 65, 30, 85, 95, 45, 70, 90, 50, 80, 35, 95, 60, 40, 85, 55, 75, 90, 40, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: isPlayingTeaser ? `${Math.min(100, Math.max(15, (h * Math.sin(i + Date.now() / 300) + 70) / 1.5))}%` : "18%",
                      transition: "height 0.15s ease",
                    }}
                    className={`w-1.5 rounded-full ${
                      i % 3 === 0
                        ? "bg-amber-400"
                        : "bg-sky-500"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] font-bold text-slate-500 mt-3 text-center">
                {isPlayingTeaser ? "Đang phát sóng âm 22.05kHz PCM 16-bit..." : "Nhấn nút để bắt đầu trải nghiệm âm thanh AI"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Storefront Guarantees */}
      <section className="py-12 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Bản Quyền Chính Hãng</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">100% sách thật & E-book DRM chuẩn quốc tế</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Giao Hàng Siêu Tốc</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Freeship đơn từ 300k trên toàn quốc</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Đổi Trả 7 Ngày</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Đổi mới miễn phí nếu có lỗi in ấn</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-200/70 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Trợ Lý Voice AI 24/7</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ ra lệnh thoại bằng tiếng Việt rảnh tay</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
