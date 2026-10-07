"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, UserCheck, Sparkles, Camera } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityUser } from "@/lib/community/types";

const AVATAR_PRESETS = [
	"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
];

const GENRE_SUGGESTIONS = [
	"Kỹ năng sống & Tư duy",
	"Văn học kinh điển",
	"Kinh doanh & Khởi nghiệp",
	"Tâm lý học",
	"Triết học & Lịch sử",
	"Khoa học viễn tưởng",
];

interface CommunityProfileModalProps {
	isOpen: boolean;
	user: CommunityUser | null;
	onClose: () => void;
	onSave: (updated: Partial<CommunityUser>) => Promise<void>;
}

export function CommunityProfileModal({
	isOpen,
	user,
	onClose,
	onSave,
}: CommunityProfileModalProps) {
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [avatar, setAvatar] = useState("");
	const [bio, setBio] = useState("");
	const [favoriteGenre, setFavoriteGenre] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (user) {
			setUsername(user.username.replace(/^@/, ""));
			setDisplayName(user.displayName);
			setAvatar(user.avatar);
			setBio(user.bio || "");
			setFavoriteGenre(user.favoriteGenre || "");
			setError("");
		}
	}, [user, isOpen]);

	if (!isOpen || !user) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!displayName.trim()) {
			setError("Vui lòng nhập tên hiển thị");
			return;
		}
		if (!username.trim()) {
			setError("Vui lòng nhập tên người dùng (@username)");
			return;
		}

		setIsSubmitting(true);
		setError("");
		try {
			const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
			await onSave({
				username: `@${cleanUsername}`,
				displayName: displayName.trim(),
				avatar: avatar.trim() || user.avatar,
				bio: bio.trim(),
				favoriteGenre: favoriteGenre.trim(),
			});
			onClose();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu hồ sơ";
			setError(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
			<div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all sm:p-8 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
				{/* Close Button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					aria-label="Đóng"
				>
					<X className="h-5 w-5" />
				</button>

				{/* Header */}
				<div className="border-b border-border pb-4">
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-bold tracking-tight text-foreground">
							Tùy chỉnh hồ sơ độc giả
						</h2>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Định hình phong cách của bạn trong mạng xã hội cộng đồng sách AuraBook
					</p>
				</div>

				{error && (
					<div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="mt-5 space-y-4">
					{/* Avatar Selection */}
					<div>
						<label className="block text-xs font-semibold text-foreground mb-2">
							Ảnh đại diện (Avatar)
						</label>
						<div className="flex items-center gap-4">
							<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 shadow-xs">
								<Image
									src={avatar || user.avatar}
									alt="Avatar preview"
									fill
									sizes="64px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div className="flex-1 space-y-2">
								<div className="flex flex-wrap gap-2">
									{AVATAR_PRESETS.map((presetUrl, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => setAvatar(presetUrl)}
											className={`relative h-8 w-8 overflow-hidden rounded-full border-2 transition-all ${
												avatar === presetUrl ? "border-primary scale-110 shadow-xs" : "border-border opacity-70 hover:opacity-100"
											}`}
										>
											<Image
												src={presetUrl}
												alt={`Preset ${idx + 1}`}
												fill
												sizes="32px"
												className="object-cover"
												unoptimized
											/>
										</button>
									))}
								</div>
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Camera className="h-3.5 w-3.5" />
									<span>Hoặc nhập URL ảnh:</span>
								</div>
								<Input
									type="url"
									value={avatar}
									onChange={(e) => setAvatar(e.target.value)}
									placeholder="https://example.com/avatar.jpg"
									className="h-8 text-xs"
								/>
							</div>
						</div>
					</div>

					{/* Names */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
						<div>
							<label className="block text-xs font-semibold text-foreground mb-1">
								Tên hiển thị <span className="text-destructive">*</span>
							</label>
							<Input
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Nguyễn Văn A"
								className="text-sm"
								required
							/>
						</div>

						<div>
							<label className="block text-xs font-semibold text-foreground mb-1">
								Username (@tag) <span className="text-destructive">*</span>
							</label>
							<div className="relative">
								<span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">
									@
								</span>
								<Input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="nguyenvana"
									className="pl-7 text-sm"
									required
								/>
							</div>
						</div>
					</div>

					{/* Bio */}
					<div>
						<label className="block text-xs font-semibold text-foreground mb-1">
							Giới thiệu bản thân (Bio)
						</label>
						<textarea
							rows={3}
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Chia sẻ vài dòng về sở thích, câu nói tâm đắc hoặc thói quen đọc sách của bạn..."
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					{/* Favorite Genre */}
					<div>
						<label className="block text-xs font-semibold text-foreground mb-1">
							Thể loại sách yêu thích
						</label>
						<Input
							type="text"
							value={favoriteGenre}
							onChange={(e) => setFavoriteGenre(e.target.value)}
							placeholder="VD: Tâm lý học, Văn học, Kinh doanh..."
							className="text-sm"
						/>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{GENRE_SUGGESTIONS.map((genre) => (
								<button
									key={genre}
									type="button"
									onClick={() => setFavoriteGenre(genre)}
									className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
										favoriteGenre === genre
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
									}`}
								>
									{genre}
								</button>
							))}
						</div>
					</div>

					{/* Footer buttons */}
					<div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
						<Button
							type="button"
							variant="outline-solid"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Hủy
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="gap-2"
						>
							<UserCheck className="h-4 w-4" />
							{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
