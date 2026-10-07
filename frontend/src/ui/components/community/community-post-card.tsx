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
	BookOpen,
	Trash2,
	Send,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityPost, type CommunityUser, type CommunityComment } from "@/lib/community/types";

interface CommunityPostCardProps {
	post: CommunityPost;
	currentUser: CommunityUser | null;
	isAdmin?: boolean;
	onDeletePost?: (postId: string) => Promise<void>;
	onTogglePin?: (postId: string) => Promise<void>;
	onRequireLogin?: () => void;
}

export function CommunityPostCard({
	post,
	currentUser,
	isAdmin = false,
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
					<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border">
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
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="font-semibold text-sm text-foreground">
								{post.author.displayName}
							</span>
							<span className="text-xs text-muted-foreground">
								{post.author.username}
							</span>
							{post.author.isVerifiedBuyer && (
								<span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
									<CheckCircle2 className="h-3 w-3" />
									Đã mua hàng
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>{formatDate(post.createdAt)}</span>
							{post.isFromProductReview && (
								<>
									<span>•</span>
									<span className="text-[11px] font-medium text-primary">
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
						<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
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

			{/* Book Card Tag if attached */}
			{post.book && (
				<div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<BookOpen className="h-4 w-4" />
						</div>
						<div>
							<div className="text-xs font-semibold text-foreground">
								{post.book.title}
							</div>
							{post.book.rating && (
								<div className="flex items-center gap-1 pt-0.5">
									<div className="flex items-center text-amber-400">
										{[1, 2, 3, 4, 5].map((s) => (
											<Star
												key={s}
												className={`h-3 w-3 ${
													s <= post.book!.rating! ? "fill-amber-400" : "text-border"
												}`}
											/>
										))}
									</div>
									<span className="text-[11px] font-medium text-muted-foreground">
										({post.book.rating}/5)
									</span>
								</div>
							)}
						</div>
					</div>

					<Link
						href={`/products/${post.book.slug}`}
						className="inline-flex items-center text-xs font-medium text-primary hover:underline"
					>
						Xem sách →
					</Link>
				</div>
			)}

			{/* Post Content */}
			<div className="mt-3.5 space-y-2">
				<h3 className="text-base font-semibold text-foreground leading-snug">
					{post.title}
				</h3>
				<p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
					{post.content}
				</p>
			</div>

			{/* Post Interaction Bar */}
			<div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
				<div className="flex items-center gap-4">
					{/* Like Button */}
					<button
						type="button"
						onClick={handleToggleLike}
						disabled={isLiking}
						className={`group flex items-center gap-1.5 font-medium transition-colors ${
							isLiked
								? "text-red-500 font-semibold"
								: "hover:text-foreground"
						}`}
					>
						<Heart
							className={`h-4 w-4 transition-transform group-hover:scale-110 ${
								isLiked ? "fill-red-500 text-red-500" : ""
							}`}
						/>
						<span>{likes.length > 0 ? `${likes.length} Thích` : "Thích"}</span>
					</button>

					{/* Comment Toggle */}
					<button
						type="button"
						onClick={() => setShowComments(!showComments)}
						className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
					>
						<MessageSquare className="h-4 w-4" />
						<span>{comments.length} Bình luận</span>
					</button>
				</div>

				{/* Share Button */}
				<button
					type="button"
					onClick={handleShare}
					className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
				>
					<Share2 className="h-3.5 w-3.5" />
					<span>{copied ? "Đã copy link!" : "Chia sẻ"}</span>
				</button>
			</div>

			{/* Comment Section Drawer/Collapse */}
			{showComments && (
				<div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 animate-in fade-in-0">
					{/* Comments list */}
					{comments.length === 0 ? (
						<p className="text-center text-xs text-muted-foreground py-2">
							Chưa có bình luận nào. Hãy là người đầu tiên nêu cảm nghĩ!
						</p>
					) : (
						<div className="space-y-3">
							{comments.map((comm) => (
								<div key={comm.id} className="flex items-start gap-2.5">
									<div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border">
										<Image
											src={comm.author.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
											alt={comm.author.displayName}
											fill
											sizes="28px"
											className="object-cover"
											unoptimized
										/>
									</div>
									<div className="flex-1 rounded-xl bg-card p-2.5 border border-border/60 text-xs">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-foreground">
												{comm.author.displayName}
											</span>
											<span className="text-[10px] text-muted-foreground">
												{formatDate(comm.createdAt)}
											</span>
										</div>
										<p className="mt-1 text-foreground/90 leading-relaxed">
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
							className="h-8 text-xs bg-card"
							disabled={isSubmittingComment}
						/>
						<Button
							type="submit"
							disabled={!commentText.trim() || isSubmittingComment}
							className="h-8 px-3 shrink-0 text-xs gap-1"
						>
							<Send className="h-3 w-3" />
							Gửi
						</Button>
					</form>
				</div>
			)}
		</article>
	);
}
