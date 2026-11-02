"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Headphones, Play, Pause, Volume2, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Loader } from "@/ui/atoms/loader";
import { getFixedPreviewChapterInfo } from "@/lib/fixed-preview-chapters";

interface AudioTeaserPlayerProps {
	productId?: string;
	productTitle?: string;
}

export function AudioTeaserPlayer({ productId = "default", productTitle = "Ấn phẩm sách" }: AudioTeaserPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentTimeSec, setCurrentTimeSec] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const previewInfo = useMemo(() => getFixedPreviewChapterInfo(productId), [productId]);
	const simulateInterval = useRef<NodeJS.Timeout | null>(null);

	// Dừng âm thanh triệt để và giải phóng tài nguyên
	const stopAudio = useCallback(() => {
		if (audioRef.current) {
			try {
				audioRef.current.pause();
				audioRef.current.src = "";
				audioRef.current.currentTime = 0;
			} catch {}
			audioRef.current = null;
		}
		if (simulateInterval.current) {
			clearInterval(simulateInterval.current);
			simulateInterval.current = null;
		}
		setIsPlaying(false);
		setIsLoading(false);
		setProgress(0);
		setCurrentTimeSec(0);
	}, []);

	// NGẮT ÂM THANH NGAY LẬP TỨC KHI THOÁT KHỎI TRANG HOẶC CHUYỂN TRANG (Tuyệt đối không phát trong nền)
	useEffect(() => {
		const handleBeforeUnload = () => stopAudio();
		window.addEventListener("pagehide", handleBeforeUnload);
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			stopAudio();
			window.removeEventListener("pagehide", handleBeforeUnload);
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [stopAudio]);

	const togglePlay = () => {
		if (!audioRef.current) {
			const audio = new Audio(`/api/audio/${encodeURIComponent(productId)}/teaser`);
			audioRef.current = audio;

			audio.onloadstart = () => setIsLoading(true);
			audio.oncanplay = () => setIsLoading(false);
			audio.onerror = () => {
				setIsLoading(false);
				simulatePreview();
			};
			audio.ontimeupdate = () => {
				const cur = audio.currentTime;
				setCurrentTimeSec(Math.min(60, Math.floor(cur)));
				if (cur >= 65) {
					audio.pause();
					setIsPlaying(false);
					setProgress(100);
					return;
				}
				const dur = Math.max(1, audio.duration || 60);
				setProgress(Math.min(100, (cur / dur) * 100));
			};
			audio.onended = () => {
				setIsPlaying(false);
				setProgress(0);
				setCurrentTimeSec(0);
			};
		}

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			setIsLoading(true);
			audioRef.current
				.play()
				.then(() => {
					setIsLoading(false);
					setIsPlaying(true);
				})
				.catch(() => {
					setIsLoading(false);
					simulatePreview();
				});
		}
	};

	const simulatePreview = () => {
		setIsPlaying(true);
		let cur = 0;
		if (simulateInterval.current) clearInterval(simulateInterval.current);
		simulateInterval.current = setInterval(() => {
			cur += 1;
			setCurrentTimeSec(Math.min(60, cur));
			if (cur >= 60) {
				cur = 0;
				setIsPlaying(false);
				if (simulateInterval.current) clearInterval(simulateInterval.current);
			}
			setProgress((cur / 60) * 100);
		}, 1000);
	};

	const readerPreviewUrl = `/reader/${encodeURIComponent(productId)}?mode=trial&chapterPreview=1`;

	return (
		<div className="rounded-card border border-primary/20 bg-primary/5 p-3 text-xs transition-colors hover:bg-primary/10">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					<Button
						type="button"
						size="sm"
						variant="outline-solid"
						onClick={togglePlay}
						className="h-9 w-9 rounded-full p-0 shrink-0 text-primary border-primary/40 bg-background hover:bg-primary/10 transition-transform active:scale-95 shadow-xs"
						aria-label={isPlaying ? "Tạm dừng" : "Nghe thử sách nói"}
					>
						{isLoading ? (
							<Loader size="sm" />
						) : isPlaying ? (
							<Pause className="h-4 w-4 fill-current text-primary" />
						) : (
							<Play className="h-4 w-4 fill-current text-primary translate-x-0.5" />
						)}
					</Button>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
							<Headphones className="h-3.5 w-3.5 text-primary shrink-0" />
							<span className="truncate">Nghe thử Audio 60s: {previewInfo.chapterTitle}</span>
						</div>
						<p className="text-[11px] text-muted-foreground truncate mt-0.5">
							{isPlaying
								? `Đang phát bản nghe thử 60 giây • ${productTitle}`
								: "Chương ngẫu nhiên cố định • Giọng đọc chuẩn phòng thu"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-1.5 shrink-0">
					<Badge variant="outline-solid" className="gap-1 text-[10px] font-semibold border-primary/30 text-primary">
						<Volume2 className="h-2.5 w-2.5 text-primary" />
						<span>Audio 60s</span>
					</Badge>
				</div>
			</div>

			{/* Progress bar when playing */}
			{isPlaying && (
				<div className="mt-2.5 pt-2 border-t border-primary/15 flex items-center justify-between gap-3 animate-in fade-in duration-200">
					<div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300 rounded-full"
							style={{ width: `${Math.min(100, progress)}%` }}
						/>
					</div>
					<span className="text-[10px] font-mono font-bold text-primary tabular-nums shrink-0">
						{currentTimeSec}s / 60s
					</span>
					<Link
						href={readerPreviewUrl}
						onClick={() => stopAudio()}
						className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
						title="Mở giao diện đọc sách để nghe và theo dõi từng câu chữ"
					>
						<BookOpen className="h-3 w-3" />
						<span>Đọc cùng audio</span>
					</Link>
				</div>
			)}
		</div>
	);
}
