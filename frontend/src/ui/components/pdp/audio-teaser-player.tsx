"use client";

import { useState, useRef } from "react";
import { Headphones, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Loader } from "@/ui/atoms/loader";

interface AudioTeaserPlayerProps {
	productId?: string;
	productTitle?: string;
}

export function AudioTeaserPlayer({ productId = "default", productTitle = "Ấn phẩm sách" }: AudioTeaserPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const togglePlay = () => {
		if (!audioRef.current) {
			const audio = new Audio(`/api/audio/${encodeURIComponent(productId)}/teaser`);
			audioRef.current = audio;

			audio.onloadstart = () => setIsLoading(true);
			audio.oncanplay = () => setIsLoading(false);
			audio.onerror = () => {
				setIsLoading(false);
				// Simulate teaser preview if no wav file uploaded on server yet
				simulatePreview();
			};
			audio.ontimeupdate = () => {
				if (audio.duration) {
					setProgress((audio.currentTime / audio.duration) * 100);
				}
			};
			audio.onended = () => {
				setIsPlaying(false);
				setProgress(0);
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

	const simulateInterval = useRef<NodeJS.Timeout | null>(null);
	const simulatePreview = () => {
		setIsPlaying(true);
		let cur = 0;
		if (simulateInterval.current) clearInterval(simulateInterval.current);
		simulateInterval.current = setInterval(() => {
			cur += 2;
			if (cur >= 100) {
				cur = 0;
				setIsPlaying(false);
				if (simulateInterval.current) clearInterval(simulateInterval.current);
			}
			setProgress(cur);
		}, 600);
	};

	return (
		<div className="rounded-card border border-border bg-muted/30 p-3 text-xs transition-colors hover:bg-muted/50">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					<Button
						type="button"
						size="sm"
						variant="outline-solid"
						onClick={togglePlay}
						className="h-8 w-8 rounded-full p-0 shrink-0 text-primary"
						aria-label={isPlaying ? "Tạm dừng" : "Nghe thử sách nói"}
					>
						{isLoading ? (
							<Loader size="sm" />
						) : isPlaying ? (
							<Pause className="h-3.5 w-3.5 fill-current" />
						) : (
							<Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
						)}
					</Button>
					<div className="min-w-0">
						<div className="flex items-center gap-1.5 font-medium text-foreground truncate">
							<Headphones className="h-3.5 w-3.5 text-primary shrink-0" />
							<span>Nghe thử trích đoạn Sách Nói (Audiobook Teaser)</span>
						</div>
						<p className="text-[11px] text-muted-foreground truncate">
							{isPlaying ? `Đang phát bản nghe thử (60 giây) • ${productTitle}` : "Giọng đọc truyền cảm chuẩn phòng thu"}
						</p>
					</div>
				</div>

				<Badge variant="outline-solid" className="gap-1 text-[10px] shrink-0 font-normal">
					<Volume2 className="h-2.5 w-2.5 text-primary" />
					<span>Audio 60s</span>
				</Badge>
			</div>

			{/* Progress bar when playing */}
			{isPlaying && (
				<div className="mt-2.5 flex items-center gap-2">
					<div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300 rounded-full"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<span className="text-[10px] font-mono text-muted-foreground tabular-nums">
						{Math.round((progress / 100) * 60)}s
					</span>
				</div>
			)}
		</div>
	);
}
