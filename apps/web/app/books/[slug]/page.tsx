"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ShoppingBag,
  Zap,
  Lock,
  Headphones,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart-context";

interface BookDetail {
  id: string;
  title: string;
  slug: string;
  author: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  format: "PHYSICAL" | "EBOOK" | "BOTH";
  original_price: number;
  sale_price: number;
  stock_quantity: number;
  available_stock: number;
  average_rating: number;
  total_reviews: number;
}

interface ReviewItem {
  id: string;
  user_full_name: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
}

const FALLBACK_DETAIL: BookDetail = {
  id: "b1000000-0000-0000-0000-000000000001",
  title: "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
  slug: "thiet-ke-he-thong-da-tac-tu-ai-rag",
  author: "AuraBook Lab",
  publisher: "NXB Công Nghệ Số",
  isbn: "978-604-0-12345-1",
  description:
    "Cẩm nang toàn diện về kiến trúc Multi-Agent Systems, RAG vector hybrid search và ứng dụng thực tiễn. Tác phẩm hướng dẫn chi tiết cách xây dựng các tác tử chuyên biệt, bảo mật bản quyền số và tối ưu hóa chi phí token trên hạ tầng đám mây hiện đại.",
  cover_url:
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
  format: "BOTH",
  original_price: 250000,
  sale_price: 199000,
  stock_quantity: 50,
  available_stock: 50,
  average_rating: 4.9,
  total_reviews: 48,
};

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { addToCart } = useCart();

  const [book, setBook] = useState<BookDetail>(FALLBACK_DETAIL);
  const [selectedFormat, setSelectedFormat] = useState<"PHYSICAL" | "EBOOK">("PHYSICAL");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Audio Teaser state (UC03)
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioScript, setAudioScript] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Reviews state (UC08)
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStatusMsg, setReviewStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      try {
        // 1. Fetch book detail
        const res = await fetch(`${apiBase}/api/v1/books/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setBook(data);
          if (data.format === "EBOOK") setSelectedFormat("EBOOK");

          // 2. Fetch reviews
          const revRes = await fetch(`${apiBase}/api/v1/books/${data.id}/reviews`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData.items || []);
          }
        }
      } catch {
        // Fallback detail
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  // Handle Play Audio Teaser (UC03)
  const handleToggleAudioTeaser = async () => {
    if (audioUrl) {
      setIsPlayingAudio(!isPlayingAudio);
      return;
    }

    setLoadingAudio(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiBase}/api/v1/books/${book.id}/audio-teaser`);
      if (res.ok) {
        const data = await res.json();
        setAudioUrl(data.audio_url);
        setAudioScript(data.script_text);
        setIsPlayingAudio(true);
      } else {
        setAudioScript(
          "Chào mừng bạn đến với tóm tắt sách AI AuraBook. Cuốn sách cung cấp những kiến thức chuyên sâu về kiến trúc đa tác tử và quy trình bảo vệ bản quyền số."
        );
      }
    } catch {
      setAudioScript("Dịch vụ Audio Teaser đang bận. Bạn vui lòng thử lại sau.");
    } finally {
      setLoadingAudio(false);
    }
  };

  // Handle Submit Review (UC08)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewStatusMsg(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = typeof window !== "undefined" ? localStorage.getItem("aurabook_access_token") : null;

    if (!token) {
      setReviewStatusMsg({
        type: "error",
        text: "Vui lòng đăng nhập để gửi đánh giá ấn phẩm này.",
      });
      setReviewLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/v1/books/${book.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: ratingInput,
          comment: commentInput.trim(),
        }),
      });

      if (res.ok) {
        const newRev = await res.json();
        setReviews([newRev, ...reviews.filter((r) => r.id !== newRev.id)]);
        setCommentInput("");
        setReviewStatusMsg({
          type: "success",
          text: "Gửi đánh giá thành công! Cảm ơn ý kiến đóng góp của bạn.",
        });
      } else if (res.status === 403) {
        setReviewStatusMsg({
          type: "error",
          text: "Chỉ độc giả đã mua ấn phẩm (đơn hàng thành công) mới được quyền gửi đánh giá.",
        });
      } else if (res.status === 400) {
        const errData = await res.json();
        setReviewStatusMsg({
          type: "error",
          text: errData.detail || "Nội dung nhận xét vi phạm tiêu chuẩn cộng đồng.",
        });
      } else {
        setReviewStatusMsg({
          type: "error",
          text: "Không thể gửi đánh giá vào lúc này. Vui lòng thử lại sau.",
        });
      }
    } catch {
      setReviewStatusMsg({
        type: "error",
        text: "Lỗi kết nối tới máy chủ đánh giá.",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(
      {
        bookId: book.id,
        title: book.title,
        slug: book.slug,
        author: book.author,
        coverUrl: book.cover_url,
        price: Number(book.sale_price),
        format: selectedFormat,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-purple-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back button */}
      <div>
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh mục sách
        </Link>
      </div>

      {/* Main Book Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Col: Cover & Audio Teaser */}
        <div className="md:col-span-5 space-y-6">
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-600 font-mono text-base">AuraBook</span>
            )}
            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
              <Badge className="bg-purple-950/80 backdrop-blur-md text-xs font-mono text-purple-300 border-purple-500/30">
                {book.format === "EBOOK" ? "E-Book DRM" : book.format === "PHYSICAL" ? "Sách in" : "In & E-Book"}
              </Badge>
            </div>
          </div>

          {/* UC03: Audio Teaser Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-slate-200">
                  AI Audio Teaser (60 Giây)
                </span>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                Gemini 2.0 Audio
              </Badge>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Nghe giọng đọc tóm tắt hấp dẫn các luận điểm chính trước khi đọc toàn tác phẩm.
            </p>

            <Button
              onClick={handleToggleAudioTeaser}
              disabled={loadingAudio}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              {loadingAudio ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang tổng hợp audio...
                </>
              ) : isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4" /> Tạm dừng Audio
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Nghe thử tóm tắt 60s
                </>
              )}
            </Button>

            {audioUrl && isPlayingAudio && (
              <div className="pt-2 space-y-2">
                <audio
                  src={audioUrl}
                  controls
                  autoPlay
                  className="w-full h-8 accent-purple-600"
                  onEnded={() => setIsPlayingAudio(false)}
                />
              </div>
            )}

            {audioScript && (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-300 italic leading-relaxed">
                &ldquo;{audioScript}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Metadata, Purchase & Format Actions */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold ml-1">{book.average_rating || 5.0}</span>
              </div>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{book.total_reviews || 24} lượt nhận xét</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Còn {book.available_stock || 50} bản
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
              {book.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400">
              Tác giả: <span className="font-semibold text-purple-300">{book.author}</span>{" "}
              {book.publisher && <>| NXB: <span className="text-slate-300">{book.publisher}</span></>}
              {book.isbn && <>| ISBN: <span className="font-mono text-slate-300">{book.isbn}</span></>}
            </p>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-baseline gap-4">
            <span className="text-3xl font-extrabold text-purple-300 font-mono">
              {Number(book.sale_price).toLocaleString("vi-VN")} đ
            </span>
            {book.original_price > book.sale_price && (
              <span className="text-sm text-slate-500 line-through font-mono">
                {Number(book.original_price).toLocaleString("vi-VN")} đ
              </span>
            )}
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Chọn định dạng sở hữu:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(book.format === "PHYSICAL" || book.format === "BOTH") && (
                <button
                  type="button"
                  onClick={() => setSelectedFormat("PHYSICAL")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedFormat === "PHYSICAL"
                      ? "border-purple-500 bg-purple-950/40 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-xs">Sách In Bìa Cứng</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Giao tận nơi 2-3 ngày</p>
                </button>
              )}

              {(book.format === "EBOOK" || book.format === "BOTH") && (
                <button
                  type="button"
                  onClick={() => setSelectedFormat("EBOOK")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedFormat === "EBOOK"
                      ? "border-purple-500 bg-purple-950/40 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs">Sách Số E-Book DRM</p>
                    <Lock className="w-3 h-3 text-purple-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kích hoạt & Đọc ngay</p>
                </button>
              )}
            </div>
          </div>

          {/* Quantity & Buy Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Số lượng:</span>
              <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-400 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 text-xs font-mono font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-slate-400 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50 text-xs font-semibold h-11 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Thêm Vào Giỏ Hàng
              </Button>

              <Button
                onClick={handleBuyNow}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-semibold h-11 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Zap className="w-4 h-4" /> Mua Ngay Bây Giờ
              </Button>
            </div>

            {/* Direct Reader Link */}
            <div className="pt-2">
              <Link href={`/reader/${book.id}`}>
                <Button
                  variant="outline"
                  className="w-full border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Mở Trình Đọc E-Book Canvas DRM (Đọc thử / Bản quyền)
                </Button>
              </Link>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-slate-200">Giới thiệu ấn phẩm</h3>
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          </div>
        </div>
      </div>

      {/* Review & Ratings Section (UC08) */}
      <section className="border-t border-slate-800 pt-10 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h2 className="text-xl font-bold text-slate-100">
                Đánh Giá & Nhận Xét Của Độc Giả (UC08)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Chỉ độc giả đã mua ấn phẩm thành công mới có quyền gửi đánh giá đã xác minh.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Star className="w-4 h-4 text-amber-400 fill-current" />
            <span className="font-extrabold text-sm text-slate-100">
              {book.average_rating || 5.0} / 5
            </span>
            <span className="text-xs text-slate-500">({reviews.length} đánh giá)</span>
          </div>
        </div>

        {/* Submit Review Form */}
        <form
          onSubmit={handleSubmitReview}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
        >
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            Viết nhận xét của bạn
          </h3>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Chọn số sao:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  className={`p-1 transition-colors ${
                    star <= ratingInput ? "text-amber-400" : "text-slate-600"
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-300">
              ({ratingInput} sao)
            </span>
          </div>

          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            rows={3}
            placeholder="Chia sẻ cảm nhận chân thực của bạn về chất lượng nội dung tác phẩm..."
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />

          {reviewStatusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                reviewStatusMsg.type === "success"
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/60 border border-red-500/40 text-red-300"
              }`}
            >
              {reviewStatusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{reviewStatusMsg.text}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={reviewLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6"
          >
            {reviewLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Gửi Đánh Giá Đã Mua Hàng"
            )}
          </Button>
        </form>

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
              Chưa có nhận xét nào cho ấn phẩm này. Hãy là người đầu tiên đánh giá!
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      {rev.user_full_name}
                    </span>
                    {rev.is_verified_purchase && (
                      <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã Mua Hàng
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? "fill-current" : "text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                {rev.comment && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
