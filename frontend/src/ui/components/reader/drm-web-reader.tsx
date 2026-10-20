"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
	ChevronLeft,
	ChevronRight,
	ShieldCheck,
	ShieldAlert,
	Sun,
	Coffee,
	Bookmark,
	Lock,
	ArrowLeft,
	Maximize2,
	Minimize2,
	List,
	BookOpen,
	Send,
	Highlighter,
	Quote,
	X,
	PanelLeftClose,
	PanelRightClose,
	Check,
	Search,
	Bot,
	CopySlash,
	Trash2,
	ExternalLink,
	Eye,
	SlidersHorizontal,
	Columns,
	Square,
	Scroll,
	LogIn,
	Layers,
	Play,
	Pause,
	Headphones,
	Minus,
	Plus,
	Type,
	ChevronDown,
	RotateCcw,
	RotateCw,
	FileText,
	LocateFixed,
	Zap,
} from "lucide-react";
import { ReaderMarkdown } from "./reader-markdown";

export interface FontOption {
	id: string;
	label: string;
	style: string;
	value: string;
}

export const FONT_OPTIONS: FontOption[] = [
	{ id: "original", label: "Mặc định của sách (Gốc)", style: "font-sans", value: "inherit" },
	{ id: "be-vietnam", label: "Be Vietnam Pro (Việt hoá chuẩn)", style: "font-sans", value: "'Be Vietnam Pro', system-ui, sans-serif" },
	{ id: "literata", label: "Literata (Văn học cổ điển)", style: "font-serif", value: "'Literata', 'Palatino', serif" },
	{ id: "merriweather", label: "Merriweather (Tiểu thuyết có chân)", style: "font-serif", value: "'Merriweather', 'Georgia', serif" },
	{ id: "lora", label: "Lora (Thanh lịch & Tinh tế)", style: "font-serif", value: "'Lora', 'Times New Roman', serif" },
	{ id: "inter", label: "Inter (Hiện đại & Quốc tế)", style: "font-sans", value: "'Inter', system-ui, sans-serif" },
];
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import ePub, { EpubCFI, Contents, type Book, type Rendition } from "epubjs";
import { Button, buttonClassName } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";
import { CHROME_VERSION_KEY } from "@/lib/chrome-sync";
import { Loader } from "@/ui/atoms/loader";

// Helper: Patch Range.prototype.setEnd và setStart để tự động chặn đứng lỗi IndexSizeError (There is no child at offset X)
function patchRangePrototype(rangeProto: any) {
	if (!rangeProto || rangeProto.__aura_patched) return;
	try {
		const origSetEnd = rangeProto.setEnd;
		rangeProto.setEnd = function (node: Node, offset: number) {
			try {
				if (node) {
					if (node.nodeType === 1) { // ELEMENT_NODE
						const max = node.childNodes ? node.childNodes.length : 0;
						if (offset > max) offset = max;
						if (offset < 0) offset = 0;
					} else if (node.nodeType === 3 || node.nodeType === 8) { // TEXT_NODE / COMMENT_NODE
						const max = (node as CharacterData).length || 0;
						if (offset > max) offset = max;
						if (offset < 0) offset = 0;
					}
				}
				return origSetEnd.call(this, node, offset);
			} catch (e) {
				try {
					return origSetEnd.call(this, node, 0);
				} catch {}
			}
		};

		const origSetStart = rangeProto.setStart;
		rangeProto.setStart = function (node: Node, offset: number) {
			try {
				if (node) {
					if (node.nodeType === 1) {
						const max = node.childNodes ? node.childNodes.length : 0;
						if (offset > max) offset = max;
						if (offset < 0) offset = 0;
					} else if (node.nodeType === 3 || node.nodeType === 8) {
						const max = (node as CharacterData).length || 0;
						if (offset > max) offset = max;
						if (offset < 0) offset = 0;
					}
				}
				return origSetStart.call(this, node, offset);
			} catch (e) {
				try {
					return origSetStart.call(this, node, 0);
				} catch {}
			}
		};

		rangeProto.__aura_patched = true;
	} catch {}
}

// Helper: Patch Contents.prototype.locationOf để sửa dứt điểm bug của epubjs khi range.startContainer là Element
function patchContentsLocationOf(contentsProto: any) {
	if (!contentsProto || contentsProto.__aura_patched_loc) return;
	try {
		const origLocationOf = contentsProto.locationOf;
		contentsProto.locationOf = function (target: any, ignoreClass?: any) {
			try {
				if (this.document && this.epubcfi && this.epubcfi.isCfiString(target)) {
					const range = new (ePub as any).EpubCFI(target).toRange(this.document, ignoreClass);
					if (range) {
						if (!range.endContainer || (range.startContainer === range.endContainer && range.startOffset === range.endOffset)) {
							const container = range.startContainer;
							if (container && container.nodeType === 1) { // ELEMENT_NODE
								const maxOffset = container.childNodes ? container.childNodes.length : 0;
								try {
									range.setEnd(container, Math.min(range.startOffset + 1, maxOffset));
								} catch {}
							} else if (container && container.nodeType === 3) { // TEXT_NODE
								let pos = container.textContent ? container.textContent.indexOf(" ", range.startOffset) : -1;
								if (pos === -1) pos = (container as CharacterData).length || 0;
								try {
									range.setEnd(container, pos);
								} catch {}
							}
						}

						let targetPos = { left: 0, top: 0 };
						if (range.startContainer && range.startContainer.nodeType === 1) {
							const rect = (range.startContainer as Element).getBoundingClientRect();
							targetPos.left = rect.left;
							targetPos.top = rect.top;
						} else if (typeof range.getBoundingClientRect === "function") {
							const rect = range.getBoundingClientRect();
							targetPos.left = rect.left;
							targetPos.top = rect.top;
						}
						return targetPos;
					}
				}
			} catch {}
			try {
				return origLocationOf.call(this, target, ignoreClass);
			} catch (err) {
				return { left: 0, top: 0 };
			}
		};
		contentsProto.__aura_patched_loc = true;
	} catch {}
}

if (typeof window !== "undefined") {
	if (typeof Range !== "undefined" && Range.prototype) {
		patchRangePrototype(Range.prototype);
	}

	// Filter false-positive epubjs console.error when calculating Range bounds on Element nodes
	const origConsoleError = console.error;
	console.error = function (...args: any[]) {
		const first = String(args[0] || "");
		if (
			first.includes("setting end offset to start container length failed") ||
			first.includes("There is no child at offset") ||
			(args[1] && String(args[1]?.message || args[1] || "").includes("There is no child at offset"))
		) {
			return;
		}
		return origConsoleError.apply(this, args);
	};

	window.addEventListener(
		"error",
		(event: any) => {
			const msg = event?.message || event?.error?.message || String(event?.error || "");
			if (
				!msg ||
				msg === "undefined" ||
				msg.includes("UtilityScript") ||
				msg.includes("Failed to execute 'setEnd' on 'Range'") ||
				msg.includes("Failed to execute 'setStart' on 'Range'") ||
				msg.includes("There is no child at offset") ||
				event?.error?.name === "IndexSizeError"
			) {
				event.preventDefault?.();
				event.stopImmediatePropagation?.();
				return true;
			}
		},
		true,
	);
	window.addEventListener(
		"unhandledrejection",
		(e: any) => {
			const r = String(e?.reason?.message || e?.reason || "");
			if (!r || r === "undefined" || r.includes("Range") || r.includes("offset") || e?.reason?.name === "IndexSizeError") {
				e.preventDefault?.();
				e.stopImmediatePropagation?.();
			}
		},
		true,
	);
}

// Patch EpubCFI.prototype.toRange & Contents.prototype.locationOf
try {
	if (typeof Contents !== "undefined" && Contents.prototype) {
		patchContentsLocationOf(Contents.prototype);
	}
	const epubContents = (ePub as any)?.Contents || (ePub as any)?.default?.Contents;
	if (epubContents && epubContents.prototype) {
		patchContentsLocationOf(epubContents.prototype);
	}
} catch {}

try {
	if (typeof EpubCFI !== "undefined" && EpubCFI.prototype && typeof EpubCFI.prototype.toRange === "function") {
		const originalToRange = EpubCFI.prototype.toRange;
		EpubCFI.prototype.toRange = function (this: any, _doc: any, ignoreClass?: any) {
			try {
				return originalToRange.call(this, _doc, ignoreClass);
			} catch (err) {
				try {
					const doc = _doc || (typeof document !== "undefined" ? document : null);
					if (doc && typeof doc.createRange === "function") {
						const safeRange = doc.createRange();
						const targetNode =
							this.path && typeof this.findNode === "function" && this.path.steps
								? this.findNode(this.path.steps, doc, ignoreClass)
								: null;
						const container = targetNode || doc.body || doc.documentElement;
						if (container) {
							safeRange.selectNodeContents(container);
							safeRange.collapse(true);
							return safeRange;
						}
					}
				} catch {}
				return null as any;
			}
		};
	}
} catch {}

interface TocItem {
	id: string;
	label: string;
	href: string;
}

interface AIMessage {
	id: string;
	sender: "user" | "ai";
	text: string;
	timestamp: string;
	highlightQuote?: string;
}

interface ChatSession {
	id: string;
	title: string;
	createdAt: string;
	bookSlug: string;
	messages: AIMessage[];
}

interface SavedQuote {
	id: string;
	text: string;
	cfi: string;
	createdAt: string;
}

interface DRMAuditLog {
	id: string;
	timestamp: string;
	event: string;
	userId: string;
	userName: string;
	licenseId: string;
	page: number;
}

interface DRMWebReaderProps {
	bookTitle?: string;
	bookSlug?: string;
	epubUrl?: string;
	userEmail?: string;
	userId?: string;
	userName?: string;
	licenseId?: string;
	backUrl?: string;
	isTrial?: boolean;
}

export type PageLayoutMode = "double" | "single" | "scroll";

export interface VoiceOption {
	id: string;
	name: string;
	shortName: string;
	badge: string;
	gender: string;
	desc: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
	{
		id: "mailinh",
		name: "Mai Linh (beyoru/MaiLinh-TTS-CoreML)",
		shortName: "Mai Linh",
		badge: "VITS/Piper ONNX",
		gender: "Nữ thanh lịch",
		desc: "Model VITS/Piper ONNX giọng nữ nhẹ nhàng, phát âm tự nhiên, ngắt câu chuẩn, suy luận siêu mượt trên CPU.",
	},
	{
		id: "f5-tts-vietnamese",
		name: "F5-TTS Vietnamese (zalopay/hynt ViVoice)",
		shortName: "F5-TTS Flow",
		badge: "Zero-Shot",
		gender: "Đa giọng clone",
		desc: "Mô hình Flow Matching zero-shot voice cloning từ mẫu 5-10s bất kỳ với ngữ điệu tiếng Việt tự nhiên.",
	},
	{
		id: "vixtts",
		name: "viXTTS (XTTS-v2 Tiếng Việt)",
		shortName: "viXTTS",
		badge: "Cảm xúc & Hơi thở",
		gender: "Truyền cảm",
		desc: "Cross-lingual voice cloning, giữ độ vang, hơi thở tự nhiên và cảm xúc văn học sâu lắng.",
	},
	{
		id: "viettts",
		name: "VietTTS (dangvansam/viet-tts)",
		shortName: "VietTTS",
		badge: "FastSpeech2",
		gender: "Nữ miền Bắc",
		desc: "Pipeline FastSpeech2 kết hợp HiFi-GAN gọn nhẹ, mã nguồn mở chuyên biệt 100% cho tiếng Việt.",
	},
	{
		id: "vi_VN-hoaimy-aurabook",
		name: "Hoài My (1000-Epoch MC Studio)",
		shortName: "Hoài My",
		badge: "Chuẩn VTV",
		gender: "Nữ miền Bắc",
		desc: "Giọng MC đài truyền hình chuẩn mực, tròn vành rõ chữ, tối ưu cho sách nói phát triển bản thân.",
	},
];

export interface HighlightColorTheme {
	id: string;
	name: string;
	primary: string;
	sentenceBg: string;
	wordGlow: string;
	wordPastBg: string;
}

export const HIGHLIGHT_COLOR_PRESETS: HighlightColorTheme[] = [
	{
		id: "gold",
		name: "Hoàng Kim (Vàng Hổ Phách)",
		primary: "#f59e0b",
		sentenceBg: "rgba(245, 158, 11, 0.28)",
		wordGlow: "0 0 10px rgba(245, 158, 11, 0.9)",
		wordPastBg: "rgba(245, 158, 11, 0.18)",
	},
	{
		id: "emerald",
		name: "Ngọc Lục Bảo (Xanh Lá)",
		primary: "#10b981",
		sentenceBg: "rgba(16, 185, 129, 0.28)",
		wordGlow: "0 0 10px rgba(16, 185, 129, 0.9)",
		wordPastBg: "rgba(16, 185, 129, 0.18)",
	},
	{
		id: "sky",
		name: "Lam Biển (Xanh Dương)",
		primary: "#0ea5e9",
		sentenceBg: "rgba(14, 165, 233, 0.28)",
		wordGlow: "0 0 10px rgba(14, 165, 233, 0.9)",
		wordPastBg: "rgba(14, 165, 233, 0.18)",
	},
	{
		id: "purple",
		name: "Tử Tinh (Tím Thạch Anh)",
		primary: "#8b5cf6",
		sentenceBg: "rgba(139, 92, 246, 0.28)",
		wordGlow: "0 0 10px rgba(139, 92, 246, 0.9)",
		wordPastBg: "rgba(139, 92, 246, 0.18)",
	},
	{
		id: "rose",
		name: "Hồng San Hô (Đỏ Hồng)",
		primary: "#f43f5e",
		sentenceBg: "rgba(244, 63, 94, 0.28)",
		wordGlow: "0 0 10px rgba(244, 63, 94, 0.9)",
		wordPastBg: "rgba(244, 63, 94, 0.18)",
	},
];

const AUDIOBOOK_SETTINGS_KEY = "aurabook_reader_audiobook_settings";

