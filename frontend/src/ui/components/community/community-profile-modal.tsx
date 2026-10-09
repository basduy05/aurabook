"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, UserCheck, Camera, Upload, Check } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { type CommunityUser } from "@/lib/community/types";
import { PRESET_AVATARS } from "@/lib/community/avatars";

const DEFAULT_PRESETS = [
	"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
	"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
];

export const BOOK_GENRES = [
	"Kinh doanh & Khởi nghiệp",
	"Kỹ năng sống & Phát triển bản thân",
	"Tài chính cá nhân & Đầu tư",
	"Văn học kinh điển",
	"Tiểu thuyết & Văn học hiện đại",
	"Tâm lý học & Hành vi",
	"Triết học & Tư tưởng nhân loại",
	"Khoa học tự nhiên & Vũ trụ",
	"Lịch sử thế giới & Lịch sử Việt Nam",
	"Công nghệ, Lập trình & Trí tuệ nhân tạo",
	"Thiền định, Mindfulness & Tâm linh",
	"Trinh thám, Kinh dị & Kỳ bí",
	"Khoa học viễn tưởng (Sci-Fi)",
	"Văn học giả tưởng (Fantasy)",
	"Hồi ký, Tự truyện & Tiểu sử",
	"Nghệ thuật, Thiết kế & Kiến trúc",
	"Thơ ca & Tản văn",
	"Sách thiếu nhi & Truyện tranh",
	"Sức khỏe, Y học & Dinh dưỡng",
	"Ngoại ngữ, Du học & Văn hóa quốc tế",
	"Chính trị, Ngoại giao & Luật học",
	"Giáo dục & Nuôi dạy con",
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
	const [avatarTab, setAvatarTab] = useState<"doraemon" | "shin" | "custom">("doraemon");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [mounted, setMounted] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

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

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 5 * 1024 * 1024) {
			setError("Dung lượng ảnh tải lên không được vượt quá 5MB");
			return;
		}

		if (!file.type.startsWith("image/")) {
			setError("Vui lòng chọn đúng định dạng hình ảnh (PNG, JPG, WEBP...)");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setAvatar(reader.result);
				setError("");
			}
		};
		reader.readAsDataURL(file);
	};

	const isUsernameCooldown = useMemo(() => {
		if (!user?.lastUsernameChange) return { active: false, daysLeft: 0 };
		const last = new Date(user.lastUsernameChange).getTime();
		const diff = Date.now() - last;
		const sevenDays = 7 * 24 * 60 * 60 * 1000;
		if (diff < sevenDays) {
			const daysLeft = Math.ceil((sevenDays - diff) / (24 * 60 * 60 * 1000));
			return { active: true, daysLeft };
		}
		return { active: false, daysLeft: 0 };
	}, [user?.lastUsernameChange]);

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

		const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
		if (isUsernameCooldown.active && `@${cleanUsername}` !== user.username.toLowerCase()) {
			setError(`Bạn chỉ có thể thay đổi ID người dùng sau mỗi 7 ngày. Vui lòng thử lại sau ${isUsernameCooldown.daysLeft} ngày nữa.`);
			return;
		}

		setIsSubmitting(true);
		setError("");
		try {
			await onSave({
				username: `@${cleanUsername}`,
				displayName: displayName.trim(),
				avatar: avatar.trim() || user.avatar,
				bio: bio.trim().slice(0, 150),
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

	const doraemonAvatars = PRESET_AVATARS.filter((a) => a.category === "doraemon");
	const shinAvatars = PRESET_AVATARS.filter((a) => a.category === "shin");

	if (!isOpen || !mounted || !user) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-xs">
			<div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all sm:p-7 animate-in fade-in-0 zoom-in-95 max-h-[92vh] overflow-y-auto">
				{/* Streamlined Single Line Header */}
				<div className="flex items-center justify-between border-b border-border pb-3">
					<h2 className="text-base font-bold text-foreground">
						Tùy chỉnh hồ sơ
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Đóng"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{error && (
					<div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[13px] text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="mt-5 space-y-5">
					{/* Avatar Section */}
					<div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3.5">
						<div className="flex items-center justify-between">
							<label className="block text-[13px] font-semibold text-foreground">
								Ảnh đại diện (Avatar)
							</label>
							<span className="text-[12px] text-muted-foreground">
								Tải ảnh từ máy tính hoặc chọn nhân vật
							</span>
						</div>

						{/* Preview & Current selection */}
						<div className="flex items-center gap-4">
							<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary shadow-sm bg-muted ring-4 ring-primary/10">
								<Image
									src={avatar || user.avatar}
									alt="Avatar preview"
									fill
									sizes="80px"
									className="object-cover"
									unoptimized
								/>
							</div>

							<div className="flex-1 space-y-2">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileUpload}
									accept="image/*"
									className="hidden"
								/>
								<Button
									type="button"
									variant="outline-solid"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
									className="gap-2 text-[12px] h-8.5 rounded-xl font-semibold"
								>
									<Upload className="h-3.5 w-3.5 text-primary" />
									Tải ảnh từ máy tính
								</Button>
								<p className="text-[11px] text-muted-foreground">
									Định dạng JPG, PNG, WEBP (Tối đa 5MB)
								</p>
							</div>
						</div>

						{/* Character Tabs Selector */}
						<div className="pt-2 border-t border-border/60">
							<div className="flex items-center gap-1.5 overflow-x-auto pb-2">
								<button
									type="button"
									onClick={() => setAvatarTab("doraemon")}
									className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
										avatarTab === "doraemon"
											? "bg-foreground text-background shadow-2xs"
											: "bg-muted text-muted-foreground hover:text-foreground"
									}`}
								>
									🐱 Doraemon
								</button>
								<button
									type="button"
									onClick={() => setAvatarTab("shin")}
									className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
										avatarTab === "shin"
											? "bg-foreground text-background shadow-2xs"
											: "bg-muted text-muted-foreground hover:text-foreground"
									}`}
								>
									🖍️ Shin - Cậu bé bút chì
								</button>
								<button
									type="button"
									onClick={() => setAvatarTab("custom")}
									className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
										avatarTab === "custom"
											? "bg-foreground text-background shadow-2xs"
											: "bg-muted text-muted-foreground hover:text-foreground"
									}`}
								>
									🖼️ Mặc định & URL
								</button>
							</div>

							{/* Character Grid */}
							<div className="mt-2">
								{avatarTab === "doraemon" && (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{doraemonAvatars.map((char) => (
											<button
												key={char.id}
												type="button"
												onClick={() => setAvatar(char.url)}
												className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
													avatar === char.url
														? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
														: "border-border/70 hover:border-primary/50 bg-card hover:bg-muted/40"
												}`}
											>
												<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
													<Image
														src={char.url}
														alt={char.name}
														fill
														sizes="40px"
														className="object-cover"
														unoptimized
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div className="text-[12px] font-bold text-foreground truncate">
														{char.name}
													</div>
													<div className="text-[10px] text-muted-foreground truncate">
														{char.description}
													</div>
												</div>
												{avatar === char.url && (
													<Check className="h-3.5 w-3.5 text-primary shrink-0 mr-1" />
												)}
											</button>
										))}
									</div>
								)}

								{avatarTab === "shin" && (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{shinAvatars.map((char) => (
											<button
												key={char.id}
												type="button"
												onClick={() => setAvatar(char.url)}
												className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
													avatar === char.url
														? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
														: "border-border/70 hover:border-primary/50 bg-card hover:bg-muted/40"
												}`}
											>
												<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
													<Image
														src={char.url}
														alt={char.name}
														fill
														sizes="40px"
														className="object-cover"
														unoptimized
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div className="text-[12px] font-bold text-foreground truncate">
														{char.name}
													</div>
													<div className="text-[10px] text-muted-foreground truncate">
														{char.description}
													</div>
												</div>
												{avatar === char.url && (
													<Check className="h-3.5 w-3.5 text-primary shrink-0 mr-1" />
												)}
											</button>
										))}
									</div>
								)}

								{avatarTab === "custom" && (
									<div className="space-y-2">
										<div className="flex flex-wrap gap-2">
											{DEFAULT_PRESETS.map((presetUrl, idx) => (
												<button
													key={idx}
													type="button"
													onClick={() => setAvatar(presetUrl)}
													className={`relative h-10 w-10 overflow-hidden rounded-full border-2 transition-all ${
														avatar === presetUrl ? "border-primary scale-110 shadow-xs" : "border-border opacity-70 hover:opacity-100"
													}`}
												>
													<Image
														src={presetUrl}
														alt={`Preset ${idx + 1}`}
														fill
														sizes="40px"
														className="object-cover"
														unoptimized
													/>
												</button>
											))}
										</div>
										<div className="flex items-center gap-1.5 text-[12px] text-muted-foreground pt-1">
											<Camera className="h-3.5 w-3.5" />
											<span>Hoặc dán URL ảnh trực tiếp:</span>
										</div>
										<Input
											type="url"
											value={avatar}
											onChange={(e) => setAvatar(e.target.value)}
											placeholder="https://example.com/avatar.jpg"
											className="h-8.5 text-[12px]"
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Names in 2-column layout */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						<div>
							<label className="block text-[13px] font-semibold text-foreground mb-1">
								Họ và tên hiển thị <span className="text-destructive">*</span>
							</label>
							<Input
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Nguyễn Văn A"
								className="text-[13px] h-9.5"
								required
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1">
								<label className="block text-[13px] font-semibold text-foreground">
									Username (@ID) <span className="text-destructive">*</span>
								</label>
								{isUsernameCooldown.active ? (
									<span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
										Đổi lại sau {isUsernameCooldown.daysLeft} ngày
									</span>
								) : (
									<span className="text-[11px] text-muted-foreground">
										Đổi được mỗi 7 ngày
									</span>
								)}
							</div>
							<div className="relative">
								<span className="absolute left-3 top-2.5 text-[13px] text-muted-foreground font-semibold">
									@
								</span>
								<Input
									type="text"
									value={username}
									disabled={isUsernameCooldown.active}
									onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
									placeholder="nguyenvana"
									className={`pl-7 text-[13px] h-9.5 ${
										isUsernameCooldown.active ? "bg-muted/60 cursor-not-allowed text-muted-foreground" : ""
									}`}
									required
								/>
							</div>
							{isUsernameCooldown.active ? (
								<p className="text-[11px] text-muted-foreground mt-1">
									🔒 Bạn vừa đổi ID gần đây. Theo quy định hệ thống, ID người dùng chỉ có thể thay đổi sau mỗi 7 ngày.
								</p>
							) : (
								<p className="text-[11px] text-muted-foreground mt-1">
									Chỉ chứa chữ thường không dấu, số và gạch dưới (3 - 30 ký tự).
								</p>
							)}
						</div>
					</div>

					{/* Favorite Genre Dropdown */}
					<div>
						<label className="block text-[13px] font-semibold text-foreground mb-1">
							Thể loại sách yêu thích
						</label>
						<select
							value={favoriteGenre}
							onChange={(e) => setFavoriteGenre(e.target.value)}
							className="w-full h-9.5 rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
						>
							<option value="">-- Chọn thể loại sách yêu thích --</option>
							{BOOK_GENRES.map((genre) => (
								<option key={genre} value={genre}>
									{genre}
								</option>
							))}
						</select>
					</div>

					{/* Bio (Max 150 characters) */}
					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="block text-[13px] font-semibold text-foreground">
								Giới thiệu bản thân (Bio)
							</label>
							<span
								className={`text-[11px] font-medium ${
									bio.length >= 150 ? "text-destructive font-bold" : "text-muted-foreground"
								}`}
							>
								{bio.length}/150 ký tự
							</span>
						</div>
						<textarea
							rows={3}
							maxLength={150}
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Chia sẻ vài dòng về sở thích, câu nói tâm đắc hoặc thói quen đọc sách của bạn (tối đa 150 ký tự)..."
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					{/* Footer buttons */}
					<div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
						<Button
							type="button"
							variant="outline-solid"
							onClick={onClose}
							disabled={isSubmitting}
							className="text-[13px] rounded-xl"
						>
							Hủy
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="gap-2 text-[13px] font-semibold rounded-xl"
						>
							<UserCheck className="h-4 w-4" />
							{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
						</Button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	);
}
