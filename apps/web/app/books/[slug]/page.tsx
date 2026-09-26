"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Headphones,
  Play,
  Pause,
  Truck,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

interface ReviewItem {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { addToCart } = useCart();

  const [selectedFormat, setSelectedFormat] = useState<"PHYSICAL" | "EBOOK">("PHYSICAL");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Review state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: "rev-1",
      user_name: "Hoàng Văn Tuấn",
      rating: 5,
      comment: "Cuốn sách rất xuất sắc! Giải thích chi tiết về RAG đa tác tử và cách nhúng vector 768 chiều. Trình đọc WASM DRM trên web cũng rất mượt.",
      is_verified_purchase: true,
      created_at: "24/09/2026",
    },
    {
      id: "rev-2",
      user_name: "Lê Minh Anh",
      rating: 5,
      comment: "Chất lượng sách in bìa cứng rất đẹp, giao hàng siêu nhanh. Phần tóm tắt âm thanh 60s nghe trước rất tiện.",
      is_verified_purchase: true,
      created_at: "22/09/2026",
    },
  ]);

  // Book metadata fallback based on slug
  const isEbookOnly = slug.includes("deep-learning");
  const isArchitecture = slug.includes("architecture");

  const title = isArchitecture
    ? "Clean Architecture: Kiến Trúc Phần Mềm Hiện Đại"
    : isEbookOnly
    ? "Học Máy & Deep Learning Thực Chiến"
    : "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG";

  const author = isArchitecture
    ? "Robert C. Martin"
    : isEbookOnly
    ? "Auriel Vance"
    : "AuraBook Lab & Đội Ngũ Nghiên Cứu";

  const originalPrice = isArchitecture ? 320000 : isEbookOnly ? 210000 : 250000;
  const salePrice = isArchitecture ? 275000 : isEbookOnly ? 168000 : 199000;
  const coverUrl = isArchitecture
    ? "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80"
    : isEbookOnly
    ? "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";

  const bookId = "b1000000-0000-0000-0000-000000000001";

  const handleAddToCart = () => {
    addToCart(
      {
        bookId,
        title,
        slug,
        author,
        coverUrl,
        price: salePrice,
        format: selectedFormat,
      },
      quantity
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!commentInput.trim()) {
      setReviewError("Vui lòng nhập nội dung đánh giá của bạn.");
      return;
    }

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      user_name: "Độc Giả AuraBook",
      rating: ratingInput,
      comment: commentInput,
      is_verified_purchase: true,
      created_at: "Vừa xong",
    };

    setReviews([newRev, ...reviews]);
    setCommentInput("");
    setReviewSuccess("Đánh giá của bạn đã được xác thực đơn hàng và đăng thành công!");
    setTimeout(() => setReviewSuccess(null), 3500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/30 via-white to-white text-slate-800 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-sky-600">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/books" className="hover:text-sky-600">Danh mục sách</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{title}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white border border-sky-100 rounded-3xl p-6 sm:p-10 shadow-lg mb-12">
        {/* Left: 3D Book Cover & Interactive Teaser (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-2xl overflow-hidden bg-slate-100 shadow-xl border border-sky-100 perspective-1000 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                BẢN QUYỀN CHÍNH HÃNG
              </Badge>
            </div>
          </div>

          {/* 60s AI Audio Teaser Player Box */}
          <div className="bg-gradient-to-r from-sky-50 to-amber-50/50 border border-sky-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                <Headphones className="w-4 h-4 text-sky-600" />
                <span>60s AI Audio Teaser (UC03)</span>
              </div>
              <Badge className="bg-amber-100 text-amber-900 text-[10px] font-semibold border-none">
                Nghe Thử Miễn Phí
              </Badge>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Bản hòa âm tóm tắt tác phẩm được biên soạn tự động từ nội dung sách qua thuật toán RIFF/WAV.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-10 h-10 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-amber-500 rounded-full transition-all ${
                      isPlayingAudio ? "w-2/3" : "w-0"
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>{isPlayingAudio ? "0:24" : "0:00"}</span>
                  <span>1:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Book Details & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">4.9 / 5.0</span>
              <span className="text-xs text-slate-400">({reviews.length} đánh giá đã xác thực)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight leading-snug">
              {title}
            </h1>
            <p className="text-sm text-sky-700 font-medium mt-1">
              Tác giả: <strong className="text-slate-900">{author}</strong>
            </p>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-baseline gap-4">
            <span className="text-3xl font-black text-sky-700">
              {salePrice.toLocaleString("vi-VN")} đ
            </span>
            <span className="text-sm text-slate-400 line-through">
              {originalPrice.toLocaleString("vi-VN")} đ
            </span>
            <Badge className="bg-red-100 text-red-700 border-none font-bold text-xs">
              TIẾT KIỆM {Math.round(((originalPrice - salePrice) / originalPrice) * 100)}%
            </Badge>
          </div>

          {/* Format Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Chọn Định Dạng Ấn Phẩm
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Physical */}
              <div
                onClick={() => setSelectedFormat("PHYSICAL")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedFormat === "PHYSICAL"
                    ? "bg-sky-50/60 border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">Sách In Giấy Truyền Thống</span>
                  <Badge className="bg-sky-100 text-sky-800 border-none text-[9px]">Giao Tận Nơi</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Bìa cứng ép kim cao cấp, ruột giấy định lượng 80gsm chống mỏi mắt.
                </p>
              </div>

              {/* E-Book DRM */}
              <div
                onClick={() => setSelectedFormat("EBOOK")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedFormat === "EBOOK"
                    ? "bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">E-Book Bản Quyền Số DRM</span>
                  <Badge className="bg-amber-100 text-amber-800 border-none text-[9px]">Kích Hoạt Ngay</Badge>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Đọc ngay trên WebAssembly Canvas, mã hóa AES-256-GCM chống sao chép.
                </p>
              </div>
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Số lượng:</span>
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 flex items-center justify-center text-sm shadow-sm"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-xs text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 flex items-center justify-center text-sm shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm h-12 rounded-xl shadow-lg shadow-amber-500/25 transition-all"
              >
                <ShoppingBag className="w-4 h-4 mr-2" /> Thêm Vào Giỏ Hàng
              </Button>

              <Link href={`/reader/${bookId}`} className="sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-sky-300 text-sky-800 hover:bg-sky-50 text-xs font-bold h-12 rounded-xl px-5">
                  <BookOpen className="w-4 h-4 mr-2 text-sky-600" />
                  Đọc Thử Canvas DRM
                </Button>
              </Link>
            </div>

            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã thêm <strong>{quantity} cuốn</strong> vào giỏ hàng thành công!</span>
              </div>
            )}
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bảo vệ bản quyền số DRM AES-256</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <span>Giao hàng toàn quốc 2-3 ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section (UC08) */}
      <div className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-sky-950 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Đánh Giá Của Độc Giả Đã Mua (UC08)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống lọc kiểm duyệt thô tục và chỉ cho phép người đã hoàn tất thanh toán (PAID) gửi nhận xét
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs">
            Xác Thực Đơn Hàng Thật
          </Badge>
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="font-bold text-xs text-slate-900">Viết nhận xét của bạn:</div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">Đánh giá số sao:</span>
            <div className="flex gap-1 text-amber-400 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 ${star <= ratingInput ? "fill-current text-amber-400" : "text-slate-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Chia sẻ cảm nhận chân thực của bạn về nội dung sách, chất lượng in ấn hoặc tính năng đọc DRM..."
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
          />

          {reviewError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          {reviewSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{reviewSuccess}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl px-5">
              Gửi Đánh Giá Xác Thực
            </Button>
          </div>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    {rev.user_name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{rev.user_name}</span>
                    {rev.is_verified_purchase && (
                      <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">
                        ✓ Đã Mua Hàng
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">{rev.created_at}</span>
              </div>

              <div className="flex text-amber-400">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
