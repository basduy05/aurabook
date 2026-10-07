"use client";

import { useState, useRef } from "react";
import { History, X, Save, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityPost } from "@/lib/community/types";
import { RichToolbar, FormattedCommunityContent } from "./community-rich-editor";
import { formatCommunityExactTime } from "@/lib/community/time";

interface CommunityPostEditModalProps {
	isOpen: boolean;
	post: CommunityPost;
	onClose: () => void;
	onSave: (postId: string, newTitle: string, newContent: string) => Promise<void>;
}

export function CommunityPostEditModal({
	isOpen,
	post,
	onClose,
	onSave,
}: CommunityPostEditModalProps) {
	const [title, setTitle] = useState(post.title);
	const [content, setContent] = useState(post.content);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) {
			setError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			await onSave(post.id, title.trim(), content.trim());
			onClose();
		} catch (err: any) {
			setError(err?.message || "Không thể lưu chỉnh sửa bài viết.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
			<div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
				<div className="flex items-center justify-between border-b border-border pb-3">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Save className="h-4 w-4" />
						</div>
						<div>
							<h2 className="text-base font-bold text-foreground">Chỉnh sửa bài viết</h2>
							<p className="text-xs text-muted-foreground">
								Lịch sử các phiên bản trước sẽ được lưu lại công khai
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{error && (
					<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<label htmlFor="edit-post-title" className="text-xs font-semibold text-foreground">
							Tiêu đề bài viết
						</label>
						<Input
							id="edit-post-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Nhập tiêu đề bài viết..."
							className="text-xs bg-muted/30"
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label htmlFor="edit-post-content" className="text-xs font-semibold text-foreground">
								Nội dung bài viết
							</label>
							<RichToolbar
								textareaRef={textareaRef}
								value={content}
								onChange={setContent}
								size="sm"
							/>
						</div>
						<textarea
							id="edit-post-content"
							ref={textareaRef}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={6}
							placeholder="Chia sẻ góc nhìn hoặc cảm nhận của bạn..."
							className="w-full rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
							disabled={isSubmitting}
						/>
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
						<Button
							type="button"
							variant="outline-solid"
							size="sm"
							onClick={onClose}
							disabled={isSubmitting}
							className="text-xs"
						>
							Hủy bỏ
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isSubmitting || !title.trim() || !content.trim()}
							className="text-xs font-semibold gap-1.5"
						>
							<Save className="h-3.5 w-3.5" />
							<span>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

interface PostHistoryModalProps {
	isOpen: boolean;
	post: CommunityPost;
	onClose: () => void;
}

export function PostHistoryModal({ isOpen, post, onClose }: PostHistoryModalProps) {
	if (!isOpen) return null;

	const history = post.editHistory || [];


	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
			<div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
				<div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
							<History className="h-4 w-4" />
						</div>
						<div>
							<h2 className="text-base font-bold text-foreground">Lịch sử chỉnh sửa</h2>
							<p className="text-xs text-muted-foreground">
								Tất cả các phiên bản của bài viết này ({history.length + 1} phiên bản)
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="space-y-4 overflow-y-auto pr-1 flex-1">
					{/* Current active version */}
					<div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-bold text-primary flex items-center gap-1.5">
								<span className="h-2 w-2 rounded-full bg-primary" />
								Phiên bản hiện tại (Mới nhất)
							</span>
							<span className="text-muted-foreground flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{formatCommunityExactTime(post.updatedAt || post.createdAt)}
							</span>
						</div>
						<div className="font-semibold text-xs text-foreground">{post.title}</div>
						<FormattedCommunityContent content={post.content} className="text-xs" />
					</div>

					{/* Previous versions */}
					{history.map((hist, index) => (
						<div key={hist.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="font-semibold text-muted-foreground">
									Phiên bản cũ #{history.length - index}
								</span>
								<span className="text-muted-foreground flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatCommunityExactTime(hist.editedAt)}
								</span>
							</div>
							<div className="font-semibold text-xs text-foreground">{hist.title}</div>
							<FormattedCommunityContent content={hist.content} className="text-xs text-muted-foreground" />
						</div>
					))}
				</div>

				<div className="pt-2 border-t border-border flex justify-end shrink-0">
					<Button type="button" variant="outline-solid" size="sm" onClick={onClose} className="text-xs">
						Đóng lịch sử
					</Button>
				</div>
			</div>
		</div>
	);
}