export function DRMWebReader({
	bookTitle = "Đắc Nhân Tâm (How to Win Friends and Influence People)",
	bookSlug = "dac-nhan-tam",
	epubUrl = "/books/dac-nhan-tam.epub",
	userEmail: initialUserEmail = "",
	userId: initialUserId = "",
	userName: initialUserName = "",
	licenseId: initialLicenseId = "",
	backUrl = "/community?tab=bookshelf",
	isTrial = false,
}: DRMWebReaderProps) {
	const viewerRef = useRef<HTMLDivElement | null>(null);
	const bookRef = useRef<Book | null>(null);
	const renditionRef = useRef<Rendition | null>(null);
	const aiMessagesEndRef = useRef<HTMLDivElement | null>(null);

	// Ref to distinguish deliberate Ctrl+C / Cmd+C copy attempts from regular text selection
	const isExplicitCopyAttempt = useRef<boolean>(false);

	// Real account profile state
	const [userProfile, setUserProfile] = useState<{
		id: string;
		name: string;
		email: string;
		license: string;
	}>({
		id: initialUserId || "AUR-USER",
		name: initialUserName || "Độc giả AuraBook",
		email: initialUserEmail || "docgia@aurabook.vn",
		license: initialLicenseId || `LCP-${bookSlug.substring(0, 6).toUpperCase()}`,
	});

	// Anti-screenshot & DRM protection state
	const [isScreenProtected, setIsScreenProtected] = useState<boolean>(false);
	const [showCopyAlert, setShowCopyAlert] = useState<boolean>(false);

	// Navigation panels
	const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
	const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
	const [aiTab, setAiTab] = useState<"chat" | "quotes" | "history">("chat");
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const [tocSearch, setTocSearch] = useState<string>("");
	const [tocList, setTocList] = useState<TocItem[]>([]);
	const [activeChapterHref, setActiveChapterHref] = useState<string>("");

	// Reading Display Settings (Layout mode: Double / Single / Continuous Scroll)
	const [layoutMode, setLayoutMode] = useState<PageLayoutMode>("double");
	const [lineHeight, setLineHeight] = useState<"normal" | "relaxed">("normal");

	// Reader state: only "light" and "sepia" (dark mode permanently removed)
	const [theme, setTheme] = useState<"light" | "sepia">("light");
	const [fontSize, setFontSize] = useState<number>(100);
	const [fontFamily, setFontFamily] = useState<string>("original");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(isTrial ? 15 : 150);
	const [readPercentage, setReadPercentage] = useState<number>(1);
	const [viewedCount, setViewedCount] = useState<number>(1);
	const viewedPagesRef = useRef<Set<number>>(new Set([1]));
	const [isTrialLocked, setIsTrialLocked] = useState<boolean>(false);
	const isTrialLockedRef = useRef<boolean>(false);
	isTrialLockedRef.current = isTrialLocked;
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	// Text selection state & Floating popover coordinates
	const [selectedText, setSelectedText] = useState<string>("");
	const [selectedCfi, setSelectedCfi] = useState<string>("");
	const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number; isBelow?: boolean } | null>(null);
	const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
	const [toastNotice, setToastNotice] = useState<string | null>(null);

	// Pulsing quote state
	const [pulsingCfi, setPulsingCfi] = useState<string | null>(null);

	// AI Reading Companion state
	const [aiInput, setAiInput] = useState<string>("");
	const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
	const [aiMessages, setAiMessages] = useState<AIMessage[]>([
		{
			id: "welcome-ai",
			sender: "ai",
			text: `Chào mừng bạn đến với "${bookTitle}". Tôi là Trợ lý AI hỗ trợ đọc sách của AuraBook. Tôi có thể diễn giải các tầng ý nghĩa triết lý, giải thích bối cảnh và phân tích những trích dẫn tâm đắc của bạn.`,
			timestamp: "Vừa xong",
		},
	]);
	const [aiSpeedMode, setAiSpeedMode] = useState<"fast" | "deep">("fast");

	const storageKey = `aurabook_reader_progress_${bookSlug}`;
	const exactPosStorageKey = `aurabook_reader_exact_pos_${bookSlug}`;
	const quotesStorageKey = `aurabook_reader_quotes_${bookSlug}`;
	const chatSessionsStorageKey = `aurabook_chat_sessions_${bookSlug}`;
	const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			return JSON.parse(localStorage.getItem(`aurabook_chat_sessions_${bookSlug}`) || "[]") as ChatSession[];
		} catch {
			return [];
		}
	});
	const [viewingSession, setViewingSession] = useState<ChatSession | null>(null);
	const auditLogsStorageKey = `aurabook_drm_audit_logs_${bookSlug}`;

	void pulsingCfi;

	// Audio Narration (Sách nói - Continuous Auto-Advancing TTS)
	const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
	const [isTtsLoading, setIsTtsLoading] = useState<boolean>(false);
	const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
	const ttsSpeedRef = useRef<number>(1.0);
	ttsSpeedRef.current = ttsSpeed;
	const [selectedVoice, setSelectedVoice] = useState<string>("mailinh");
	const selectedVoiceRef = useRef<string>("mailinh");
	selectedVoiceRef.current = selectedVoice;
	const [isAudioPopoverOpen, setIsAudioPopoverOpen] = useState<boolean>(false);
	const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);
	const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
	const sentenceQueueRef = useRef<{ sentences: string[]; currentIndex: number }>({ sentences: [], currentIndex: 0 });
	const isContinuousPlayingRef = useRef<boolean>(false);
	const audioPrefetchCache = useRef<Map<string, string>>(new Map());
	const inFlightPrefetches = useRef<Set<string>>(new Set());

	const clickedParagraphRef = useRef<HTMLElement | null>(null);
	const lastClickedCfiRef = useRef<string | null>(null);
	const lastReadTargetRef = useRef<{
		source: "selection" | "page" | "clicked";
		text: string;
		page: number;
	} | null>(null);

	// Sleep Timer Control (15, 30, 60 minutes)
	const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0);
	const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number>(0);

	// Highlight Color Customization (Hoàng Kim, Ngọc Lục Bảo, Lam Biển, Tử Tinh, Hồng San Hô)
	const [highlightColorId, setHighlightColorId] = useState<string>("gold");
	const highlightColorIdRef = useRef<string>("gold");
	highlightColorIdRef.current = highlightColorId;

	// Reading position tracking
	const currentPlayingLocationRef = useRef<{
		page: number;
		cfi?: string;
		sentence?: string;
		chapterHref?: string;
	} | null>(null);

	// Tự động quay lại vị trí đang đọc sau khi người dùng không tương tác (Auto-Return to Active Reading Location after Inactivity)
	const isUserBrowsingAwayRef = useRef<boolean>(false);
	const userInactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Lưu cài đặt sách nói vào localStorage
	const saveAudiobookSettings = useCallback((settings: {
		voice?: string;
		speed?: number;
		highlightColor?: string;
		sleepTimerMinutes?: number;
	}) => {
		if (typeof window === "undefined") return;
		try {
			const existing = (JSON.parse(localStorage.getItem(AUDIOBOOK_SETTINGS_KEY) || "{}") || {}) as Record<string, any>;
			const updated = { ...existing, ...settings };
			localStorage.setItem(AUDIOBOOK_SETTINGS_KEY, JSON.stringify(updated));
		} catch {}
	}, []);

	// Ngăn chặn lỗi Console Error / UtilityScript / IndexSizeError làm văng popup Turbopack dev overlay
	useEffect(() => {
		if (typeof window === "undefined") return;

		const originalConsoleError = window.console.error;
		window.console.error = function (...args: any[]) {
			if (
				args.length === 0 ||
				args[0] === undefined ||
				args[0] === null ||
				String(args[0]) === "undefined" ||
				String(args[0]).includes("UtilityScript") ||
				String(args[0]).includes("Failed to execute 'setEnd' on 'Range'") ||
				String(args[0]).includes("Failed to execute 'setStart' on 'Range'") ||
				String(args[0]).includes("There is no child at offset") ||
				String(args[0]).includes("IndexSizeError")
			) {
				return;
			}
			try {
				const stack = new Error().stack || "";
				if (stack.includes("UtilityScript")) {
					return;
				}
			} catch {}
			if (originalConsoleError) originalConsoleError.apply(console, args);
		};

		const handleGlobalError = (event: ErrorEvent) => {
			const msg = event?.message || event?.error?.message || String(event?.error || "");
			if (
				!msg ||
				msg === "undefined" ||
				msg.includes("UtilityScript") ||
				msg.includes("Failed to execute 'setEnd' on 'Range'") ||
				msg.includes("Failed to execute 'setStart' on 'Range'") ||
				msg.includes("There is no child at offset") ||
				event?.error?.name === "IndexSizeError"
			) {
				event.preventDefault?.();
				event.stopImmediatePropagation?.();
				return true;
			}
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const reason = event?.reason;
			const reasonStr = String(reason?.message || reason || "");
			if (
				!reason ||
				reasonStr === "undefined" ||
				reasonStr === "" ||
				reasonStr.includes("UtilityScript") ||
				reasonStr.includes("Failed to execute 'setEnd' on 'Range'") ||
				reasonStr.includes("Failed to execute 'setStart' on 'Range'") ||
				reasonStr.includes("There is no child at offset") ||
				reason?.name === "IndexSizeError"
			) {
				event.preventDefault?.();
				event.stopImmediatePropagation?.();
			}
		};

		window.addEventListener("error", handleGlobalError, true);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		return () => {
			window.console.error = originalConsoleError;
			window.removeEventListener("error", handleGlobalError, true);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
		};
	}, []);


	// Nạp cài đặt sách nói đã lưu từ trước (Giọng đọc, Tốc độ, Màu highlight, Hẹn giờ)
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const saved = localStorage.getItem(AUDIOBOOK_SETTINGS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as Record<string, any>;
				if (parsed && typeof parsed === "object") {
					if (parsed.voice) {
						setSelectedVoice(parsed.voice);
						selectedVoiceRef.current = parsed.voice;
					}
					if (typeof parsed.speed === "number") {
						setTtsSpeed(parsed.speed);
						ttsSpeedRef.current = parsed.speed;
					}
					if (parsed.highlightColor) {
						setHighlightColorId(parsed.highlightColor);
						highlightColorIdRef.current = parsed.highlightColor;
					}
					if (typeof parsed.sleepTimerMinutes === "number") {
						setSleepTimerMinutes(parsed.sleepTimerMinutes);
						setSleepTimerRemainingSec(parsed.sleepTimerMinutes * 60);
					}
				}
			}
		} catch {}
	}, []);

	// DRM Session & Concurrency Protection
	const [isAuthRevoked, setIsAuthRevoked] = useState<boolean>(false);
	const [isMultiTabBlocked, setIsMultiTabBlocked] = useState<boolean>(false);

	const tabId = useMemo(
		() => `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		[],
	);
	const singleTabChannelRef = useRef<BroadcastChannel | null>(null);

	const claimActiveTab = useCallback(() => {
		try {
			localStorage.setItem(`aurabook_active_reader_tab_${bookSlug}`, tabId);
		} catch {}
		singleTabChannelRef.current?.postMessage({
			type: "CLAIM_TAB",
			tabId,
			timestamp: Date.now(),
		});
		setIsMultiTabBlocked(false);
	}, [bookSlug, tabId]);

	// Fetch real logged-in account profile from API & enforce access
	useEffect(() => {
		async function fetchRealProfile() {
			try {
				const res = await fetch("/api/community/profile");
				if (!res.ok) {
					setIsAuthRevoked(true);
					bookRef.current?.destroy();
					return;
				}
				const data = (await res.json()) as any;
				if (!data?.user) {
					setIsAuthRevoked(true);
					bookRef.current?.destroy();
					return;
				}
				const u = data.user;
				const realId = u.realAccount?.id || u.id || "MEMBER";
				const realName = u.displayName || u.realAccount?.fullName || u.username || "Độc giả AuraBook";
				const realEmail = u.realAccount?.email || "docgia@aurabook.vn";
				const cleanId = String(realId).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
				const realLicense = `LCP-${cleanId || "AUR"}-${bookSlug.substring(0, 6).toUpperCase()}`;

				setUserProfile({
					id: String(realId),
					name: realName,
					email: realEmail,
					license: realLicense,
				});
				setIsAuthRevoked(false);
			} catch (e) {
				console.warn("[DRMWebReader] Could not fetch profile:", e);
			}
		}
		fetchRealProfile();
	}, [bookSlug]);

	// Session Watchdog: Detects logout, session expiration or cross-tab sign-out
	useEffect(() => {
		let isMounted = true;
		let checkInterval: NodeJS.Timeout;

		const verifyAuthSession = async () => {
			try {
				const res = await fetch("/api/community/profile");
				if (!res.ok) {
					if (isMounted) {
						setIsAuthRevoked(true);
						bookRef.current?.destroy();
					}
					return;
				}
				const data = (await res.json()) as any;
				if (!data?.user) {
					if (isMounted) {
						setIsAuthRevoked(true);
						bookRef.current?.destroy();
					}
				} else {
					if (isMounted) {
						setIsAuthRevoked(false);
					}
				}
			} catch {
				// Network error
			}
		};

		// Check when cross-tab storage changes (e.g. user logged out in another tab)
		const handleStorage = (e: StorageEvent) => {
			if (e.key === CHROME_VERSION_KEY || e.key === null) {
				verifyAuthSession();
			}
		};

		// Check when tab becomes visible or receives focus
		const handleVisibilityOrFocus = () => {
			if (document.visibilityState === "visible") {
				verifyAuthSession();
			}
		};

		window.addEventListener("storage", handleStorage);
		window.addEventListener("focus", handleVisibilityOrFocus);
		document.addEventListener("visibilitychange", handleVisibilityOrFocus);

		// Periodic watchdog check every 5 seconds
		checkInterval = setInterval(verifyAuthSession, 5000);

		return () => {
			isMounted = false;
			clearInterval(checkInterval);
			window.removeEventListener("storage", handleStorage);
			window.removeEventListener("focus", handleVisibilityOrFocus);
			document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
		};
	}, []);

	// Single Tab DRM Enforcement: Enforce exactly 1 active tab for reading
	useEffect(() => {
		if (typeof window === "undefined") return;

		const CHANNEL_NAME = `aurabook_drm_single_tab_${bookSlug}`;
		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel(CHANNEL_NAME);
			singleTabChannelRef.current = channel;
		} catch {
			// BroadcastChannel fallback
		}

		// Whenever this tab mounts, it claims ownership of reading session
		claimActiveTab();

		const handleMessage = (e: MessageEvent) => {
			const data = e.data;
			if (!data) return;

			if (data.type === "CLAIM_TAB") {
				if (data.tabId !== tabId) {
					// Another tab became active -> lock this tab immediately!
					setIsMultiTabBlocked(true);
				}
			}
		};

		channel?.addEventListener("message", handleMessage);

		// Synchronize state with storage
		const checkOwnership = () => {
			try {
				const currentActive = localStorage.getItem(`aurabook_active_reader_tab_${bookSlug}`);
				if (currentActive && currentActive !== tabId) {
					setIsMultiTabBlocked(true);
				} else if (currentActive === tabId) {
					setIsMultiTabBlocked(false);
				}
			} catch {}
		};

		// Fallback cross-tab storage listener
		const handleStorage = (e: StorageEvent) => {
			if (e.key === `aurabook_active_reader_tab_${bookSlug}`) {
				checkOwnership();
			}
		};

		window.addEventListener("storage", handleStorage);
		window.addEventListener("focus", checkOwnership);
		document.addEventListener("visibilitychange", checkOwnership);

		// Continuous watchdog every 600ms
		const pollInterval = setInterval(checkOwnership, 600);

		return () => {
			clearInterval(pollInterval);
			channel?.removeEventListener("message", handleMessage);
			channel?.close();
			window.removeEventListener("storage", handleStorage);
			window.removeEventListener("focus", checkOwnership);
			document.removeEventListener("visibilitychange", checkOwnership);
		};
	}, [bookSlug, tabId, claimActiveTab]);

	// Load saved quotes from localStorage
	useEffect(() => {
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem(quotesStorageKey);
				if (saved) {
					setSavedQuotes(JSON.parse(saved) as SavedQuote[]);
				}
			} catch (e) {
				// ignore
			}
		}
	}, [quotesStorageKey]);

	// Auto scroll AI chat
	useEffect(() => {
		if (isAiOpen && aiTab === "chat") {
			aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [aiMessages, isAiOpen, aiTab]);

	const userProfileRef = useRef(userProfile);
	userProfileRef.current = userProfile;

	const currentPageRef = useRef(currentPage);
	currentPageRef.current = currentPage;

	const layoutModeRef = useRef<PageLayoutMode>(layoutMode);
	layoutModeRef.current = layoutMode;

	const lineHeightRef = useRef<"normal" | "relaxed">(lineHeight);
	lineHeightRef.current = lineHeight;

	const fontFamilyRef = useRef<string>(fontFamily);
	fontFamilyRef.current = fontFamily;

	// Show toast helper
	const showToast = useCallback((msg: string) => {
		setToastNotice(msg);
		setTimeout(() => setToastNotice(null), 3600);
	}, []);

	// Record security audit log (stable reference using refs to avoid re-triggering effects)
	const recordAuditLog = useCallback(
		(eventDesc: string) => {
			if (typeof window === "undefined") return;
			try {
				const existingLogs = JSON.parse(localStorage.getItem(auditLogsStorageKey) || "[]") as DRMAuditLog[];
				const newEntry: DRMAuditLog = {
					id: String(Date.now()),
					timestamp: new Date().toLocaleString("vi-VN"),
					event: eventDesc,
					userId: userProfileRef.current.id,
					userName: userProfileRef.current.name,
					licenseId: userProfileRef.current.license,
					page: currentPageRef.current,
				};
				const updated = [newEntry, ...existingLogs.slice(0, 49)];
				localStorage.setItem(auditLogsStorageKey, JSON.stringify(updated));
			} catch (e) {
				// ignore
			}
		},
		[auditLogsStorageKey],
	);

	const formatTime = (secs: number) => {
		if (isNaN(secs) || secs < 0) return "00:00";
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	const restoreOriginalDom = useCallback(() => {
		try {
			const contentsList = (renditionRef.current as any)?.getContents?.() || [];
			contentsList.forEach((contents: any) => {
				const doc = contents.document as Document;
				if (!doc) return;
				const wrappedEls = doc.querySelectorAll("[data-aura-orig-html]");
				wrappedEls.forEach((el) => {
					el.innerHTML = el.getAttribute("data-aura-orig-html") || el.innerHTML;
					el.removeAttribute("data-aura-orig-html");
				});
				const oldActiveWords = doc.querySelectorAll(".aurabook-word-active, .aurabook-word-past, .aurabook-karaoke-active, .aurabook-sentence-active, .aurabook-sentence, mark.aurabook-sentence");
				oldActiveWords.forEach((el) => {
					el.classList.remove("aurabook-word-active", "aurabook-word-past", "aurabook-karaoke-active", "aurabook-sentence-active");
					(el as HTMLElement).style.background = "transparent";
					(el as HTMLElement).style.boxShadow = "none";
				});
			});
		} catch (e) {}
	}, []);

	// Sleep Timer ticking interval
	useEffect(() => {
		if (sleepTimerMinutes <= 0 || !isTtsPlaying) return;

		const interval = setInterval(() => {
			setSleepTimerRemainingSec((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					if (ttsAudioRef.current) {
						ttsAudioRef.current.pause();
					}
					isContinuousPlayingRef.current = false;
					setIsTtsPlaying(false);
					setSleepTimerMinutes(0);
					restoreOriginalDom();
					showToast("🌙 Đã dừng đọc sách theo hẹn giờ ngủ (Sleep Timer)");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [sleepTimerMinutes, isTtsPlaying, showToast, restoreOriginalDom]);

	const GOOGLE_FONTS_HREF =
		"https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap";

	// Immediate reader style injector (Fonts, Theme, Line-height, Font-size)
	// Immediate reader style injector (Fonts, Theme, Line-height, Font-size, Highlight Color)
	const applyReaderStyles = useCallback(
		(
			targetTheme = theme,
			targetFont = fontFamilyRef.current,
			targetLineHeight = lineHeightRef.current,
			targetFontSize = fontSize,
			targetHighlightColor = highlightColorIdRef.current,
		) => {
			if (!renditionRef.current) return;
			const fontOpt = FONT_OPTIONS.find((f) => f.id === targetFont) || FONT_OPTIONS[0];
			const fontVal = fontOpt.value;
			const isSepiaTheme = targetTheme === "sepia";
			const bgColor = isSepiaTheme ? "#fbf0d9" : "#ffffff";
			const textColor = isSepiaTheme ? "#433422" : "#1e293b";
			const lhVal = targetLineHeight === "relaxed" ? "2.0" : "1.65";
			const hlTheme = HIGHLIGHT_COLOR_PRESETS.find((c) => c.id === targetHighlightColor) || HIGHLIGHT_COLOR_PRESETS[0];

			try {
				renditionRef.current.themes.select(targetTheme);
				renditionRef.current.themes.fontSize(`${targetFontSize}%`);
				if (fontOpt.id === "original") {
					renditionRef.current.themes.override("font-family", "inherit !important");
				} else {
					renditionRef.current.themes.override("font-family", `${fontVal} !important`);
				}
				renditionRef.current.themes.override("line-height", `${lhVal} !important`);
			} catch (e) {}

			try {
				const contentsList = (renditionRef.current as any).getContents?.() || [];
				contentsList.forEach((contents: any) => {
					const doc = contents.document as Document;
					if (!doc) return;

					let fontLink = doc.getElementById("aurabook-google-fonts") as HTMLLinkElement | null;
					if (!fontLink) {
						fontLink = doc.createElement("link");
						fontLink.id = "aurabook-google-fonts";
						fontLink.rel = "stylesheet";
						fontLink.href = GOOGLE_FONTS_HREF;
						doc.head?.appendChild(fontLink);
					}

					let styleTag = doc.getElementById("aurabook-custom-reader-style") as HTMLStyleElement | null;
					if (!styleTag) {
						styleTag = doc.createElement("style");
						styleTag.id = "aurabook-custom-reader-style";
						doc.head?.appendChild(styleTag);
					}

					styleTag.textContent = `
						html, body {
							background-color: ${bgColor} !important;
							color: ${textColor} !important;
							font-family: ${fontVal} !important;
							line-height: ${lhVal} !important;
							font-size: ${targetFontSize}% !important;
							transition: background-color 0.2s ease, color 0.2s ease;
							-webkit-user-drag: none !important;
							user-drag: none !important;
						}
						* {
							-webkit-user-drag: none !important;
							user-drag: none !important;
						}
						p, span, div, h1, h2, h3, h4, h5, h6, a, blockquote, li, em, strong, article, section, b, i, table, tr, td, th {
							font-family: ${fontVal} !important;
							color: ${textColor} !important;
							line-height: ${lhVal} !important;
							-webkit-user-drag: none !important;
							user-drag: none !important;
						}
						::selection {
							background: ${isSepiaTheme ? "rgba(184, 134, 11, 0.35)" : "rgba(59, 130, 246, 0.35)"} !important;
							color: inherit !important;
						}
						::-moz-selection {
							background: ${isSepiaTheme ? "rgba(184, 134, 11, 0.35)" : "rgba(59, 130, 246, 0.35)"} !important;
							color: inherit !important;
						}
						.aura-pulsing-quote {
							animation: auraPulseAnim 0.75s ease-in-out infinite alternate !important;
						}
						@keyframes auraPulseAnim {
							0% { fill: #fde047 !important; fill-opacity: 0.48 !important; }
							100% { fill: #fef08a !important; fill-opacity: 0.18 !important; }
						}
						.aura-pulsing-glow {
							background-color: rgba(253, 224, 71, 0.45) !important;
							box-shadow: 0 0 12px rgba(253, 224, 71, 0.65) !important;
							animation: auraGlowAnim 0.8s ease-in-out infinite alternate !important;
							border-radius: 4px !important;
						}
						@keyframes auraGlowAnim {
							0% { background-color: rgba(253, 224, 71, 0.50) !important; box-shadow: 0 0 12px rgba(253, 224, 71, 0.70) !important; }
							100% { background-color: rgba(254, 240, 138, 0.20) !important; box-shadow: 0 0 3px rgba(253, 224, 71, 0.25) !important; }
						}
						span.aurabook-sentence {
							transition: background-color 0.2s ease, box-shadow 0.2s ease;
							border-radius: 4px;
							display: inline !important;
							background: transparent !important;
							box-shadow: none !important;
						}
						span.aurabook-sentence-active {
							background-color: ${hlTheme.sentenceBg} !important;
							box-shadow: 0 0 0 2px ${hlTheme.primary}88 !important;
							border-radius: 4px !important;
							display: inline !important;
						}
						tr.aurabook-sentence-active {
							background-color: ${hlTheme.sentenceBg} !important;
							transition: background-color 0.2s ease;
						}
						tr.aurabook-sentence-active td,
						tr.aurabook-sentence-active th,
						td.aurabook-sentence-active,
						th.aurabook-sentence-active,
						caption.aurabook-sentence-active {
							background-color: ${hlTheme.sentenceBg} !important;
							outline: 2px solid ${hlTheme.primary}88 !important;
							border-radius: 2px !important;
							transition: background-color 0.2s ease;
						}
						table {
							margin: 1rem 0 !important;
							border-collapse: collapse !important;
							width: 100% !important;
						}
						th, td {
							border: 1px solid rgba(120, 120, 120, 0.25) !important;
							padding: 6px 10px !important;
						}
						th {
							background: rgba(120, 120, 120, 0.1) !important;
							font-weight: 600 !important;
						}
					`;
				});
			} catch (e) {
				console.warn("[applyReaderStyles] error:", e);
			}
		},
		[theme, fontSize],
	);

	// Hàm chuyển đổi bảng biểu (HTML Table) thành câu văn tiếng Việt tự nhiên cho sách nói
	const parseTableToSpeech = useCallback((table: HTMLTableElement): string => {
		try {
			const parts: string[] = [];
			const caption = table.querySelector("caption")?.textContent?.trim();
			if (caption) parts.push(`Bảng: ${caption}.`);

			const thEls = Array.from(table.querySelectorAll("thead th, tr:first-child th"));
			const headers = thEls.map((th) => th.textContent?.trim() || "").filter(Boolean);
			if (headers.length > 0) {
				parts.push(`Bao gồm các cột: ${headers.join(", ")}.`);
			}

			const rows = Array.from(table.querySelectorAll("tbody tr, tr"));
			let rowNum = 1;
			for (const row of rows) {
				const tds = Array.from(row.querySelectorAll("td"));
				if (tds.length === 0) continue;

				const rowCells: string[] = [];
				tds.forEach((td, i) => {
					const val = td.textContent?.trim();
					if (val) {
						const colName = headers[i] ? `${headers[i]}: ` : "";
						rowCells.push(`${colName}${val}`);
					}
				});
				if (rowCells.length > 0) {
					parts.push(`Hàng ${rowNum}: ${rowCells.join("; ")}.`);
					rowNum++;
				}
			}
			return parts.join(" ");
		} catch {
			return (table.textContent || "").trim();
		}
	}, []);

	// Extract visible text on the currently displayed page (not top of whole chapter)
	const getVisiblePageElements = useCallback((): { text: string; elements: HTMLElement[] } => {
		try {
			if (!renditionRef.current) return { text: "", elements: [] };
			const contentsList = (renditionRef.current as any).getContents?.() || [];
			if (!contentsList.length) return { text: "", elements: [] };

			const contents = contentsList[0];
			const doc = contents?.document as Document;
			const win = contents?.window as Window;
			if (!doc || !win) return { text: "", elements: [] };

			const winWidth = win.innerWidth || doc.documentElement.clientWidth;
			const winHeight = win.innerHeight || doc.documentElement.clientHeight;

			const candidates = Array.from(
				doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, blockquote, li, table"),
			) as HTMLElement[];

			const visibleElements: HTMLElement[] = [];
			const textParts: string[] = [];

			for (const el of candidates) {
				if (el.parentElement?.closest("p, h1, h2, h3, h4, h5, h6, blockquote, li, table")) {
					continue;
				}

				const rect = el.getBoundingClientRect();
				const inHorizontal = rect.right > 8 && rect.left < winWidth - 8;
				const inVertical = rect.bottom > 8 && rect.top < winHeight - 8;

				if (inHorizontal && inVertical) {
					let t = "";
					if (el.tagName === "TABLE") {
						t = parseTableToSpeech(el as HTMLTableElement);
						el.setAttribute("data-aura-table-speech", t);
					} else {
						t = (el.innerText || el.textContent || "").trim();
					}
					if (t.length > 0) {
						visibleElements.push(el);
						textParts.push(t);
					}
				}
			}

			if (textParts.length > 0) {
				return { text: textParts.join(" "), elements: visibleElements };
			}

			// Scroll mode fallback
			const allParas = Array.from(doc.querySelectorAll("p, table")) as HTMLElement[];
			for (const el of allParas) {
				const rect = el.getBoundingClientRect();
				if (rect.top >= 0 && rect.top < winHeight) {
					let t = "";
					if (el.tagName === "TABLE") {
						t = parseTableToSpeech(el as HTMLTableElement);
						el.setAttribute("data-aura-table-speech", t);
					} else {
						t = (el.innerText || el.textContent || "").trim();
					}
					if (t.length > 0) {
						visibleElements.push(el);
						textParts.push(t);
					}
				}
			}

			if (textParts.length > 0) {
				return { text: textParts.join(" "), elements: visibleElements };
			}
		} catch (e) {
			console.warn("[getVisiblePageElements] error:", e);
		}
		return { text: "", elements: [] };
	}, [parseTableToSpeech]);

	// Extract sentences visible on the current page
	const getVisiblePageSentences = useCallback((): { sentences: string[]; elements: HTMLElement[] } => {
		const { elements, text } = getVisiblePageElements();
		const sentences: string[] = [];
		if (elements.length > 0) {
			for (const el of elements) {
				let raw = "";
				if (el.tagName === "TABLE" || el.hasAttribute("data-aura-table-speech")) {
					raw = el.getAttribute("data-aura-table-speech") || parseTableToSpeech(el as HTMLTableElement);
				} else {
					raw = (el.innerText || el.textContent || "").trim();
				}
				if (!raw) continue;
				const split = raw
					.split(/(?<=[.?!…\n])\s+/)
					.map((s) => s.trim())
					.filter((s) => s.length > 1);
				sentences.push(...split);
			}
		}
		if (sentences.length === 0 && text) {
			const split = text
				.split(/(?<=[.?!…\n])\s+/)
				.map((s) => s.trim())
				.filter((s) => s.length > 1);
			sentences.push(...split);
		}
		return { sentences, elements };
	}, [getVisiblePageElements, parseTableToSpeech]);

	// Highlight the exact active sentence in the rendition iframe with 2-level word tracking
	const highlightSentenceInDoc = useCallback((doc: Document, sentence: string) => {
		try {
			// 1. Phục hồi hoàn toàn DOM của các câu highlight trước đó trong mọi contents
			const allContents = (renditionRef.current as any)?.getContents?.() || [];
			allContents.forEach((c: any) => {
				const cDoc = c?.document as Document | undefined;
				if (!cDoc) return;
				const wrappedEls = cDoc.querySelectorAll("[data-aura-orig-html]");
				wrappedEls.forEach((el) => {
					const orig = el.getAttribute("data-aura-orig-html");
					if (orig) el.innerHTML = orig;
					el.removeAttribute("data-aura-orig-html");
				});
				cDoc.querySelectorAll(".aurabook-sentence-active, .aurabook-sentence, mark.aurabook-sentence, tr.aurabook-sentence-active, td.aurabook-sentence-active, th.aurabook-sentence-active, caption.aurabook-sentence-active").forEach((el) => {
					el.classList.remove("aurabook-sentence-active", "aurabook-word-active", "aurabook-word-past");
					(el as HTMLElement).style.background = "";
					(el as HTMLElement).style.boxShadow = "";
					(el as HTMLElement).style.outline = "";
				});
			});

			if (!sentence || sentence.length < 2) return;
			const clean = sentence.replace(/\s+/g, " ").trim();
			if (!clean) return;

			// 2. Xử lý chính xác từng phần tử trong bảng biểu (HTML Table)
			const tableCandidates = Array.from(doc.querySelectorAll("table"));
			for (const table of tableCandidates) {
				const caption = table.querySelector("caption");
				if (caption) {
					const cText = (caption.textContent || "").trim();
					if (cText && (clean.includes(cText) || clean.startsWith("Bảng:"))) {
						caption.classList.add("aurabook-sentence-active");
						if (layoutModeRef.current === "scroll") {
							try { caption.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
						}
						return;
					}
				}

				if (clean.startsWith("Bao gồm các cột:")) {
					const headerRow = table.querySelector("thead tr, tr:first-child");
					if (headerRow) {
						headerRow.classList.add("aurabook-sentence-active");
						headerRow.querySelectorAll("th, td").forEach((cell) => cell.classList.add("aurabook-sentence-active"));
						if (layoutModeRef.current === "scroll") {
							try { headerRow.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
						}
						return;
					}
				}

				const mRow = clean.match(/^Hàng\s+(\d+):/i);
				if (mRow) {
					const rowNum = parseInt(mRow[1], 10);
					const dataRows = Array.from(table.querySelectorAll("tbody tr, tr")).filter((r) => r.querySelectorAll("td").length > 0);
					const targetRow = dataRows[rowNum - 1];
					if (targetRow) {
						targetRow.classList.add("aurabook-sentence-active");
						targetRow.querySelectorAll("td").forEach((cell) => cell.classList.add("aurabook-sentence-active"));
						if (layoutModeRef.current === "scroll") {
							try { targetRow.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
						}
						return;
					}
				}

				const tableSpeech = table.getAttribute("data-aura-table-speech") || "";
				if (tableSpeech && tableSpeech.includes(clean)) {
					const cells = Array.from(table.querySelectorAll("td, th"));
					let matchedCell: HTMLElement | null = null;
					for (const cell of cells) {
						const cellText = (cell.textContent || "").trim();
						if (cellText && cellText.length > 2 && clean.includes(cellText)) {
							cell.classList.add("aurabook-sentence-active");
							matchedCell = cell as HTMLElement;
						}
					}
					if (matchedCell) {
						const row = matchedCell.closest("tr");
						if (row) row.classList.add("aurabook-sentence-active");
						if (layoutModeRef.current === "scroll") {
							try { matchedCell.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {}
						}
						return;
					}
				}
			}

			// 3. Xử lý các khối văn bản thông thường (p, h1-h6, blockquote, li)
			const candidates = Array.from(doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, blockquote, li"));
			for (const el of candidates) {
				const text = (el.textContent || "").replace(/\s+/g, " ").trim();
				if (!text.includes(clean) && !(clean.length > 25 && text.includes(clean.slice(0, 25)))) {
					continue;
				}

				// Backup nguyên trạng HTML gốc để phục hồi 100% không suy hao DOM
				if (!el.hasAttribute("data-aura-orig-html")) {
					el.setAttribute("data-aura-orig-html", el.innerHTML);
				}

				let highlighted = false;
				// Cách 1: Sử dụng TreeWalker + DOM Range chuẩn xác để bọc đúng đoạn văn bản của câu, không phá vỡ cấu trúc và các câu khác
				try {
					const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
					const textNodes: { node: Text; start: number; end: number }[] = [];
					let accumulated = "";
					let currNode: Node | null;
					while ((currNode = walker.nextNode())) {
						const tNode = currNode as Text;
						const nodeText = tNode.textContent || "";
						const start = accumulated.length;
						accumulated += nodeText;
						textNodes.push({ node: tNode, start, end: accumulated.length });
					}

					let matchStart = -1;
					let matchEnd = -1;
					const exactIdx = accumulated.indexOf(clean);
					if (exactIdx !== -1) {
						matchStart = exactIdx;
						matchEnd = exactIdx + clean.length;
					} else {
						const lowerAcc = accumulated.toLowerCase();
						const lowerClean = clean.toLowerCase();
						const ciIdx = lowerAcc.indexOf(lowerClean);
						if (ciIdx !== -1) {
							matchStart = ciIdx;
							matchEnd = ciIdx + clean.length;
						} else {
							const words = clean.split(/\s+/).filter(Boolean);
							const wordPatterns = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
							const flexRegex = new RegExp(wordPatterns.join("\\s+"), "i");
							const m = accumulated.match(flexRegex);
							if (m && m.index !== undefined) {
								matchStart = m.index;
								matchEnd = m.index + m[0].length;
							}
						}
					}

					if (matchStart !== -1 && matchEnd !== -1) {
						const range = doc.createRange();
						let startNode: Text | null = null;
						let startOffset = 0;
						let endNode: Text | null = null;
						let endOffset = 0;

						for (const tn of textNodes) {
							if (!startNode && matchStart >= tn.start && matchStart <= tn.end) {
								startNode = tn.node;
								startOffset = matchStart - tn.start;
							}
							if (matchEnd >= tn.start && matchEnd <= tn.end) {
								endNode = tn.node;
								endOffset = matchEnd - tn.start;
								break;
							}
						}

						if (
							startNode &&
							endNode &&
							startNode.nodeType === Node.TEXT_NODE &&
							endNode.nodeType === Node.TEXT_NODE
						) {
							const safeStartOffset = Math.max(0, Math.min(startOffset, startNode.length));
							const safeEndOffset = Math.max(0, Math.min(endOffset, endNode.length));
							if (startNode !== endNode || safeStartOffset <= safeEndOffset) {
								range.setStart(startNode, safeStartOffset);
								range.setEnd(endNode, safeEndOffset);

								const mark = doc.createElement("span");
								mark.className = "aurabook-sentence aurabook-sentence-active";
								mark.textContent = clean;

								range.deleteContents();
								range.insertNode(mark);
								highlighted = true;
							}
						}
					}
				} catch (rangeErr) {
					// Fall back silently to regex replacement if range creation encounters DOM variance
				}

				// Cách 2: Thay thế regex an toàn chỉ khi có chuỗi khớp trong innerHTML (tuyệt đối không ghi đè toàn bộ nội dung của thẻ cha)
				if (!highlighted) {
					const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					const regex = new RegExp(`(${escaped})`, "i");
					if (regex.test(el.innerHTML)) {
						el.innerHTML = el.innerHTML.replace(
							regex,
							`<span class="aurabook-sentence aurabook-sentence-active">${clean}</span>`,
						);
						highlighted = true;
					}
				}

				// Nhảy theo từng câu: chỉ cuộn mượt ở chế độ cuộn dọc (scroll), tuyệt đối không cuộn ở chế độ phân trang
				if (layoutModeRef.current === "scroll") {
					try {
						const activeSpan = el.querySelector(".aurabook-sentence-active") || el;
						activeSpan.scrollIntoView({ behavior: "smooth", block: "center" });
					} catch {}
				}
				return;
			}
		} catch (e) {
			console.warn("[highlightSentenceInDoc]:", e);
		}
	}, []);

	// Thu thập dải câu kế tiếp trải dài qua các trang tiếp theo trong toàn bộ chương hiện tại (Lookahead Stream)
	const getUpcomingSentencesAhead = useCallback(
		(referenceSentence?: string, count: number = 24): string[] => {
			try {
				if (!renditionRef.current) return [];
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				if (!contentsList.length) return [];

				const doc = contentsList[0]?.document as Document | undefined;
				if (!doc) return [];

				const candidates = Array.from(
					doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, blockquote, li, table"),
				) as HTMLElement[];

				const allChapterSentences: string[] = [];
				for (const el of candidates) {
					if (el.parentElement?.closest("p, h1, h2, h3, h4, h5, h6, blockquote, li, table")) {
						continue;
					}
					let raw = "";
					if (el.tagName === "TABLE" || el.hasAttribute("data-aura-table-speech")) {
						raw = el.getAttribute("data-aura-table-speech") || parseTableToSpeech(el as HTMLTableElement);
					} else {
						raw = (el.innerText || el.textContent || "").trim();
					}
					if (!raw) continue;
					const split = raw
						.split(/(?<=[.?!…\n])\s+/)
						.map((s) => s.trim())
						.filter((s) => s.length > 1);
					allChapterSentences.push(...split);
				}

				if (!referenceSentence || !referenceSentence.trim()) {
					return allChapterSentences.slice(0, count);
				}

				const cleanRef = referenceSentence.trim();
				const refIdx = allChapterSentences.findIndex(
					(s) => s === cleanRef || s.includes(cleanRef) || cleanRef.includes(s),
				);

				if (refIdx !== -1) {
					return allChapterSentences.slice(refIdx + 1, refIdx + 1 + count);
				}

				return allChapterSentences.slice(0, count);
			} catch (e) {
				console.warn("[getUpcomingSentencesAhead] error:", e);
				return [];
			}
		},
		[parseTableToSpeech],
	);

	// Kiến trúc Lookahead Pre-fetching Engine: Tải trước nhiều câu song song trong nền (Asynchronous Parallel Prefetch)
	// Tự động mở rộng số lượng câu tải trước theo tốc độ đọc (14-25 câu khi chọn 1.5x - 2.0x), vừa đọc vừa nạp liên tục
	const prefetchSentences = useCallback(
		(sentencesList: string[], startIndex: number, windowSize: number = 10) => {
			if (!sentencesList || sentencesList.length === 0) return;
			const currentSpeed = ttsSpeedRef.current;
			const currentVoice = selectedVoiceRef.current;
			// Tự động điều chỉnh số câu cần load trước tỉ lệ thuận với tốc độ đọc (2.0x thì load tới 20-25 câu)
			const effectiveWindow = Math.max(windowSize, Math.round(12 * currentSpeed));
			const endIndex = Math.min(sentencesList.length, startIndex + effectiveWindow);

			for (let i = startIndex; i < endIndex; i++) {
				const sentence = sentencesList[i]?.trim();
				if (!sentence || sentence.length < 2) continue;
				const cacheKey = `${currentVoice}:${currentSpeed}:${sentence}`;
				if (audioPrefetchCache.current.has(cacheKey) || inFlightPrefetches.current.has(cacheKey)) {
					continue;
				}

				inFlightPrefetches.current.add(cacheKey);
				fetch("/api/ai/tts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: sentence,
						speed: currentSpeed,
						voice: currentVoice,
						tone: "standard",
					}),
				})
					.then((r) => (r.ok ? r.json() : null))
					.then((d: any) => {
						if (d?.audioBase64) {
							audioPrefetchCache.current.set(cacheKey, d.audioBase64);
						}
					})
					.catch(() => {})
					.finally(() => {
						inFlightPrefetches.current.delete(cacheKey);
					});
			}
		},
		[],
	);

	// Continuous Playback: Read sentence by sentence and auto-turn pages until stopped
	const playSentenceAtIndex = useCallback(
		async (index: number) => {
			if (!isContinuousPlayingRef.current) return;
			const { sentences } = sentenceQueueRef.current;

			if (index >= sentences.length) {
				// Đã đọc hết các câu trên trang hiện tại. Tự động lật trang để đọc tiếp liền mạch!
				if (renditionRef.current && isContinuousPlayingRef.current) {
					// Nếu người dùng đang tự lật trang đi xem nơi khác, tiếp tục phát các câu tiếp theo mà không ép giật màn hình
					if (isUserBrowsingAwayRef.current) {
						const lastSentence = sentences[sentences.length - 1];
						const upcoming = getUpcomingSentencesAhead(lastSentence, 15);
						if (upcoming.length > 0) {
							sentenceQueueRef.current = { sentences: upcoming, currentIndex: 0 };
							playSentenceAtIndex(0);
						} else {
							handleStopReadAloud();
						}
						return;
					}
					try {
						// Chế độ cuộn: Cuộn mượt màn hình xuống trang tiếp theo
						if (layoutModeRef.current === "scroll") {
							const container = document.getElementById("viewer-container");
							if (container) {
								container.scrollBy({ top: Math.round(container.clientHeight * 0.75), behavior: document.hasFocus() ? "smooth" : "auto" });
							}
						} else {
							await renditionRef.current.next();
						}

						// Cơ chế kiểm tra với retry đảm bảo trang tiếp theo đã render xong trước khi lấy câu
						let attempts = 0;
						const tryPlayNextPage = () => {
							if (!isContinuousPlayingRef.current) return;
							const { sentences: nextSentences } = getVisiblePageSentences();
							const lastSentence = sentences[sentences.length - 1];
							let filtered = nextSentences;
							if (lastSentence && filtered.length > 0) {
								const lastIdx = filtered.findIndex((s) => s === lastSentence || s.includes(lastSentence) || lastSentence.includes(s));
								if (lastIdx !== -1) {
									filtered = filtered.slice(lastIdx + 1);
								}
							}

							if (filtered.length > 0) {
								sentenceQueueRef.current = { sentences: filtered, currentIndex: 0 };
								const lookaheadCount = Math.max(14, Math.round(12 * ttsSpeedRef.current));
								const upcomingAhead = getUpcomingSentencesAhead(filtered[0], lookaheadCount);
								prefetchSentences(upcomingAhead.length > 0 ? upcomingAhead : filtered, 0, lookaheadCount);
								playSentenceAtIndex(0);
							} else if (attempts < 6) {
								attempts++;
								setTimeout(tryPlayNextPage, 180);
							} else {
								// Fallback: Tìm các câu tiếp theo trong toàn chương để không bao giờ bị dừng giữa chừng
								const upcoming = getUpcomingSentencesAhead(lastSentence, 15);
								if (upcoming.length > 0) {
									sentenceQueueRef.current = { sentences: upcoming, currentIndex: 0 };
									if (renditionRef.current && layoutModeRef.current !== "scroll") {
										renditionRef.current.next().catch(() => {});
									}
									playSentenceAtIndex(0);
								} else {
									handleStopReadAloud();
								}
							}
						};
						setTimeout(tryPlayNextPage, 220);
					} catch {
						handleStopReadAloud();
					}
				} else {
					handleStopReadAloud();
				}
				return;
			}

			sentenceQueueRef.current.currentIndex = index;
			const currentSentence = sentences[index];
			if (!currentSentence || !currentSentence.trim() || !/[a-zA-Z0-9\u00C0-\u1EF9]/.test(currentSentence)) {
				playSentenceAtIndex(index + 1);
				return;
			}

			// Highlight câu đang đọc trong iframe và tự động chuyển trang / cuộn bám theo
			let activeSentenceCfi: string | undefined;
			try {
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				for (const c of contentsList) {
					if (c?.document) {
						highlightSentenceInDoc(c.document, currentSentence);
						const activeSpan = c.document.querySelector(".aurabook-sentence-active") as HTMLElement | null;
						if (activeSpan) {
							if (typeof c.cfiFromNode === "function") {
								try {
									activeSentenceCfi = c.cfiFromNode(activeSpan);
								} catch {}
							}
							if (layoutModeRef.current === "scroll") {
								try {
									if (!isUserBrowsingAwayRef.current) {
										const behavior = document.hasFocus() ? "smooth" : "auto";
										activeSpan.scrollIntoView({ behavior, block: "center" });
									}
								} catch {}
							} else {
								// Chế độ phân trang (paginated): Kiểm tra nếu câu đang đọc nằm ở cột hoặc trang tiếp theo
								if (!isUserBrowsingAwayRef.current) {
									const win = c.window as Window;
									const winWidth = win?.innerWidth || c.document.documentElement.clientWidth;
									const winHeight = win?.innerHeight || c.document.documentElement.clientHeight;
									const rect = activeSpan.getBoundingClientRect();
									// Nếu câu vượt khỏi vùng nhìn thấy theo chiều ngang hoặc chiều dọc:
									const isOffScreen = rect.left >= winWidth - 10 || rect.right <= 10 || rect.top >= winHeight - 10 || rect.bottom <= 10;
									if (isOffScreen) {
										if (activeSentenceCfi) {
											renditionRef.current?.display(activeSentenceCfi);
										} else {
											renditionRef.current?.next();
										}
									}
								}
							}
							break;
						}
					}
				}
				if (activeSentenceCfi) {
					currentPlayingLocationRef.current = {
						page: currentPageRef.current,
						cfi: activeSentenceCfi,
						sentence: currentSentence,
						chapterHref: activeChapterHref,
					};
				} else if (currentSentence) {
					const curCfi = renditionRef.current?.location?.start?.cfi;
					if (currentPlayingLocationRef.current) {
						currentPlayingLocationRef.current.sentence = currentSentence;
						if (curCfi && !currentPlayingLocationRef.current.cfi) {
							currentPlayingLocationRef.current.cfi = curCfi;
						}
						currentPlayingLocationRef.current.chapterHref = activeChapterHref;
					} else {
						currentPlayingLocationRef.current = { page: currentPageRef.current, sentence: currentSentence, cfi: curCfi, chapterHref: activeChapterHref };
					}
				}
			} catch {}

			const currentSpeed = ttsSpeedRef.current;
			const currentVoice = selectedVoiceRef.current;
			const cacheKey = `${currentVoice}:${currentSpeed}:${currentSentence.trim()}`;

			// Kích hoạt nạp trước song song các câu kế tiếp (lên tới 14-25 câu phía trước trải dài qua các trang)
			const lookaheadCount = Math.max(14, Math.round(12 * currentSpeed));
			const upcomingAhead = getUpcomingSentencesAhead(currentSentence, lookaheadCount);
			prefetchSentences(upcomingAhead.length > 0 ? upcomingAhead : sentences, upcomingAhead.length > 0 ? 0 : index + 1, lookaheadCount);

			// Nếu audio của câu này đã được tải trước từ bộ nhớ đệm, phát ngay lập tức (0ms delay)
			let audioBase64 = audioPrefetchCache.current.get(cacheKey);

			if (!audioBase64) {
				setIsTtsLoading(true);
			}

			try {
				if (!audioBase64) {
					try {
						const res = await fetch("/api/ai/tts", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								text: currentSentence,
								speed: currentSpeed,
								voice: currentVoice,
								tone: "standard",
							}),
						});

						if (res.ok) {
							const data = (await res.json()) as any;
							if (data?.audioBase64) {
								audioBase64 = data.audioBase64;
								audioPrefetchCache.current.set(cacheKey, audioBase64!);
							}
						}
					} catch (fetchErr) {
						console.warn("[TTS fetch warning]:", fetchErr);
					}

					// Fallback nếu server không trả về audio: Thử dùng Web Speech API tự nhiên của trình duyệt
					if (!audioBase64) {
						if (typeof window !== "undefined" && "speechSynthesis" in window) {
							const utterance = new SpeechSynthesisUtterance(currentSentence);
							utterance.lang = "vi-VN";
							utterance.rate = currentSpeed;
							utterance.onend = () => {
								if (isContinuousPlayingRef.current) {
									playSentenceAtIndex(index + 1);
								}
							};
							utterance.onerror = () => {
								if (isContinuousPlayingRef.current) {
									playSentenceAtIndex(index + 1);
								}
							};
							window.speechSynthesis.cancel();
							window.speechSynthesis.speak(utterance);
							setIsTtsLoading(false);
							setIsTtsPlaying(true);
							return;
						} else {
							// Bỏ qua câu lỗi và chuyển êm sang câu kế tiếp
							setIsTtsLoading(false);
							if (isContinuousPlayingRef.current) {
								setTimeout(() => playSentenceAtIndex(index + 1), 250);
							}
							return;
						}
					}
				}

				if (!isContinuousPlayingRef.current || !audioBase64) return;

				if (!ttsAudioRef.current) {
					ttsAudioRef.current = new Audio();
				}
				const audio = ttsAudioRef.current;
				const mime = audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg";
				audio.src = `data:${mime};base64,${audioBase64}`;
				// Server đã tổng hợp audio theo đúng currentSpeed, do đó playbackRate đặt 1.0 chuẩn xác,
				// tránh bị nhân đôi tốc độ (double-scaling) khiến âm thanh bị biến dạng hoặc đọc giật cục
				// Cập nhật vị trí đang phát audio sách nói hiện tại
				const currentCfiTarget = activeSentenceCfi || currentPlayingLocationRef.current?.cfi || renditionRef.current?.location?.start?.cfi || "";
				currentPlayingLocationRef.current = {
					page: currentPageRef.current,
					cfi: currentCfiTarget,
					sentence: currentSentence,
				};
				if (typeof window !== "undefined") {
					try {
						const exactPosData = {
							cfi: currentCfiTarget,
							page: currentPageRef.current,
							sentence: currentSentence,
							sentenceIndex: index,
							chapterHref: activeChapterHref,
							updatedAt: Date.now(),
						};
						localStorage.setItem(exactPosStorageKey, JSON.stringify(exactPosData));
						if (exactPosData.cfi) {
							localStorage.setItem(storageKey, exactPosData.cfi);
						}
					} catch {}
				}

				audio.ontimeupdate = () => {
					if (isTrial && audio.currentTime >= 60) {
						audio.pause();
						isContinuousPlayingRef.current = false;
						setIsTtsPlaying(false);
						setIsPaywallOpen(true);
						showToast("⏱️ Đã kết thúc 60s nghe thử miễn phí. Mua sách để nghe trọn vẹn!");
						return;
					}

					// Vừa đọc vừa liên tục nạp trước các câu kế tiếp (Continuous Streaming Lookahead)
					if (audio.duration && audio.currentTime > audio.duration * 0.25) {
						const nextLookahead = Math.max(14, Math.round(12 * currentSpeed));
						const nextUpcoming = getUpcomingSentencesAhead(currentSentence, nextLookahead);
						if (nextUpcoming.length > 0) {
							prefetchSentences(nextUpcoming, 0, nextLookahead);
						}
					}
				};

				audio.onended = () => {
					if (isContinuousPlayingRef.current) {
						// Chuyển sang câu tiếp theo liền mạch
						playSentenceAtIndex(index + 1);
					}
				};

				audio.onerror = () => {
					if (isContinuousPlayingRef.current) {
						playSentenceAtIndex(index + 1);
					}
				};

				await audio.play();
				setIsTtsLoading(false);
				setIsTtsPlaying(true);
			} catch (err) {
				console.warn("[Continuous TTS Warning]:", err);
				setIsTtsLoading(false);
				if (isContinuousPlayingRef.current) {
					setTimeout(() => {
						if (isContinuousPlayingRef.current) {
							playSentenceAtIndex(index + 1);
						}
					}, 400);
				}
			}
		},
		[getVisiblePageSentences, highlightSentenceInDoc, isTrial, prefetchSentences, getUpcomingSentencesAhead, showToast, activeChapterHref, storageKey, exactPosStorageKey],
	);

	// Đọc tiếp liên tục từ đoạn văn bản được bôi chọn (Continuous Read-Aloud from Selection)
	// Tìm chính xác câu chứa nội dung được bôi chọn trên trang hiện tại, phát từ câu đó và tự động đọc tiếp các câu sau & chuyển trang mượt mà
	const startReadingFromSelection = useCallback(
		(snippet?: string) => {
			const rawTarget = (snippet || selectedText || (clickedParagraphRef.current?.textContent ?? "")).trim();
			if (!rawTarget) {
				showToast("⚠️ Vui lòng bôi chọn đoạn văn bản hoặc nhấp chuột để chọn vị trí đọc.");
				return;
			}

			// 1. Lấy toàn bộ các câu hiển thị trên trang hiện tại
			const pageRes = getVisiblePageSentences();
			let sentencesToQueue = pageRes.sentences;
			let startIndex = 0;

			// Chuẩn hóa văn bản để so sánh chính xác dù khác biệt khoảng trắng
			const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
			const targetNorm = norm(rawTarget);
			const firstSentOfTarget = norm(rawTarget.split(/(?<=[.?!…\n])\s+/)[0] || rawTarget);

			let matchIdx = -1;
			if (sentencesToQueue.length > 0) {
				// Tìm câu khớp trực tiếp hoặc câu bao hàm đoạn bôi đen
				matchIdx = sentencesToQueue.findIndex((s) => {
					const sNorm = norm(s);
					return (
						sNorm === targetNorm ||
						sNorm.includes(targetNorm) ||
						targetNorm.includes(sNorm) ||
						sNorm.includes(firstSentOfTarget) ||
						firstSentOfTarget.includes(sNorm)
					);
				});

				// Nếu chưa thấy, thử so khớp sau khi loại bỏ dấu câu (fuzzy clean)
				if (matchIdx === -1) {
					const clean = (s: string) => s.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
					const targetClean = clean(firstSentOfTarget.length > 8 ? firstSentOfTarget : targetNorm);
					if (targetClean.length >= 3) {
						matchIdx = sentencesToQueue.findIndex((s) => {
							const sClean = clean(s);
							return sClean.includes(targetClean) || targetClean.includes(sClean);
						});
					}
				}
			}

			if (matchIdx !== -1) {
				// Khớp thành công trên trang hiện tại: Giữ TOÀN BỘ câu của trang, bắt đầu phát từ matchIdx!
				startIndex = matchIdx;
			} else {
				// Nếu không khớp trực tiếp trên trang hiện tại, tìm trong phạm vi toàn chương (Lookahead)
				const upcoming = getUpcomingSentencesAhead(rawTarget, 40);
				if (upcoming.length > 0) {
					sentencesToQueue = upcoming;
					startIndex = 0;
				} else {
					// Fallback cuối: tách các câu từ đoạn bôi đen và đọc tiếp
					const selSentences = rawTarget
						.split(/(?<=[.?!…\n])\s+/)
						.map((s) => s.trim())
						.filter((s) => s.length > 1);
					sentencesToQueue = selSentences.length > 0 ? selSentences : [rawTarget];
					startIndex = 0;
				}
			}

			if (sentencesToQueue.length === 0) {
				showToast("⚠️ Không tìm thấy nội dung để đọc.");
				return;
			}

			isContinuousPlayingRef.current = true;
			// Đặt lại cờ browsing away để trình đọc lập tức bám theo câu đọc và tự động lật trang
			isUserBrowsingAwayRef.current = false;
			if (userInactivityTimerRef.current) {
				clearTimeout(userInactivityTimerRef.current);
				userInactivityTimerRef.current = null;
			}
			sentenceQueueRef.current = { sentences: sentencesToQueue, currentIndex: startIndex };

			// Xóa trạng thái bôi đen để không che khuất màn hình
			setSelectedText("");
			setSelectionCoords(null);
			try {
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				contentsList.forEach((c: any) => {
					c?.window?.getSelection()?.removeAllRanges();
				});
				window.getSelection()?.removeAllRanges();
			} catch {}

			// Cập nhật vị trí đang phát audio
			const startingSentence = sentencesToQueue[startIndex] || rawTarget;
			const currentCfi = renditionRef.current?.location?.start?.cfi || "";
			currentPlayingLocationRef.current = {
				page: currentPageRef.current,
				cfi: currentCfi,
				sentence: startingSentence,
			};
			try {
				const exactData = {
					cfi: currentCfi,
					page: currentPageRef.current,
					sentence: startingSentence,
					sentenceIndex: startIndex,
					chapterHref: activeChapterHref,
					updatedAt: Date.now(),
				};
				localStorage.setItem(exactPosStorageKey, JSON.stringify(exactData));
			} catch {}

			// Tải trước song song các câu tiếp theo theo tốc độ đọc
			const lookaheadCount = Math.max(14, Math.round(12 * ttsSpeedRef.current));
			const upcomingAhead = getUpcomingSentencesAhead(startingSentence, lookaheadCount);
			prefetchSentences(upcomingAhead.length > 0 ? upcomingAhead : sentencesToQueue, upcomingAhead.length > 0 ? 0 : startIndex + 1, lookaheadCount);

			playSentenceAtIndex(startIndex);
			showToast("▶️ Sách nói: Đang đọc tiếp từ vị trí bạn bôi chọn");
		},
		[getVisiblePageSentences, getUpcomingSentencesAhead, prefetchSentences, playSentenceAtIndex, showToast, selectedText, activeChapterHref, exactPosStorageKey],
	);

	const handleToggleReadAloud = useCallback(() => {
		if (isTtsPlaying) {
			isContinuousPlayingRef.current = false;
			if (ttsAudioRef.current) {
				ttsAudioRef.current.pause();
			}
			setIsTtsPlaying(false);
			showToast("⏸️ Đã tạm dừng đọc");
			return;
		}

		isContinuousPlayingRef.current = true;

		// Nếu audio đang dừng dở ở giữa câu, tiếp tục phát
		if (
			ttsAudioRef.current &&
			ttsAudioRef.current.src &&
			!ttsAudioRef.current.ended &&
			ttsAudioRef.current.currentTime > 0
		) {
			ttsAudioRef.current.playbackRate = 1.0;
			ttsAudioRef.current.play().catch(() => {});
			setIsTtsPlaying(true);
			showToast("▶️ Tiếp tục đọc sách");
			return;
		}

		// Nếu người dùng đang bôi chọn văn bản, đọc tiếp liên tục từ đoạn bôi chọn
		if (selectedText && selectedText.trim().length > 1) {
			startReadingFromSelection(selectedText);
			return;
		}

		// Nếu người dùng vừa nhấp chuột vào đoạn văn bản, đọc tiếp từ đoạn đó
		if (clickedParagraphRef.current && clickedParagraphRef.current.textContent?.trim()) {
			const pText = clickedParagraphRef.current.textContent.trim();
			clickedParagraphRef.current = null;
			startReadingFromSelection(pText);
			return;
		}

		let sentencesToRead: string[] = [];
		let startIndex = 0;
		const res = getVisiblePageSentences();
		sentencesToRead = res.sentences;

		// Khôi phục đọc tiếp từ vị trí câu dở dang thay vì luôn bắt đầu từ câu 0
		const activeSent = currentPlayingLocationRef.current?.sentence;
		if (activeSent) {
			const matchIdx = sentencesToRead.findIndex(
				(s) => s.trim() === activeSent.trim() || s.includes(activeSent.trim()) || activeSent.trim().includes(s.trim()),
			);
			if (matchIdx !== -1) {
				startIndex = matchIdx;
			}
		}

		if (sentencesToRead.length === 0) {
			isContinuousPlayingRef.current = false;
			showToast("⚠️ Không tìm thấy văn bản để đọc trên trang này.");
			return;
		}

		sentenceQueueRef.current = { sentences: sentencesToRead, currentIndex: startIndex };
		const lookaheadCount = Math.max(14, Math.round(12 * ttsSpeedRef.current));
		const upcomingAhead = getUpcomingSentencesAhead(sentencesToRead[startIndex], lookaheadCount);
		prefetchSentences(upcomingAhead.length > 0 ? upcomingAhead : sentencesToRead, 0, lookaheadCount);
		playSentenceAtIndex(startIndex);
		showToast(startIndex > 0 ? "▶️ Tiếp tục đọc từ vị trí đang nghe dở" : "▶️ Bắt đầu đọc từ đầu trang");
	}, [isTtsPlaying, selectedText, startReadingFromSelection, getVisiblePageSentences, getUpcomingSentencesAhead, prefetchSentences, playSentenceAtIndex, showToast]);

	const handleStopReadAloud = useCallback(() => {
		isContinuousPlayingRef.current = false;
		if (userInactivityTimerRef.current) {
			clearTimeout(userInactivityTimerRef.current);
		}
		isUserBrowsingAwayRef.current = false;
		if (ttsAudioRef.current) {
			try {
				ttsAudioRef.current.pause();
				ttsAudioRef.current.src = "";
			} catch {}
		}
		sentenceQueueRef.current = { sentences: [], currentIndex: 0 };
		lastReadTargetRef.current = null;
		setIsTtsPlaying(false);
		setIsTtsLoading(false);
		restoreOriginalDom();
		showToast("⏹️ Đã dừng hẳn đọc sách");
	}, [restoreOriginalDom, showToast]);

	const handleChangeTtsSpeed = useCallback((newSpeed: number) => {
		setTtsSpeed(newSpeed);
		ttsSpeedRef.current = newSpeed;
		saveAudiobookSettings({ speed: newSpeed });
		if (ttsAudioRef.current && isTtsPlaying) {
			ttsAudioRef.current.playbackRate = 1.0;
		}
		// Nạp trước ngay các câu tiếp theo theo tốc độ mới
		const currentSent = currentPlayingLocationRef.current?.sentence;
		if (currentSent) {
			const lookaheadCount = Math.max(14, Math.round(12 * newSpeed));
			const upcoming = getUpcomingSentencesAhead(currentSent, lookaheadCount);
			if (upcoming.length > 0) {
				prefetchSentences(upcoming, 0, lookaheadCount);
			}
		}
		showToast(`Tốc độ đọc: ${newSpeed}x`);
	}, [isTtsPlaying, showToast, saveAudiobookSettings, getUpcomingSentencesAhead, prefetchSentences]);

	const handleChangeTtsVoice = useCallback((newVoice: string) => {
		setSelectedVoice(newVoice);
		selectedVoiceRef.current = newVoice;
		saveAudiobookSettings({ voice: newVoice });
		const voiceObj = VOICE_OPTIONS.find((v) => v.id === newVoice);
		showToast(`🎙️ Đã chuyển giọng: ${voiceObj?.shortName || newVoice}`);

		// Nếu đang đọc dở, tổng hợp ngay câu hiện tại với giọng mới
		if (isContinuousPlayingRef.current) {
			if (ttsAudioRef.current) {
				try {
					ttsAudioRef.current.pause();
				} catch {}
			}
			playSentenceAtIndex(sentenceQueueRef.current.currentIndex);
		}
	}, [playSentenceAtIndex, showToast, saveAudiobookSettings]);

	// Background Chapter Audio Warm-up Engine: Xử lý ngầm các câu trong chương để lưu vào cache chia sẻ cho toàn bộ người dùng
	useEffect(() => {
		if (isLoading || !renditionRef.current) return;

		let isCancelled = false;
		// Đợi 2.5 giây sau khi mở sách hoặc đổi chương để ưu tiên toàn bộ UI và luồng đọc chính
		const warmupTimer = setTimeout(() => {
			if (isCancelled) return;
			const currentSpeed = ttsSpeedRef.current;
			const currentVoice = selectedVoiceRef.current;
			// Thu thập danh sách câu trong toàn bộ chương
			const chapterSentences = getUpcomingSentencesAhead("", 60);
			if (!chapterSentences || chapterSentences.length === 0) return;

			// Lọc ra các câu chưa có trong bộ nhớ tạm
			const missingSentences = chapterSentences.filter((s) => {
				const k = `${currentVoice}:${currentSpeed}:${s.trim()}`;
				return !audioPrefetchCache.current.has(k) && !inFlightPrefetches.current.has(k);
			});

			if (missingSentences.length === 0) return;

			// Nạp từng đợt nhỏ 3 câu với khoảng nghỉ 800ms để không ảnh hưởng hiệu năng và mạng
			let idx = 0;
			const processBatch = () => {
				if (isCancelled || idx >= missingSentences.length) return;
				const batch = missingSentences.slice(idx, idx + 3);
				idx += 3;
				prefetchSentences(batch, 0, 3);
				setTimeout(processBatch, 800);
			};

			processBatch();
		}, 2500);

		return () => {
			isCancelled = true;
			clearTimeout(warmupTimer);
		};
	}, [activeChapterHref, isLoading, getUpcomingSentencesAhead, prefetchSentences]);

	const handleSetSleepTimer = useCallback((mins: number) => {
		setSleepTimerMinutes(mins);
		setSleepTimerRemainingSec(mins * 60);
		saveAudiobookSettings({ sleepTimerMinutes: mins });
		if (mins > 0) {
			showToast(`🌙 Đã hẹn giờ tự động tắt sau ${mins} phút`);
		} else {
			showToast("🌙 Đã tắt hẹn giờ đọc");
		}
	}, [showToast, saveAudiobookSettings]);

	const handleChangeHighlightColor = useCallback((colorId: string) => {
		setHighlightColorId(colorId);
		highlightColorIdRef.current = colorId;
		saveAudiobookSettings({ highlightColor: colorId });
		applyReaderStyles(theme, fontFamilyRef.current, lineHeightRef.current, fontSize, colorId);
		const hlTheme = HIGHLIGHT_COLOR_PRESETS.find((c) => c.id === colorId);
		showToast(`🎨 Màu Highlight: ${hlTheme?.name.split(" ")[0] || colorId}`);
	}, [applyReaderStyles, theme, fontSize, showToast, saveAudiobookSettings]);

	const handleRewind10s = useCallback(() => {
		if (ttsAudioRef.current && ttsAudioRef.current.currentTime > 4) {
			ttsAudioRef.current.currentTime = 0;
			showToast("⏪ Đọc lại từ đầu câu hiện tại");
		} else if (sentenceQueueRef.current.currentIndex > 0) {
			const prevIdx = sentenceQueueRef.current.currentIndex - 1;
			playSentenceAtIndex(prevIdx);
			showToast("⏪ Lùi về câu trước");
		} else {
			showToast("⏪ Đang ở câu đầu tiên");
		}
	}, [playSentenceAtIndex, showToast]);

	const handleSkip10s = useCallback(() => {
		if (sentenceQueueRef.current.currentIndex < sentenceQueueRef.current.sentences.length - 1) {
			const nextIdx = sentenceQueueRef.current.currentIndex + 1;
			playSentenceAtIndex(nextIdx);
			showToast("⏩ Chuyển sang câu tiếp theo");
		} else {
			showToast("⏩ Đã hết các câu trên trang");
		}
	}, [playSentenceAtIndex, showToast]);


	// Chuyển mượt mà đến bất kỳ CFI nào trên sách với hiệu ứng phát sáng nhẹ (giống hệt cơ chế nhảy trích dẫn)
	const jumpToCfiWithPulse = useCallback((cfi: string, message?: string) => {
		if (!cfi || !renditionRef.current) return;
		renditionRef.current.display(cfi).then(() => {
			// Chỉ thêm ePub.js annotation nếu cfi là Range CFI hợp lệ (có từ 2 dấu phẩy trở lên)
			const isRangeCfi = typeof cfi === "string" && (cfi.match(/,/g) || []).length >= 2;
			if (isRangeCfi) {
				try {
					renditionRef.current?.annotations.add(
						"highlight",
						cfi,
						{},
						() => {},
						"aura-pulsing-quote",
						{ fill: "#fde047", "fill-opacity": "0.40" },
					);
				} catch (e) {}

				setTimeout(() => {
					try {
						renditionRef.current?.annotations.remove(cfi, "highlight");
					} catch (e) {}
				}, 4500);
			}

			setPulsingCfi(cfi);
			if (message) showToast(message);

			setTimeout(() => {
				setPulsingCfi(null);
			}, 4500);

			// Kích hoạt hiệu ứng phát sáng nhẹ mềm mại trực tiếp trên DOM cho câu / đoạn được trúng đích
			setTimeout(() => {
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				for (const c of contentsList) {
					const doc = c?.document as Document | undefined;
					if (doc) {
						if (currentPlayingLocationRef.current?.sentence) {
							highlightSentenceInDoc(doc, currentPlayingLocationRef.current.sentence);
						}
						const activeSpan = doc.querySelector(".aurabook-sentence-active") as HTMLElement | null;
						if (activeSpan) {
							activeSpan.classList.add("aura-pulsing-glow");
							setTimeout(() => {
								try { activeSpan.classList.remove("aura-pulsing-glow"); } catch {}
							}, 4500);
						} else if (clickedParagraphRef.current && clickedParagraphRef.current.ownerDocument === doc) {
							clickedParagraphRef.current.classList.add("aura-pulsing-glow");
							setTimeout(() => {
								try { clickedParagraphRef.current?.classList.remove("aura-pulsing-glow"); } catch {}
							}, 4500);
						}
					}
				}
			}, 120);
		}).catch((err) => {
			console.warn("[jumpToCfiWithPulse display error]:", err);
		});
	}, [highlightSentenceInDoc, showToast]);

	// Tự động đồng bộ và bám theo trang/câu sách nói đang đọc (Auto-Follow Speaking Sentence)
	const syncToActiveReadingLocation = useCallback(async (notify = false) => {
		try {
			if (userInactivityTimerRef.current) {
				clearTimeout(userInactivityTimerRef.current);
				userInactivityTimerRef.current = null;
			}
			isUserBrowsingAwayRef.current = false;

			if (!renditionRef.current) return false;
			const loc = currentPlayingLocationRef.current;
			let targetCfi = loc?.cfi;

			// Nếu chưa có CFI, tìm câu active trong DOM
			if (!targetCfi) {
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				for (const c of contentsList) {
					const doc = c?.document as Document | undefined;
					if (doc) {
						let activeSpan = doc.querySelector(".aurabook-sentence-active") as HTMLElement | null;
						if (!activeSpan && loc?.sentence) {
							highlightSentenceInDoc(doc, loc.sentence);
							activeSpan = doc.querySelector(".aurabook-sentence-active") as HTMLElement | null;
						}
						if (activeSpan && typeof c.cfiFromNode === "function") {
							try {
								targetCfi = c.cfiFromNode(activeSpan);
								if (targetCfi && loc) loc.cfi = targetCfi;
							} catch {}
						}
						if (targetCfi) break;
					}
				}
			}

			// Fallback: Kiểm tra CFI lưu trong exactPosStorageKey hoặc storageKey
			if (!targetCfi && typeof window !== "undefined") {
				try {
					const rawExact = localStorage.getItem(exactPosStorageKey);
					if (rawExact) {
						const parsed = JSON.parse(rawExact) as { cfi?: string } | null;
						if (parsed && typeof parsed.cfi === "string") targetCfi = parsed.cfi;
					}
					if (!targetCfi) {
						targetCfi = localStorage.getItem(storageKey) || undefined;
					}
				} catch {}
			}

			if (targetCfi) {
				jumpToCfiWithPulse(targetCfi, notify ? "📍 Đã chuyển về vị trí sách nói đang đọc" : undefined);
				return true;
			}

			// Nếu vị trí đang đọc ở chương khác và có chapterHref
			if (loc?.chapterHref && loc.chapterHref !== activeChapterHref && renditionRef.current) {
				renditionRef.current.display(loc.chapterHref).then(() => {
					if (loc.sentence) {
						const contentsList = (renditionRef.current as any)?.getContents?.() || [];
						for (const c of contentsList) {
							if (c?.document) highlightSentenceInDoc(c.document, loc.sentence);
						}
					}
					if (notify) showToast("📍 Đã chuyển về vị trí sách nói đang đọc");
				}).catch(() => {});
				return true;
			}

			// Chế độ scroll fallback
			if (layoutModeRef.current === "scroll") {
				const contentsList = (renditionRef.current as any)?.getContents?.() || [];
				for (const c of contentsList) {
					const doc = c?.document as Document | undefined;
					if (doc) {
						const activeSpan = doc.querySelector(".aurabook-sentence-active") as HTMLElement | null;
						if (activeSpan) {
							try {
								activeSpan.scrollIntoView({ behavior: "smooth", block: "center" });
								if (notify) showToast("📍 Đang ở vị trí sách nói đang đọc");
								return true;
							} catch {}
						}
					}
				}
			}
		} catch (e) {
			console.warn("[syncToActiveReadingLocation] error:", e);
		}
		return false;
	}, [jumpToCfiWithPulse, highlightSentenceInDoc, showToast, exactPosStorageKey, storageKey, activeChapterHref]);

	// Tự động quay lại vị trí đang đọc sau khi người dùng không tương tác (Auto-Return to Active Reading Location after Inactivity)
	const registerUserManualNavigation = useCallback(() => {
		if (!isContinuousPlayingRef.current && !isTtsPlaying && !currentPlayingLocationRef.current?.sentence) {
			return;
		}

		isUserBrowsingAwayRef.current = true;
		if (userInactivityTimerRef.current) {
			clearTimeout(userInactivityTimerRef.current);
		}

		userInactivityTimerRef.current = setTimeout(() => {
			if (isContinuousPlayingRef.current || isTtsPlaying || currentPlayingLocationRef.current?.sentence) {
				syncToActiveReadingLocation(false);
				showToast("📍 Tự động quay trở lại vị trí sách nói đang đọc");
			}
			isUserBrowsingAwayRef.current = false;
		}, 5500); // Sau 5.5 giây người dùng dừng tương tác, tự động quay về câu đang nói
	}, [isTtsPlaying, syncToActiveReadingLocation, showToast]);

	const registerUserManualNavigationRef = useRef(registerUserManualNavigation);
	registerUserManualNavigationRef.current = registerUserManualNavigation;

	// Dọn dẹp bộ đếm thời gian khi unmount
	useEffect(() => {
		return () => {
			if (userInactivityTimerRef.current) {
				clearTimeout(userInactivityTimerRef.current);
			}
		};
	}, []);

	// Đi đến vị trí đang đọc / vị trí con trỏ (Jump to speaking sentence / cursor / selected text)
	const handleJumpToCursor = useCallback(async () => {
		// 1. ƯU TIÊN SỐ 1: Nếu sách nói ĐANG PHÁT hoặc có câu đọc dở, nhảy ngay về câu đang nói bằng jumpToCfiWithPulse mượt mà!
		if (isContinuousPlayingRef.current || isTtsPlaying || currentPlayingLocationRef.current?.sentence || currentPlayingLocationRef.current?.cfi) {
			const synced = await syncToActiveReadingLocation(true);
			if (synced) return;
		}

		// 2. Nếu người dùng vừa nhấp chuột đặt con trỏ vào một đoạn văn bản (lastClickedCfiRef)
		if (lastClickedCfiRef.current && renditionRef.current) {
			jumpToCfiWithPulse(lastClickedCfiRef.current, "📍 Đã chuyển về vị trí con trỏ bạn vừa chọn");
			return;
		}

		// 3. Nếu người dùng đang bôi đen một đoạn text (selection)
		if (selectedCfi && renditionRef.current) {
			jumpToCfiWithPulse(selectedCfi, "📍 Đã chuyển về đoạn văn bản bạn đang chọn");
			return;
		}

		// 4. Mặc định: đọc từ câu đầu tiên nhìn thấy trên trang hiện tại
		const res = getVisiblePageSentences();
		if (res.sentences.length > 0) {
			isContinuousPlayingRef.current = true;
			sentenceQueueRef.current = { sentences: res.sentences, currentIndex: 0 };
			const lookaheadCount = Math.max(14, Math.round(12 * ttsSpeedRef.current));
			const upcoming = getUpcomingSentencesAhead(res.sentences[0], lookaheadCount);
			prefetchSentences(upcoming.length > 0 ? upcoming : res.sentences, 0, lookaheadCount);
			playSentenceAtIndex(0);
			showToast("▶️ Bắt đầu đọc từ đầu trang hiện tại");
		} else {
			showToast("👆 Vui lòng nhấp vào một đoạn văn trên trang để đặt con trỏ đọc");
		}
	}, [isTtsPlaying, syncToActiveReadingLocation, jumpToCfiWithPulse, selectedCfi, getUpcomingSentencesAhead, prefetchSentences, playSentenceAtIndex, showToast, getVisiblePageSentences]);

	// Fullscreen handler
	const toggleFullscreen = () => {
		if (typeof document === "undefined") return;
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(() => {});
			setIsFullscreen(true);
		} else {
			document.exitFullscreen().catch(() => {});
			setIsFullscreen(false);
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	// STRICT KEYBOARD GUARD: Outside of navigation keys (page flipping & scrolling), ANY key press immediately blanks/covers the screen!
	const handleStrictKeyboardGuard = useCallback(
		(e: KeyboardEvent) => {
			// Allow typing inside search input or AI chat input
			const target = (e.target || document.activeElement) as HTMLElement | null;
			const isTyping =
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable ||
					Boolean(target.closest?.("input, textarea, [contenteditable='true']")));
			if (isTyping) {
				return;
			}

			// Whitelist all reading navigation keys: ArrowLeft, ArrowRight, ArrowUp, ArrowDown, PageUp, PageDown, Space
			const allowedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", " "];
			if (allowedKeys.includes(e.key)) {
				return;
			}

			// ANY OTHER KEY (PrintScreen, Win, Shift, Alt, Ctrl, F12, letters, numbers, etc.)
			e.preventDefault();
			e.stopPropagation();
			setIsScreenProtected(true);

			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText("").catch(() => {});
			}

			recordAuditLog(`Nhấn phím ngoài danh mục điều hướng (${e.key}) - Kích hoạt màn che bảo vệ`);
			showToast(`⚠️ Bảo vệ DRM: Phát hiện phím (${e.key}). Chỉ cho phép phím điều hướng đọc sách, các phím khác sẽ tự động che màn hình.`);
		},
		[recordAuditLog, showToast],
	);

	const handleStrictKeyUpGuard = useCallback((e: KeyboardEvent) => {
		const target = (e.target || document.activeElement) as HTMLElement | null;
		const isTyping =
			target &&
			(target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable ||
				Boolean(target.closest?.("input, textarea, [contenteditable='true']")));
		const allowedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", " "];
		if (isTyping || allowedKeys.includes(e.key)) {
			return;
		}
		setIsScreenProtected(true);
	}, []);

	// DRM Protection: Anti-Screenshot & Screen Capture Protection with Audit Logging
	useEffect(() => {
		// 1. When window loses focus (e.g., user opens Snipping Tool, Win+Shift+S, Alt+Tab, etc.)
		const handleBlur = () => {
			setTimeout(() => {
				if (!document.hasFocus()) {
					// Nếu người dùng đang nghe sách nói, cho phép nội dung tự động di chuyển bên dưới mà không bị màn đen che khuất
					if (!isContinuousPlayingRef.current && !isTtsPlaying) {
						setIsScreenProtected(true);
					}
					recordAuditLog("Mất tiêu điểm ứng dụng (Kích hoạt công cụ chụp màn hình Snipping Tool / phần mềm ngoài)");
				}
			}, 20);
		};

		const handleFocus = () => {
			setTimeout(() => {
				setIsScreenProtected(false);
				if (isContinuousPlayingRef.current || isTtsPlaying || currentPlayingLocationRef.current?.sentence) {
					syncToActiveReadingLocation(false);
				}
			}, 80);
		};

		const handleVisibilityChange = () => {
			if (document.hidden || !document.hasFocus()) {
				if (!isContinuousPlayingRef.current && !isTtsPlaying) {
					setIsScreenProtected(true);
				}
				recordAuditLog("Ẩn tab ứng dụng / Chuyển cửa sổ phần mềm ngoài");
			} else {
				setTimeout(() => {
					setIsScreenProtected(false);
					if (isContinuousPlayingRef.current || isTtsPlaying || currentPlayingLocationRef.current?.sentence) {
						syncToActiveReadingLocation(false);
					}
				}, 80);
			}
		};

		// 4. Block Context Menu (right click)
		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
		};

		// 5. Block Copy & Cut - ONLY trigger alert if user explicitly pressed Ctrl+C
		const handleCopyBlock = (e: ClipboardEvent) => {
			e.preventDefault();
			if (isExplicitCopyAttempt.current) {
				setShowCopyAlert(true);
				setTimeout(() => setShowCopyAlert(false), 2500);
			}
		};

		window.addEventListener("blur", handleBlur);
		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("keydown", handleStrictKeyboardGuard, { capture: true });
		window.addEventListener("keyup", handleStrictKeyUpGuard, { capture: true });
		window.addEventListener("contextmenu", handleContextMenu);
		window.addEventListener("copy", handleCopyBlock);
		window.addEventListener("cut", handleCopyBlock);

		return () => {
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("keydown", handleStrictKeyboardGuard, { capture: true });
			window.removeEventListener("keyup", handleStrictKeyUpGuard, { capture: true });
			window.removeEventListener("contextmenu", handleContextMenu);
			window.removeEventListener("copy", handleCopyBlock);
			window.removeEventListener("cut", handleCopyBlock);
		};
	}, [showToast, recordAuditLog, syncToActiveReadingLocation]);

	// Auto-resize Rendition when container dimensions change (e.g., sidebars toggle or window resize)
	useEffect(() => {
		if (!viewerRef.current) return;

		let resizeTimer: NodeJS.Timeout;
		let lastWidth = 0;
		let lastHeight = 0;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				if (width <= 0 || height <= 0) continue;

				if (Math.abs(width - lastWidth) > 6 || Math.abs(height - lastHeight) > 6) {
					lastWidth = width;
					lastHeight = height;

					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(() => {
						if (renditionRef.current) {
							try {
								renditionRef.current.resize(width, height);
								const loc = (renditionRef.current.currentLocation() as any)?.start?.cfi;
								if (loc) {
									renditionRef.current.display(loc);
								}
							} catch (e) {
								// ignore
							}
						}
					}, 80);
				}
			}
		});

		ro.observe(viewerRef.current);
		return () => {
			ro.disconnect();
			clearTimeout(resizeTimer);
		};
	}, []);

	// Responsive spread & Flow Layout Configuration
	useEffect(() => {
		if (!renditionRef.current) return;

		const isSingle = layoutMode === "single";

		if (layoutMode === "scroll") {
			// Continuous scrolling flow
			renditionRef.current.flow("scrolled");
			renditionRef.current.spread("none");
		} else if (isSingle) {
			// Single page layout
			renditionRef.current.flow("paginated");
			renditionRef.current.spread("none");
		} else {
			// Duo page layout (double)
			renditionRef.current.flow("paginated");
			renditionRef.current.spread("auto");
		}

		// Re-display current location with exact dimensions so columns never get clipped or misaligned
		const timer = setTimeout(() => {
			if (renditionRef.current && viewerRef.current) {
				const rect = viewerRef.current.getBoundingClientRect();
				if (rect.width > 0 && rect.height > 0) {
					try {
						renditionRef.current.resize(rect.width, rect.height);
						const loc = (renditionRef.current.currentLocation() as any)?.start?.cfi;
						if (loc) {
							renditionRef.current.display(loc);
						}
					} catch (e) {
						// ignore
					}
				}
			}
		}, 80);

		return () => clearTimeout(timer);
	}, [isTocOpen, isAiOpen, layoutMode]);

	// Load book and ePub rendition
	useEffect(() => {
		if (!viewerRef.current) return;

		let isMounted = true;
		setIsLoading(true);
		setLoadError(null);

		try {
			viewerRef.current.innerHTML = "";

			const book = ePub(epubUrl);
			bookRef.current = book;

			// Load Navigation Table of Contents
			book.loaded.navigation.then((nav) => {
				if (!isMounted) return;
				if (nav.toc && nav.toc.length > 0) {
					const items = nav.toc.map((t, idx) => ({
						id: String(idx + 1),
						label: t.label.trim(),
						href: t.href,
					}));
					setTocList(items);
					if (items[0]?.href) {
						setActiveChapterHref(items[0].href);
					}
				} else {
					// Fallback mock chapters if epub has no TOC
					const fallbackItems = [
						{ id: "1", label: "Chương 1: Khởi đầu hành trình", href: "" },
						{ id: "2", label: "Chương 2: Bối cảnh & Nhân vật", href: "" },
						{ id: "3", label: "Chương 3: Khám phá & Xung đột", href: "" },
						{ id: "4", label: "Chương 4: Bước ngoặt cao trào", href: "" },
						{ id: "5", label: "Chương 5: Kết thúc & Suy ngẫm", href: "" },
					];
					setTocList(fallbackItems);
					setActiveChapterHref("1");
				}
			});

			const rendition = book.renderTo(viewerRef.current, {
				width: "100%",
				height: "100%",
				spread: layoutModeRef.current === "single" ? "none" : "auto",
				flow: layoutModeRef.current === "scroll" ? "scrolled" : "paginated",
			});
			renditionRef.current = rendition;

			// Bảo vệ ePub.js Annotations khỏi IndexSizeError (There is no child at offset X)
			if (rendition.annotations) {
				const origAdd = rendition.annotations.add.bind(rendition.annotations);
				rendition.annotations.add = (type: any, cfiRange: any, data: any, cb: any, className: any, styles: any) => {
					// Chỉ cho phép Range CFI hợp lệ (phải có từ 2 dấu phẩy trở lên)
					const isRange = typeof cfiRange === "string" && (cfiRange.match(/,/g) || []).length >= 2;
					if (!isRange) {
						return null as any;
					}
					try {
						return origAdd(type, cfiRange, data, cb, className, styles);
					} catch (err) {
						return null as any;
					}
				};

				const origInject = (rendition.annotations as any)?.inject?.bind(rendition.annotations);
				if (typeof origInject === "function") {
					(rendition.annotations as any).inject = (view: any) => {
						try {
							const sectionIndex = view?.index;
							if (sectionIndex in (rendition.annotations as any)._annotationsBySectionIndex) {
								const annotations = (rendition.annotations as any)._annotationsBySectionIndex[sectionIndex] || [];
								annotations.forEach((hash: string) => {
									try {
										const annotation = (rendition.annotations as any)._annotations[hash];
										if (annotation && typeof annotation.attach === "function") {
											const isRange = typeof annotation.cfiRange === "string" && (annotation.cfiRange.match(/,/g) || []).length >= 2;
											if (isRange) {
												annotation.attach(view);
											}
										}
									} catch (e) {}
								});
							}
						} catch (e) {}
					};
				}
			}

			// Register themes: only Sepia and Light (Dark mode permanently removed)
			rendition.themes.register("sepia", {
				body: { "background-color": "#fbf0d9 !important", color: "#433422 !important" }, // design-tokens-allow
				"p, span, div, h1, h2, h3, h4, h5, h6, a, blockquote, li, em, strong, article, section": {
					color: "#433422 !important", // design-tokens-allow
					"background-color": "transparent !important",
				},
			});
			rendition.themes.register("light", {
				body: { "background-color": "#ffffff !important", color: "#1e293b !important" }, // design-tokens-allow
				"p, span, div, h1, h2, h3, h4, h5, h6, a, blockquote, li, em, strong, article, section": {
					color: "#1e293b !important", // design-tokens-allow
					"background-color": "transparent !important",
				},
			});

			rendition.themes.select(theme);
			rendition.themes.fontSize(`${fontSize}%`);

			// Hook into iframe contents: SOFT GENTLE PULSING HIGHLIGHT, Font Family & Clean Selection
			rendition.hooks.content.register((contents: any) => {
				applyReaderStyles();
				const activeFont = FONT_OPTIONS.find((f) => f.id === fontFamilyRef.current) || FONT_OPTIONS[0];
				contents.addStylesheetRules({
					body: {
						"user-select": "text !important",
						"-webkit-user-select": "text !important",
						"-webkit-user-drag": "none !important",
						"user-drag": "none !important",
						"line-height": lineHeightRef.current === "relaxed" ? "2.0 !important" : "1.65 !important",
						"font-family": `${activeFont.value} !important`,
					},
					"*": {
						"-webkit-user-drag": "none !important",
						"user-drag": "none !important",
					},
					"p, span, div, h1, h2, h3, h4, h5, h6, a, blockquote, li, em, strong, article, section, table, tr, td, th": {
						"font-family": `${activeFont.value} !important`,
						"-webkit-user-drag": "none !important",
						"user-drag": "none !important",
					},
					"::selection": { background: "rgba(59, 130, 246, 0.35) !important", color: "inherit !important" },
					"::-moz-selection": { background: "rgba(59, 130, 246, 0.35) !important", color: "inherit !important" },
					".aurabook-sentence-active, mark.aurabook-sentence-active": {
						"background-color": "rgba(250, 204, 21, 0.42) !important",
						color: "inherit !important",
						"border-radius": "3px !important",
						padding: "1px 3px !important",
						"-webkit-box-decoration-break": "clone !important",
						"box-decoration-break": "clone !important",
						transition: "background-color 0.15s ease !important",
					},
					// Gentle glowing pulse animation that never covers up text
					".aura-pulsing-quote": {
						animation: "auraPulseAnim 0.75s ease-in-out infinite alternate !important",
					},
					"@keyframes auraPulseAnim": {
						"0%": { fill: "#fde047 !important", "fill-opacity": "0.48 !important" }, // design-tokens-allow
						"100%": { fill: "#fef08a !important", "fill-opacity": "0.18 !important" }, // design-tokens-allow
					},
					".aura-pulsing-glow": {
						"background-color": "rgba(253, 224, 71, 0.45) !important",
						"box-shadow": "0 0 12px rgba(253, 224, 71, 0.65) !important",
						"animation": "auraGlowAnim 0.8s ease-in-out infinite alternate !important",
						"border-radius": "4px !important",
					},
					"@keyframes auraGlowAnim": {
						"0%": { "background-color": "rgba(253, 224, 71, 0.50) !important", "box-shadow": "0 0 12px rgba(253, 224, 71, 0.70) !important" },
						"100%": { "background-color": "rgba(254, 240, 138, 0.20) !important", "box-shadow": "0 0 3px rgba(253, 224, 71, 0.25) !important" },
					},
				});

				// Inside iframe: Strict keyboard guard (Only ArrowLeft & ArrowRight allowed, everything else covers the screen)
				contents.document.addEventListener("keydown", handleStrictKeyboardGuard, { capture: true });
				contents.document.addEventListener("keyup", handleStrictKeyUpGuard, { capture: true });

				// Chặn hoàn toàn việc kéo văn bản ra ngoài (Anti-Drag DRM Protection)
				const blockDrag = (e: DragEvent) => {
					e.preventDefault();
					e.stopPropagation();
					return false;
				};
				contents.document.addEventListener("dragstart", blockDrag, { capture: true });
				contents.window.addEventListener("dragstart", blockDrag, { capture: true });

				contents.document.addEventListener("copy", (e: ClipboardEvent) => {
					e.preventDefault();
					if (isExplicitCopyAttempt.current) {
						setShowCopyAlert(true);
						setTimeout(() => setShowCopyAlert(false), 2500);
					}
				});

				contents.document.addEventListener("cut", (e: ClipboardEvent) => {
					e.preventDefault();
					if (isExplicitCopyAttempt.current) {
						setShowCopyAlert(true);
						setTimeout(() => setShowCopyAlert(false), 2500);
					}
				});

				contents.document.addEventListener("contextmenu", (e: MouseEvent) => {
					e.preventDefault();
				});

				contents.document.addEventListener("mousedown", () => {
					setIsScreenProtected(false);
				});

				contents.window.addEventListener("focus", () => {
					setIsScreenProtected(false);
					if (isContinuousPlayingRef.current || isTtsPlaying || currentPlayingLocationRef.current?.sentence) {
						syncToActiveReadingLocation(false);
					}
				});

				// Bảo vệ nội dung iframe khỏi lỗi Range / IndexSizeError / UtilityScript làm văng popup Turbopack
				try {
					if (contents) {
						patchContentsLocationOf(contents);
						if (contents.constructor?.prototype) {
							patchContentsLocationOf(contents.constructor.prototype);
						}
					}
					const iWin = contents.window;
					if (iWin) {
						if (iWin.Range?.prototype) {
							patchRangePrototype(iWin.Range.prototype);
						}
						iWin.addEventListener("error", (event: any) => {
							const msg = event?.message || event?.error?.message || String(event?.error || "");
							if (
								!msg ||
								msg === "undefined" ||
								msg.includes("UtilityScript") ||
								msg.includes("Failed to execute 'setEnd' on 'Range'") ||
								msg.includes("Failed to execute 'setStart' on 'Range'") ||
								msg.includes("There is no child at offset") ||
								event?.error?.name === "IndexSizeError"
							) {
								event.preventDefault?.();
								event.stopImmediatePropagation?.();
								return true;
							}
						}, true);
						iWin.addEventListener("unhandledrejection", (e: any) => {
							const r = String(e?.reason?.message || e?.reason || "");
							if (!r || r === "undefined" || r.includes("Range") || r.includes("offset") || e?.reason?.name === "IndexSizeError") {
								e.preventDefault?.();
								e.stopImmediatePropagation?.();
							}
						}, true);
					}
				} catch {}

				// Khóa cuộn dọc trong chế độ 2 cột / 1 cột (paginated mode) để triệt tiêu hoàn toàn lỗi chồng chéo chữ
				const enforcePaginatedScrollReset = () => {
					if (layoutModeRef.current !== "scroll") {
						if (contents.window?.scrollY !== 0 || contents.document?.documentElement?.scrollTop !== 0 || contents.document?.body?.scrollTop !== 0) {
							contents.window?.scrollTo?.(0, 0);
							if (contents.document?.documentElement) contents.document.documentElement.scrollTop = 0;
							if (contents.document?.body) contents.document.body.scrollTop = 0;
						}
					}
				};
				contents.window?.addEventListener?.("scroll", enforcePaginatedScrollReset, { passive: true });
				contents.document?.addEventListener?.("scroll", enforcePaginatedScrollReset, { passive: true });

				// Bắt sự kiện cuộn/lướt chuột hoặc chạm trong iframe để kích hoạt bộ đếm thời gian tự động quay về vị trí đọc
				const handleManualIframeInteraction = () => {
					registerUserManualNavigationRef.current?.();
				};
				contents.window?.addEventListener?.("wheel", handleManualIframeInteraction, { passive: true });
				contents.window?.addEventListener?.("touchmove", handleManualIframeInteraction, { passive: true });
				contents.document?.addEventListener?.("wheel", handleManualIframeInteraction, { passive: true });
				contents.document?.addEventListener?.("touchmove", handleManualIframeInteraction, { passive: true });

				// Paragraph click listener for on-demand read-from-here & auto-clear stale selection
				contents.document.addEventListener("click", (e: MouseEvent) => {
					const target = e.target as HTMLElement;
					if (target.tagName === "A" || target.closest("a")) return;
					const para = target.closest("p, h1, h2, h3, h4, h5, h6, blockquote, li") as HTMLElement | null;
					if (para) {
						clickedParagraphRef.current = para;
						let paraCfi = "";
						try {
							if (typeof contents.cfiFromNode === "function") {
								paraCfi = contents.cfiFromNode(para);
							}
						} catch {}
						if (!paraCfi) {
							paraCfi = renditionRef.current?.location?.start?.cfi || "";
						}
						lastClickedCfiRef.current = paraCfi;

						const paraText = (para.textContent || "").trim();
						if (paraText.length > 1) {
							const firstSentence = paraText.split(/(?<=[.?!…\n])\s+/)[0]?.trim() || paraText.slice(0, 100);
							currentPlayingLocationRef.current = {
								page: currentPageRef.current,
								cfi: paraCfi,
								sentence: firstSentence,
							};
							try {
								const exactData = {
									cfi: paraCfi,
									page: currentPageRef.current,
									sentence: firstSentence,
									sentenceIndex: 0,
									chapterHref: activeChapterHref,
									updatedAt: Date.now(),
								};
								localStorage.setItem(exactPosStorageKey, JSON.stringify(exactData));
							} catch {}
						}
					}
					// Tự động đóng thanh công cụ bôi đen nếu người dùng chỉ click chuột bình thường
					setTimeout(() => {
						const sel = contents.window?.getSelection();
						if (!sel || sel.isCollapsed || !sel.toString().trim()) {
							setSelectedText("");
							setSelectionCoords(null);
						}
					}, 120);
				});
			});

			// Catch text selection inside ePub and compute floating popover position near cursor
			rendition.on("selected", (cfiRange: string, contents: any) => {
				if (!isMounted) return;
				const selection = contents?.window?.getSelection();
				const text = selection ? selection.toString().trim() : "";
				if (text && text.length > 1) {
					setSelectedText(text);
					setSelectedCfi(cfiRange);

					// Compute precise relative coordinates for floating toolbar
					try {
						if (selection.rangeCount > 0) {
							const range = selection.getRangeAt(0);
							const rect = range.getBoundingClientRect();
							const iframe = viewerRef.current?.querySelector("iframe");
							const iframeRect = iframe ? iframe.getBoundingClientRect() : { top: 0, left: 0 };
							const viewerRect = viewerRef.current?.getBoundingClientRect() || { top: 0, left: 0, width: 800, height: 600 };

							// Relative position inside viewer container
							const targetX = (iframeRect.left + rect.left + rect.width / 2) - viewerRect.left;
							const targetY = (iframeRect.top + rect.top) - viewerRect.top;

							// Giữ tọa độ ngang luôn nằm trọn trong khung đọc (cách mép tối thiểu 200px)
							const minX = 200;
							const maxX = Math.max(minX, viewerRect.width - 200);
							const clampedX = Math.max(minX, Math.min(maxX, targetX));

							// Nếu đoạn bôi đen ở sát mép trên (< 75px), tự động lật thanh công cụ xuống phía dưới đoạn văn
							const isBelow = targetY < 75;
							const clampedY = isBelow
								? Math.min(viewerRect.height - 50, (iframeRect.top + rect.bottom) - viewerRect.top + 12)
								: Math.max(16, targetY - 12);

							setSelectionCoords({
								x: clampedX,
								y: clampedY,
								isBelow,
							});
						}
					} catch (e) {
						setSelectionCoords(null);
					}
				}
			});

			// Restore saved reading progress
			let targetCfi: string | undefined = undefined;
			let savedExactPos: any = null;
			if (typeof window !== "undefined") {
				try {
					const rawExact = localStorage.getItem(exactPosStorageKey);
					if (rawExact) {
						savedExactPos = JSON.parse(rawExact);
						if (savedExactPos?.cfi) {
							targetCfi = savedExactPos.cfi;
						}
					}
					if (!targetCfi) {
						targetCfi = localStorage.getItem(storageKey) || undefined;
					}
				} catch {}
			}

			rendition.display(targetCfi || undefined).then(() => {
				if (isMounted) {
					setIsLoading(false);
				}
				// Khôi phục chính xác vị trí con trỏ và câu đang đọc dở khi tải lại trang
				if (savedExactPos?.sentence) {
					currentPlayingLocationRef.current = {
						page: savedExactPos.page || 1,
						cfi: targetCfi,
						sentence: savedExactPos.sentence,
					};
					setTimeout(() => {
						if (!isMounted) return;
						const contentsList = (renditionRef.current as any)?.getContents?.() || [];
						for (const c of contentsList) {
							const doc = c?.document;
							if (doc && savedExactPos.sentence) {
								highlightSentenceInDoc(doc, savedExactPos.sentence);
								const target = doc.querySelector(".aurabook-sentence-active");
								if (target) {
									if (layoutModeRef.current === "scroll") {
										try {
											target.scrollIntoView({ behavior: "smooth", block: "center" });
										} catch {}
									} else {
										try {
											c?.window?.scrollTo?.(0, 0);
											if (c?.document?.documentElement) c.document.documentElement.scrollTop = 0;
											if (c?.document?.body) c.document.body.scrollTop = 0;
										} catch {}
									}
								}
							}
						}
					}, 350);
				}
			});

			// Generate real ePub locations to accurately calculate total pages and reading percentage
			book.ready.then(() => {
				return (book.locations as any).generate(1000);
			}).then(() => {
				const totalLocs = Number((book.locations as any)?.total || (book.locations as any)?.length?.() || 0);
				if (isMounted && totalLocs > 0) {
					setTotalPages(totalLocs);
				}
			}).catch(() => {
				// ignore if locations cannot generate
			});

			// Relocated tracking: Save progress & Track ACTIVE CHAPTER & 15-page trial guard
			rendition.on("relocated", (location: any) => {
				if (!isMounted) return;

				// Clear active audio playback on page navigation if not in continuous playing mode
				if (!isContinuousPlayingRef.current && isTtsPlaying) {
					if (ttsAudioRef.current) {
						try {
							ttsAudioRef.current.pause();
							ttsAudioRef.current.src = "";
						} catch {}
					}
					setIsTtsPlaying(false);
					restoreOriginalDom();
				}
				lastReadTargetRef.current = null;
				clickedParagraphRef.current = null;

				let curPageNum = 1;
				let totP = totalPages;

				const locationsObj = book.locations as any;
				const totalLocs = Number(locationsObj?.total || locationsObj?.length?.() || 0);

				if (locationsObj && totalLocs > 0 && location?.start?.cfi) {
					const locPage = locationsObj.locationFromCfi(location.start.cfi);
					const rawPageNum = typeof locPage === "number" ? locPage : Number(locPage?.index ?? locPage);
					if (typeof rawPageNum === "number" && !isNaN(rawPageNum) && rawPageNum > 0) {
						curPageNum = rawPageNum;
						setCurrentPage(rawPageNum);
						currentPageRef.current = rawPageNum;
					}
					totP = totalLocs;
					setTotalPages(totP);
					const pct = Math.round(Number(locationsObj.percentageFromCfi(location.start.cfi) || 0) * 100);
					setReadPercentage(Math.max(1, Math.min(100, pct)));
				} else if (location?.start?.displayed?.page) {
					curPageNum = Number(location.start.displayed.page) || 1;
					totP = Number(location.start.displayed.total) || 150;
					setCurrentPage(curPageNum);
					currentPageRef.current = curPageNum;
					setTotalPages(totP);
					setReadPercentage(Math.max(1, Math.min(100, Math.round((curPageNum / totP) * 100))));
				}

				const cfi = location?.start?.cfi;
				if (cfi && typeof window !== "undefined") {
					try {
						localStorage.setItem(storageKey, cfi);
						const rawExact = localStorage.getItem(exactPosStorageKey);
						let exactObj: any = {};
						if (rawExact) {
							try {
								exactObj = JSON.parse(rawExact) || {};
							} catch {}
						}
						exactObj = {
							...exactObj,
							cfi,
							page: curPageNum,
							chapterHref: activeChapterHref,
							sentence: exactObj.sentence || currentPlayingLocationRef.current?.sentence,
							updatedAt: Date.now(),
						};
						localStorage.setItem(exactPosStorageKey, JSON.stringify(exactObj));
					} catch (e) {
						// ignore
					}
				}

				// Trial enforcement: Track unique pages read across the book (15 pages non-continuous limit)
				if (isTrial) {
					viewedPagesRef.current.add(curPageNum);
					const count = viewedPagesRef.current.size;
					setViewedCount(count);

					if (count >= 15) {
						setIsTrialLocked(true);
						setIsPaywallOpen(true);
					}
				}

				// Sync reading progress to Backend aurabook_apps.drm database (CHỈ DÀNH CHO SÁCH ĐÃ MUA, TUYỆT ĐỐI KHÔNG CẤP PHÁT BẢN ĐỌC THỬ VÀO TỦ SÁCH)
				if (userProfileRef.current?.email && !isTrial) {
					fetch("/api/drm/progress", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							productId: bookSlug,
							userEmail: userProfileRef.current.email,
							currentPage: curPageNum,
							totalPages: totP,
							isTrial: false,
						}),
					}).catch(() => {
						// Silently ignore network failures
					});
				}

				// Find and highlight currently reading chapter
				const currentHref = location?.start?.href || "";
				if (currentHref) {
					const cleanCurrent = currentHref.split("#")[0].split("/").pop() || "";
					book.loaded.navigation.then((nav) => {
						if (!isMounted || !nav.toc) return;
						const matched = nav.toc.find((ch) => {
							if (!ch.href) return false;
							const cleanCh = ch.href.split("#")[0].split("/").pop() || "";
							return cleanCurrent === cleanCh || currentHref.includes(ch.href) || ch.href.includes(currentHref);
						});
						if (matched) {
							setActiveChapterHref(matched.href);
						}
					});
				}

				// Tự động nạp trước (Pre-warm Cache) các câu đầu của trang mới vào RAM cache
				// Để khi độc giả bấm "Sách nói" sẽ nghe được ngay lập tức với 0ms độ trễ
				setTimeout(() => {
					if (!isMounted) return;
					try {
						const { sentences: pageSentences } = getVisiblePageSentences();
						if (pageSentences && pageSentences.length > 0) {
							prefetchSentences(pageSentences, 0, 3);
						}
					} catch {}
				}, 600);
			});
		} catch (err: any) {
			console.warn("Lỗi khởi tạo ePub:", err);
			if (isMounted) {
				setIsLoading(false);
				setLoadError("Không thể tải file sách trực tiếp từ máy chủ. Đang hiển thị bản xem trước.");
			}
		}

		// Keyboard pagination with page turning loading & 15-page trial guard
		const handleKeyDown = (e: KeyboardEvent) => {
			// Bỏ qua nếu người dùng đang gõ phím trong ô chat AI hoặc bất kỳ trường nhập liệu nào
			const target = (e.target || document.activeElement) as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable ||
					Boolean(target.closest?.("input, textarea, [contenteditable='true']")))
			) {
				return;
			}

			if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
				nextPage();
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
				prevPage();
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			isMounted = false;
			window.removeEventListener("keydown", handleKeyDown);
			if (bookRef.current) {
				try {
					bookRef.current.destroy();
				} catch (e) {
					// ignore
				}
			}
		};
	}, [epubUrl, storageKey]);

	// Chặn kéo thả nội dung ra ngoài trên toàn bộ cửa sổ đọc sách (DRM Anti-Drag Protection)
	useEffect(() => {
		const handleDragStart = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			return false;
		};
		window.addEventListener("dragstart", handleDragStart, { capture: true });
		return () => {
			window.removeEventListener("dragstart", handleDragStart, { capture: true });
		};
	}, []);

	// Theme switcher: only light or sepia (applied immediately without reload)
	const changeTheme = (newTheme: "light" | "sepia") => {
		setTheme(newTheme);
		applyReaderStyles(newTheme, fontFamilyRef.current, lineHeightRef.current, fontSize);
		showToast(`Giao diện: ${newTheme === "sepia" ? "Vàng ấm Sepia" : "Sáng tiêu chuẩn"}`);
	};

	// Font family switcher (supports Vietnamese fonts, applied immediately without reload)
	const changeFontFamily = (fontId: string) => {
		setFontFamily(fontId);
		fontFamilyRef.current = fontId;
		applyReaderStyles(theme, fontId, lineHeightRef.current, fontSize);
		if (renditionRef.current && viewerRef.current) {
			const rect = viewerRef.current.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				renditionRef.current.resize(rect.width, rect.height);
			}
		}
		const target = FONT_OPTIONS.find((f) => f.id === fontId);
		if (target) {
			showToast(`Đã đổi phông chữ: ${target.label.split(" (")[0]}`);
		}
	};

	// Font size switcher (applied immediately without reload)
	const changeFontSize = (delta: number) => {
		const newSize = Math.max(70, Math.min(180, fontSize + delta));
		setFontSize(newSize);
		applyReaderStyles(theme, fontFamilyRef.current, lineHeightRef.current, newSize);
		if (renditionRef.current && viewerRef.current) {
			const rect = viewerRef.current.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				renditionRef.current.resize(rect.width, rect.height);
			}
		}
	};

	// Line height switcher (applied immediately without reload)
	const changeLineHeight = (mode: "normal" | "relaxed") => {
		setLineHeight(mode);
		lineHeightRef.current = mode;
		applyReaderStyles(theme, fontFamilyRef.current, mode, fontSize);
		if (renditionRef.current && viewerRef.current) {
			const rect = viewerRef.current.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				renditionRef.current.resize(rect.width, rect.height);
			}
		}
		showToast(mode === "relaxed" ? "Khoảng cách dòng: Thoáng đãng (2.0)" : "Khoảng cách dòng: Tiêu chuẩn (1.65)");
	};

	// Change page layout mode (applied immediately without reload)
	const changeLayoutMode = (mode: PageLayoutMode) => {
		setLayoutMode(mode);
		layoutModeRef.current = mode;
		if (renditionRef.current) {
			try {
				if (mode === "scroll") {
					renditionRef.current.flow("scrolled");
					renditionRef.current.spread("none");
				} else if (mode === "single") {
					renditionRef.current.flow("paginated");
					renditionRef.current.spread("none");
				} else {
					renditionRef.current.flow("paginated");
					renditionRef.current.spread("auto");
				}
				setTimeout(() => {
					applyReaderStyles(theme, fontFamilyRef.current, lineHeightRef.current, fontSize);
					if (renditionRef.current && viewerRef.current) {
						const rect = viewerRef.current.getBoundingClientRect();
						if (rect.width > 0 && rect.height > 0) {
							renditionRef.current.resize(rect.width, rect.height);
						}
						const loc = (renditionRef.current.currentLocation() as any)?.start?.cfi;
						if (loc) {
							renditionRef.current.display(loc);
						}
					}
				}, 60);
			} catch (e) {
				// ignore
			}
		}
		showToast(
			mode === "single"
				? "Chế độ đọc: 1 trang duy nhất (Single Page)"
				: mode === "double"
					? "Chế độ đọc: 2 trang song song (Double Pages)"
					: "Chế độ đọc: Cuộn liền nối tiếp (Continuous Scroll)",
		);
	};

	// Restart trial to page 1
	const handleRestartTrial = () => {
		setIsTrialLocked(false);
		setIsPaywallOpen(false);
		setCurrentPage(1);
		currentPageRef.current = 1;
		viewedPagesRef.current = new Set([1]);
		setViewedCount(1);
		if (renditionRef.current) {
			renditionRef.current.display(0);
		}
	};

	const nextPage = () => {
		registerUserManualNavigation();

		// Strict hard lock for trial: cannot read beyond 15 pages
		if (isTrial && (isTrialLockedRef.current || viewedPagesRef.current.size >= 15 || currentPageRef.current >= 15)) {
			setIsTrialLocked(true);
			setIsPaywallOpen(true);
			showToast("Bạn đã đọc hết 15 trang đọc thử. Vui lòng mua sách để mở khóa bản quyền.");
			return;
		}

		if (isTrial) {
			const nextP = Math.min(15, currentPageRef.current + 1);
			currentPageRef.current = nextP;
			setCurrentPage(nextP);
			viewedPagesRef.current.add(nextP);
			setViewedCount(viewedPagesRef.current.size);
			if (viewedPagesRef.current.size >= 15 || nextP >= 15) {
				setIsTrialLocked(true);
				setTimeout(() => setIsPaywallOpen(true), 300);
			}
		}

		// In continuous scroll mode: scroll down smoothly first
		if (layoutModeRef.current === "scroll") {
			const container = document.getElementById("viewer-container");
			if (container && container.scrollTop + container.clientHeight < container.scrollHeight - 60) {
				container.scrollBy({ top: Math.round(container.clientHeight * 0.75), behavior: "smooth" });
				return;
			}
		}

		// Fast, responsive turn without blocking the full screen
		if (renditionRef.current) {
			renditionRef.current.next().catch(() => {});
		}
	};

	const prevPage = () => {
		registerUserManualNavigation();

		if (isTrial) {
			const prevP = Math.max(1, currentPageRef.current - 1);
			currentPageRef.current = prevP;
			setCurrentPage(prevP);
		}

		// In continuous scroll mode: scroll up smoothly first
		if (layoutModeRef.current === "scroll") {
			const container = document.getElementById("viewer-container");
			if (container && container.scrollTop > 60) {
				container.scrollBy({ top: -Math.round(container.clientHeight * 0.75), behavior: "smooth" });
				return;
			}
		}

		// Fast, responsive turn without blocking the full screen
		if (renditionRef.current) {
			renditionRef.current.prev().catch(() => {});
		}
	};

	// Navigate to chapter: KEEP TOC OPEN & Enforce 15-page trial limit
	const handleNavigateChapter = (chapter: TocItem, chIdx?: number) => {
		registerUserManualNavigation();

		if (isTrial) {
			const chapterIndex = typeof chIdx === "number"
				? chIdx
				: tocList.findIndex(
						(ch) => ch.id === chapter.id || (ch.href && chapter.href && (ch.href === chapter.href || ch.href.includes(chapter.href))),
					);
			if (isTrialLockedRef.current || viewedPagesRef.current.size >= 15 || chapterIndex > 1) {
				setIsTrialLocked(true);
				setIsPaywallOpen(true);
				showToast("Chương này đã bị khóa bản quyền. Vui lòng mua sách để mở khóa.");
				return;
			}
		}

		if (chapter.href && renditionRef.current) {
			renditionRef.current
				.display(chapter.href)
				.then(() => {
					setActiveChapterHref(chapter.href);
				})
				.catch(() => {});
		} else {
			setActiveChapterHref(chapter.id);
			showToast(`Đang đọc: ${chapter.label}`);
		}
	};

	// Highlight text action
	const handleHighlightSelected = () => {
		if (!selectedText) return;
		try {
			if (renditionRef.current && selectedCfi) {
				const isRange = typeof selectedCfi === "string" && (selectedCfi.match(/,/g) || []).length >= 2;
				if (isRange) {
					const hlTheme = HIGHLIGHT_COLOR_PRESETS.find((c) => c.id === highlightColorId) || HIGHLIGHT_COLOR_PRESETS[0];
					renditionRef.current.annotations.add(
						"highlight",
						selectedCfi,
						{},
						() => {},
						"hl-aura",
						{ fill: hlTheme.primary, "fill-opacity": "0.35" },
					);
				}
			}
		} catch (e) {
			// ignore
		}
		try {
			const contentsList = (renditionRef.current as any)?.getContents?.() || [];
			contentsList.forEach((c: any) => {
				c?.window?.getSelection()?.removeAllRanges();
			});
			window.getSelection()?.removeAllRanges();
		} catch {}
		showToast("Đã tô màu đoạn văn bản thành công.");
		setSelectedText("");
		setSelectionCoords(null);
	};

	// Save quote action
	const handleSaveQuote = () => {
		if (!selectedText) return;
		const newQuote: SavedQuote = {
			id: String(Date.now()),
			text: selectedText,
			cfi: selectedCfi,
			createdAt: new Date().toLocaleDateString("vi-VN", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
		};
		const updated = [newQuote, ...savedQuotes];
		setSavedQuotes(updated);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(quotesStorageKey, JSON.stringify(updated));
			} catch (e) {
				// ignore
			}
		}
		showToast("Đã lưu đoạn trích dẫn vào mục Trích dẫn đã lưu!");
		setSelectedText("");
		setSelectionCoords(null);
	};

	// Delete saved quote
	const handleDeleteQuote = (quoteId: string) => {
		const updated = savedQuotes.filter((q) => q.id !== quoteId);
		setSavedQuotes(updated);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(quotesStorageKey, JSON.stringify(updated));
			} catch (e) {
				// ignore
			}
		}
		showToast("Đã xóa trích dẫn khỏi danh sách.");
	};

	// Jump to quote location in ePub AND make it HIGHLIGHTED with SOFT PULSING effect (NOT too dark)
	const handleJumpToQuote = (cfi: string, quoteText?: string) => {
		if (quoteText) {
			currentPlayingLocationRef.current = {
				page: currentPageRef.current,
				cfi: cfi,
				sentence: quoteText,
			};
		}
		jumpToCfiWithPulse(cfi, "✨ Đã định vị trích dẫn (đoạn chữ đang phát sáng nhẹ trên trang sách).");
	};

	// Ask AI about quote
	const handleAskAIAboutQuote = (text: string) => {
		setIsAiOpen(true);
		setAiTab("chat");
		handleSendAIMessage(`Hãy diễn giải ý nghĩa triết lý và bối cảnh của trích dẫn này: "${text}"`, text);
	};

	// Ask AI about selected text
	const handleAskAIAboutSelection = () => {
		if (!selectedText) return;
		const quoteText = selectedText;
		setSelectedText("");
		setSelectionCoords(null);
		setIsAiOpen(true);
		setAiTab("chat");
		handleSendAIMessage(`Hãy diễn giải ý nghĩa triết lý và bối cảnh của đoạn văn này: "${quoteText}"`, quoteText);
	};

	// Send manual message to AI (connected to Dify RAG Knowledge Base & Smart literature engine)
	const handleSendAIMessage = async (promptText?: string, quoteContext?: string) => {
		const text = (promptText || aiInput).trim();
		if (!text) return;

		const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
		const userMsg: AIMessage = {
			id: `user-${Date.now()}`,
			sender: "user",
			text,
			timestamp: timeStr,
			highlightQuote: quoteContext,
		};

		const updatedMessages = [...aiMessages, userMsg];
		setAiMessages(updatedMessages);
		setAiInput("");
		setIsAiThinking(true);

		const aiMsgId = `ai-${Date.now()}`;
		let streamedText = "";

		try {
			const res = await fetch("/api/ai/reader-chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: text,
					bookTitle,
					bookSlug,
					quoteContext: quoteContext || "",
					user: userProfileRef.current?.email || "reader_web",
					stream: true,
					aiMode: aiSpeedMode,
				}),
			});

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}

			const contentType = res.headers.get("content-type") || "";

			// Trường hợp 1: Streaming SSE (Real-time token typing)
			if (contentType.includes("text/event-stream") && res.body) {
				const reader = res.body.getReader();
				const decoder = new TextDecoder("utf-8");
				let buffer = "";

				// Tạo tin nhắn AI rỗng để bắt đầu stream
				setAiMessages((prev) => [
					...prev,
					{
						id: aiMsgId,
						sender: "ai",
						text: "",
						timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
					},
				]);

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						const trimmed = line.trim();
						if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
							try {
								const parsed = JSON.parse(trimmed.slice(6)) as any;
								if (parsed.chunk) {
									streamedText += parsed.chunk;
									setAiMessages((prev) =>
										prev.map((m) => (m.id === aiMsgId ? { ...m, text: streamedText } : m))
									);
								}
							} catch (_) {}
						}
					}
				}

				// Flush trailing buffer nếu còn chunk cuối
				if (buffer.trim()) {
					const trimmed = buffer.trim();
					if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
						try {
							const parsed = JSON.parse(trimmed.slice(6)) as any;
							if (parsed.chunk) {
								streamedText += parsed.chunk;
								setAiMessages((prev) =>
									prev.map((m) => (m.id === aiMsgId ? { ...m, text: streamedText } : m))
								);
							}
						} catch (_) {}
					}
				}
			} else {
				// Trường hợp 2: JSON Response thông thường
				const data = (await res.json()) as any;
				streamedText = data.answer || data.response || data.text || "";
				setAiMessages((prev) => [
					...prev,
					{
						id: aiMsgId,
						sender: "ai",
						text: streamedText || `Phân tích tác phẩm từ AuraBook AI: Tác phẩm "${bookTitle}" là một tác phẩm mang nhiều giá trị nghệ thuật và nhân văn sâu sắc.`,
						timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
					},
				]);
			}

			// Tự động lưu phiên vào chatSessions sau khi hoàn thành hội thoại
			if (streamedText) {
				const finalAiMsg: AIMessage = {
					id: aiMsgId,
					sender: "ai",
					text: streamedText,
					timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
				};
				const currentSessionMessages = [...updatedMessages, finalAiMsg];

				setChatSessions((prevSessions) => {
					const existingIndex = prevSessions.findIndex((s) => s.bookSlug === bookSlug);
					let newSessions: ChatSession[];
					if (existingIndex >= 0) {
						newSessions = prevSessions.map((s, idx) =>
							idx === existingIndex ? { ...s, messages: currentSessionMessages } : s
						);
					} else {
						newSessions = [
							{
								id: `session_${bookSlug}_${Date.now()}`,
								title: text.slice(0, 45) + (text.length > 45 ? "..." : ""),
								createdAt: new Date().toLocaleString("vi-VN"),
								bookSlug,
								messages: currentSessionMessages,
							},
							...prevSessions,
						];
					}
					try {
						localStorage.setItem(chatSessionsStorageKey, JSON.stringify(newSessions));
					} catch (_) {}
					return newSessions;
				});
			}
		} catch (e) {
			console.warn("[Reader AI] Query error:", e);
			if (!streamedText) {
				const fallbackMsg: AIMessage = {
					id: `ai-${Date.now()}`,
					sender: "ai",
					text: `Tôi đã nhận câu hỏi của bạn về tác phẩm "${bookTitle}". Bạn có thể hỏi thêm về bối cảnh, tư tưởng tác giả hoặc chọn bất kỳ trích đoạn nào trên trang sách để cùng tôi phân tích nhé!`,
					timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
				};
				setAiMessages((prev) => [...prev, fallbackMsg]);
			}
		} finally {
			setIsAiThinking(false);
		}
	};

	const filteredToc = tocList.filter((t) => t.label.toLowerCase().includes(tocSearch.toLowerCase()));

	// FULL SEPIA THEME VARIABLES: Syncs Header, Sidebars, Footer and Content 100% seamlessly
	const isSepia = theme === "sepia";

	const themeBg = isSepia
		? "bg-[#fbf0d9] text-[#433422]" // design-tokens-allow
		: "bg-background text-foreground";

	const headerBg = isSepia
		? "bg-[#f4ebd0] border-[#d8cbb0] text-[#433422]" // design-tokens-allow
		: "bg-card/95 border-border text-foreground";

	const sidebarBg = isSepia
		? "bg-[#f7efe0] border-[#d8cbb0] text-[#433422]" // design-tokens-allow
		: "bg-card border-border text-card-foreground";

	const sidebarSubHeaderBg = isSepia
		? "bg-[#ede2cd] border-[#d8cbb0]" // design-tokens-allow
		: "bg-muted/30 border-border";

	const inputBg = isSepia
		? "bg-[#fbf0d9] border-[#d8cbb0] text-[#433422] placeholder:text-[#8a765a]" // design-tokens-allow
		: "bg-background border-border text-foreground";

	const cardItemBg = isSepia
		? "bg-[#fbf0d9] border-[#d8cbb0] text-[#433422]" // design-tokens-allow
		: "bg-card border-border text-card-foreground";

	const footerBg = isSepia
		? "bg-[#f4ebd0] border-[#d8cbb0] text-[#5c4a32]" // design-tokens-allow
		: "bg-card/95 border-border text-muted-foreground";

	return (
		<div className={`relative flex h-screen w-full flex-col overflow-hidden select-none transition-colors duration-200 ${themeBg}`}>
			{/* 0. ACCESS REVOKED (LOGGED OUT / UNAUTHENTICATED) DRM BARRIER */}
			{isAuthRevoked && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/98 backdrop-blur-2xl p-6 text-center select-none animate-in fade-in duration-200">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4 border border-destructive/20 shadow-lg">
						<ShieldAlert className="h-8 w-8" />
					</div>
					<div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1 text-[11px] font-semibold text-destructive mb-2 font-mono">
						<Lock className="h-3 w-3" />
						<span>QUYỀN TRUY CẬP ĐÃ BỊ THU HỒI</span>
					</div>
					<h2 className="text-xl font-bold text-foreground tracking-tight">
						Phiên Đăng Nhập Đã Kết Thúc
					</h2>
					<p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
						Tài khoản của bạn đã đăng xuất hoặc phiên đọc đã hết hạn. Để bảo vệ bản quyền số theo tiêu chuẩn Readium LCP DRM, ấn phẩm chỉ được phép đọc khi duy trì phiên đăng nhập hợp lệ.
					</p>
					<div className="mt-6 flex items-center gap-3">
						<Button
							variant="default"
							size="sm"
							onClick={() => {
								const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
								window.location.assign(`/vi/channel-vnd/login?next=${encodeURIComponent(currentUrl)}`);
							}}
							className="gap-2"
						>
							<LogIn className="h-4 w-4" />
							<span>Đăng nhập lại để tiếp tục</span>
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								window.location.assign("/vi/channel-vnd/community?tab=bookshelf");
							}}
						>
							Về tủ sách của tôi
						</Button>
					</div>
				</div>
			)}

			{/* 0.1 SINGLE ACTIVE TAB CONCURRENCY DRM BARRIER */}
			{isMultiTabBlocked && !isAuthRevoked && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/98 backdrop-blur-2xl p-6 text-center select-none animate-in fade-in duration-200">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 shadow-lg">
						<Layers className="h-8 w-8" />
					</div>
					<div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-2 font-mono">
						<Lock className="h-3 w-3" />
						<span>BẢO VỆ DRM • ĐƠN TAB ĐỘC QUYỀN</span>
					</div>
					<h2 className="text-xl font-bold text-foreground tracking-tight">
						Phiên Đọc Đang Mở Ở Tab Khác
					</h2>
					<p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
						Hệ thống phát hiện ấn phẩm này đang được mở ở một tab khác trên trình duyệt. Để bảo vệ bản quyền số DRM và chống chia sẻ tài khoản đồng thời, AuraBook chỉ cho phép đọc trên 1 tab duy nhất tại một thời điểm.
					</p>
					<div className="mt-6 flex items-center gap-3">
						<Button
							variant="default"
							size="sm"
							onClick={claimActiveTab}
							className="gap-2"
						>
							<Play className="h-4 w-4" />
							<span>Tiếp tục đọc trên tab này</span>
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								window.location.assign(backUrl);
							}}
						>
							Về tủ sách
						</Button>
					</div>
				</div>
			)}

			{/* 1. ANTI-SCREENSHOT / FOCUS LOSS DRM SHIELD OVERLAY */}
			{isScreenProtected && (
				<div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl p-6 text-center select-none animate-in fade-in duration-150">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20 shadow-lg animate-pulse">
						<ShieldAlert className="h-8 w-8" />
					</div>
					<h2 className="text-lg font-bold text-foreground tracking-tight">
						BẢO VỆ BẢN QUYỀN DRM AURABOOK
					</h2>
					<p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
						Nội dung ấn phẩm được bảo vệ tự động chống chụp ảnh màn hình và quay video. Màn hình tạm thời được che khi ứng dụng mất tiêu điểm.
					</p>
					<div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-card border border-border">
						<Lock className="h-3.5 w-3.5 text-primary" />
						<span>Cấp riêng cho: {userProfile.name} (#{userProfile.id})</span>
					</div>
					<Button
						variant="default"
						size="sm"
						onClick={() => setIsScreenProtected(false)}
						className="mt-6 gap-2"
					>
						<Eye className="h-4 w-4" />
						<span>Nhấp vào đây để tiếp tục đọc</span>
					</Button>
				</div>
			)}

			{/* 2. TOP-CENTER REAL USER IDENTITY WATERMARK BADGE */}
			<div className={`pointer-events-none absolute top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-mono shadow-2xs backdrop-blur-xs select-none ${
				isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]/90 text-[#5c4a32]" : "border-border/70 bg-card/90 text-muted-foreground" // design-tokens-allow
			}`}>
				<ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
				<span className="truncate max-w-[280px]">
					Bản quyền: {userProfile.name} • ID: #{userProfile.id}
				</span>
			</div>

			{/* 3. DRM COPY BLOCKED TOAST ALERT (Chỉ hiện khi bấm Ctrl+C có chủ đích) */}
			{showCopyAlert && (
				<div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-card border border-destructive/40 bg-card px-4 py-2 text-xs font-medium text-destructive shadow-overlay animate-in fade-in slide-in-from-top-3">
					<CopySlash className="h-4 w-4 shrink-0" />
					<span>Ấn phẩm được bảo vệ bản quyền DRM AuraBook. Tính năng sao chép văn bản đã bị khóa.</span>
				</div>
			)}

			{/* 4. GENERIC TOAST NOTICE */}
			{toastNotice && (
				<div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-card border px-4 py-2.5 text-xs font-medium shadow-overlay animate-in fade-in slide-in-from-top-3 ${
					isSepia ? "border-[#d8cbb0] bg-[#fbf0d9] text-[#433422]" : "border-border bg-card text-foreground" // design-tokens-allow
				}`}>
					<Check className="h-4 w-4 text-success shrink-0" />
					<span>{toastNotice}</span>
				</div>
			)}

			{/* 5. TOP TOOLBAR - SYNCED IN SEPIA (z-50 so popups are above AI sidebar) */}
			<header className={`z-50 flex h-14 items-center justify-between border-b px-4 md:px-6 backdrop-blur-md transition-colors ${headerBg}`}>
				{/* Left: Back to bookshelf & TOC toggle */}
				<div className="flex items-center gap-2.5">
					<LinkWithChannel
						href={backUrl}
						className={buttonClassName({
							variant: isSepia ? "ghost" : "outline-solid",
							size: "sm",
							asLink: true,
							className: isSepia ? "gap-1.5 border border-[#d8cbb0] bg-[#fbf0d9] hover:bg-[#ede2cd]" : "gap-1.5", // design-tokens-allow
						})}
						title="Quay về Tủ sách của tôi trong Cộng đồng"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Kho sách</span>
					</LinkWithChannel>

					<Button
						variant={isTocOpen ? "secondary" : isSepia ? "ghost" : "outline-solid"}
						size="sm"
						onClick={() => setIsTocOpen(!isTocOpen)}
						className={isSepia ? "gap-1.5 border border-[#d8cbb0] bg-[#fbf0d9] hover:bg-[#ede2cd]" : "gap-1.5"} // design-tokens-allow
						title="Mục lục tác phẩm"
					>
						<List className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Mục lục</span>
					</Button>

					<div className={`hidden lg:flex items-center gap-2 ml-2 pl-3 border-l ${isSepia ? "border-[#d8cbb0]" : "border-border"}`}>
						<div className="max-w-[200px] xl:max-w-xs truncate">
							<h1 className="truncate font-semibold text-xs tracking-tight">
								{bookTitle}
							</h1>
						</div>
						{isTrial && (
							<Badge variant="outline-solid" className="ml-1 gap-1 py-0.5 px-2 text-[10px] font-medium border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
								<span>Bản đọc thử ({viewedCount}/15 trang)</span>
							</Badge>
						)}
					</div>
				</div>

				{/* Right: Audio Narration ("Sách nói"), AI Companion toggle, Reading Settings, Theme Switcher, Fullscreen */}
				<div className="flex items-center gap-2">
					{/* SÁCH NÓI POPOVER DROPDOWN (Directly beneath button, z-[70] above AI sidebar) */}
					<div className="relative">
						<Button
							variant={isAudioPopoverOpen ? "default" : isTtsPlaying ? "default" : isSepia ? "ghost" : "outline-solid"}
							size="sm"
							onClick={() => setIsAudioPopoverOpen((prev) => !prev)}
							className={
								isTtsPlaying
									? "bg-primary text-primary-foreground font-semibold shadow-xs"
									: isSepia && !isAudioPopoverOpen
										? "border border-[#d8cbb0] bg-[#fbf0d9] hover:bg-[#ede2cd] text-[#433422]"
										: "border-border bg-card hover:bg-muted text-foreground"
							}
							title="Mở bảng điều khiển Sách nói"
						>
							<Headphones className="h-3.5 w-3.5 mr-1" />
							<span>Sách nói</span>
						</Button>

						{isAudioPopoverOpen && (
							<div
								className={`absolute right-0 top-full mt-2 z-[70] w-80 rounded-card border p-4 shadow-elevated animate-in fade-in slide-in-from-top-2 select-none ${
									isSepia ? "bg-[#f7efe0] border-[#d8cbb0] text-[#433422]" : "bg-card border-border text-foreground"
								}`}
							>
								{/* Header */}
								<div className="flex items-center justify-between pb-2 mb-3 border-b border-inherit">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold">Điều Khiển Sách Nói</span>
										{isTtsPlaying && (
											<span className="flex h-2 w-2 relative">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
												<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
											</span>
										)}
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setIsAudioPopoverOpen(false)}
										className="h-6 w-6 rounded-full"
									>
										<X className="h-3.5 w-3.5" />
									</Button>
								</div>

								{/* Controls row: Rewind 10s, Play/Pause, Skip 10s, Stop completely */}
								<div className="flex items-center justify-center gap-3 mb-3.5">
									{/* Tua lùi 10s */}
									<Button
										variant="ghost"
										size="icon"
										onClick={handleRewind10s}
										className="h-9 w-9 rounded-full opacity-80 hover:opacity-100"
										title="Tua lùi câu trước (-10s)"
									>
										<RotateCcw className="h-4 w-4" />
									</Button>

									{/* Play / Pause */}
									<Button
										variant="default"
										size="icon"
										onClick={handleToggleReadAloud}
										disabled={isTtsLoading}
										className={`h-11 w-11 rounded-full shadow-md transition-transform active:scale-95 ${
											isSepia
												? "bg-[#8b5a00] hover:bg-[#724a00] text-white"
												: "bg-primary text-primary-foreground"
										}`}
										title={isTtsPlaying ? "Tạm dừng" : "Tiếp tục đọc"}
									>
										{isTtsLoading ? (
											<Loader size="sm" className="h-4 w-4 text-white" />
										) : isTtsPlaying ? (
											<Pause className="h-5 w-5" />
										) : (
											<Play className="h-5 w-5 ml-0.5" />
										)}
									</Button>

									{/* Tua tới 10s */}
									<Button
										variant="ghost"
										size="icon"
										onClick={handleSkip10s}
										className="h-9 w-9 rounded-full opacity-80 hover:opacity-100"
										title="Tua sang câu kế tiếp (+10s)"
									>
										<RotateCw className="h-4 w-4" />
									</Button>

									{/* Dừng hẳn */}
									<Button
										variant="ghost"
										size="icon"
										onClick={handleStopReadAloud}
										className="h-9 w-9 rounded-full opacity-60 hover:opacity-100 hover:text-destructive"
										title="Dừng hẳn đọc sách"
									>
										<Square className="h-4 w-4" />
									</Button>
								</div>

								{/* Đi đến vị trí đang đọc / đang nói */}
								<Button
									variant="outline-solid"
									size="sm"
									onClick={handleJumpToCursor}
									className="w-full mb-3 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-button border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-2xs"
									title="Cuộn về câu sách nói đang phát hoặc vị trí con trỏ đọc"
								>
									<LocateFixed className="h-3.5 w-3.5" />
									<span>Đi đến vị trí đang đọc</span>
								</Button>

								{/* Chọn giọng đọc AI (5 mô hình tiếng Việt chuyên sâu) */}
								<div className="space-y-1.5 mb-3">
									<label className="text-xs font-semibold opacity-80 flex items-center justify-between">
										<span>Giọng đọc AI:</span>
										<span className="text-[10px] text-primary font-medium">
											{VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.badge || "Chuẩn MC"}
										</span>
									</label>
									<select
										value={selectedVoice}
										onChange={(e) => handleChangeTtsVoice(e.target.value)}
										className={`w-full rounded-button border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary ${
											isSepia
												? "border-[#d8cbb0] bg-[#ede2cd]/80 text-[#433422]"
												: "border-border bg-background text-foreground"
										}`}
									>
										{VOICE_OPTIONS.map((v) => (
											<option key={v.id} value={v.id}>
												{v.name}
											</option>
										))}
									</select>
									<p className="text-[10px] text-muted-foreground leading-tight">
										{VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.desc}
									</p>
								</div>

								{/* Tốc độ đọc (Speed selector) */}
								<div className="space-y-1.5 mb-3">
									<label className="text-xs font-semibold opacity-80">Tốc độ đọc:</label>
									<div
										className={`grid grid-cols-5 gap-1 rounded-button border p-1 text-xs font-mono text-center ${
											isSepia ? "border-[#d8cbb0] bg-[#ede2cd]/60" : "border-border bg-muted/40"
										}`}
									>
										{[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
											<button
												key={spd}
												type="button"
												onClick={() => handleChangeTtsSpeed(spd)}
												className={`py-1 rounded-sm transition-all ${
													ttsSpeed === spd
														? isSepia
															? "bg-[#8b5a00] text-white font-bold shadow-2xs"
															: "bg-primary text-primary-foreground font-bold shadow-2xs"
														: "opacity-75 hover:opacity-100"
												}`}
											>
												{spd}x
											</button>
										))}
									</div>
								</div>

								{/* Hẹn giờ tắt (Sleep Timer) */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold opacity-80 flex items-center justify-between">
										<span>Hẹn giờ tắt:</span>
										{sleepTimerMinutes > 0 && (
											<span className="font-mono text-primary font-bold text-[11px]">
												Còn {formatTime(sleepTimerRemainingSec)}
											</span>
										)}
									</label>
									<div className="grid grid-cols-4 gap-1 text-xs">
										{[
											{ label: "Tắt", mins: 0 },
											{ label: "15p", mins: 15 },
											{ label: "30p", mins: 30 },
											{ label: "60p", mins: 60 },
										].map((item) => (
											<button
												key={item.mins}
												type="button"
												onClick={() => handleSetSleepTimer(item.mins)}
												className={`py-1.5 rounded-button font-medium border transition-colors ${
													sleepTimerMinutes === item.mins
														? isSepia
															? "bg-[#8b5a00] border-[#8b5a00] text-white font-bold"
															: "bg-primary border-primary text-primary-foreground font-bold"
														: isSepia
															? "border-[#d8cbb0] hover:bg-[#ede2cd]"
															: "border-border hover:bg-muted"
												}`}
											>
												{item.label}
											</button>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* AI Reading Companion Button */}
					<Button
						variant={isAiOpen ? "default" : isSepia ? "ghost" : "outline-solid"}
						size="sm"
						onClick={() => setIsAiOpen(!isAiOpen)}
						className={isSepia && !isAiOpen ? "gap-1.5 border border-[#d8cbb0] bg-[#fbf0d9] hover:bg-[#ede2cd]" : "gap-1.5"} // design-tokens-allow
						title="Trợ lý AI Đọc sách & Trích dẫn"
					>
						<Bot className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">Trợ lý AI</span>
						{savedQuotes.length > 0 && (
							<span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px] font-bold">
								{savedQuotes.length}
							</span>
						)}
					</Button>

					{/* READING DISPLAY SETTINGS POPOVER BUTTON (Layout, Font size, Line height) */}
					<div className="relative">
						<Button
							variant={isSettingsOpen ? "secondary" : isSepia ? "ghost" : "outline-solid"}
							size="sm"
							onClick={() => setIsSettingsOpen(!isSettingsOpen)}
							className={isSepia ? "gap-1.5 border border-[#d8cbb0] bg-[#fbf0d9] hover:bg-[#ede2cd]" : "gap-1.5"} // design-tokens-allow
							title="Cài đặt thông số đọc sách (1 trang, 2 trang, cuộn dọc)"
						>
							<SlidersHorizontal className="h-3.5 w-3.5" />
							<span className="hidden md:inline text-xs">Cài đặt đọc</span>
						</Button>

						{/* SETTINGS DROPDOWN POPOVER (z-[70] so it's above AI sidebar) */}
						{isSettingsOpen && (
							<div
								className={`absolute right-0 top-full mt-2 z-[70] w-80 rounded-card border p-4 shadow-elevated animate-in fade-in slide-in-from-top-2 select-none ${
									isSepia ? "bg-[#f7efe0] border-[#d8cbb0] text-[#433422]" : "bg-card border-border text-foreground" // design-tokens-allow
								}`}
							>
								<div className="flex items-center justify-between pb-2.5 mb-3 border-b border-inherit">
									<span className="text-sm font-bold">Thông Số Đọc Sách</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setIsSettingsOpen(false)}
										className="h-6 w-6 rounded-full"
									>
										<X className="h-3.5 w-3.5" />
									</Button>
								</div>

								{/* 1. Bố cục trang: 1 trang, 2 trang, cuộn liền */}
								<div className="space-y-1.5 mb-3.5">
									<label className="text-xs font-semibold opacity-80">Bố cục trang đọc:</label>
									<div className="grid grid-cols-3 gap-1.5">
										<button
											onClick={() => changeLayoutMode("single")}
											className={`flex flex-col items-center justify-center py-2 px-1 rounded-button text-xs font-medium transition-all ${
												layoutMode === "single"
													? isSepia
														? "bg-[#fbf0d9] border border-[#b8860b] text-[#8b5a00] font-bold shadow-xs" // design-tokens-allow
														: "bg-primary text-primary-foreground font-bold shadow-xs"
													: isSepia
														? "hover:bg-[#ede2cd] border border-transparent" // design-tokens-allow
														: "hover:bg-muted border border-transparent"
											}`}
										>
											<Square className="h-4 w-4 mb-1" />
											<span>1 trang</span>
										</button>

										<button
											onClick={() => changeLayoutMode("double")}
											className={`flex flex-col items-center justify-center py-2 px-1 rounded-button text-xs font-medium transition-all ${
												layoutMode === "double"
													? isSepia
														? "bg-[#fbf0d9] border border-[#b8860b] text-[#8b5a00] font-bold shadow-xs" // design-tokens-allow
														: "bg-primary text-primary-foreground font-bold shadow-xs"
													: isSepia
														? "hover:bg-[#ede2cd] border border-transparent" // design-tokens-allow
														: "hover:bg-muted border border-transparent"
											}`}
										>
											<Columns className="h-4 w-4 mb-1" />
											<span>2 trang</span>
										</button>

										<button
											onClick={() => changeLayoutMode("scroll")}
											className={`flex flex-col items-center justify-center py-2 px-1 rounded-button text-xs font-medium transition-all ${
												layoutMode === "scroll"
													? isSepia
														? "bg-[#fbf0d9] border border-[#b8860b] text-[#8b5a00] font-bold shadow-xs" // design-tokens-allow
														: "bg-primary text-primary-foreground font-bold shadow-xs"
													: isSepia
														? "hover:bg-[#ede2cd] border border-transparent" // design-tokens-allow
														: "hover:bg-muted border border-transparent"
											}`}
										>
											<Scroll className="h-4 w-4 mb-1" />
											<span>Cuộn liền</span>
										</button>
									</div>
								</div>

								{/* 2. Kiểu phông chữ (Custom Styled Dropdown - zero glitch on Windows) */}
								<div className="space-y-1.5 mb-3.5">
									<label className="text-xs font-semibold opacity-80 flex items-center justify-between">
										<span className="flex items-center gap-1">
											<Type className="h-3.5 w-3.5" />
											<span>Phông chữ hiển thị:</span>
										</span>
									</label>
									<div className="relative">
										<button
											type="button"
											onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
											className={`w-full h-9 px-3 flex items-center justify-between text-xs font-medium rounded-button border transition-colors ${
												isSepia
													? "bg-[#fbf0d9] border-[#d8cbb0] text-[#433422]" // design-tokens-allow
													: "bg-background border-border text-foreground hover:bg-muted/50"
											}`}
										>
											<span className="truncate">
												{FONT_OPTIONS.find((f) => f.id === fontFamily)?.label || "Mặc định của sách"}
											</span>
											<ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${isFontDropdownOpen ? "rotate-180" : ""}`} />
										</button>

										{isFontDropdownOpen && (
											<div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-card border p-1 shadow-lg max-h-56 overflow-y-auto ${
												isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] text-[#433422]" : "bg-popover border-border text-popover-foreground"
											}`}>
												{FONT_OPTIONS.map((font) => {
													const isSelected = fontFamily === font.id;
													return (
														<button
															key={font.id}
															type="button"
															onClick={() => {
																changeFontFamily(font.id);
																setIsFontDropdownOpen(false);
															}}
															className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-xs text-left transition-colors ${
																isSelected
																	? isSepia
																		? "bg-[#ede2cd] font-bold text-[#8b5a00]"
																		: "bg-primary/10 text-primary font-bold"
																	: isSepia
																		? "hover:bg-[#ede2cd]/60"
																		: "hover:bg-muted"
															}`}
														>
															<span className={font.style}>{font.label}</span>
															{isSelected && <Check className="h-3.5 w-3.5 ml-1 shrink-0 text-primary" />}
														</button>
													);
												})}
											</div>
										)}
									</div>
								</div>

								{/* 3. Cỡ chữ (Font size) */}
								<div className="space-y-1.5 mb-3.5">
									<div className="flex items-center justify-between text-xs font-semibold opacity-80">
										<span>Kích cỡ chữ:</span>
									</div>
									<div className={`flex items-center justify-between rounded-button border p-1 ${
										isSepia ? "border-[#d8cbb0] bg-[#ede2cd]" : "border-border bg-muted/40" // design-tokens-allow
									}`}>
										<Button
											variant="ghost"
											size="icon"
											type="button"
											onClick={() => changeFontSize(-5)}
											disabled={fontSize <= 70}
											className="h-7 w-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
											title="Giảm kích cỡ chữ (-5%)"
										>
											<Minus className="h-3.5 w-3.5" />
										</Button>
										<span className="font-mono font-bold text-sm select-none px-3">
											{fontSize}%
										</span>
										<Button
											variant="ghost"
											size="icon"
											type="button"
											onClick={() => changeFontSize(5)}
											disabled={fontSize >= 180}
											className="h-7 w-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
											title="Tăng kích cỡ chữ (+5%)"
										>
											<Plus className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>

								{/* 4. Khoảng cách dòng (Line Height) */}
								<div className="space-y-1.5">
									<label className="text-xs font-semibold opacity-80">Khoảng cách dòng:</label>
									<div className="grid grid-cols-2 gap-1.5">
										<button
											onClick={() => changeLineHeight("normal")}
											className={`py-1.5 px-2 rounded-button text-xs font-medium text-center transition-all ${
												lineHeight === "normal"
													? isSepia
														? "bg-[#fbf0d9] border border-[#b8860b] font-bold text-[#8b5a00]" // design-tokens-allow
														: "bg-primary text-primary-foreground font-bold"
													: isSepia
														? "hover:bg-[#ede2cd]" // design-tokens-allow
														: "hover:bg-muted"
											}`}
										>
											Tiêu chuẩn
										</button>
										<button
											onClick={() => changeLineHeight("relaxed")}
											className={`py-1.5 px-2 rounded-button text-xs font-medium text-center transition-all ${
												lineHeight === "relaxed"
													? isSepia
														? "bg-[#fbf0d9] border border-[#b8860b] font-bold text-[#8b5a00]" // design-tokens-allow
														: "bg-primary text-primary-foreground font-bold"
													: isSepia
														? "hover:bg-[#ede2cd]" // design-tokens-allow
														: "hover:bg-muted"
											}`}
										>
											Thoáng rộng
										</button>
									</div>
								</div>

								{/* 5. Giọng đọc sách nói AI */}
								<div className="space-y-1.5 mt-3.5 pt-3 border-t border-inherit">
									<label className="text-xs font-semibold opacity-80 flex items-center justify-between">
										<span>Giọng đọc sách nói AI:</span>
										<span className="text-[10px] text-primary font-medium">
											{VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.badge}
										</span>
									</label>
									<select
										value={selectedVoice}
										onChange={(e) => handleChangeTtsVoice(e.target.value)}
										className={`w-full rounded-button border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary ${
											isSepia
												? "border-[#d8cbb0] bg-[#ede2cd]/80 text-[#433422]"
												: "border-border bg-background text-foreground"
										}`}
									>
										{VOICE_OPTIONS.map((v) => (
											<option key={v.id} value={v.id}>
												{v.name}
											</option>
										))}
									</select>
								</div>

								{/* 6. Màu Highlight câu sách nói */}
								<div className="space-y-1.5 mt-3 pt-3 border-t border-inherit">
									<label className="text-xs font-semibold opacity-80 flex items-center justify-between">
										<span>Màu Highlight câu sách nói:</span>
										<span className="text-[10px] text-primary font-medium">
											{HIGHLIGHT_COLOR_PRESETS.find((c) => c.id === highlightColorId)?.name.split(" ")[0] || "Hoàng Kim"}
										</span>
									</label>
									<div className="grid grid-cols-5 gap-1.5">
										{HIGHLIGHT_COLOR_PRESETS.map((color) => {
											const isSelected = highlightColorId === color.id;
											return (
												<button
													key={color.id}
													type="button"
													onClick={() => handleChangeHighlightColor(color.id)}
													title={color.name}
													className={`group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-button border transition-all ${
														isSelected
															? isSepia
																? "border-[#8b5a00] bg-[#ede2cd] ring-2 ring-[#8b5a00]/40 font-bold"
																: "border-primary bg-primary/10 ring-2 ring-primary/40 font-bold"
															: isSepia
																? "border-[#d8cbb0] hover:bg-[#ede2cd]/50"
																: "border-border hover:bg-muted"
													}`}
												>
													<span
														className="h-3.5 w-3.5 rounded-full shadow-xs transition-transform group-hover:scale-110"
														style={{ backgroundColor: color.primary }}
													/>
													<span className="text-[9px] mt-1 truncate max-w-full leading-none">
														{color.name.split(" ")[0]}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Theme Switcher: Only Light and Sepia (Dark mode permanently removed) */}
					<div className={`flex items-center rounded-button border p-0.5 ${
						isSepia ? "border-[#d8cbb0] bg-[#ede2cd]" : "border-border bg-muted/40" // design-tokens-allow
					}`}>
						<Button
							variant={theme === "light" ? "secondary" : "ghost"}
							size="icon"
							onClick={() => changeTheme("light")}
							className="h-7 w-7"
							title="Chế độ Sáng"
						>
							<Sun className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant={theme === "sepia" ? "secondary" : "ghost"}
							size="icon"
							onClick={() => changeTheme("sepia")}
							className="h-7 w-7"
							title="Chế độ Giấy ngà Sepia (Chuyển toàn bộ giao diện)"
						>
							<Coffee className="h-3.5 w-3.5" />
						</Button>
					</div>

					{/* Fullscreen Button */}
					<Button
						variant={isFullscreen ? "secondary" : "ghost"}
						size="icon"
						onClick={toggleFullscreen}
						className={`h-7 w-7 rounded-button border ${
							isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]" : "border-border bg-muted/40" // design-tokens-allow
						}`}
						title={isFullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}
					>
						{isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
					</Button>
				</div>
			</header>

			{/* 6. MAIN WORKSPACE BODY WITH DUAL SIDEBARS */}
			<div className="relative flex flex-1 overflow-hidden">
				{/* LEFT COLLAPSIBLE SIDEBAR: TABLE OF CONTENTS (TOC) - SYNCED IN SEPIA */}
				{isTocOpen && (
					<aside className={`relative z-30 flex w-72 sm:w-80 flex-col border-r shadow-elevated animate-in slide-in-from-left duration-200 transition-colors ${sidebarBg}`}>
						<div className={`flex items-center justify-between border-b px-4 py-3 ${sidebarSubHeaderBg}`}>
							<div className="flex items-center gap-2">
								<span className="font-semibold text-xs">Mục Lục Tác Phẩm</span>
								<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 font-mono font-bold text-primary border-primary/30 bg-primary/10">
									Đã đọc: {readPercentage}%
								</Badge>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsTocOpen(false)}
								className="h-7 w-7 rounded-button hover:bg-black/5"
								title="Thu nhỏ mục lục"
							>
								<PanelLeftClose className="h-4 w-4" />
							</Button>
						</div>

						{/* Search in TOC */}
						<div className={`p-3 border-b ${isSepia ? "border-[#d8cbb0]" : "border-border"}`}>
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 opacity-60" />
								<Input
									type="text"
									placeholder="Tìm kiếm chương..."
									value={tocSearch}
									onChange={(e) => setTocSearch(e.target.value)}
									className={`h-8 pl-8 text-xs rounded-button transition-colors ${inputBg}`}
								/>
							</div>
						</div>

						{/* Chapters list (NO icon, NO "Đang đọc" text, clean active highlighting) */}
						<div className="flex-1 overflow-y-auto p-2 space-y-1">
							{filteredToc.map((chapter, chIdx) => {
								const isCurrent =
									(chapter.href && activeChapterHref.includes(chapter.href)) ||
									(chapter.href && chapter.href.includes(activeChapterHref)) ||
									chapter.id === activeChapterHref;
								const isLocked = isTrial && chIdx > 1;

								return (
									<button
										key={`toc-${chapter.id || "ch"}-${chIdx}`}
										onClick={() => handleNavigateChapter(chapter, chIdx)}
										className={`group flex w-full items-center justify-between rounded-button px-3 py-2 text-left text-xs transition-all ${
											isLocked ? "opacity-60 hover:opacity-100" : ""
										} ${
											isCurrent
												? isSepia
													? "bg-[#b8860b]/15 text-[#8b5a00] font-bold border-l-4 border-[#b8860b] pl-2.5 shadow-2xs" // design-tokens-allow
													: "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-2.5 shadow-2xs"
												: isSepia
													? "font-medium hover:bg-[#ede2cd] active:scale-[0.99]" // design-tokens-allow
													: "font-medium text-foreground hover:bg-muted active:scale-[0.99]"
										}`}
									>
										<div className="flex items-center gap-2 truncate pr-2">
											{isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
											<span className="truncate group-hover:underline">
												{chapter.label}
											</span>
										</div>
										<span
											className={`text-[10px] shrink-0 font-mono ${
												isCurrent ? "font-bold text-primary" : "opacity-60"
											}`}
										>
											{isLocked ? "Khóa" : `#${chapter.id}`}
										</span>
									</button>
								);
							})}
						</div>
					</aside>
				)}

				{/* CENTER READING CANVAS: ADAPTS TO SINGLE, DOUBLE, OR SCROLL LAYOUT */}
				<main className="relative flex flex-1 items-center justify-center overflow-hidden p-3 md:p-6">
					{/* Loading indicator */}
					{isLoading && (
						<div className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-xs ${
							isSepia ? "bg-[#fbf0d9]/80 text-[#433422]" : "bg-background/80 text-foreground" // design-tokens-allow
						}`}>
							<Loader size="lg" text="Đang nạp dữ liệu sách điện tử bảo mật DRM..." />
						</div>
					)}



					{/* Error fallback card */}
					{loadError && (
						<div className={`max-w-md rounded-card border p-6 text-center shadow-xl ${cardItemBg}`}>
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-button bg-primary/10 text-primary mb-4">
								<BookOpen className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-base">Bản Đọc Thử Mẫu (EPUB Preview)</h3>
							<p className="mt-2 text-xs opacity-75 leading-relaxed">
								Hệ thống DRM Reader bảo vệ chống sao chép và phân phối trái phép. Bạn đang trải nghiệm giao diện đọc tiêu chuẩn với định dạng EPUB 3.0.
							</p>
							<Button
								variant="default"
								size="sm"
								onClick={() => {
									setLoadError(null);
									setIsLoading(false);
								}}
								className="mt-5"
							>
								Tiếp tục đọc chế độ mô phỏng
							</Button>
						</div>
					)}

					{/* The EPUB.js rendering container: switches smoothly between single page, duo page, or scroll */}
					<div
						id="viewer-container"
						onWheel={registerUserManualNavigation}
						onTouchMove={registerUserManualNavigation}
						onDragStart={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
						className={`relative h-full w-full rounded-card shadow-2xl ${
							layoutMode === "scroll" ? "overflow-y-auto overflow-x-hidden scroll-smooth" : "overflow-hidden"
						} ${
							layoutMode === "single" || (isTocOpen && isAiOpen)
								? "max-w-2xl mx-auto"
								: "max-w-4xl mx-auto"
						} ${
							isSepia
								? "bg-[#f4ebd0] border border-[#d8cbb0]" // design-tokens-allow
								: "bg-white border border-slate-200" // design-tokens-allow
						}`}
					>
						{/* DYNAMIC REPEATING DRM WATERMARK GRID ACROSS THE READING CANVAS - REFINED: SUBTLE & ELEGANT */}
						<div
							key="drm-watermark-overlay"
							className={`pointer-events-none absolute inset-0 z-10 overflow-hidden select-none flex flex-wrap items-center justify-around gap-28 p-12 ${
								isSepia ? "opacity-[0.045] text-[#5c4033]" : "opacity-[0.04] text-slate-800" // design-tokens-allow
							}`}
						>
							{Array.from({ length: 4 }).map((_, idx) => (
								<div
									key={`drm-watermark-row-${idx}`}
									className="rotate-[-20deg] font-mono text-[9px] font-normal whitespace-nowrap tracking-widest"
								>
									{userProfile.name} • #{userProfile.id} • {userProfile.license}
								</div>
							))}
						</div>

						{/* EPUB VIEWER DIV (Isolated unmanaged container for ePub.js engine) */}
						<div
							id="viewer"
							key="epub-canvas-isolated-viewer"
							ref={viewerRef}
							onDragStart={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
							suppressHydrationWarning
							className={`relative z-0 h-full w-full ${
								layoutMode === "scroll" ? "min-h-full overflow-y-visible" : "overflow-hidden"
							}`}
						/>

						{/* HARD TRIAL LOCK SCREEN: Blocks reading completely when 15 pages are reached */}
						{isTrial && isTrialLocked && (
							<div
								key="drm-trial-lock-overlay"
								className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md p-6 text-center select-none animate-in fade-in duration-200"
							>
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 shadow-md border border-primary/20">
									<Lock className="h-7 w-7" />
								</div>
								<Badge variant="outline-solid" className="mb-2 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
									Đã xem đủ 15 trang đọc thử
								</Badge>
								<h3 className="font-bold text-lg text-foreground tracking-tight">
									Nội Dung Phía Sau Đã Được Khóa Bản Quyền
								</h3>
								<p className="mt-1 font-medium text-xs text-primary truncate max-w-sm">
									{bookTitle}
								</p>
								<p className="mt-2.5 max-w-md text-xs text-muted-foreground leading-relaxed">
									Bạn đã trải nghiệm hết 15 trang đọc thử miễn phí (sách có tổng số {totalPages} trang). Để đọc tiếp các chương tiếp theo và mở khóa toàn bộ quyền lợi, vui lòng đặt mua tác phẩm.
								</p>
								<div className="mt-5 flex items-center gap-3">
									<LinkWithChannel
										href={`/products/${bookSlug}`}
										className="flex items-center gap-1.5 rounded-button bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-transform"
									>
										<span>Đặt mua sách ngay</span>
										<span>→</span>
									</LinkWithChannel>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleRestartTrial}
										className="text-xs"
									>
										Đọc lại 15 trang đầu
									</Button>
								</div>
							</div>
						)}

						{/* FLOATING TEXT SELECTION ACTION BAR - ANCHORED NEAR USER'S CURSOR SELECTION */}
						{selectedText && (
							<div
								key="drm-floating-selection-bar"
								className={`absolute z-40 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full border px-2.5 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 transition-all select-none overflow-x-auto no-scrollbar ${
									isSepia ? "bg-[#fbf0d9]/95 border-[#d8cbb0] text-[#433422]" : "bg-card/95 border-border text-foreground" // design-tokens-allow
								}`}
								style={
									selectionCoords
										? {
												left: `${selectionCoords.x}px`,
												top: `${selectionCoords.y}px`,
												transform: selectionCoords.isBelow ? "translate(-50%, 0%)" : "translate(-50%, -100%)",
											}
										: {
												bottom: "1.5rem",
												left: "50%",
												transform: "translateX(-50%)",
											}
								}
							>
								{/* Small pointer caret */}
								{selectionCoords && (
									<div
										className={`pointer-events-none absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border ${
											selectionCoords.isBelow
												? "-top-1.5 border-l border-t"
												: "-bottom-1.5 border-r border-b"
										} ${
											isSepia ? "bg-[#fbf0d9] border-[#d8cbb0]" : "bg-card border-border" // design-tokens-allow
										}`}
									/>
								)}

								<span
									className="hidden md:inline-block max-w-[90px] truncate text-[11px] font-medium italic opacity-75 font-serif border-r border-border/40 pr-2 shrink-0"
									style={{ fontFamily: "'Literata', 'Merriweather', 'Lora', Georgia, serif" }}
									title={selectedText}
								>
									"{selectedText}"
								</span>

								<Button
									variant="default"
									size="sm"
									onClick={() => {
										const txt = selectedText;
										startReadingFromSelection(txt);
									}}
									className="h-7 text-xs gap-1 rounded-full px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-xs shrink-0 whitespace-nowrap"
									title="Đọc tiếp liên tục từ đoạn văn bản bạn vừa bôi chọn cho đến hết sách"
								>
									<LocateFixed className="h-3 w-3" />
									<span>Đọc tiếp từ đây</span>
								</Button>

								<Button
									variant="secondary"
									size="sm"
									onClick={handleHighlightSelected}
									className="h-7 text-xs gap-1 rounded-full px-2.5 shrink-0 whitespace-nowrap"
									title="Tô màu Highlight đoạn này"
								>
									<Highlighter className="h-3 w-3 text-amber-500" />
									<span>Highlight</span>
								</Button>

								<Button
									variant="secondary"
									size="sm"
									onClick={handleSaveQuote}
									className="h-7 text-xs gap-1 rounded-full px-2.5 shrink-0 whitespace-nowrap"
									title="Lưu vào sổ tay trích dẫn"
								>
									<Quote className="h-3 w-3 text-primary" />
									<span>Lưu trích dẫn</span>
								</Button>

								<Button
									variant="default"
									size="sm"
									onClick={handleAskAIAboutSelection}
									className="h-7 text-xs gap-1 rounded-full px-2.5 shrink-0 whitespace-nowrap"
									title="Hỏi AI diễn giải ý nghĩa"
								>
									<Bot className="h-3 w-3" />
									<span>Hỏi AI</span>
								</Button>

								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setSelectedText("");
										setSelectionCoords(null);
									}}
									className="h-6 w-6 rounded-full opacity-60 hover:opacity-100 shrink-0"
									title="Đóng thanh công cụ"
								>
									<X className="h-3.5 w-3.5" />
								</Button>
							</div>
						)}
					</div>

					{/* Floating Prev/Next Buttons (Available in all reading modes) */}
					<Button
						variant="secondary"
						size="icon"
						onClick={prevPage}
						aria-label={layoutMode === "scroll" ? "Cuộn lên / Về phần trước" : "Trang trước"}
						className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 ${
							isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]/85 text-[#433422]" : "border-border bg-background/80" // design-tokens-allow
						}`}
						title={layoutMode === "scroll" ? "Cuộn lên / Về phần trước" : "Trang trước"}
					>
						<ChevronLeft className="h-5 w-5" />
					</Button>

					<Button
						variant="secondary"
						size="icon"
						onClick={nextPage}
						aria-label={layoutMode === "scroll" ? "Cuộn tiếp / Sang phần sau" : "Trang sau"}
						className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 ${
							isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]/85 text-[#433422]" : "border-border bg-background/80" // design-tokens-allow
						}`}
						title={layoutMode === "scroll" ? "Cuộn tiếp / Sang phần sau" : "Trang sau"}
					>
						<ChevronRight className="h-5 w-5" />
					</Button>
				</main>

				{/* RIGHT COLLAPSIBLE SIDEBAR: AI READING COMPANION & SAVED QUOTES - FIXED OVERLAY DRAWER */}
				{isAiOpen && (
					<aside className={`fixed top-14 right-0 bottom-11 z-40 flex w-[390px] max-w-[90vw] flex-col border-l shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-200 transition-colors ${sidebarBg}`}>
						{/* Header */}
						<div className={`flex items-center justify-between border-b px-4 py-3 ${sidebarSubHeaderBg}`}>
							<div className="flex items-center gap-2">
								<div className="flex h-6 w-6 items-center justify-center rounded-button bg-primary text-primary-foreground shadow-2xs">
									<Bot className="h-3.5 w-3.5" />
								</div>
								<div>
									<div className="flex items-center gap-1.5 font-semibold text-xs">
										<span>Trợ Lý & Sổ Tay AuraBook</span>
									</div>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsAiOpen(false)}
								className="h-7 w-7 rounded-button hover:bg-black/5"
								title="Thu nhỏ trợ lý AI"
							>
								<PanelRightClose className="h-4 w-4" />
							</Button>
						</div>

						{/* TAB SWITCHER: Hỏi đáp AI vs Trích dẫn đã lưu */}
						<div className={`grid grid-cols-2 border-b p-1 gap-1 ${
							isSepia ? "border-[#d8cbb0] bg-[#ede2cd]" : "border-border bg-muted/20" // design-tokens-allow
						}`}>
							<button
								onClick={() => setAiTab("chat")}
								className={`flex items-center justify-center gap-1.5 py-1.5 rounded-button text-xs font-medium transition-all ${
									aiTab === "chat"
										? isSepia
											? "bg-[#fbf0d9] text-[#433422] shadow-xs font-semibold" // design-tokens-allow
											: "bg-card text-foreground shadow-xs font-semibold"
										: "opacity-70 hover:opacity-100"
								}`}
							>
								<Bot className="h-3.5 w-3.5 text-primary" />
								<span>Hỏi đáp AI</span>
							</button>

							<button
								onClick={() => setAiTab("quotes")}
								className={`flex items-center justify-center gap-1.5 py-1.5 rounded-button text-xs font-medium transition-all ${
									aiTab === "quotes"
										? isSepia
											? "bg-[#fbf0d9] text-[#433422] shadow-xs font-semibold" // design-tokens-allow
											: "bg-card text-foreground shadow-xs font-semibold"
										: "opacity-70 hover:opacity-100"
								}`}
							>
								<Quote className="h-3.5 w-3.5 text-primary" />
								<span>Trích dẫn</span>
								{savedQuotes.length > 0 && (
									<Badge variant="outline-solid" className={`text-[10px] py-0 px-1.5 font-mono ${
										isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]" : "" // design-tokens-allow
									}`}>
										{savedQuotes.length}
									</Badge>
								)}
							</button>
						</div>

						{/* AI Speed Mode Bar */}
						{aiTab === "chat" && (
							<div className={`flex items-center justify-between px-3.5 py-1.5 text-[11px] border-b ${
								isSepia ? "border-[#d8cbb0] bg-[#fbf0d9]/60 text-[#433422]" : "border-border/60 bg-muted/15 text-muted-foreground"
							}`}>
								<span className="flex items-center gap-1 font-medium">
									<Zap className="h-3 w-3 text-amber-500 fill-amber-500/20" /> Chế độ phản hồi:
								</span>
								<div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-border/40">
									<button
										type="button"
										onClick={() => setAiSpeedMode("fast")}
										className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
											aiSpeedMode === "fast"
												? "bg-primary text-primary-foreground shadow-2xs"
												: "hover:text-foreground opacity-75"
										}`}
										title="Tốc độ siêu nhanh 1-2s (Gemma 2 2B)"
									>
										⚡ Siêu tốc
									</button>
									<button
										type="button"
										onClick={() => setAiSpeedMode("deep")}
										className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
											aiSpeedMode === "deep"
												? "bg-primary text-primary-foreground shadow-2xs"
												: "hover:text-foreground opacity-75"
										}`}
										title="Phân tích văn học chuyên sâu (Gemma 3 4B)"
									>
										🧠 Chuyên sâu
									</button>
								</div>
							</div>
						)}

						{/* TAB 1: AI DIALOGUE CHAT STREAM */}
						{aiTab === "chat" && (
							<>
								<div className={`flex-1 overflow-y-auto p-3.5 space-y-3.5 text-sm ${
									isSepia ? "bg-[#f4ebd0]/40" : "bg-muted/10" // design-tokens-allow
								}`}>
									{aiMessages.map((msg) => (
										<div
											key={msg.id}
											className={`flex flex-col max-w-[92%] p-3 leading-relaxed rounded-xl shadow-xs ${
												msg.sender === "user"
													? isSepia
														? "self-end bg-[#8b5a00] text-white rounded-br-xs" // design-tokens-allow
														: "self-end bg-primary text-primary-foreground rounded-br-xs"
													: `${cardItemBg} self-start rounded-bl-xs border border-inherit`
											}`}
										>
											{msg.highlightQuote && (
												<div
													className="mb-2 rounded-md border-l-2 border-primary/60 bg-black/5 dark:bg-white/5 p-2 text-xs italic font-serif leading-relaxed"
													style={{ fontFamily: "'Literata', 'Merriweather', 'Lora', Georgia, serif" }}
												>
													"{msg.highlightQuote}"
												</div>
											)}
											<div className="flex items-center justify-between gap-3 text-[11px] opacity-75 mb-1">
												<span className="font-semibold">{msg.sender === "user" ? "Bạn" : "AuraBook AI"}</span>
												<span className="tabular-nums">{msg.timestamp}</span>
											</div>
											{msg.sender === "ai" ? (
												<ReaderMarkdown content={msg.text} isSepia={isSepia} />
											) : (
												<div className="whitespace-pre-wrap text-[14px] leading-relaxed">
													{msg.text}
												</div>
											)}
										</div>
									))}
									{isAiThinking && (
										<div className={`self-start flex items-center gap-2.5 text-xs p-3 rounded-xl border border-inherit shadow-xs ${cardItemBg}`}>
											<Loader size="sm" />
											<span className="animate-pulse font-medium">Trợ lý AI đang tra cứu GraphRAG & phân tích tác phẩm...</span>
										</div>
									)}
									<div ref={aiMessagesEndRef} />
								</div>

								{/* Quick Reading Discussion Prompts */}
								<div className={`border-t p-2.5 ${
									isSepia ? "border-[#d8cbb0] bg-[#ede2cd]" : "border-border bg-muted/20" // design-tokens-allow
								}`}>
									<div className="mb-1.5 text-[11px] font-semibold opacity-85 flex items-center gap-1">
										<Bot className="h-3 w-3 text-primary" />
										<span>Phân tích & Thảo luận tác phẩm:</span>
									</div>
									<div className="flex flex-wrap gap-1.5">
										<button
											onClick={() => handleSendAIMessage("Hãy diễn giải bối cảnh lịch sử và tầng nghĩa nguyên bản của phần sách này.")}
											className={`rounded-button border px-2 py-1 text-xs text-left transition-colors ${
												isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] hover:bg-[#f4ebd0]" : "bg-card border-border hover:bg-muted" // design-tokens-allow
											}`}
										>
											📖 Bối cảnh & Ý nghĩa
										</button>
										<button
											onClick={() => handleSendAIMessage("Phân tích tầng nghĩa triết lý và động cơ tâm lý học trong đoạn này.")}
											className={`rounded-button border px-2 py-1 text-xs text-left transition-colors ${
												isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] hover:bg-[#f4ebd0]" : "bg-card border-border hover:bg-muted" // design-tokens-allow
											}`}
										>
											💡 Triết lý & Tâm lý học
										</button>
										<button
											onClick={() => handleSendAIMessage("Đoạn trích này có thể ứng dụng vào giao tiếp và đời sống thực tế hiện nay như thế nào?")}
											className={`rounded-button border px-2 py-1 text-xs text-left transition-colors ${
												isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] hover:bg-[#f4ebd0]" : "bg-card border-border hover:bg-muted" // design-tokens-allow
											}`}
										>
											🌿 Ứng dụng thực tế
										</button>
										<button
											onClick={() => handleSendAIMessage("Hãy tóm tắt ngắn gọn các luận điểm đắt giá nhất của chương này.")}
											className={`rounded-button border px-2 py-1 text-xs text-left transition-colors ${
												isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] hover:bg-[#f4ebd0]" : "bg-card border-border hover:bg-muted" // design-tokens-allow
											}`}
										>
											🔍 Tóm tắt luận điểm
										</button>
									</div>
								</div>

								{/* Text Chat Input */}
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleSendAIMessage();
									}}
									className={`flex items-center gap-2 border-t p-3 ${
										isSepia ? "border-[#d8cbb0] bg-[#f7efe0]" : "border-border bg-card" // design-tokens-allow
									}`}
								>
									<Input
										type="text"
										placeholder="Hỏi AI phân tích, giải nghĩa tác phẩm..."
										value={aiInput}
										onChange={(e) => setAiInput(e.target.value)}
										className={`h-9 text-sm rounded-button transition-colors ${inputBg}`}
									/>
									<Button
										type="submit"
										variant="default"
										size="icon"
										disabled={!aiInput.trim() || isAiThinking}
										className="h-9 w-9 shrink-0 rounded-button"
										title="Gửi câu hỏi"
									>
										<Send className="h-4 w-4" />
									</Button>
								</form>
							</>
						)}
						{/* TAB 3: CHAT HISTORY */}
						{aiTab === "history" && (
							<div className={`flex-1 overflow-y-auto p-3 space-y-2.5 text-xs ${
								isSepia ? "bg-[#f4ebd0]/40" : "bg-muted/10" // design-tokens-allow
							}`}>
								{viewingSession ? (
									<>
										<div className={`flex items-center gap-2 p-2 rounded-button border mb-2 ${
											isSepia ? "bg-[#ede2cd] border-[#d8cbb0]" : "bg-muted border-border"
										}`}>
											<button
												onClick={() => setViewingSession(null)}
												className="flex items-center gap-1.5 text-[11px] font-medium hover:text-primary transition-colors"
											>
												<ChevronLeft className="h-3.5 w-3.5" />
												<span>Danh sách lịch sử</span>
											</button>
											<span className="opacity-50">•</span>
											<span className="text-[11px] opacity-75 truncate">{viewingSession.title}</span>
										</div>
										<div className="space-y-2.5">
											{viewingSession.messages.filter((m: AIMessage) => m.text).map((msg: AIMessage, idx: number) => (
												<div
													key={`hist-msg-${msg.id || idx}`}
													className={`flex flex-col p-3 rounded-xl shadow-xs text-xs ${
														msg.sender === "user"
															? isSepia
																? "bg-[#8b5a00] text-white ml-4 rounded-br-xs" // design-tokens-allow
																: "bg-primary text-primary-foreground ml-4 rounded-br-xs"
															: `${cardItemBg} mr-4 rounded-bl-xs border border-inherit`
													}`}
												>
													<div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-1">
														<span className="font-semibold">{msg.sender === "user" ? "Bạn" : "AuraBook AI"}</span>
														<span className="tabular-nums">{msg.timestamp}</span>
													</div>
													{msg.sender === "ai" ? (
														<ReaderMarkdown content={msg.text} isSepia={isSepia} />
													) : (
														<div className="whitespace-pre-wrap leading-relaxed">
															{msg.text}
														</div>
													)}
												</div>
											))}
										</div>
										<div className="pt-2 pb-1">
											<button
												onClick={() => {
													setAiMessages([...viewingSession.messages]);
													setViewingSession(null);
													setAiTab("chat");
												}}
												className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-button border text-xs font-medium transition-colors ${
													isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] hover:bg-[#ede2cd]" : "bg-card border-border hover:bg-muted"
												}`}
											>
												<RotateCw className="h-3.5 w-3.5" />
												<span>Tiếp tục cuộc hội thoại này</span>
											</button>
										</div>
									</>
								) : chatSessions.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-8 text-center opacity-70">
										<div className={`flex h-12 w-12 items-center justify-center rounded-full border mb-3 text-primary ${
											isSepia ? "bg-[#ede2cd] border-[#d8cbb0]" : "bg-muted border-border" // design-tokens-allow
										}`}>
											<FileText className="h-5 w-5" />
										</div>
										<h4 className="font-semibold text-xs">Chưa có lịch sử hội thoại</h4>
										<p className="mt-1 text-[11px] leading-relaxed max-w-[220px]">
											Các cuộc hội thoại sẽ được lưu lại khi bạn nhấn <strong>"Hội thoại mới"</strong>.
										</p>
									</div>
								) : (
									<>
										<div className="text-[11px] font-semibold opacity-75 px-1 py-0.5">
											{chatSessions.length} cuộc hội thoại đã lưu
										</div>
										{chatSessions.map((session: ChatSession) => {
											const msgCount = session.messages.filter((m: AIMessage) => m.sender !== "ai" || m.id !== "welcome-ai").length;
											return (
												<div
													key={session.id}
													className={`flex flex-col gap-1.5 rounded-card border p-3 shadow-xs cursor-pointer transition-all ${cardItemBg} ${
														isSepia ? "hover:border-[#b8860b]" : "hover:border-primary/50"
													}`}
													onClick={() => setViewingSession(session)}
												>
													<div className="flex items-start justify-between gap-2">
														<p className="text-xs font-medium leading-relaxed line-clamp-2 flex-1">
															{session.title}
														</p>
														<ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 mt-0.5" />
													</div>
													<div className={`flex items-center gap-2 text-[10px] ${
														isSepia ? "opacity-70" : "text-muted-foreground"
													}`}>
														<span className="font-mono">{session.createdAt}</span>
														<span>•</span>
														<span>{msgCount} tin nhắn</span>
													</div>
													<div className="flex items-center gap-1.5 mt-0.5">
														<button
															onClick={(e) => {
																e.stopPropagation();
																setAiMessages([...session.messages]);
																setAiTab("chat");
															}}
															className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-1 rounded-button border transition-colors ${
																isSepia
																	? "border-[#b8860b]/40 text-[#8b5a00] hover:bg-[#ede2cd]" // design-tokens-allow
																	: "border-primary/20 text-primary hover:bg-primary/10"
															}`}
														>
															<RotateCw className="h-3 w-3" />
															<span>Tiếp tục</span>
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																const updated = chatSessions.filter((s: ChatSession) => s.id !== session.id);
																setChatSessions(updated);
																try { localStorage.setItem(chatSessionsStorageKey, JSON.stringify(updated)); } catch (_) {}
															}}
															className="flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 hover:text-destructive px-1.5 py-1 rounded-button transition-colors"
														>
															<Trash2 className="h-3 w-3" />
															<span>Xóa</span>
														</button>
													</div>
												</div>
											);
										})}
									</>
								)}
							</div>
						)}

						{/* TAB 2: SAVED QUOTES LIST */}
						{aiTab === "quotes" && (
							<div className={`flex-1 overflow-y-auto p-3 space-y-3 text-xs ${
								isSepia ? "bg-[#f4ebd0]/40" : "bg-muted/10" // design-tokens-allow
							}`}>
								{savedQuotes.length === 0 ? (
									<div className="flex flex-col items-center justify-center p-8 text-center opacity-70 my-auto">
										<div className={`flex h-12 w-12 items-center justify-center rounded-full border mb-3 text-primary ${
											isSepia ? "bg-[#ede2cd] border-[#d8cbb0]" : "bg-muted border-border" // design-tokens-allow
										}`}>
											<Quote className="h-5 w-5" />
										</div>
										<h4 className="font-semibold text-xs">Chưa có trích dẫn nào</h4>
										<p className="mt-1 text-[11px] leading-relaxed max-w-[220px]">
											Bôi đen bất kỳ đoạn văn bản nào trong sách và chọn <strong>"Lưu trích dẫn"</strong> để lưu trữ tại đây.
										</p>
									</div>
								) : (
									savedQuotes.map((q) => (
										<div
											key={q.id}
											className={`flex flex-col gap-2 rounded-card border p-3 shadow-xs transition-colors ${cardItemBg} ${
												isSepia ? "hover:border-[#b8860b]" : "hover:border-primary/50" // design-tokens-allow
											}`}
										>
											<div className="flex items-start gap-2">
												<Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
												<p
													className="text-xs italic font-serif leading-relaxed"
													style={{ fontFamily: "'Literata', 'Merriweather', 'Lora', Georgia, serif" }}
												>
													"{q.text}"
												</p>
											</div>

											<div className={`flex items-center justify-between border-t pt-2 text-[10px] ${
												isSepia ? "border-[#d8cbb0]/60 opacity-80" : "border-border/60 text-muted-foreground" // design-tokens-allow
											}`}>
												<span className="font-mono">{q.createdAt}</span>

												<div className="flex items-center gap-1.5">
													{q.cfi && (
														<button
															onClick={() => handleJumpToQuote(q.cfi, q.text)}
															className={`flex items-center gap-1 transition-colors font-medium px-2 py-1 rounded-button border ${
																isSepia
																	? "border-[#b8860b]/40 text-[#8b5a00] hover:bg-[#ede2cd]" // design-tokens-allow
																	: "border-primary/20 text-primary hover:bg-primary/10"
															}`}
															title="Đi tới vị trí và làm phát sáng nhẹ trích dẫn trên sách"
														>
															<ExternalLink className="h-3 w-3" />
															<span>Đến vị trí</span>
														</button>
													)}

													<button
														onClick={() => handleAskAIAboutQuote(q.text)}
														className="flex items-center gap-1 opacity-80 hover:opacity-100 font-medium px-1.5 py-1 rounded-button hover:bg-black/5"
														title="Gửi đoạn trích dẫn này để AI diễn giải"
													>
														<Bot className="h-3 w-3 text-primary" />
														<span>Hỏi AI</span>
													</button>

													<button
														onClick={() => handleDeleteQuote(q.id)}
														className="opacity-70 hover:opacity-100 hover:text-destructive transition-colors p-1 rounded-button"
														title="Xóa trích dẫn"
													>
														<Trash2 className="h-3 w-3" />
													</button>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						)}
					</aside>
				)}
			</div>

			{/* 8. BOTTOM STATUS BAR WITH REAL USER LICENSING - SYNCED IN SEPIA */}
			<footer className={`z-20 flex h-11 items-center justify-between border-t px-4 md:px-6 text-xs backdrop-blur-md transition-colors ${footerBg}`}>
				<div className="flex items-center gap-2">
					<Lock className="h-3.5 w-3.5 text-success" />
					<span className="hidden sm:inline">Bảo vệ bản quyền số:</span>
					<span className="font-medium">
						Readium LCP ({userProfile.license})
					</span>
					<span className="hidden md:inline text-[11px] opacity-75">
						• Cấp riêng: {userProfile.name} ({userProfile.email})
					</span>
				</div>

				<div className="flex items-center gap-4">
					<span className="tabular-nums font-mono font-medium max-w-[280px] sm:max-w-md truncate" title={tocList.find(c => (c.href && activeChapterHref.includes(c.href)) || c.id === activeChapterHref)?.label || ""}>
						{isTrial ? (
							`Đọc thử: Đã xem ${viewedCount}/15 trang (${readPercentage}%)`
						) : (() => {
							const idx = tocList.findIndex(c => (c.href && activeChapterHref.includes(c.href)) || (c.href && activeChapterHref && c.href.includes(activeChapterHref)) || c.id === activeChapterHref);
							if (idx >= 0 && tocList[idx]?.label) {
								return `Chương ${idx + 1}/${tocList.length}: ${tocList[idx].label} (${readPercentage}%)`;
							}
							return `Tiến độ đọc: ${readPercentage}%`;
						})()}
					</span>
					<div className={`w-28 h-1.5 rounded-full overflow-hidden ${isSepia ? "bg-[#ede2cd]" : "bg-muted"}`}>
						<div
							className={`h-full transition-all duration-300 ${isSepia ? "bg-[#8b5a00]" : "bg-primary"}`}
							style={{
								width: `${readPercentage}%`,
							}}
						/>
					</div>
				</div>

				<div className="flex items-center gap-1.5 text-[11px]">
					<Bookmark className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">Tiến độ lưu tự động</span>
				</div>
			</footer>

			{/* TRIAL PAYWALL MODAL */}
			{isPaywallOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
					<div
						className={`relative w-full max-w-md rounded-card border p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 ${
							isSepia ? "bg-[#fbf0d9] border-[#d8cbb0] text-[#433422]" : "bg-card border-border text-card-foreground"
						}`}
					>
						<button
							onClick={() => setIsPaywallOpen(false)}
							className="absolute top-4 right-4 rounded-button p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
							title="Đóng"
						>
							<X className="h-4 w-4" />
						</button>

						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 shadow-xs">
							<Lock className="h-7 w-7" />
						</div>

						<Badge
							variant="outline-solid"
							className="mb-2 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
						>
							Giới hạn đọc thử 15 trang đầu
						</Badge>

						<h3 className="font-bold text-lg tracking-tight">
							Bạn đã hoàn thành 15 trang đọc thử!
						</h3>
						<p className="mt-1 font-medium text-xs text-primary truncate max-w-sm mx-auto">
							{bookTitle}
						</p>

						<p className="mt-3 text-xs opacity-80 leading-relaxed text-muted-foreground">
							Quyền lợi đọc thử miễn phí áp dụng cho 15 trang liên tiếp đầu tiên. Để tiếp tục đọc toàn bộ các chương tiếp theo, mở khóa Trợ lý AI và đồng bộ ghi chú, hãy sở hữu ngay ấn phẩm này.
						</p>

						<div className="mt-6 flex flex-col gap-2.5">
							<LinkWithChannel
								href={`/products/${bookSlug}`}
								className="flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-95"
							>
								<span>Đặt mua sách ngay</span>
								<span>→</span>
							</LinkWithChannel>
							<button
								type="button"
								onClick={() => setIsPaywallOpen(false)}
								className="rounded-button border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
							>
								Quay lại đọc lại 15 trang đầu
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
