"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Heart,
	MessageSquare,
	Share2,
	Star,
	CheckCircle2,
	Pin,
	ExternalLink,
	Trash2,
	Send,
	Bookmark,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityPost, type CommunityUser, type CommunityComment } from "@/lib/community/types";

interface CommunityPostCardProps {
	post: CommunityPost;
	currentUser: CommunityUser | null;
	isAdmin?: boolean;
	isSaved?: boolean;
	onToggleSave?: (postId: string) => void;
	onDeletePost?: (postId: string) => Promise<void>;
	onTogglePin?: (postId: string) => Promise<void>;
	onRequireLogin?: () => void;
}

export function CommunityPostCard({
	post,
	currentUser,
	isAdmin = false,
	isSaved = false,
	onToggleSave,
	onDeletePost,
	onTogglePin,
	onRequireLogin,
}: CommunityPostCardProps) {
	const currentUserId = currentUser?.id || "guest";
	const [likes, setLikes] = useState<string[]>(post.likes || []);
	const [isLiking, setIsLiking] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<CommunityComment[]>(post.comments || []);
	const [commentText, setCommentText] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const [copied, setCopied] = useState(false);

	const isLiked = likes.includes(currentUserId);

	const handleToggleLike = async () => {
		if (!currentUser) {
			if (onRequireLogin) onRequireLogin();
			return;
		}
		if (isLiking) return;

		setIsLiking(true);
		// Optimistic update
		const nextLikes = isLiked
			? likes.filter((id) => id !== currentUserId)
			: [...likes, currentUserId];
		setLikes(nextLikes);

		try {
			const res = await fetch(`/api/community/posts/${post.id}/like`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: currentUserId }),
			});
			if (res.ok) {
				const data = (await res.json()) as { likesCount: number; isLiked: boolean };
				if (data.isLiked && !nextLikes.includes(currentUserId)) {
					setLikes([...nextLikes, currentUserId]);
				} else if (!data.isLiked && nextLikes.includes(currentUserId)) {
					setLikes(nextLikes.filter((id) => id !== currentUserId));
				}
			}
		} catch (e) {
			console.error("Failed to toggle like:", e);
			// Rollback on error
			setLikes(likes);
		} finally {
			setIsLiking(false);
		}
	};

	const handleAddComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentUser) {
			if (onRequireLogin) onRequireLogin();
			return;
		}
		if (!commentText.trim() || isSubmittingComment) return;

		setIsSubmittingComment(true);
		try {
			const res = await fetch(`/api/community/posts/${post.id}/comment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					author: {
						id: currentUser.id,
						username: currentUser.username,
						displayName: currentUser.displayName,
						avatar: currentUser.avatar,
					},
					content: commentText.trim(),
				}),
			});

			if (res.ok) {
				const data = (await res.json()) as { comment: CommunityComment };
				setComments((prev) => [...prev, data.comment]);
				setCommentText("");
			}
		} catch (e) {
			console.error("Failed to add comment:", e);
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const handleShare = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Format date nicely
	const formatDate = (dateStr: string) => {
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("vi-VN", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	return (
		<article className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 sm:p-6">
			{/* Top Bar / Meta */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
						<Image
							src={post.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
							alt={post.author.displayName}
							fill
							sizes="44px"
							className="object-cover"
							unoptimized
						/>
					</div>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-semibold text-[13px] text-foreground">
								{post.author.displayName}
							</span>
							<span className="text-[13px] text-muted-foreground">
								{post.author.username}
							</span>
							{post.author.isVerifiedBuyer && (
								<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[13px] font-semibold text-success">
									<CheckCircle2 className="h-3.5 w-3.5" />
									Đã mua hàng
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5">
							<span>{formatDate(post.createdAt)}</span>
							{post.isFromProductReview && (
								<>
									<span>•</span>
									<span className="text-[13px] font-semibold text-primary">
										Đánh giá từ sản phẩm
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right tags / admin actions */}
				<div className="flex items-center gap-2">
					{post.isPinned && (
						<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[13px] font-semibold text-amber-600">
							<Pin className="h-3 w-3" />
							Ghim
						</span>
					)}

					{isAdmin && (
						<div className="flex items-center gap-1 border-l border-border pl-2">
							{onTogglePin && (
								<button
									type="button"
									onClick={() => onTogglePin(post.id)}
									className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
									title={post.isPinned ? "Bỏ ghim" : "Ghim bài"}
								>
									<Pin className="h-4 w-4" />
								</button>
							)}
							{onDeletePost && (
								<button
									type="button"
									onClick={() => onDeletePost(post.id)}
									className="rounded-md p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
									title="Xóa bài viết"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Book Card Tag with exact title, author, price, and product link (Always visible book cover image) */}
			{post.book && (
				<div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 flex items-center justify-between gap-3 group transition-colors hover:border-border">
					<div className="flex items-center gap-3 min-w-0">
						<div className="relative w-11 h-16 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted shadow-2xs">
							<Image
								src={post.book.thumbnail || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80"}
								alt={post.book.title}
								fill
								sizes="44px"
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="min-w-0">
							<div className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
								{post.book.title}
							</div>
							{post.book.author && (
								<div className="text-[13px] text-muted-foreground truncate mt-0.5">
									{post.book.author}
								</div>
							)}
							<div className="flex items-center gap-2 mt-0.5">
								<span className="text-[13px] font-bold text-primary">
									{post.book.price || "120.000 ₫"}
								</span>
								{post.book.rating && (
									<span className="flex items-center gap-0.5 text-[13px] text-amber-500 font-semibold">
										<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
										{post.book.rating}
									</span>
								)}
							</div>
						</div>
					</div>

					<Link
						href={`/vi/channel-vnd/products/${post.book.slug}`}
						className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0 shadow-2xs"
					>
						<span>Xem sách</span>
						<ExternalLink className="h-3.5 w-3.5" />
					</Link>
				</div>
			)}

			{/* Post Content */}
			<div className="mt-3.5 space-y-1.5">
				<h3 className="text-[15px] font-semibold text-foreground leading-snug">
					{post.title}
				</h3>
				<p className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-line">
					{post.content}
				</p>
			</div>

			{/* Post Interaction Bar (Likes, Comments, Save, Share) */}
			<div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[13px] text-muted-foreground">
				<div className="flex items-center gap-5">
					{/* Like Button */}
					<button
						type="button"
						onClick={handleToggleLike}
						disabled={isLiking}
						className={`group flex items-center gap-2 font-medium transition-colors ${
							isLiked
								? "text-red-500 font-semibold"
								: "hover:text-foreground"
						}`}
					>
						<Heart
							className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${
								isLiked ? "fill-red-500 text-red-500" : ""
							}`}
						/>
						<span>{likes.length > 0 ? `${likes.length} Thích` : "Thích"}</span>
					</button>

					{/* Comment Toggle */}
					<button
						type="button"
						onClick={() => setShowComments(!showComments)}
						className="flex items-center gap-2 font-medium hover:text-foreground transition-colors"
					>
						<MessageSquare className="h-4.5 w-4.5" />
						<span>{comments.length} Bình luận</span>
					</button>
				</div>

				<div className="flex items-center gap-4">
					{/* Bookmark / Save Post Button */}
					<button
						type="button"
						onClick={() => onToggleSave?.(post.id)}
						className={`group flex items-center gap-1.5 font-medium transition-colors ${
							isSaved
								? "text-primary font-semibold"
								: "hover:text-foreground"
						}`}
						title={isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
					>
						<Bookmark
							className={`h-4 w-4 transition-transform group-hover:scale-110 ${
								isSaved ? "fill-primary text-primary" : ""
							}`}
						/>
						<span>{isSaved ? "Đã lưu" : "Lưu"}</span>
					</button>

					{/* Share Button */}
					<button
						type="button"
						onClick={handleShare}
						className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
					>
						<Share2 className="h-4 w-4" />
						<span>{copied ? "Đã copy link!" : "Chia sẻ"}</span>
					</button>
				</div>
			</div>

			{/* Comment Section Drawer/Collapse */}
			{showComments && (
				<div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 animate-in fade-in-0">
					{/* Comments list */}
					{comments.length === 0 ? (
						<p className="text-center text-[13px] text-muted-foreground py-2">
							Chưa có bình luận nào. Hãy là người đầu tiên nêu cảm nghĩ!
						</p>
					) : (
						<div className="space-y-3">
							{comments.map((comm) => (
								<div key={comm.id} className="flex items-start gap-3">
									<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
										<Image
											src={comm.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
											alt={comm.author.displayName}
											fill
											sizes="32px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="flex-1 rounded-xl bg-card p-3 border border-border/60 text-[13px]">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-[13px] text-foreground">
												{comm.author.displayName}
											</span>
											<span className="text-[13px] text-muted-foreground">
												{formatDate(comm.createdAt)}
											</span>
										</div>
										<p className="mt-1 text-foreground/90 leading-relaxed text-[13px]">
											{comm.content}
										</p>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Add Comment Input */}
					<form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
						<Input
							type="text"
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							placeholder="Viết bình luận cho bài đánh giá này..."
							className="h-9 text-[13px] bg-card"
							disabled={isSubmittingComment}
						/>
						<Button
							type="submit"
							disabled={!commentText.trim() || isSubmittingComment}
							className="h-9 px-4 shrink-0 text-[13px] font-semibold gap-1.5"
						>
							<Send className="h-3.5 w-3.5" />
							Gửi
						</Button>
					</form>
				</div>
			)}
		</article>
	);
}
