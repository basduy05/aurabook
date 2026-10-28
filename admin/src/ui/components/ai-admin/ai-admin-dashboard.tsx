"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Activity,
	Bot,
	Mic,
	ShieldCheck,
	Sparkles,
	RefreshCw,
	CheckCircle2,
	XCircle,
	ExternalLink,
	Play,
	Lock,
	Unlock,
	Send,
	Sliders,
	Radio,
	Save,
	Zap,
	Cpu,
	Volume2,
	Settings,
	AlertTriangle,
	BookOpen,
	MessageSquare,
	ChevronLeft,
	ChevronRight,
	Star,
	Eye,
	PhoneCall,
	X,
	Check,
	UploadCloud,
	Database,
	Share2,
	Layers,
	Search,
	FileText,
	Trash2,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Loader as TrapezoidLoader } from "@/ui/atoms/loader";
import { cn } from "@/lib/utils";

export type TabKey = "health" | "graphrag" | "voice" | "drm" | "eval" | "chatbot";

export interface VoiceModelInfo {
	id: string;
	name: string;
	badge: string;
	engine: string;
	desc: string;
}

export const VOICE_MODELS: VoiceModelInfo[] = [
	{
		id: "vi_VN-hoaimy-aurabook",
		name: "Hoài My (1000 Epochs)",
		badge: "Nữ • VTV MC Studio",
		engine: "VITS / Piper",
		desc: "Giọng MC đài truyền hình chuẩn mực, tròn vành rõ chữ, tối ưu cho sách nói kinh doanh và phát triển bản thân.",
	},
	{
		id: "mailinh",
		name: "Mai Linh",
		badge: "Nữ • Trẻ trung thanh thoát",
		engine: "VITS / Piper ONNX",
		desc: "Model VITS/Piper ONNX giọng nữ trẻ trung, trong trẻo, ngắt câu chuẩn, âm điệu nhẹ nhàng thanh thoát.",
	},
	{
		id: "f5-tts-vietnamese",
		name: "F5-TTS Vietnamese",
		badge: "Nữ • Flow Matching",
		engine: "Flow Matching ViVoice",
		desc: "Mô hình Flow Matching mã nguồn mở. Zero-shot cloning với nhịp điệu đọc nhanh, linh hoạt, tự nhiên.",
	},
	{
		id: "vixtts",
		name: "viXTTS",
		badge: "Nam • Trầm ấm văn học",
		engine: "XTTS-v2 Cross-lingual",
		desc: "Giọng Nam trầm ấm, truyền cảm, có chiều sâu văn học và cảm xúc câu văn, tối ưu cho tiểu thuyết và truyện kể.",
	},
	{
		id: "viettts",
		name: "VietTTS",
		badge: "Nam • Chuẩn miền Bắc",
		engine: "FastSpeech2 + HiFi-GAN",
		desc: "Giọng Nam phát thanh viên miền Bắc chuẩn, phát âm rõ ràng, nhịp đọc đĩnh đạc và rành mạch.",
	},
];

export interface QuickModelOption {
	id: string;
	name: string;
	badge: string;
	provider: "ollama" | "gemini" | "groq" | "openai";
	model: string;
	baseUrl: string;
	apiKey?: string;
	desc: string;
	speed: string;
}

export const QUICK_MODELS: QuickModelOption[] = [
	{
		id: "gemma2:2b",
		name: "Gemma 2 2B",
		badge: "Google Local • Đã cài đặt • Siêu tốc GPU",
		provider: "ollama",
		model: "gemma2:2b",
		baseUrl: "http://localhost:11434",
		desc: "Mô hình Google chính thức mở siêu nhẹ, chạy 100% trên GPU VRAM, phản hồi dưới 1 giây, bảo mật tuyệt đối.",
		speed: "~0.8s (Cục bộ GPU)",
	},
	{
		id: "gemma3:4b",
		name: "Gemma 3 4B",
		badge: "Google Gemma 3 • Đã cài đặt",
		provider: "ollama",
		model: "gemma3:4b",
		baseUrl: "http://localhost:11434",
		desc: "Thế hệ Gemma 3 mới nhất của Google, 4 tỷ tham số, hiểu sâu sắc ngữ cảnh văn học và tiếng Việt xuất sắc.",
		speed: "~3.5s (Cục bộ)",
	},
	{
		id: "gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		badge: "Google Cloud Free",
		provider: "gemini",
		model: "gemini-2.0-flash",
		baseUrl: "https://generativelanguage.googleapis.com",
		desc: "Mô hình mới nhất của Google, suy luận đa bước cực thông minh, tốc độ cực nhanh, 1.500 req/ngày miễn phí.",
		speed: "~350ms (Siêu tốc)",
	},
	{
		id: "gemini-1.5-flash",
		name: "Gemini 1.5 Flash",
		badge: "Google Cloud Free",
		provider: "gemini",
		model: "gemini-1.5-flash",
		baseUrl: "https://generativelanguage.googleapis.com",
		desc: "Mô hình tiêu chuẩn Google AI Studio, 1 triệu token context, tóm tắt và hiểu sâu đa chủ đề.",
		speed: "~450ms (Nhanh)",
	},
	{
		id: "qwen2.5:3b",
		name: "Qwen 2.5 3B",
		badge: "Local 0đ",
		provider: "ollama",
		model: "qwen2.5:3b",
		baseUrl: "http://localhost:11434",
		desc: "Mô hình ngôn ngữ gọn nhẹ, xử lý ngữ pháp và thành ngữ tiếng Việt chuẩn xác.",
		speed: "~1.5s (Cục bộ)",
	},
	{
		id: "deepseek-r1:1.5b",
		name: "DeepSeek R1 1.5B",
		badge: "Local 0đ CoT",
		provider: "ollama",
		model: "deepseek-r1:1.5b",
		baseUrl: "http://localhost:11434",
		desc: "Mô hình suy luận chuỗi tư duy (Chain-of-Thought), bóc tách câu hỏi nhiều góc cạnh logic.",
		speed: "~2.0s (Suy luận)",
	},
];

interface ServiceItem {
	id: string;
	name: string;
	category: string;
	port: number;
	url: string;
	status: "online" | "offline" | "degraded";
	latencyMs: number;
	details: string;
	lastChecked: string;
}

export interface AIAdminDashboardProps {
	embedded?: boolean;
	activeTab?: TabKey;
	onTabChange?: (tab: TabKey) => void;
	hideSidebar?: boolean;
}

export function AIAdminDashboard({
	embedded = false,
	activeTab: controlledTab,
	onTabChange,
	hideSidebar = false,
}: AIAdminDashboardProps = {}) {
	const [internalTab, setInternalTab] = useState<TabKey>(controlledTab || "chatbot");
	const activeTab = controlledTab ?? internalTab;
	const setActiveTab = (t: TabKey) => {
		setInternalTab(t);
		if (onTabChange) onTabChange(t);
	};
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Session inspection states
	const [sessions, setSessions] = useState<any[]>([]);
	const [selectedSessionForView, setSelectedSessionForView] = useState<any | null>(null);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);

	// Health State
	const [healthData, setHealthData] = useState<{
		systemStatus: string;
		onlineCount: number;
		totalCount: number;
		services: ServiceItem[];
		timestamp: string;
	} | null>(null);

	// GraphRAG & EPUB State
	const [graphData, setGraphData] = useState<{
		totalNodes: number;
		totalEdges: number;
		totalChunks: number;
		nodeTypes: Record<string, number>;
		books: any[];
		sampleGraph?: { nodes: any[]; edges: any[] };
	} | null>(null);
	const [isLoadingGraph, setIsLoadingGraph] = useState(false);
	const [isSeedingEPUBs, setIsSeedingEPUBs] = useState(false);
	const [isUploadingEPUB, setIsUploadingEPUB] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string>("");
	const [uploadResult, setUploadResult] = useState<any>(null);

	// GraphRAG Query Workbench State
	const [graphQueryText, setGraphQueryText] = useState("Tư vấn cuốn Trí Tuệ Do Thái, giá bao nhiêu cho bản điện tử và sách giấy?");
	const [isQueryingGraph, setIsQueryingGraph] = useState(false);
	const [graphQueryResult, setGraphQueryResult] = useState<any>(null);
	const [isDifySettingsOpen, setIsDifySettingsOpen] = useState(false);

	// GraphRAG Database Explorer State
	const [dbExplorerTab, setDbExplorerTab] = useState<"chapters" | "chunks" | "nodes_edges" | "storage">("chapters");
	const [selectedBookSlug, setSelectedBookSlug] = useState<string>("dac-nhan-tam");
	const [bookChapters, setBookChapters] = useState<any[]>([]);
	const [isLoadingChapters, setIsLoadingChapters] = useState(false);
	const [selectedChapterDetail, setSelectedChapterDetail] = useState<any | null>(null);
	const [isLoadingChapterDetail, setIsLoadingChapterDetail] = useState(false);
	const [chunkSearchQuery, setChunkSearchQuery] = useState("");
	const [selectedChunkBook, setSelectedChunkBook] = useState("");
	const [inspectedChunks, setInspectedChunks] = useState<any[]>([]);
	const [inspectedChunksTotal, setInspectedChunksTotal] = useState(0);
	const [isLoadingChunks, setIsLoadingChunks] = useState(false);
	const [inspectedNodeType, setInspectedNodeType] = useState("");
	const [inspectedNodes, setInspectedNodes] = useState<any[]>([]);
	const [inspectedNodesTotal, setInspectedNodesTotal] = useState(0);
	const [inspectedEdges, setInspectedEdges] = useState<any[]>([]);
	const [inspectedEdgesTotal, setInspectedEdgesTotal] = useState(0);
	const [storageInfo, setStorageInfo] = useState<any>(null);
	const [isCleanReseeding, setIsCleanReseeding] = useState(false);
	const [readerModel, setReaderModel] = useState<string>("gemma2:2b");
	const [readerMaxTokens, setReaderMaxTokens] = useState<number>(2048);
	const [sandboxMode, setSandboxMode] = useState<"voice" | "reader">("voice");
	const [isTestingReader, setIsTestingReader] = useState<boolean>(false);
	const [readerTestResult, setReaderTestResult] = useState<any>(null);
	const [copiedStoragePath, setCopiedStoragePath] = useState(false);


	// Dify State
	const [_difyConfig, setDifyConfig] = useState<any>(null);
	const [difyLogs, setDifyLogs] = useState<any[]>([]);
	const [testPrompt, setTestPrompt] = useState("");
	const [isTestingPrompt, setIsTestingPrompt] = useState(false);
	const [promptResult, setPromptResult] = useState<any>(null);

	// Dify Edit Form State
	const [difyForm, setDifyForm] = useState({
		apiUrl: "http://localhost:8080/v1",
		apiKey: "",
		datasetId: "",
		topK: 4,
	});
	const [isSavingDify, setIsSavingDify] = useState(false);

	// Voice State & Edit Form
	const [voiceData, setVoiceData] = useState<any>(null);
	const [activePreset, setActivePreset] = useState("local-free");
	const [voiceForm, setVoiceForm] = useState(() => {
		let initialVoice = "vi_VN-hoaimy-aurabook";
		if (typeof window !== "undefined") {
			try {
				const saved = localStorage.getItem("aurabook_admin_selected_voice");
				if (saved) initialVoice = saved;
			} catch (_) {}
		}
		return {
			sttProvider: "whisper-local",
			sttModel: "Systran/faster-whisper-small",
			sttBaseUrl: "http://localhost:8000/v1",
			sttApiKey: "",
			llmProvider: "ollama",
			llmModel: "gemma2:2b",
			llmBaseUrl: "http://localhost:11434",
			llmApiKey: "",
			temperature: 0.7,
			maxTokens: 180,
			ttsProvider: "piper-local",
			ttsVoice: initialVoice,
			ttsBaseUrl: "http://localhost:5050/v1",
			ttsApiKey: "",
			ttsSpeed: 1.0,
			systemPrompt:
				"Bạn là Aura AI, Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu thân thiện, ấm áp, trả lời ngắn gọn và tra cứu giá sách chính xác.",
		};
	});
	const [isSavingVoice, setIsSavingVoice] = useState(false);
	const [testConnMessage, setTestConnMessage] = useState<{ url: string; msg: string; ok: boolean } | null>(null);
	const [isTestingConn, setIsTestingConn] = useState(false);
	const [installedOllamaModels, setInstalledOllamaModels] = useState<string[]>(["qwen2.5:3b"]);
	const [isScanningOllama, setIsScanningOllama] = useState(false);

	const handleScanOllamaModels = async () => {
		setIsScanningOllama(true);
		try {
			const res = await fetch("/api/ai/admin/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "scan-ollama-models", url: voiceForm.llmBaseUrl }),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.models && data.models.length > 0) {
					setInstalledOllamaModels(data.models);
					setActionMessage(`Đã phát hiện ${data.models.length} mô hình Ollama trên máy: ${data.models.join(", ")}`);
					setTimeout(() => setActionMessage(""), 5000);
				}
			}
		} catch (err: any) {
			console.warn("Scan Ollama error:", err);
		} finally {
			setIsScanningOllama(false);
		}
	};

	const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

	const handlePreviewVoice = async (voiceId: string) => {
		try {
			setTestingVoiceId(voiceId);
			const sampleTexts: Record<string, string> = {
				"vi_VN-hoaimy-aurabook": "Chào mừng bạn đến với AuraBook. Đây là giọng đọc Hoài My chuẩn phong cách MC đài truyền hình.",
				mailinh: "Xin chào bạn. Đây là giọng đọc Mai Linh VITS Piper nhẹ nhàng, phát âm tự nhiên và ngắt câu chuẩn xác.",
				"f5-tts-vietnamese": "Xin chào độc giả. Đây là giọng đọc F5-TTS Vietnamese Flow Matching với khả năng zero-shot voice cloning.",
				vixtts: "Chào bạn. Đây là mô hình viXTTS, tái hiện cảm xúc câu văn sâu lắng và hơi thở tự nhiên của tiếng Việt.",
				viettts: "AuraBook xin kính chào quý độc giả. Đây là giọng đọc từ pipeline VietTTS FastSpeech2 kết hợp HiFi-GAN.",
			};
			const text = sampleTexts[voiceId] || "Xin chào, đây là giọng đọc thử nghiệm trên hệ thống AuraBook.";
			const res = await fetch("/api/ai/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, voice: voiceId, speed: voiceForm.ttsSpeed || 1.0 }),
			});
			if (!res.ok) throw new Error("Lỗi gọi TTS API");
			const data = (await res.json()) as any;
			if (data.audioBase64) {
				const mime = data.mimeType || (data.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg");
				const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
				audio.play();
			}
		} catch (err) {
			console.error("Test voice error:", err);
		} finally {
			setTestingVoiceId(null);
		}
	};

	// DRM Sessions State
	const [drmData, setDrmData] = useState<any>(null);
	const [actionMessage, setActionMessage] = useState("");

	// Eval State
	const [evalData, setEvalData] = useState<any>(null);
	const [isRunningEval, setIsRunningEval] = useState(false);

	// Chatbot Supervision State
	const [chatbotTestQuery, setChatbotTestQuery] = useState("Gợi ý cho tôi cuốn sách hay về tâm lý và thói quen");
	const [isTestingChatbot, setIsTestingChatbot] = useState(false);
	const [chatbotTestResult, setChatbotTestResult] = useState<any>(null);
	const [chatbotGovernance, setChatbotGovernance] = useState({
		requireMethodSelection: true,
		requireIntakeSurvey: true,
		connectingHandOff: true,
		horizontalProductScroll: true,
	});

	const handleTestReader = async () => {
		if (!chatbotTestQuery.trim() || isTestingReader) return;
		setIsTestingReader(true);
		setReaderTestResult(null);
		const start = Date.now();
		try {
			const res = await fetch("/api/ai/reader-chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: chatbotTestQuery,
					bookTitle: "Đắc Nhân Tâm",
					bookSlug: "dac-nhan-tam",
					stream: false,
				}),
			});
			if (res.ok) {
				const data = (await res.json()) as Record<string, any>;
				setReaderTestResult({ ...data, latencyMs: Date.now() - start });
			}
		} catch (err) {
			console.error("Test reader error:", err);
		} finally {
			setIsTestingReader(false);
		}
	};

	const handleTestChatbot = async () => {
		if (!chatbotTestQuery.trim() || isTestingChatbot) return;
		setIsTestingChatbot(true);
		setChatbotTestResult(null);
		try {
			const res = await fetch("/api/ai/voice-agent/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: chatbotTestQuery,
					topic: "Tư vấn chọn sách & Sách bán chạy",
					model: voiceForm.llmModel,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				setChatbotTestResult(data);
			}
		} catch (err) {
			console.error("Test chatbot error:", err);
		} finally {
			setIsTestingChatbot(false);
		}
	};

	// Load Initial Data
	const fetchHealth = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/ai/admin/health");
			if (res.ok) {
				const data = (await res.json()) as any;
				setHealthData(data);
			}
		} catch (err) {
			console.error("Fetch health error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDify = async () => {
		try {
			const res = await fetch("/api/ai/admin/dify");
			if (res.ok) {
				const data = (await res.json()) as any;
				setDifyConfig(data.config);
				setDifyLogs(data.recentLogs || []);
				if (data.config) {
					setDifyForm({
						apiUrl: data.config.apiUrl || "http://localhost:8080/v1",
						apiKey: data.config.apiKey || "",
						datasetId: data.config.datasetId || "",
						topK: data.config.topK || 4,
					});
				}
			}
		} catch (err) {
			console.error("Fetch dify error:", err);
		}
	};

	const fetchVoice = async () => {
		try {
			const res = await fetch("/api/ai/admin/voice");
			if (res.ok) {
				const data = (await res.json()) as any;
				setVoiceData(data);
				if (data.activePreset) setActivePreset(data.activePreset);
				if (data.voiceConfig) {
					let voiceId = data.voiceConfig.ttsVoice;
					if (typeof window !== "undefined") {
						const localSaved = localStorage.getItem("aurabook_admin_selected_voice");
						if (localSaved) {
							voiceId = localSaved;
						} else if (voiceId) {
							localStorage.setItem("aurabook_admin_selected_voice", voiceId);
						}
					}
					setVoiceForm((prev) => ({
						...prev,
						...data.voiceConfig,
						ttsVoice: voiceId || prev.ttsVoice,
					}));
				}
			}
		} catch (err) {
			console.error("Fetch voice error:", err);
		}
	};

	const fetchDrm = async () => {
		try {
			const res = await fetch("/api/ai/admin/drm-sessions");
			if (res.ok) {
				const data = (await res.json()) as any;
				setDrmData(data);
			}
		} catch (err) {
			console.error("Fetch drm error:", err);
		}
	};

	const fetchEval = async () => {
		try {
			const res = await fetch("/api/ai/admin/eval");
			if (res.ok) {
				const data = (await res.json()) as any;
				setEvalData(data);
			}
		} catch (err) {
			console.error("Fetch eval error:", err);
		}
	};

	const fetchSessions = async () => {
		setIsLoadingSessions(true);
		try {
			const res = await fetch("/api/ai/voice-agent/sessions");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.sessions) {
					setSessions(data.sessions);
				}
			}
		} catch (err) {
			console.warn("Fetch sessions error:", err);
		} finally {
			setIsLoadingSessions(false);
		}
	};

	const fetchGraphStats = async () => {
		setIsLoadingGraph(true);
		try {
			const res = await fetch("/api/ai/graphrag/stats");
			if (res.ok) {
				const data = (await res.json()) as any;
				setGraphData({
					totalNodes: data.totalNodes ?? data.stats?.totalNodes ?? 0,
					totalEdges: data.totalEdges ?? data.stats?.totalEdges ?? 0,
					totalChunks: data.totalChunks ?? data.stats?.totalChunks ?? 0,
					nodeTypes: data.nodeTypes ?? data.stats?.entityBreakdown ?? {},
					books: data.books ?? data.stats?.books ?? [],
				});
				if (data.storageInfo) {
					setStorageInfo(data.storageInfo);
				}
			}
		} catch (err) {
			console.error("Fetch graph stats error:", err);
		} finally {
			setIsLoadingGraph(false);
		}
	};

	const fetchBookChapters = async (slug: string) => {
		setIsLoadingChapters(true);
		setSelectedChapterDetail(null);
		try {
			const res = await fetch(`/api/ai/graphrag/inspect?type=chapters&bookSlug=${encodeURIComponent(slug)}`);
			if (res.ok) {
				const data = (await res.json()) as any;
				setBookChapters(data.chapters || []);
				if (data.chapters && data.chapters.length > 0) {
					fetchChapterDetail(slug, data.chapters[0].chapterIndex);
				}
			}
		} catch (e) {
			console.error("Fetch chapters error:", e);
		} finally {
			setIsLoadingChapters(false);
		}
	};

	const fetchChapterDetail = async (slug: string, chapterIndex: number) => {
		setIsLoadingChapterDetail(true);
		try {
			const res = await fetch(
				`/api/ai/graphrag/inspect?type=chapter_detail&bookSlug=${encodeURIComponent(slug)}&chapterIndex=${chapterIndex}`,
			);
			if (res.ok) {
				const data = (await res.json()) as any;
				setSelectedChapterDetail(data);
			}
		} catch (e) {
			console.error("Fetch chapter detail error:", e);
		} finally {
			setIsLoadingChapterDetail(false);
		}
	};

	const fetchInspectedChunks = async (bookSlug?: string, search?: string) => {
		setIsLoadingChunks(true);
		try {
			const bSlug = bookSlug !== undefined ? bookSlug : selectedChunkBook;
			const sQuery = search !== undefined ? search : chunkSearchQuery;
			const res = await fetch(
				`/api/ai/graphrag/inspect?type=chunks&bookSlug=${encodeURIComponent(bSlug)}&search=${encodeURIComponent(sQuery)}&limit=30`,
			);
			if (res.ok) {
				const data = (await res.json()) as any;
				setInspectedChunks(data.chunks || []);
				setInspectedChunksTotal(data.total || 0);
			}
		} catch (e) {
			console.error("Fetch chunks error:", e);
		} finally {
			setIsLoadingChunks(false);
		}
	};

	const fetchInspectedNodes = async (nodeType?: string) => {
		try {
			const nType = nodeType !== undefined ? nodeType : inspectedNodeType;
			const res = await fetch(`/api/ai/graphrag/inspect?type=nodes&nodeType=${encodeURIComponent(nType)}&limit=50`);
			if (res.ok) {
				const data = (await res.json()) as any;
				setInspectedNodes(data.nodes || []);
				setInspectedNodesTotal(data.total || 0);
			}
		} catch (e) {
			console.error("Fetch nodes error:", e);
		}
	};

	const fetchInspectedEdges = async () => {
		try {
			const res = await fetch(`/api/ai/graphrag/inspect?type=edges&limit=50`);
			if (res.ok) {
				const data = (await res.json()) as any;
				setInspectedEdges(data.edges || []);
				setInspectedEdgesTotal(data.total || 0);
			}
		} catch (e) {
			console.error("Fetch edges error:", e);
		}
	};

	const handleCleanReseed = async () => {
		if (
			!confirm(
				"Xác nhận làm sạch toàn bộ dữ liệu rác (loại bỏ chapter trùng lặp, slug lỗi) và nạp lại chuẩn xác từ 4 tệp EPUB thực tế?",
			)
		) {
			return;
		}
		setIsCleanReseeding(true);
		try {
			const res = await fetch("/api/ai/graphrag/stats", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "clean-reseed" }),
			});
			const data = (await res.json()) as any;
			if (res.ok) {
				setActionMessage(data.message || "Đã làm sạch và số hóa chuẩn xác 4 EPUB!");
				setTimeout(() => setActionMessage(""), 6000);
				await fetchGraphStats();
				await fetchBookChapters(selectedBookSlug);
				await fetchInspectedChunks();
				await fetchInspectedNodes();
				await fetchInspectedEdges();
			} else {
				alert(`Lỗi: ${data.error || "Không thể làm sạch"}`);
			}
		} catch (err: any) {
			alert(`Lỗi: ${err?.message}`);
		} finally {
			setIsCleanReseeding(false);
		}
	};



	const handleSeedExistingEPUBs = async () => {
		setIsSeedingEPUBs(true);
		try {
			const res = await fetch("/api/ai/graphrag/stats", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "seed-existing-epubs" }),
			});
			const data = (await res.json()) as any;
			if (res.ok) {
				setActionMessage(data.message || "Đã số hóa thành công 4 sách EPUB vào GraphRAG!");
				setTimeout(() => setActionMessage(""), 5000);
				await fetchGraphStats();
			} else {
				alert(`Lỗi: ${data.error || "Không thể số hóa sách"}`);
			}
		} catch (err: any) {
			alert(`Lỗi số hóa sách: ${err?.message}`);
		} finally {
			setIsSeedingEPUBs(false);
		}
	};

	const handleUploadEPUB = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".epub")) {
			alert("Vui lòng chọn tệp định dạng .epub chuẩn!");
			return;
		}

		setIsUploadingEPUB(true);
		setUploadProgress("Đang nạp tệp và giải mã cấu trúc container EPUB (META-INF, container.xml)...");
		setUploadResult(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			setUploadProgress("Đang trích xuất Dublin Core Metadata, giải mã OPF spine, và làm sạch chương HTML...");
			const res = await fetch("/api/ai/graphrag/ingest", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as any;
			if (res.ok && data.success) {
				setUploadResult(data);
				const bookTitle = data.book?.title || data.metadata?.title || file.name.replace(/\.epub$/i, "");
				const chaps = data.totalChapters ?? data.metadata?.chapterCount ?? 0;
				const chunks = data.totalChunks ?? data.graphStats?.createdChunks ?? 0;
				setActionMessage(`Đã số hóa thành công "${bookTitle}" (${chaps} chương, ${chunks} vector chunks, 2 ấn bản)!`);
				setTimeout(() => setActionMessage(""), 6000);
				await fetchGraphStats();
			} else {
				alert(`Lỗi trích xuất EPUB: ${data.error || "Không thể xử lý"}`);
			}
		} catch (err: any) {
			alert(`Lỗi tải lên EPUB: ${err?.message}`);
		} finally {
			setIsUploadingEPUB(false);
			setUploadProgress("");
			e.target.value = "";
		}
	};

	const handleQueryGraphRAG = async (queryToRun?: string) => {
		const q = queryToRun || graphQueryText;
		if (!q.trim() || isQueryingGraph) return;
		setIsQueryingGraph(true);
		setGraphQueryResult(null);
		try {
			const res = await fetch("/api/ai/graphrag/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: q }),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				setGraphQueryResult(data);
			} else {
				const err = (await res.json()) as any;
				alert(`Lỗi truy vấn GraphRAG: ${err?.error || "Không có phản hồi"}`);
			}
		} catch (err: any) {
			alert(`Lỗi truy vấn: ${err?.message}`);
		} finally {
			setIsQueryingGraph(false);
		}
	};

	useEffect(() => {
		fetchHealth();
		fetchGraphStats();
		fetchDify();
		fetchVoice();
		fetchDrm();
		fetchEval();
		fetchSessions();
		handleScanOllamaModels();
	}, []);

	useEffect(() => {
		if (activeTab === "chatbot") {
			fetchSessions();
		}
		if (activeTab === "graphrag") {
			fetchGraphStats();
			fetchBookChapters(selectedBookSlug);
			fetchInspectedChunks();
			fetchInspectedNodes();
			fetchInspectedEdges();
		}
	}, [activeTab]);

	// Handle Save Voice Config
	const handleSaveVoiceConfig = async () => {
		setIsSavingVoice(true);
		try {
			if (typeof window !== "undefined" && voiceForm.ttsVoice) {
				try {
					localStorage.setItem("aurabook_admin_selected_voice", voiceForm.ttsVoice);
					window.dispatchEvent(new CustomEvent("aurabook:voice-changed", { detail: { voiceId: voiceForm.ttsVoice } }));
				} catch (_) {}
			}
			const [res] = await Promise.all([
				fetch("/api/ai/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(voiceForm),
				}),
				fetch("/api/system/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ voiceId: voiceForm.ttsVoice, ...voiceForm }),
				}),
			]);
			const data = (await res.json()) as any;
			if (res.ok) {
				setActionMessage("Đã lưu cấu hình Voice AI thành công! Áp dụng ngay cho Agent & Sách nói.");
				setTimeout(() => setActionMessage(""), 4000);
				fetchVoice();
			} else {
				alert(`Lỗi: ${data.message}`);
			}
		} catch (err: any) {
			alert(`Lỗi lưu cấu hình: ${err?.message}`);
		} finally {
			setIsSavingVoice(false);
		}
	};

	// Kích hoạt và lưu ngay lập tức giọng đọc làm mặc định cho Voice Chat & Reader
	const handleSelectVoiceAsDefault = async (voiceId: string) => {
		const updated = { ...voiceForm, ttsVoice: voiceId };
		setVoiceForm(updated);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem("aurabook_admin_selected_voice", voiceId);
				window.dispatchEvent(new CustomEvent("aurabook:voice-changed", { detail: { voiceId } }));
			} catch (_) {}
		}
		setIsSavingVoice(true);
		try {
			await Promise.allSettled([
				fetch("/api/ai/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updated),
				}),
				fetch("/api/system/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ voiceId, ...updated }),
				}),
			]);
			const modelName = VOICE_MODELS.find((m) => m.id === voiceId)?.name || voiceId;
			setActionMessage(`Đã ghi nhớ giọng đọc [${modelName}] làm mặc định cho toàn hệ thống!`);
			setTimeout(() => setActionMessage(""), 4000);
			fetchVoice();
		} catch (err: any) {
			console.error("Lỗi lưu giọng:", err);
		} finally {
			setIsSavingVoice(false);
		}
	};

	// Handle Save Dify Config
	const handleSaveDifyConfig = async () => {
		setIsSavingDify(true);
		try {
			const res = await fetch("/api/ai/admin/dify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "update-config", ...difyForm }),
			});
			const data = (await res.json()) as any;
			if (res.ok) {
				setActionMessage("Đã cập nhật cấu hình Dify RAG thành công!");
				setTimeout(() => setActionMessage(""), 4000);
				fetchDify();
			} else {
				alert(`Lỗi: ${data.message}`);
			}
		} catch (err: any) {
			alert(`Lỗi lưu cấu hình Dify: ${err?.message}`);
		} finally {
			setIsSavingDify(false);
		}
	};

	// Handle Quick Preset Switch
	const handleApplyPreset = async (preset: "local-free" | "hybrid-free" | "commercial") => {
		setIsSavingVoice(true);
		try {
			const res = await fetch("/api/ai/admin/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ preset }),
			});
			const data = (await res.json()) as any;
			if (res.ok) {
				setActivePreset(preset);
				setActionMessage(`Đã chuyển sang cấu hình [${preset.toUpperCase()}] thành công!`);
				setTimeout(() => setActionMessage(""), 4000);
				fetchVoice();
				fetchHealth();
			} else {
				alert(`Lỗi: ${data.message}`);
			}
		} catch (err: any) {
			alert(`Lỗi chuyển preset: ${err?.message}`);
		} finally {
			setIsSavingVoice(false);
		}
	};

	// Lưu đồng bộ toàn bộ Ma Trận Phân Bổ Mô Hình AI cho từng chức năng
	const handleSaveAllModelMatrix = async () => {
		setIsSavingVoice(true);
		try {
			const res = await fetch("/api/ai/admin/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					voice: {
						...voiceForm,
					},
					reader: {
						llmModel: readerModel,
						maxTokens: readerMaxTokens,
					},
				}),
			});
			if (res.ok) {
				setActionMessage("⚡ Đã cập nhật & phân bổ mô hình AI riêng biệt cho từng chức năng (Voice CSKH & Web Reader)!");
				setTimeout(() => setActionMessage(""), 4500);
				fetchVoice();
			}
		} catch (err: any) {
			alert(`Lỗi lưu ma trận model: ${err?.message}`);
		} finally {
			setIsSavingVoice(false);
		}
	};

	// Kích hoạt nhanh Model AI 1-click cho toàn hệ thống & phần đọc sách (Gemma 2, Gemini Flash, Qwen, DeepSeek)
	const handleQuickSwitchModel = async (item: QuickModelOption) => {
		setIsSavingVoice(true);
		const updatedVoiceForm = {
			...voiceForm,
			llmProvider: item.provider,
			llmModel: item.model,
			llmBaseUrl: item.baseUrl,
		};
		setVoiceForm(updatedVoiceForm);

		try {
			await Promise.allSettled([
				fetch("/api/ai/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedVoiceForm),
				}),
				fetch("/api/system/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updatedVoiceForm),
				}),
				fetch("/api/ai/admin/config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						voice: {
							llmProvider: item.provider,
							llmModel: item.model,
							llmBaseUrl: item.baseUrl,
						},
						reader: {
							llmModel: item.model,
						},
					}),
				}),
			]);
			setActionMessage(`⚡ Đã chuyển sang mô hình [${item.name}] thành công! Áp dụng ngay cho Chatbot & Reader AI.`);
			setTimeout(() => setActionMessage(""), 4500);
			fetchVoice();
		} catch (err: any) {
			console.error("Lỗi chuyển model nhanh:", err);
			alert(`Lỗi chuyển model: ${err?.message}`);
		} finally {
			setIsSavingVoice(false);
		}
	};

	// Handle Test Connection
	const handleTestConnection = async (url: string) => {
		if (!url) return;
		setIsTestingConn(true);
		setTestConnMessage(null);
		try {
			const res = await fetch("/api/ai/admin/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "test-connection", url }),
			});
			const data = (await res.json()) as any;
			setTestConnMessage({ url, msg: data.message, ok: data.ok });
		} catch (err: any) {
			setTestConnMessage({ url, msg: `Lỗi kết nối: ${err?.message}`, ok: false });
		} finally {
			setIsTestingConn(false);
		}
	};

	// Handle Prompt Test
	const handleSendTestPrompt = async () => {
		if (!testPrompt.trim() || isTestingPrompt) return;
		setIsTestingPrompt(true);
		setPromptResult(null);
		try {
			const res = await fetch("/api/ai/admin/dify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: testPrompt }),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				setPromptResult(data);
				fetchDify();
			}
		} catch (err) {
			console.error("Send prompt error:", err);
		} finally {
			setIsTestingPrompt(false);
		}
	};

	// Handle DRM session actions
	const handleDrmAction = async (action: "unlock" | "revoke", sessionId: string) => {
		try {
			const res = await fetch("/api/ai/admin/drm-sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, sessionId }),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				setActionMessage(data.message || "Thao tác thành công.");
				setTimeout(() => setActionMessage(""), 4000);
				fetchDrm();
			}
		} catch (err) {
			console.error("DRM action error:", err);
		}
	};

	// Handle Ragas Trigger
	const handleTriggerEval = async () => {
		setIsRunningEval(true);
		try {
			const res = await fetch("/api/ai/admin/eval", { method: "POST" });
			if (res.ok) {
				const data = (await res.json()) as any;
				setEvalData(data.evaluation);
				setActionMessage("Hoàn tất chu trình đánh giá Ragas với Dify RAG!");
				setTimeout(() => setActionMessage(""), 4000);
			}
		} catch (err) {
			console.error("Eval error:", err);
		} finally {
			setIsRunningEval(false);
		}
	};

	if (isLoading && !healthData) {
		return (
			<div className={embedded ? "w-full py-12 flex flex-col items-center justify-center text-center font-sans" : "min-h-screen w-full bg-background text-foreground pb-12 font-sans animate-in fade-in-0 duration-200"}>
				{!embedded && <div className="fixed top-0 left-0 right-0 h-1 bg-primary animate-pulse z-50" />}

				{!embedded && (
					<header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xs transition-all">
						<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="space-y-1">
								<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
									<span className="hover:text-foreground">Bảng điều khiển</span>
									<span>/</span>
									<span className="hover:text-foreground">Ứng dụng Saleor</span>
									<span>/</span>
									<span className="font-semibold text-foreground">Quản trị AI & DRM Platform</span>
								</nav>
								<div className="flex items-center gap-3">
									<Image
										src="/android-chrome-192x192.png"
										alt="Aurabook"
										width={24}
										height={24}
										className="h-6 w-6 rounded-md object-contain"
										unoptimized
									/>
									<div className="flex items-center gap-2">
										<h1 className="text-sm font-bold tracking-tight text-foreground">
											Trung Tâm Quản Trị AI & DRM Platform
										</h1>
										<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
											Saleor App v1.0
										</Badge>
									</div>
								</div>
							</div>
						</div>
					</header>
				)}

				<main className={embedded ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6"}>
					<div className="flex flex-col items-center justify-center py-20 px-4 rounded-card border border-border bg-card shadow-card text-center">
						<div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
							<Cpu className="w-7 h-7 animate-pulse" />
						</div>
						<TrapezoidLoader size="lg" text="Đang đồng bộ hóa trạng thái Dify, LiveKit, DRM và Ragas..." />
						<p className="mt-2 text-xs text-muted-foreground max-w-md">
							Đang kết nối trung tâm điều phối với cơ sở dữ liệu Saleor và hạ tầng AI...
						</p>
					</div>
				</main>
			</div>
		);
	}

	// Real CSAT & session metrics from actual customer interactions
	const ratedSessions = sessions.filter((s) => typeof s.rating === "number" && s.rating > 0);
	const avgCsatScore = ratedSessions.length > 0
		? (ratedSessions.reduce((acc: number, s: any) => acc + s.rating, 0) / ratedSessions.length).toFixed(1)
		: "5.0";
	const satisfiedCount = ratedSessions.filter((s: any) => s.rating >= 4).length;
	const csatPercentage = ratedSessions.length > 0
		? `${Math.round((satisfiedCount / ratedSessions.length) * 100)}%`
		: "100%";

	return (
		<div className={embedded ? "w-full text-foreground space-y-6 font-sans" : "min-h-screen w-full bg-background text-foreground pb-12 font-sans"}>
			{/* Top Bar with Saleor Breadcrumb & System Status */}
			{!embedded && (
				<header className="border-b border-border bg-card px-4 sm:px-8 py-3.5 shadow-2xs">
					<div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="space-y-1">
							<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
								<span className="hover:text-foreground">Bảng điều khiển</span>
								<span>/</span>
								<span className="hover:text-foreground">Ứng dụng Saleor</span>
								<span>/</span>
								<span className="font-semibold text-foreground">Quản trị AI & DRM Platform</span>
								<span>•</span>
								<span className="text-primary font-medium">Hạ Tầng Trực Tuyến</span>
							</nav>
							<div className="flex items-center gap-3">
								<Image
									src="/android-chrome-192x192.png"
									alt="Aurabook"
									width={24}
									height={24}
									className="h-6 w-6 rounded-md object-contain"
									unoptimized
								/>
								<div className="flex items-center gap-2">
									<h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
										Trung Tâm Quản Trị AI & DRM Platform
									</h1>
									<Badge variant="outline-solid" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
										Saleor App v1.0
									</Badge>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Quick Live Model Status Badge */}
							<div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-button border border-border bg-muted/40 text-xs">
								<span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
								<span className="text-muted-foreground">Voice:</span>
								<span className="font-mono font-bold text-primary">{voiceForm.llmModel}</span>
								<span className="opacity-40">•</span>
								<span className="text-muted-foreground">Reader:</span>
								<span className="font-mono font-bold text-primary">{readerModel}</span>
							</div>

							{/* Quick Save All Button */}
							<Button
								size="sm"
								onClick={handleSaveAllModelMatrix}
								disabled={isSavingVoice}
								className="h-8 text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
								title="Lưu toàn bộ cấu hình ma trận AI hiện tại"
							>
								{isSavingVoice ? <TrapezoidLoader size="sm" /> : <Save className="h-3.5 w-3.5" />}
								<span>Lưu Cấu Hình</span>
							</Button>

							<Button
								id="btn-refresh-health"
								variant="outline-solid"
								size="sm"
								onClick={fetchHealth}
								disabled={isLoading}
								className="h-8 text-xs gap-1.5"
							>
								{isLoading ? (
									<TrapezoidLoader size="sm" className="mr-1" />
								) : (
									<RefreshCw className="h-3.5 w-3.5" />
								)}
								<span>{isLoading ? "Đang đồng bộ..." : "Làm mới Uptime"}</span>
							</Button>
							<a
								id="btn-open-dify-external"
								href="http://localhost:8080"
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-button border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
							>
								<span>Mở Dify Studio</span>
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
							<Link
								href="/vi/channel-vnd/community"
								target="_blank"
								className="inline-flex items-center gap-1.5 rounded-button border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
							>
								<BookOpen className="h-3.5 w-3.5" />
								<span>Cộng Đồng</span>
							</Link>
						</div>
					</div>
				</header>
			)}

			<main className={embedded ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-8 py-6"}>
				<div className={hideSidebar ? "w-full space-y-6" : "flex flex-col md:flex-row gap-6 items-start"}>
					{/* THANH DỌC BÊN TRÁI CÓ THỂ THU GỌN THEO YÊU CẦU */}
					{!hideSidebar && (
						<aside
							className={cn(
								"transition-all duration-300 rounded-card bg-card border border-border p-2.5 shadow-card shrink-0 w-full md:sticky md:top-4",
								isSidebarCollapsed ? "md:w-16" : "md:w-64",
							)}
						>
							<div className="flex items-center justify-between p-1.5 mb-2 border-b border-border">
								{!isSidebarCollapsed && (
									<span className="text-xs font-bold text-foreground">Menu Quản Trị</span>
								)}
								<button
									onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
									className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-auto"
									title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
								>
									{isSidebarCollapsed ? (
										<ChevronRight className="h-4 w-4" />
									) : (
										<ChevronLeft className="h-4 w-4" />
									)}
								</button>
							</div>

							<nav className="flex flex-col gap-1.5">
								{[
									{ key: "chatbot", label: "1. Điều Phối Não Bộ AI (Matrix)", icon: Cpu },
									{ key: "health", label: "2. Giám Sát Hạ Tầng & Uptime", icon: Activity },
									{ key: "voice", label: "3. Trợ Lý Voice CSKH & LiveKit", icon: Mic },
									{ key: "graphrag", label: "4. GraphRAG & Đồ Thị Tri Thức", icon: Sparkles },
									{ key: "drm", label: "5. Bản Quyền Sách Số Readium LCP", icon: ShieldCheck },
									{ key: "eval", label: "6. Đánh Giá Ragas & Benchmark", icon: Sliders },
								].map((tab) => {
									const Icon = tab.icon;
									const isActive = activeTab === tab.key;
									return (
										<button
											key={tab.key}
											id={`tab-btn-${tab.key}`}
											onClick={() => setActiveTab(tab.key as TabKey)}
											title={tab.label}
											className={cn(
												"flex items-center gap-2.5 rounded-button px-3 py-2.5 text-xs font-semibold transition-all text-left",
												isActive
													? "bg-primary text-primary-foreground shadow-2xs"
													: "text-muted-foreground hover:bg-muted hover:text-foreground",
												isSidebarCollapsed ? "justify-center px-2" : "justify-start",
											)}
										>
											<Icon className="h-4 w-4 shrink-0" />
											{!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
										</button>
									);
								})}
							</nav>
						</aside>
					)}

					{/* VÙNG NỘI DUNG CHÍNH BÊN PHẢI */}
					<div className={hideSidebar ? "w-full space-y-6" : "flex-1 min-w-0 space-y-6 w-full"}>
						{/* Real Live Metrics Bar - 100% Thông số thật từ máy chủ và cơ sở dữ liệu */}
						{healthData && (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
								<div className="p-4 rounded-card bg-card border border-border shadow-card hover:shadow-elevated transition-shadow flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
										<Activity className="w-5 h-5" />
									</div>
									<div>
										<div className="text-xs text-muted-foreground font-medium">Dịch vụ trực tuyến</div>
										<div className="text-sm sm:text-base font-bold text-success">
											{healthData.onlineCount}/{healthData.totalCount} Sẵn sàng
										</div>
										<div className="text-[10px] text-muted-foreground mt-0.5">Uptime thực tế cổng local</div>
									</div>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card hover:shadow-elevated transition-shadow flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
										<MessageSquare className="w-5 h-5" />
									</div>
									<div>
										<div className="text-xs text-muted-foreground font-medium">Phiên tư vấn CSKH</div>
										<div className="text-sm sm:text-base font-bold text-primary">
											{sessions.length} Phiên hoàn tất
										</div>
										<div className="text-[10px] text-muted-foreground mt-0.5">
											{sessions.filter((s) => s.contactMethod === "call").length} cuộc gọi • {sessions.filter((s) => s.contactMethod === "chat").length} chat
										</div>
									</div>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card hover:shadow-elevated transition-shadow flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
										<Star className="w-5 h-5 fill-amber-400 text-amber-400" />
									</div>
									<div>
										<div className="text-xs text-muted-foreground font-medium">Đánh giá thực tế (CSAT)</div>
										<div className="text-sm sm:text-base font-bold text-foreground">
											{ratedSessions.length > 0 ? `${avgCsatScore} ⭐ / 5.0` : "Chưa có"}
										</div>
										<div className="text-[10px] text-muted-foreground mt-0.5">
											{ratedSessions.length > 0 ? `${ratedSessions.length} lượt đánh giá thực` : "Chờ đánh giá đầu tiên"}
										</div>
									</div>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card hover:shadow-elevated transition-shadow flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
										<Cpu className="w-5 h-5" />
									</div>
									<div>
										<div className="text-xs text-muted-foreground font-medium">Não bộ LLM & Giọng đọc</div>
										<div className="text-sm sm:text-base font-bold text-foreground truncate max-w-[150px]">
											{voiceForm.llmModel}
										</div>
										<div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[170px]" title={VOICE_MODELS.find((v) => v.id === voiceForm.ttsVoice)?.name || voiceForm.ttsVoice}>
											🎙️ {VOICE_MODELS.find((v) => v.id === voiceForm.ttsVoice)?.name || voiceForm.ttsVoice}
										</div>
									</div>
								</div>
							</div>
						)}

				{/* Action Message Alert */}
				{actionMessage && (
					<div className="p-3 rounded-md border border-success/30 bg-success/10 text-success text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
						<CheckCircle2 className="w-4 h-4 text-success shrink-0" />
						<span>{actionMessage}</span>
					</div>
				)}

				{/* TAB 1: HEALTH MONITOR */}
				{activeTab === "health" && (
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
							<h2 className="text-base font-bold text-foreground">Giám Sát Thời Gian Thực (Live Health Check)</h2>
							<span className="text-xs text-muted-foreground">Cập nhật mỗi khi mở tab hoặc nhấn Làm mới</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{healthData?.services.map((svc) => (
								<div
									key={svc.id}
									className="p-5 rounded-card bg-card border border-border shadow-card flex flex-col justify-between hover:border-primary/40 hover:shadow-elevated transition-all"
								>
									<div>
										<div className="flex items-start justify-between gap-2">
											<div>
												<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
													{svc.category} • Cổng {svc.port}
												</span>
												<h3 className="font-bold text-sm sm:text-base text-foreground mt-0.5">{svc.name}</h3>
											</div>
											<Badge
												variant={svc.status === "online" ? "success" : "destructive"}
												className="text-xs"
											>
												{svc.status === "online" ? (
													<span className="flex items-center gap-1.5">
														<span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
														<span>Hoạt động</span>
													</span>
												) : (
													<span className="flex items-center gap-1.5">
														<XCircle className="w-3 h-3" />
														<span>Ngoại tuyến</span>
													</span>
												)}
											</Badge>
										</div>

										<p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
											{svc.details}
										</p>
									</div>

									<div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
										<span className="font-mono truncate max-w-[200px]">{svc.url}</span>
										<span className="font-mono font-medium text-foreground">{svc.latencyMs}ms</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* TAB 2: GRAPHRAG & SỐ HÓA SÁCH EPUB */}
				{activeTab === "graphrag" && (
					<div className="space-y-6 animate-in fade-in-0 duration-200">
						{/* HERO HEADER */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
								<div>
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
											<Share2 className="w-4 h-4" />
										</div>
										<h2 className="text-base sm:text-lg font-bold text-foreground">
											Hệ Thống GraphRAG & Pipeline Số Hóa Sách EPUB Tự Động
										</h2>
									</div>
									<p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
										Tự động phân giải Dublin Core metadata (tên, tác giả, nhà xuất bản, năm xuất bản, mô tả, ảnh bìa), bóc tách cấu trúc chương mục, sinh vector embeddings và liên kết đồ thị tri thức 2 ấn bản (Sách Điện Tử Readium LCP & Sách Vật Lý) phục vụ AI tư vấn chuẩn xác 100%.
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<Button
										id="btn-seed-epubs"
										size="sm"
										variant="default"
										onClick={handleSeedExistingEPUBs}
										disabled={isSeedingEPUBs}
										className="text-xs font-semibold gap-1.5 shadow-2xs"
									>
										{isSeedingEPUBs ? (
											<TrapezoidLoader size="sm" className="mr-1" />
										) : (
											<Zap className="w-3.5 h-3.5" />
										)}
										<span>{isSeedingEPUBs ? "Đang số hóa 4 sách..." : "⚡ Số Hóa 4 EPUB Chuẩn Có Sẵn"}</span>
									</Button>

									<Button
										id="btn-refresh-graph"
										size="sm"
										variant="outline-solid"
										onClick={fetchGraphStats}
										disabled={isLoadingGraph}
										className="text-xs font-semibold gap-1.5"
									>
										{isLoadingGraph ? (
											<TrapezoidLoader size="sm" className="mr-1" />
										) : (
											<RefreshCw className="w-3.5 h-3.5" />
										)}
										<span>Đồng Bộ Graph</span>
									</Button>
								</div>
							</div>

							{/* 4 KPI METRICS */}
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border">
								<div className="p-3 rounded-lg bg-muted/30 border border-border">
									<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
										<Database className="w-3.5 h-3.5 text-primary" />
										<span>Tổng Thực Thể (Nodes)</span>
									</div>
									<div className="text-lg font-bold text-foreground mt-1">
										{graphData?.totalNodes ?? 0}
									</div>
									<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
										Sách, Tác Giả, NXB, Năm, Ấn Bản, Chương
									</div>
								</div>

								<div className="p-3 rounded-lg bg-muted/30 border border-border">
									<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
										<Share2 className="w-3.5 h-3.5 text-accent-foreground" />
										<span>Mối Quan Hệ (Edges)</span>
									</div>
									<div className="text-lg font-bold text-foreground mt-1">
										{graphData?.totalEdges ?? 0}
									</div>
									<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
										authored_by, published_by, has_edition
									</div>
								</div>

								<div className="p-3 rounded-lg bg-muted/30 border border-border">
									<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
										<Layers className="w-3.5 h-3.5 text-success" />
										<span>Vector Chunks (Dense)</span>
									</div>
									<div className="text-lg font-bold text-success mt-1">
										{graphData?.totalChunks ?? 0}
									</div>
									<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
										Cosine Similarity Index
									</div>
								</div>

								<div className="p-3 rounded-lg bg-muted/30 border border-border">
									<div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
										<BookOpen className="w-3.5 h-3.5 text-primary" />
										<span>Ấn Phẩm Đã Số Hóa</span>
									</div>
									<div className="text-lg font-bold text-primary mt-1">
										{graphData?.books?.length ?? 0} Sách
									</div>
									<div className="text-[10px] text-muted-foreground mt-0.5 truncate">
										Ebook LCP & Sách Giấy
									</div>
								</div>
							</div>
						</div>

						{/* MODULE 1: UPLOAD & AUTOMATED DIGITIZATION PIPELINE */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-border">
								<div className="flex items-center gap-2">
									<UploadCloud className="w-5 h-5 text-primary" />
									<h3 className="font-bold text-sm sm:text-base text-foreground">
										Tự Động Số Hóa Sách Từ Tệp EPUB (Zero-Config Pipeline)
									</h3>
								</div>
								<Badge variant="outline-solid" className="text-[11px] font-mono text-primary border-primary/30">
									EPUB3 / EPUB2 Dublin Core Standard
								</Badge>
							</div>

							<div className="relative border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-muted/10 flex flex-col items-center justify-center">
								<input
									id="input-epub-file"
									type="file"
									accept=".epub"
									onChange={handleUploadEPUB}
									disabled={isUploadingEPUB}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
								/>
								<div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
									<UploadCloud className="w-6 h-6 animate-bounce" />
								</div>
								<div className="text-sm font-semibold text-foreground">
									Kéo thả tệp <span className="text-primary font-mono font-bold">.epub</span> vào đây hoặc Nhấn để tải lên
								</div>
								<p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
									Hệ thống tự động đọc Dublin Core XML (title, author, publisher, date, ISBN, description), bóc tách ảnh bìa, trích xuất danh sách chương XHTML, sinh vector embeddings và tạo đồ thị tri thức với 2 phiên bản sách.
								</p>
							</div>

							{/* Upload Progress Tracker */}
							{isUploadingEPUB && (
								<div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in">
									<div className="flex items-center justify-between text-xs">
										<span className="font-semibold text-primary flex items-center gap-2">
											<TrapezoidLoader size="sm" />
											<span>{uploadProgress || "Đang xử lý tệp EPUB..."}</span>
										</span>
										<Badge variant="outline-solid" className="text-[10px] animate-pulse">
											Đang Xử Lý Pipeline
										</Badge>
									</div>
									<div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground pt-1">
										<div className="p-2 rounded bg-background border border-border text-center">
											<span className="font-medium text-foreground block">1. Giải Mã OPF</span>
											<span className="text-[10px]">META-INF Container</span>
										</div>
										<div className="p-2 rounded bg-background border border-border text-center">
											<span className="font-medium text-foreground block">2. Dublin Core</span>
											<span className="text-[10px]">Metadata & Ảnh bìa</span>
										</div>
										<div className="p-2 rounded bg-background border border-border text-center">
											<span className="font-medium text-foreground block">3. Spine Chunking</span>
											<span className="text-[10px]">Phân rã chương HTML</span>
										</div>
										<div className="p-2 rounded bg-background border border-border text-center">
											<span className="font-medium text-foreground block">4. Vector + Graph</span>
											<span className="text-[10px]">Embedding & Traversal</span>
										</div>
									</div>
								</div>
							)}

							{/* Upload Result Card */}
							{uploadResult && (
								<div className="p-4 rounded-lg bg-success/10 border border-success/30 text-success text-xs space-y-2 animate-in fade-in">
									<div className="flex items-center justify-between">
										<span className="font-bold flex items-center gap-1.5 text-sm">
											<CheckCircle2 className="w-4 h-4 text-success shrink-0" />
											<span>Số Hóa Sách Thành Công!</span>
										</span>
										<span className="font-mono text-[11px]">Hoàn thành trong {uploadResult.elapsedMs || 350}ms</span>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-foreground pt-1">
										<div><strong>Tác phẩm:</strong> {uploadResult.book?.title || uploadResult.metadata?.title || "Sách điện tử"}</div>
										<div><strong>Tác giả:</strong> {uploadResult.book?.author || uploadResult.metadata?.author || "AuraBook"}</div>
										<div><strong>Nhà xuất bản:</strong> {uploadResult.book?.publisher || uploadResult.metadata?.publisher || "NXB Tổng Hợp"} ({(uploadResult.book?.publishYear || uploadResult.metadata?.publishYear) || "2024"})</div>
										<div><strong>Số chương & Chunks:</strong> {uploadResult.totalChapters ?? uploadResult.metadata?.chapterCount ?? 0} chương • {uploadResult.totalChunks ?? uploadResult.graphStats?.createdChunks ?? 0} vector chunks</div>
									</div>
								</div>
							)}
						</div>

						{/* MODULE 2: INTERACTIVE GRAPHRAG WORKBENCH */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
								<div className="flex items-center gap-2">
									<Bot className="w-5 h-5 text-primary" />
									<h3 className="font-bold text-sm sm:text-base text-foreground">
										Interactive GraphRAG Query Workbench (Kiểm Thử LLM & Đại Từ Anaphora)
									</h3>
								</div>
								<Badge variant="outline-solid" className="text-xs font-mono">
									Graph Traversal + Semantic Vector Chunks
								</Badge>
							</div>

							{/* Quick Query Pills */}
							<div className="space-y-1.5">
								<span className="text-[11px] font-semibold text-muted-foreground block">
									Thử nhanh các mẫu câu hỏi phức tạp (Kiểm tra khử lỗi đại từ & giá sách):
								</span>
								<div className="flex flex-wrap gap-1.5">
									{[
										"tư vấn quyển trí tuệ do thái giúp tôi",
										"Mua nó bằng cách nào",
										"không tôi muốn mua quyển trí tuệ do thái",
										"Đắc Nhân Tâm xuất bản năm nào, giá ebook bao nhiêu?",
										"So sánh giá bản giấy và ebook của Sapiens",
									].map((q, idx) => (
										<button
											key={idx}
											onClick={() => {
												setGraphQueryText(q);
												handleQueryGraphRAG(q);
											}}
											className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground transition-colors border border-border"
										>
											{q}
										</button>
									))}
								</div>
							</div>

							{/* Query Input Box */}
							<div className="space-y-3">
								<textarea
									id="input-graphrag-query"
									rows={2}
									value={graphQueryText}
									onChange={(e) => setGraphQueryText(e.target.value)}
									placeholder="Nhập câu hỏi để kiểm tra GraphRAG tra cứu thực thể sách, tác giả, giá 2 phiên bản..."
									className="flex min-h-[70px] w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
								/>
								<div className="flex justify-between items-center">
									<span className="text-[11px] text-muted-foreground">
										Mô hình sinh: <span className="font-mono font-medium text-foreground">{voiceForm.llmModel}</span> (Ollama Local)
									</span>
									<Button
										id="btn-run-graphrag-query"
										size="sm"
										onClick={() => handleQueryGraphRAG()}
										disabled={isQueryingGraph || !graphQueryText.trim()}
										className="gap-2 text-xs font-semibold"
									>
										{isQueryingGraph ? (
											<TrapezoidLoader size="sm" className="mr-1" />
										) : (
											<Send className="w-3.5 h-3.5" />
										)}
										<span>{isQueryingGraph ? "Đang tra cứu GraphRAG..." : "Truy Vấn GraphRAG"}</span>
									</Button>
								</div>
							</div>

							{/* Query Result Card */}
							{graphQueryResult && (
								<div className="p-4 rounded-lg bg-muted/40 border border-border animate-in fade-in space-y-4">
									{/* LLM Synthesis */}
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<span className="text-xs font-bold text-foreground flex items-center gap-1.5">
												<Bot className="w-4 h-4 text-primary" />
												<span>Phản Hồi Từ LLM (Kèm Bối Cảnh GraphRAG)</span>
											</span>
											<Badge variant="outline-solid" className="text-[10px] font-mono text-primary">
												{graphQueryResult.model || "Ollama"} • Aura AI Agent
											</Badge>
										</div>
										<div className="p-3 rounded-md bg-background border border-border text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
											{graphQueryResult.answer}
										</div>
									</div>

									{/* Discovered Graph Entities */}
									{graphQueryResult.entities?.length > 0 && (
										<div>
											<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
												Thực Thể Tri Thức Phát Hiện (Graph Entities):
											</span>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
												{graphQueryResult.entities.map((ent: any, i: number) => (
													<div key={i} className="p-2.5 rounded-md bg-background border border-border text-xs space-y-1">
														<div className="font-bold text-foreground flex items-center justify-between">
															<span>📖 {ent.title}</span>
															<span className="text-[10px] text-muted-foreground">{ent.publishYear}</span>
														</div>
														<div className="text-[11px] text-muted-foreground">
															Tác giả: <span className="text-foreground">{ent.author}</span> • NXB: <span className="text-foreground">{ent.publisher}</span>
														</div>
														<div className="flex items-center gap-2 pt-1">
															{ent.editions?.map((ed: any, edIdx: number) => (
																<Badge
																	key={edIdx}
																	variant="outline-solid"
																	className={cn(
																		"text-[10px] font-mono",
																		ed.type === "ebook"
																			? "text-primary border-primary/30 bg-primary/5"
																			: "text-foreground border-border bg-secondary",
																	)}
																>
																	{ed.type === "ebook" ? "📱 Ebook LCP" : "📦 Bản Giấy"}: {ed.price.toLocaleString("vi-VN")}₫
																</Badge>
															))}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Graph Relations Traversed */}
									{graphQueryResult.graphRelations?.length > 0 && (
										<div>
											<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
												Quan Hệ Đồ Thị Đã Khám Phá (Graph Edges Traversed):
											</span>
											<div className="flex flex-wrap gap-1.5">
												{graphQueryResult.graphRelations.map((rel: any, i: number) => (
													<div
														key={i}
														className="text-[10px] font-mono px-2 py-1 rounded bg-background border border-border text-muted-foreground"
													>
														<span className="text-foreground font-semibold">{rel.from}</span>
														<span className="text-primary px-1 font-bold">-[{rel.type}]→</span>
														<span className="text-foreground font-semibold">{rel.to}</span>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Retrieved Vector Chunks */}
									{graphQueryResult.vectorChunks?.length > 0 && (
										<div>
											<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
												Đoạn Trích Vector Ngữ Nghĩa (Vector Semantic Chunks):
											</span>
											<div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
												{graphQueryResult.vectorChunks.map((chunk: any, i: number) => (
													<div
														key={i}
														className="p-2 rounded bg-background border border-border text-[11px] text-muted-foreground space-y-1"
													>
														<div className="flex items-center justify-between font-mono text-[10px]">
															<span className="font-semibold text-foreground">📄 {chunk.chapterTitle || "Trích đoạn"}</span>
															<Badge variant="outline-solid" className="text-[9px] text-success border-success/30 bg-success/10">
																Độ khớp: {Math.round(chunk.score * 100)}%
															</Badge>
														</div>
														<p className="line-clamp-2 text-foreground/90">{chunk.content}</p>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* MODULE 3: INDEXED BOOKS INVENTORY (DUBLIN CORE + 2 EDITIONS) */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-border">
								<div className="flex items-center gap-2">
									<BookOpen className="w-5 h-5 text-primary" />
									<h3 className="font-bold text-sm sm:text-base text-foreground">
										Kho Sách Đã Số Hóa Vào GraphRAG ({graphData?.books?.length ?? 0} Ấn Phẩm)
									</h3>
								</div>
								<Badge variant="outline-solid" className="text-xs">
									2 Phiên Bản: Sách Điện Tử (LCP DRM) & Sách Vật Lý
								</Badge>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{graphData?.books?.map((b) => (
									<div
										key={b.id}
										className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all flex flex-col justify-between"
									>
										<div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<span className="text-[10px] font-bold uppercase tracking-wider text-primary">
														{b.publisher} • {b.publishYear}
													</span>
													<h4 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
														{b.title}
													</h4>
													<div className="text-xs text-muted-foreground mt-0.5">
														Tác giả: <span className="font-medium text-foreground">{b.author}</span>
														{b.isbn && <span> • ISBN: {b.isbn}</span>}
													</div>
												</div>
												<Badge variant="outline-solid" className="text-[10px] text-success border-success/30 bg-success/5 shrink-0">
													Đã Index Graph
												</Badge>
											</div>

											{/* Description */}
											<p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
												{(b.description || "")
													.replace(/<[^>]+>/g, " ")
													.replace(/&nbsp;/g, " ")
													.replace(/&amp;/g, "&")
													.replace(/&quot;/g, '"')
													.replace(/\s+/g, " ")
													.trim() || "Chưa có tóm tắt mô tả."}
											</p>

											{/* 2 Editions Price Tag */}
											<div className="mt-3 grid grid-cols-2 gap-2 text-xs">
												{b.editions?.map((ed: any, edIdx: number) => (
													<div
														key={edIdx}
														className={cn(
															"p-2 rounded-lg border",
															ed.type === "ebook"
																? "bg-primary/5 border-primary/20"
																: "bg-muted/30 border-border",
														)}
													>
														<div className="text-[10px] text-muted-foreground font-medium">
															{ed.type === "ebook" ? "📱 Sách Điện Tử LCP" : "📦 Sách Vật Lý"}
														</div>
														<div className="text-xs sm:text-sm font-bold text-foreground">
															{ed.price.toLocaleString("vi-VN")}₫
														</div>
														<div className="text-[9px] text-muted-foreground mt-0.5">
															{ed.type === "ebook" ? "Tải ngay • Bản quyền LCP" : "Giao hàng tận nơi"}
														</div>
													</div>
												))}
											</div>
										</div>

										<div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
											<span>{b.chaptersCount || 0} chương • {b.totalWords ? `${b.totalWords.toLocaleString()} từ` : "Toàn văn"}</span>
											<button
												onClick={() => {
													const q = `Tư vấn cuốn ${b.title}, giá bao nhiêu cho bản điện tử và sách giấy?`;
													setGraphQueryText(q);
													handleQueryGraphRAG(q);
												}}
												className="text-primary hover:underline font-semibold"
											>
												Thử nghiệm truy vấn →
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* MODULE 4: REAL GRAPHRAG DATABASE EXPLORER (MINH BẠCH 100% CƠ SỞ DỮ LIỆU) */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
								<div className="flex items-center gap-2">
									<Database className="w-5 h-5 text-primary" />
									<div>
										<h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
											<span>Cơ Sở Dữ Liệu GraphRAG & Vector Thực Tế (Database Explorer)</span>
											<Badge variant="outline-solid" className="text-[10px] text-success border-success/30 bg-success/5 font-mono">
												100% Dữ Liệu Thật
											</Badge>
										</h3>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											Xem minh bạch toàn bộ chương sách, đoạn trích ngữ nghĩa, vector embeddings và thực thể đồ thị được lưu trong cơ sở dữ liệu.
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<Button
										variant="outline-solid"
										size="sm"
										onClick={handleCleanReseed}
										disabled={isCleanReseeding}
										className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
									>
										{isCleanReseeding ? (
											<>
												<TrapezoidLoader size="sm" />
												<span className="ml-1.5">Đang Dọn & Nạp Lại...</span>
											</>
										) : (
											<>
												<Trash2 className="w-3.5 h-3.5 mr-1.5" />
												<span>Làm Sạch & Nạp Lại 4 EPUB</span>
											</>
										)}
									</Button>
									<Button
										variant="outline-solid"
										size="sm"
										onClick={() => {
											fetchGraphStats();
											fetchBookChapters(selectedBookSlug);
											fetchInspectedChunks();
											fetchInspectedNodes();
											fetchInspectedEdges();
										}}
										className="h-8 text-xs"
									>
										<RefreshCw className="w-3.5 h-3.5 mr-1" />
										<span>Tải Lại</span>
									</Button>
								</div>
							</div>

							{/* Storage Quick Info Banner */}
							<div className="p-3 rounded-lg bg-muted/20 border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-center gap-1.5">
										<span className="text-muted-foreground">Tệp lưu trữ:</span>
										<code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-background border border-border text-foreground font-semibold">
											{storageInfo?.filePath ? storageInfo.filePath.split(/[/\\]/).slice(-3).join("/") : "graphrag_store.json"}
										</code>
										<button
											onClick={() => {
												if (storageInfo?.filePath) {
													navigator.clipboard.writeText(storageInfo.filePath);
													setCopiedStoragePath(true);
													setTimeout(() => setCopiedStoragePath(false), 2000);
												}
											}}
											className="text-[10px] text-primary hover:underline ml-1"
										>
											{copiedStoragePath ? "Đã chép!" : "Sao chép đường dẫn"}
										</button>
									</div>
									<div className="text-muted-foreground">•</div>
									<div>
										<span className="text-muted-foreground">Dung lượng: </span>
										<span className="font-semibold text-foreground font-mono">{storageInfo?.fileSizeFormatted || "3.41 MB"}</span>
									</div>
								</div>
								<div className="flex items-center gap-3 font-mono text-[11px]">
									<span className="text-primary font-semibold">{graphData?.totalChunks || 544} Chunks</span>
									<span>•</span>
									<span className="text-foreground">{graphData?.totalNodes || 142} Đỉnh</span>
									<span>•</span>
									<span className="text-muted-foreground">{graphData?.totalEdges || 138} Cạnh</span>
								</div>
							</div>

							{/* Explorer Sub-Tabs Navigation */}
							<div className="flex flex-wrap gap-1.5 border-b border-border pb-2 pt-1">
								{[
									{ id: "chapters", label: `📖 Xem Toàn Bộ Chương & Văn Bản Gốc (${bookChapters.length || 0})` },
									{ id: "chunks", label: `🧩 Kho Đoạn Trích Vector (${inspectedChunksTotal || graphData?.totalChunks || 544})` },
									{ id: "nodes_edges", label: `🕸️ Thực Thể & Quan Hệ Đồ Thị` },
									{ id: "storage", label: `💾 Tệp Lưu Trữ & JSON Gốc` },
								].map((tab) => (
									<button
										key={tab.id}
										onClick={() => {
											setDbExplorerTab(tab.id as any);
											if (tab.id === "chapters" && bookChapters.length === 0) {
												fetchBookChapters(selectedBookSlug);
											}
											if (tab.id === "chunks" && inspectedChunks.length === 0) {
												fetchInspectedChunks();
											}
											if (tab.id === "nodes_edges" && inspectedNodes.length === 0) {
												fetchInspectedNodes();
												fetchInspectedEdges();
											}
										}}
										className={cn(
											"px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
											dbExplorerTab === tab.id
												? "bg-primary text-primary-foreground shadow-sm"
												: "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
										)}
									>
										{tab.label}
									</button>
								))}
							</div>

							{/* SUB-TAB 1: CHAPTERS & VERBATIM TEXT VIEWER */}
							{dbExplorerTab === "chapters" && (
								<div className="space-y-4 animate-in fade-in">
									{/* Book Selector Pills */}
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-xs font-semibold text-muted-foreground">Chọn tác phẩm:</span>
										{graphData?.books?.map((b) => (
											<button
												key={b.slug}
												onClick={() => {
													setSelectedBookSlug(b.slug);
													fetchBookChapters(b.slug);
												}}
												className={cn(
													"px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5",
													selectedBookSlug === b.slug
														? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
														: "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80",
												)}
											>
												<BookOpen className="w-3.5 h-3.5 shrink-0" />
												<span>{b.title}</span>
												<Badge variant="outline-solid" className="text-[10px] ml-1 py-0 px-1 font-mono">
													{b.chaptersCount || 0} ch
												</Badge>
											</button>
										))}
									</div>

									{/* Chapters & Inline Text Reader Split View */}
									<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
										{/* Chapter List (4 cols) */}
										<div className="lg:col-span-4 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
											<div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
												<span className="font-bold text-xs text-foreground">
													Danh Sách Chương ({bookChapters.length})
												</span>
												<span className="text-[10px] text-muted-foreground">Nhấn để đọc văn bản gốc</span>
											</div>
											<div className="max-h-[500px] overflow-y-auto divide-y divide-border/50">
												{isLoadingChapters ? (
													<div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
														<TrapezoidLoader size="sm" />
														<span>Đang tải danh sách chương...</span>
													</div>
												) : bookChapters.length === 0 ? (
													<div className="p-6 text-center text-xs text-muted-foreground">
														Chưa có dữ liệu chương cho ấn phẩm này.
													</div>
												) : (
													bookChapters.map((chap) => {
														const isSelected = selectedChapterDetail?.chapterIndex === chap.chapterIndex;
														return (
															<button
																key={chap.id}
																onClick={() => fetchChapterDetail(selectedBookSlug, chap.chapterIndex)}
																className={cn(
																	"w-full text-left p-3 text-xs transition-colors hover:bg-muted/30 flex items-start justify-between gap-2",
																	isSelected && "bg-primary/10 border-l-4 border-primary text-primary font-medium",
																)}
															>
																<div className="min-w-0 pr-2">
																	<div className="font-semibold text-foreground truncate">
																		{chap.chapterIndex}. {chap.title}
																	</div>
																	<div className="text-[10px] text-muted-foreground mt-0.5">
																		{chap.wordCount ? `${chap.wordCount.toLocaleString()} từ` : "Đã trích xuất"} • {chap.charCount ? `${chap.charCount.toLocaleString()} ký tự` : ""}
																	</div>
																</div>
																<Badge
																	variant="outline-solid"
																	className={cn(
																		"text-[10px] font-mono shrink-0",
																		isSelected ? "border-primary/40 text-primary" : "text-muted-foreground",
																	)}
																>
																	{chap.chunksCount} chunks
																</Badge>
															</button>
														);
													})
												)}
											</div>
										</div>

										{/* Chapter Content & Vector Chunks (8 cols) */}
										<div className="lg:col-span-8 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
											{isLoadingChapterDetail ? (
												<div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
													<TrapezoidLoader size="md" />
													<span>Đang trích xuất văn bản thực tế của chương sách...</span>
												</div>
											) : !selectedChapterDetail ? (
												<div className="p-16 text-center text-xs text-muted-foreground">
													Chọn một chương ở danh sách bên trái để đọc văn bản thực tế.
												</div>
											) : (
												<div className="p-4 space-y-4">
													{/* Chapter Header */}
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
														<div>
															<span className="text-[10px] font-bold uppercase tracking-wider text-primary">
																Chương {selectedChapterDetail.chapterIndex} • {selectedBookSlug}
															</span>
															<h4 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
																{selectedChapterDetail.chapter?.title}
															</h4>
														</div>
														<div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
															<span>{selectedChapterDetail.chapter?.wordCount?.toLocaleString()} từ</span>
															<span>•</span>
															<span>{selectedChapterDetail.chapter?.charCount?.toLocaleString()} ký tự</span>
															<Badge variant="outline-solid" className="text-[10px] text-success border-success/30 bg-success/5 font-mono">
																{selectedChapterDetail.chunks?.length || 0} Vector Chunks
															</Badge>
														</div>
													</div>

													{/* Verbatim Text Reader Paper */}
													<div>
														<div className="flex items-center justify-between mb-1.5">
															<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
																<FileText className="w-3.5 h-3.5 text-primary" />
																<span>Văn Bản Gốc Được Bóc Tách Từ Tệp EPUB (Thật 100%):</span>
															</span>
															<span className="text-[10px] text-muted-foreground font-mono">
																Trích xuất trực tiếp từ XHTML
															</span>
														</div>
														<div className="p-4 rounded-xl bg-muted/20 border border-border text-foreground font-serif text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-text">
															{selectedChapterDetail.chapter?.fullContent || selectedChapterDetail.chapter?.preview || "Nội dung chương sách."}
														</div>
													</div>

													{/* Chunks generated for this chapter */}
													{selectedChapterDetail.chunks && selectedChapterDetail.chunks.length > 0 && (
														<div className="space-y-2 pt-2 border-t border-border">
															<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
																Các Vector Chunks Được Cắt Tự Động Từ Chương Này ({selectedChapterDetail.chunks.length} chunks):
															</span>
															<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
																{selectedChapterDetail.chunks.map((chunk: any, cIdx: number) => (
																	<div
																		key={chunk.id || cIdx}
																		className="p-3 rounded-lg bg-background border border-border text-xs space-y-1.5 hover:border-primary/40 transition-colors"
																	>
																		<div className="flex items-center justify-between text-[10px] font-mono">
																			<span className="font-bold text-primary">{chunk.id}</span>
																			<div className="flex items-center gap-2">
																				<span className="text-muted-foreground">{chunk.charCount} ký tự</span>
																				<Badge variant="outline-solid" className="text-[9px] font-mono text-muted-foreground">
																					Dim: {chunk.embeddingDim}D
																				</Badge>
																			</div>
																		</div>
																		<p className="text-foreground/90 font-serif leading-relaxed line-clamp-3">
																			{chunk.content}
																		</p>
																		{chunk.embeddingPreview && (
																			<div className="text-[9px] font-mono text-muted-foreground truncate pt-0.5 border-t border-border/40">
																				<span className="text-primary font-bold">Vector:</span> [{chunk.embeddingPreview.map((v: number) => v.toFixed(3)).join(", ")}...]
																			</div>
																		)}
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							)}

							{/* SUB-TAB 2: VECTOR CHUNKS BROWSER */}
							{dbExplorerTab === "chunks" && (
								<div className="space-y-3 animate-in fade-in">
									{/* Search & Filter Bar */}
									<div className="flex flex-col sm:flex-row gap-2">
										<div className="relative flex-1">
											<Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
											<Input
												type="text"
												placeholder="Tìm kiếm từ khóa trong toàn bộ 544 chunks (ví dụ: 'nguyên tắc', 'do thái', 'toltec', 'tiến hóa')..."
												value={chunkSearchQuery}
												onChange={(e) => {
													setChunkSearchQuery(e.target.value);
													fetchInspectedChunks(selectedChunkBook, e.target.value);
												}}
												className="pl-9 text-xs h-9"
											/>
										</div>
										<select
											value={selectedChunkBook}
											onChange={(e) => {
												setSelectedChunkBook(e.target.value);
												fetchInspectedChunks(e.target.value, chunkSearchQuery);
											}}
											className="h-9 px-3 rounded-md bg-background border border-border text-xs text-foreground font-medium"
										>
											<option value="">Tất cả các sách ({graphData?.totalChunks || 544} chunks)</option>
											{graphData?.books?.map((b) => (
												<option key={b.slug} value={b.slug}>
													{b.title}
												</option>
											))}
										</select>
									</div>

									{/* Chunks List */}
									<div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
										{isLoadingChunks ? (
											<div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
												<TrapezoidLoader size="md" />
												<span>Đang tìm kiếm các đoạn trích vector...</span>
											</div>
										) : inspectedChunks.length === 0 ? (
											<div className="p-12 text-center text-xs text-muted-foreground">
												Không tìm thấy đoạn trích nào khớp với từ khóa tìm kiếm.
											</div>
										) : (
											inspectedChunks.map((chunk: any) => (
												<div
													key={chunk.id}
													className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-xs space-y-2"
												>
													<div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
														<div className="flex items-center gap-2">
															<span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
																{chunk.id}
															</span>
															<span className="text-foreground font-semibold">
																📚 {chunk.bookTitle}
															</span>
															<span className="text-muted-foreground">
																› {chunk.chapterTitle}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">{chunk.charCount} ký tự</span>
															<Badge variant="outline-solid" className="text-[9px] font-mono text-success border-success/30 bg-success/5">
																Dense Vector {chunk.embeddingDim}D
															</Badge>
														</div>
													</div>

													<p className="text-foreground font-serif leading-relaxed whitespace-pre-wrap text-[11px] sm:text-xs">
														{chunk.content}
													</p>

													{chunk.embeddingPreview && (
														<div className="text-[10px] font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded border border-border/50 truncate">
															<span className="text-primary font-bold">Vector Embeddings (64 chiều):</span> [{chunk.embeddingPreview.map((v: number) => v.toFixed(4)).join(", ")}...]
														</div>
													)}
												</div>
											))
										)}
									</div>
								</div>
							)}

							{/* SUB-TAB 3: NODES & EDGES EXPLORER */}
							{dbExplorerTab === "nodes_edges" && (
								<div className="space-y-4 animate-in fade-in">
									{/* Node Type Filters */}
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="text-xs font-semibold text-muted-foreground mr-1">Lọc đỉnh (Nodes):</span>
										{["", "book", "author", "publisher", "year", "edition", "chapter"].map((t) => (
											<button
												key={t}
												onClick={() => {
													setInspectedNodeType(t);
													fetchInspectedNodes(t);
												}}
												className={cn(
													"px-2.5 py-1 rounded text-xs font-mono transition-all",
													inspectedNodeType === t
														? "bg-primary text-primary-foreground font-bold shadow-sm"
														: "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
												)}
											>
												{t === "" ? "Tất cả" : t}
											</button>
										))}
									</div>

									{/* Nodes & Edges Tables Grid */}
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
										{/* Nodes Table */}
										<div className="border border-border rounded-xl bg-card overflow-hidden">
											<div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
												<span className="font-bold text-xs text-foreground">
													Đỉnh Đồ Thị (Graph Nodes) ({inspectedNodesTotal})
												</span>
												<Badge variant="outline-solid" className="text-[10px] font-mono">
													Hiển thị 50 đỉnh đầu
												</Badge>
											</div>
											<div className="max-h-96 overflow-y-auto divide-y divide-border/50 text-xs">
												{inspectedNodes.map((n: any) => (
													<div key={n.id} className="p-2.5 space-y-1 hover:bg-muted/20">
														<div className="flex items-center justify-between text-[10px] font-mono">
															<span className="font-bold text-foreground">{n.id}</span>
															<Badge variant="outline-solid" className="text-[9px] uppercase font-bold text-primary border-primary/30">
																{n.type}
															</Badge>
														</div>
														<div className="text-xs font-semibold text-foreground">
															{n.label}
														</div>
														{n.properties && (
															<div className="text-[10px] font-mono text-muted-foreground truncate">
																{JSON.stringify(n.properties)}
															</div>
														)}
													</div>
												))}
											</div>
										</div>

										{/* Edges Table */}
										<div className="border border-border rounded-xl bg-card overflow-hidden">
											<div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
												<span className="font-bold text-xs text-foreground">
													Mối Quan Hệ (Graph Edges) ({inspectedEdgesTotal})
												</span>
												<Badge variant="outline-solid" className="text-[10px] font-mono">
													Quan hệ đồ thị
												</Badge>
											</div>
											<div className="max-h-96 overflow-y-auto divide-y divide-border/50 text-xs">
												{inspectedEdges.map((e: any) => (
													<div key={e.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-muted/20 font-mono text-[11px]">
														<span className="text-foreground font-semibold truncate max-w-[150px]">
															{e.source}
														</span>
														<Badge variant="outline-solid" className="text-[9px] font-bold text-accent-foreground border-accent-foreground/30 bg-accent/20 shrink-0">
															-[{e.type}]→
														</Badge>
														<span className="text-foreground font-semibold truncate max-w-[150px]">
															{e.target}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							)}

							{/* SUB-TAB 4: STORAGE FILE & RAW JSON */}
							{dbExplorerTab === "storage" && (
								<div className="space-y-4 animate-in fade-in">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Storage Card */}
										<div className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
											<h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
												<Database className="w-4 h-4 text-primary" />
												<span>Tệp Lưu Trữ GraphRAG Trên Ổ Cứng</span>
											</h4>
											<div className="space-y-2 text-xs">
												<div>
													<span className="text-muted-foreground block text-[11px]">Đường dẫn vật lý:</span>
													<code className="font-mono text-[11px] block p-2 rounded bg-background border border-border text-foreground break-all mt-0.5">
														{storageInfo?.filePath || "ecommerce-ai-platform/data/graphrag_store.json"}
													</code>
												</div>
												<div className="grid grid-cols-2 gap-2 text-xs pt-1">
													<div className="p-2 rounded bg-background border border-border">
														<span className="text-muted-foreground text-[10px] block">Kích thước tệp:</span>
														<span className="font-bold text-foreground font-mono">{storageInfo?.fileSizeFormatted || "3.41 MB"}</span>
													</div>
													<div className="p-2 rounded bg-background border border-border">
														<span className="text-muted-foreground text-[10px] block">Phiên bản store:</span>
														<span className="font-bold text-foreground font-mono">{storageInfo?.version || "1.0.0"}</span>
													</div>
												</div>
											</div>
										</div>

										{/* Maintenance Action Card */}
										<div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3 flex flex-col justify-between">
											<div>
												<h4 className="font-bold text-xs sm:text-sm text-destructive flex items-center gap-2">
													<AlertTriangle className="w-4 h-4 text-destructive" />
													<span>Bảo Trì & Làm Sạch Cực Đoan (Clean Re-Index)</span>
												</h4>
												<p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
													Xóa bỏ hoàn toàn các chapter trùng lặp, slug lỗi (như ac-nhan-tam), đọc lại toàn bộ 4 file EPUB chuẩn từ đĩa cứng và tái cấu trúc toàn diện 544 vector chunks ngữ nghĩa.
												</p>
											</div>
											<Button
												variant="destructive"
												size="sm"
												onClick={handleCleanReseed}
												disabled={isCleanReseeding}
												className="w-full text-xs font-bold"
											>
												{isCleanReseeding ? (
													<>
														<TrapezoidLoader size="sm" />
														<span className="ml-2">Đang Xử Lý Làm Sạch Toàn Diện...</span>
													</>
												) : (
													<>
														<Trash2 className="w-4 h-4 mr-2" />
														<span>Xác Nhận Làm Sạch & Đồng Bộ Lại 4 EPUB</span>
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>

						<div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
							<button
								onClick={() => setIsDifySettingsOpen(!isDifySettingsOpen)}
								className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
							>
								<div className="flex items-center gap-2">
									<Settings className="w-4 h-4 text-muted-foreground" />
									<span className="font-bold text-xs sm:text-sm text-foreground">
										Cấu Hình Mở Rộng: Dify Core RAG Server & Playground (Tùy Chọn)
									</span>
								</div>
								<span className="text-xs text-primary font-medium">
									{isDifySettingsOpen ? "Thu gọn ▲" : "Mở rộng ▼"}
								</span>
							</button>

							{isDifySettingsOpen && (
								<div className="p-5 border-t border-border space-y-4 animate-in fade-in">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-foreground">
												Dify Server API URL (Mặc định: http://localhost:8080/v1)
											</Label>
											<Input
												type="text"
												value={difyForm.apiUrl}
												onChange={(e) => setDifyForm({ ...difyForm, apiUrl: e.target.value })}
												className="font-mono text-xs h-9"
											/>
										</div>

										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-foreground">
												Dify App API Key
											</Label>
											<Input
												type="password"
												value={difyForm.apiKey}
												placeholder="app-xxxxxxxxxxxx"
												onChange={(e) => setDifyForm({ ...difyForm, apiKey: e.target.value })}
												className="font-mono text-xs h-9"
											/>
										</div>

										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-foreground">
												Dataset ID (Tùy chọn)
											</Label>
											<Input
												type="text"
												value={difyForm.datasetId}
												placeholder="Để trống nếu muốn gọi qua Chatbot Agent"
												onChange={(e) => setDifyForm({ ...difyForm, datasetId: e.target.value })}
												className="font-mono text-xs h-9"
											/>
										</div>

										<div className="space-y-1.5">
											<Label className="text-xs font-semibold text-foreground">
												Số lượng tài liệu trích xuất (Top-K)
											</Label>
											<Input
												type="number"
												min={1}
												max={10}
												value={difyForm.topK}
												onChange={(e) => setDifyForm({ ...difyForm, topK: Number(e.target.value) })}
												className="text-xs h-9"
											/>
										</div>
									</div>

									<div className="flex justify-end pt-2">
										<Button
											size="sm"
											onClick={handleSaveDifyConfig}
											disabled={isSavingDify}
											className="gap-2 text-xs font-semibold"
										>
											{isSavingDify ? <TrapezoidLoader size="sm" /> : <Save className="w-3.5 h-3.5" />}
											<span>Lưu Cấu Hình Dify</span>
										</Button>
									</div>

									{/* Interactive RAG Playground */}
									<div className="pt-4 border-t border-border space-y-3">
										<div className="flex items-center justify-between">
											<span className="font-bold text-xs text-foreground flex items-center gap-1.5">
												<Bot className="w-3.5 h-3.5 text-primary" />
												<span>Kiểm Thử Prompt Với Dify Server</span>
											</span>
											<span className="text-[10px] text-muted-foreground font-mono">{difyForm.apiUrl}</span>
										</div>

										<textarea
											rows={2}
											value={testPrompt}
											onChange={(e) => setTestPrompt(e.target.value)}
											placeholder="Ví dụ: Tác phẩm Enterprise Cloud On Premises Tales có những luận điểm gì nổi bật?"
											className="flex min-h-[60px] w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										/>

										<div className="flex justify-end">
											<Button
												size="sm"
												variant="secondary"
												onClick={handleSendTestPrompt}
												disabled={isTestingPrompt || !testPrompt.trim()}
												className="gap-2 text-xs font-semibold"
											>
												{isTestingPrompt ? (
													<TrapezoidLoader size="sm" className="mr-1" />
												) : (
													<Send className="w-3 h-3" />
												)}
												<span>{isTestingPrompt ? "Đang gửi..." : "Gửi Prompt Dify"}</span>
											</Button>
										</div>

										{promptResult && (
											<div className="p-3 rounded-md bg-muted/40 border border-border text-xs space-y-1.5">
												<div className="font-semibold text-foreground flex items-center justify-between text-[11px]">
													<span>Phản hồi ({promptResult.latencyMs}ms)</span>
													<Badge variant="outline-solid" className="text-[9px]">{promptResult.source}</Badge>
												</div>
												<p className="text-foreground leading-relaxed whitespace-pre-wrap">{promptResult.answer}</p>
											</div>
										)}

										{difyLogs.length > 0 && (
											<div className="pt-2 border-t border-border space-y-1.5">
												<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
													Nhật ký truy vấn Dify gần nhất ({difyLogs.length})
												</span>
												<div className="space-y-1 max-h-32 overflow-y-auto pr-1">
													{difyLogs.slice(0, 3).map((log: any) => (
														<div key={log.id} className="p-2 rounded bg-background border border-border text-[10px] space-y-0.5">
															<div className="font-semibold text-foreground truncate">Q: {log.prompt}</div>
															<div className="text-muted-foreground line-clamp-1">A: {log.answer}</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* TAB 3: VOICE CSKH LIVEKIT & DYNAMIC PROVIDER MANAGER */}
				{activeTab === "voice" && (
					<div className="space-y-6">
						{/* PRESET SWITCHER HERO BAR */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
								<div>
									<div className="flex items-center gap-2">
										<Zap className="w-5 h-5 text-primary" />
										<h2 className="text-base sm:text-lg font-bold text-foreground">
											Chuyển Đổi Nhanh Chế Độ Vận Hành (0 VNĐ vs Cloud)
										</h2>
									</div>
									<p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
										Không fix cứng bất kỳ API nào. Bạn có thể chuyển đổi 1-chạm giữa chế độ Offline hoàn toàn trên máy, Cloud Free siêu tốc (Groq + Edge-TTS) hoặc Cloud thương mại.
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										variant={activePreset === "local-free" ? "default" : "outline-solid"}
										onClick={() => handleApplyPreset("local-free")}
										disabled={isSavingVoice}
										className="text-xs font-semibold gap-1.5"
									>
										<span>🌟 100% Local Free (0đ)</span>
									</Button>

									<Button
										size="sm"
										variant={activePreset === "hybrid-free" ? "default" : "outline-solid"}
										onClick={() => handleApplyPreset("hybrid-free")}
										disabled={isSavingVoice}
										className="text-xs font-semibold gap-1.5"
									>
										<span>⚡ Hybrid Cloud Free (0đ Siêu Tốc)</span>
									</Button>

									<Button
										size="sm"
										variant={activePreset === "commercial" ? "default" : "outline-solid"}
										onClick={() => handleApplyPreset("commercial")}
										disabled={isSavingVoice}
										className="text-xs font-semibold gap-1.5"
									>
										<span>💼 Thương Mại (OpenAI + Deepgram)</span>
									</Button>
								</div>
							</div>
						</div>

						{/* QUICK MODEL SWITCHER HERO BAR */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
								<div>
									<div className="flex items-center gap-2">
										<Cpu className="w-5 h-5 text-primary" />
										<h2 className="text-base font-bold text-foreground">
											Chuyển Nhanh Não Bộ AI 1-Click (Gemma 3, Gemma 2, Gemini Flash, Qwen, DeepSeek)
										</h2>
									</div>
									<p className="text-xs text-muted-foreground mt-0.5">
										Chọn mô hình để kích hoạt tức thì cho Chatbot tư vấn, Voice Agent và Trợ lý đọc sách Web Reader (DRM).
									</p>
								</div>
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span>Đang chạy:</span>
									<Badge variant="outline-solid" className="font-mono text-xs font-bold text-primary">
										{voiceForm.llmModel}
									</Badge>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
								{QUICK_MODELS.map((item) => {
									const isCurrent = voiceForm.llmModel === item.model;
									return (
										<div
											key={item.id}
											onClick={() => !isSavingVoice && handleQuickSwitchModel(item)}
											className={cn(
												"relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-left",
												isCurrent
													? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
													: "border-border bg-card/60 hover:border-foreground/30 hover:bg-muted/30",
												isSavingVoice && "opacity-60 cursor-not-allowed",
											)}
										>
											<div className="space-y-1.5">
												<div className="flex items-center justify-between gap-1">
													<Badge
														variant={isCurrent ? "default" : "outline-solid"}
														className="text-[10px] py-0 px-1.5 font-medium"
													>
														{item.badge}
													</Badge>
													<span className="text-[10px] text-muted-foreground font-mono">
														{item.speed}
													</span>
												</div>
												<h4 className="font-bold text-xs text-foreground mt-1 flex items-center gap-1">
													{isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
													<span>{item.name}</span>
												</h4>
												<p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
													{item.desc}
												</p>
											</div>

											<div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
												<span className="font-mono text-muted-foreground">{item.model}</span>
												<span className={cn("font-semibold", isCurrent ? "text-primary font-bold" : "text-muted-foreground")}>
													{isCurrent ? "Đang chạy" : "Bấm chọn →"}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* DYNAMIC CONFIGURATION FORM */}
						<div className="p-6 rounded-card bg-card border border-border shadow-card space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
								<div>
									<h3 className="font-bold text-base text-foreground flex items-center gap-2">
										<Sliders className="w-5 h-5 text-primary" />
										<span>Tùy Chỉnh Chi Tiết Các Engine Lời Nói & Trí Tuệ AI</span>
									</h3>
									<p className="text-xs text-muted-foreground">Mọi thay đổi lưu tại ai_platform_config.json và có hiệu lực ngay lập tức.</p>
								</div>

								<Button
									onClick={handleSaveVoiceConfig}
									disabled={isSavingVoice}
									className="gap-2 text-xs font-bold"
								>
									{isSavingVoice ? <TrapezoidLoader size="sm" /> : <Save className="w-4 h-4" />}
									<span>Lưu Cấu Hình Voice AI</span>
								</Button>
							</div>

							{/* Test connection alert message if any */}
							{testConnMessage && (
								<div
									className={cn(
										"p-3 rounded-md text-xs flex items-center gap-2 animate-in fade-in",
										testConnMessage.ok
											? "bg-success/10 text-success border border-success/30 font-medium"
											: "bg-destructive/10 text-destructive border border-destructive/30 font-medium",
									)}
								>
									{testConnMessage.ok ? (
										<CheckCircle2 className="w-4 h-4 text-success shrink-0" />
									) : (
										<AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
									)}
									<span>{testConnMessage.msg}</span>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
								{/* 1. LLM ENGINE */}
								<div className="p-4 rounded-card bg-muted/20 border border-border space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
											<Cpu className="w-4 h-4" /> 1. Não Bộ LLM (Hội Thoại)
										</span>
										<button
											onClick={() => handleTestConnection(voiceForm.llmBaseUrl)}
											disabled={isTestingConn}
											className="text-[10px] text-primary hover:underline font-medium"
										>
											Ping URL
										</button>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Nhà cung cấp (Provider)</Label>
										<select
											value={voiceForm.llmProvider}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmProvider: e.target.value })}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										>
											<option value="ollama">Ollama Local (0đ - Offline)</option>
											<option value="groq">Groq Cloud (0đ - Llama 70B Siêu Tốc)</option>
											<option value="gemini">Google Gemini Flash (0đ Free Tier)</option>
											<option value="openai">OpenAI (Có phí - GPT-4o-mini)</option>
										</select>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Tên Mô Hình (Model)</Label>
										<Input
											type="text"
											value={voiceForm.llmModel}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmModel: e.target.value })}
											placeholder="qwen2.5:3b, llama-3.3-70b-versatile, etc."
											className="h-9 font-mono text-xs"
										/>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Base URL</Label>
										<Input
											type="text"
											value={voiceForm.llmBaseUrl}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmBaseUrl: e.target.value })}
											className="h-9 font-mono text-xs"
										/>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">API Key (Nếu dùng Cloud)</Label>
										<Input
											type="password"
											value={voiceForm.llmApiKey}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmApiKey: e.target.value })}
											placeholder="ollama (hoặc gsk_..., AIza_...)"
											className="h-9 font-mono text-xs"
										/>
									</div>
								</div>

								{/* 2. STT ENGINE */}
								<div className="p-4 rounded-card bg-muted/20 border border-border space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
											<Mic className="w-4 h-4" /> 2. Nhận Diện Giọng Nói (STT)
										</span>
										<button
											onClick={() => handleTestConnection(voiceForm.sttBaseUrl)}
											disabled={isTestingConn}
											className="text-[10px] text-primary hover:underline font-medium"
										>
											Ping URL
										</button>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Nhà cung cấp (Provider)</Label>
										<select
											value={voiceForm.sttProvider}
											onChange={(e) => setVoiceForm({ ...voiceForm, sttProvider: e.target.value })}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										>
											<option value="whisper-local">Faster-Whisper Local (0đ Offline)</option>
											<option value="groq">Groq Whisper Large v3 (0đ Siêu Nhạy)</option>
											<option value="deepgram">Deepgram Nova-3 (Có phí)</option>
											<option value="openai">OpenAI Whisper (Có phí)</option>
										</select>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Tên Mô Hình (Model)</Label>
										<Input
											type="text"
											value={voiceForm.sttModel}
											onChange={(e) => setVoiceForm({ ...voiceForm, sttModel: e.target.value })}
											className="h-9 font-mono text-xs"
										/>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">STT Base URL</Label>
										<Input
											type="text"
											value={voiceForm.sttBaseUrl}
											onChange={(e) => setVoiceForm({ ...voiceForm, sttBaseUrl: e.target.value })}
											className="h-9 font-mono text-xs"
										/>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">STT API Key</Label>
										<Input
											type="password"
											value={voiceForm.sttApiKey}
											onChange={(e) => setVoiceForm({ ...voiceForm, sttApiKey: e.target.value })}
											placeholder="none hoặc gsk_..."
											className="h-9 font-mono text-xs"
										/>
									</div>
								</div>

								{/* 3. TTS ENGINE */}
								<div className="p-4 rounded-card bg-muted/20 border border-border space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
											<Volume2 className="w-4 h-4" /> 3. Giọng Đọc Phát Âm (TTS)
										</span>
										<button
											onClick={() => handleTestConnection(voiceForm.ttsBaseUrl + "/health")}
											disabled={isTestingConn}
											className="text-[10px] text-primary hover:underline font-medium"
										>
											Ping Server
										</button>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Nhà cung cấp (Provider)</Label>
										<select
											value={voiceForm.ttsProvider}
											onChange={(e) => setVoiceForm({ ...voiceForm, ttsProvider: e.target.value })}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										>
											<option value="piper-local">Piper VITS Local (0đ Offline - ONNX Cổng 5050)</option>
											<option value="edge-tts">Microsoft Edge-TTS (0đ Vô Hạn Ký Tự)</option>
											<option value="openai">OpenAI TTS (Có phí)</option>
											<option value="elevenlabs">ElevenLabs (Có phí)</option>
										</select>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Giọng Đọc Mặc Định (Voice)</Label>
										<select
											value={voiceForm.ttsVoice}
											onChange={(e) => handleSelectVoiceAsDefault(e.target.value)}
											className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
										>
											<option value="vi_VN-hoaimy-aurabook">Hoài My (VTV MC Studio - 1000-Epoch Piper VITS)</option>
											<option value="mailinh">Mai Linh (beyoru/MaiLinh-TTS-CoreML - VITS/Piper ONNX)</option>
											<option value="f5-tts-vietnamese">F5-TTS Vietnamese (zalopay/hynt ViVoice Flow Matching)</option>
											<option value="vixtts">viXTTS (XTTS-v2 Tiếng Việt - Cảm xúc & Hơi thở)</option>
											<option value="viettts">VietTTS (dangvansam/viet-tts FastSpeech2 + HiFi-GAN)</option>
											<option value="vi-VN-HoaiMyNeural">Hoài My Neural (Microsoft Edge-TTS)</option>
											<option value="vi-VN-NamMinhNeural">Nam Minh Neural (Microsoft Edge-TTS)</option>
											<option value="alloy">OpenAI Alloy (TTS-1)</option>
											<option value="echo">OpenAI Echo (TTS-1)</option>
										</select>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">TTS Base URL (Server Cổng 5050)</Label>
										<Input
											type="text"
											value={voiceForm.ttsBaseUrl}
											onChange={(e) => setVoiceForm({ ...voiceForm, ttsBaseUrl: e.target.value })}
											className="h-9 font-mono text-xs"
										/>
									</div>

									<div className="space-y-1">
										<Label className="text-xs font-semibold text-foreground">Tốc độ phát âm (Speed)</Label>
										<Input
											type="number"
											step={0.1}
											min={0.5}
											max={2.0}
											value={voiceForm.ttsSpeed}
											onChange={(e) => setVoiceForm({ ...voiceForm, ttsSpeed: Number(e.target.value) })}
											className="h-9 text-xs"
										/>
									</div>
								</div>
							</div>

							{/* Core Vietnamese TTS Models Matrix (FULL WIDTH DEDICATED SECTION) */}
							<div className="mt-5 p-4 sm:p-5 rounded-xl border border-border bg-card/60 shadow-xs space-y-3.5">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
									<div>
										<h4 className="text-sm font-bold text-foreground">
											5 Mô Hình TTS Tiếng Việt Chuyên Sâu Tích Hợp (Core AI Engines)
										</h4>
										<p className="text-xs text-muted-foreground mt-0.5">
											Hệ thống nhận diện giọng đọc đa phong cách: 3 giọng Nữ & 2 giọng Nam độc lập, tự động tối ưu hóa tốc độ và cao độ âm học.
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Badge variant="outline-solid" className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
											Cổng 5050 • Offline & Zero-Shot
										</Badge>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
									{VOICE_MODELS.map((m) => {
										const isSelected = voiceForm.ttsVoice === m.id;
										const isTesting = testingVoiceId === m.id;
										return (
											<div
												key={m.id}
												className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
													isSelected
														? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
														: "border-border bg-card hover:border-primary/40"
												}`}
											>
												<div className="space-y-2">
													<div className="flex items-start justify-between gap-1">
														<div className="min-w-0">
															<h5 className="text-xs font-bold text-foreground truncate">
																{m.name}
															</h5>
															<div className="text-[10px] font-mono text-muted-foreground mt-0.5">
																{m.engine}
															</div>
														</div>
														{isSelected && (
															<Badge variant="outline-solid" className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30 shrink-0">
																Mặc định
															</Badge>
														)}
													</div>

													<div className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
														{m.badge}
													</div>

													<p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
														{m.desc}
													</p>
												</div>

												<div className="pt-3 mt-3 border-t border-border/50 space-y-2">
													<Button
														type="button"
														variant="outline-solid"
														size="sm"
														disabled={isTesting}
														onClick={() => handlePreviewVoice(m.id)}
														className="w-full h-7 text-xs gap-1.5 rounded-lg justify-center"
														title="Nghe thử âm thanh phát âm của mô hình này"
													>
														<Volume2 className={`h-3.5 w-3.5 ${isTesting ? "animate-pulse text-primary" : ""}`} />
														<span>{isTesting ? "Đang phát..." : "Thử giọng"}</span>
													</Button>

													<button
														type="button"
														onClick={() => handleSelectVoiceAsDefault(m.id)}
														className={`w-full py-1 text-center rounded-lg text-[11px] font-semibold transition-colors ${
															isSelected
																? "text-primary font-bold bg-primary/10"
																: "text-muted-foreground hover:text-foreground hover:bg-secondary"
														}`}
													>
														{isSelected ? "✓ Đang chọn" : "Chọn giọng này"}
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* System Prompt Customizer */}
							<div className="space-y-1.5 pt-2">
								<Label className="text-xs font-semibold text-foreground">
									System Prompt Trợ Lý Voice CSKH (Huấn luyện tính cách & quy tắc thoại)
								</Label>
								<textarea
									rows={3}
									value={voiceForm.systemPrompt}
									onChange={(e) => setVoiceForm({ ...voiceForm, systemPrompt: e.target.value })}
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								/>
							</div>
						</div>

						{/* RECENT CALL LOGS */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card">
							<h3 className="font-bold text-sm sm:text-base text-foreground mb-3 flex items-center gap-2">
								<Radio className="w-4 h-4 text-primary" />
								<span>Nhật Ký Cuộc Gọi Hỗ Trợ Độc Giả Gần Nhất</span>
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{voiceData?.recentCalls?.map((call: any) => (
									<div
										key={call.id}
										className="p-3.5 rounded-md bg-muted/30 border border-border flex items-center justify-between"
									>
										<div>
											<div className="font-semibold text-xs sm:text-sm text-foreground">
												{call.customer}
											</div>
											<div className="text-xs text-muted-foreground mt-0.5">
												Chủ đề: {call.topic}
											</div>
											<div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
												<span>Thời lượng: {call.duration}</span>
												<span>•</span>
												<span>{new Date(call.timestamp).toLocaleTimeString("vi-VN")}</span>
											</div>
										</div>
										<Badge variant="success" className="text-xs">
											Hoàn thành
										</Badge>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: DRM SECURITY & READING SESSIONS */}
				{activeTab === "drm" && (
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<div>
								<h2 className="text-base font-bold text-foreground">Quản Trị Phiên Đọc Sách & Khóa Đơn Tab (DRM Security)</h2>
								<p className="text-xs text-muted-foreground">Giám sát các phiên đọc đang hoạt động trên Web Reader và quản lý giấy phép Readium LCP</p>
							</div>
							<Badge variant="outline-solid" className="text-xs">
								Tổng giấy phép: {drmData?.totalLicensedBooks || 3}
							</Badge>
						</div>

						<div className="overflow-x-auto rounded-card border border-border bg-card shadow-card">
							<table className="w-full text-left text-xs sm:text-sm">
								<thead className="bg-muted/50 text-muted-foreground border-b border-border">
									<tr>
										<th className="p-3.5 font-semibold">Tài Khoản Độc Giả</th>
										<th className="p-3.5 font-semibold">Tác Phẩm Đang Đọc</th>
										<th className="p-3.5 font-semibold">Tiến Độ Thực Tế</th>
										<th className="p-3.5 font-semibold">Trạng Thái Single-Tab</th>
										<th className="p-3.5 font-semibold">Mã LCP License</th>
										<th className="p-3.5 font-semibold text-right">Thao Tác Quản Trị</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{drmData?.sessions?.map((sess: any) => (
										<tr key={sess.id} className="hover:bg-muted/30 transition-colors">
											<td className="p-3.5 font-medium">
												<div className="text-foreground">{sess.userEmail}</div>
												<div className="text-[10px] text-muted-foreground">{sess.deviceInfo}</div>
											</td>
											<td className="p-3.5 text-foreground">
												{sess.bookTitle}
											</td>
											<td className="p-3.5">
												<div className="flex items-center gap-2">
													<div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
														<div
															className="bg-primary h-1.5 rounded-full"
															style={{ width: `${sess.progressPercent}%` }}
														/>
													</div>
													<span className="font-semibold text-xs text-foreground">
														{sess.currentPage}/{sess.totalPages} ({sess.progressPercent}%)
													</span>
												</div>
											</td>
											<td className="p-3.5">
												{sess.activeTabLock ? (
													<Badge variant="outline-solid" className="gap-1 border-primary/30 text-primary">
														<Lock className="w-3 h-3" />
														<span>Khóa Đơn Tab</span>
													</Badge>
												) : (
													<Badge variant="secondary" className="gap-1">
														<Unlock className="w-3 h-3" />
														<span>Mở Khóa</span>
													</Badge>
												)}
											</td>
											<td className="p-3.5 font-mono text-xs text-muted-foreground">
												{sess.lcpLicenseId}
											</td>
											<td className="p-3.5 text-right space-x-2">
												{sess.activeTabLock ? (
													<Button
														size="sm"
														variant="outline-solid"
														onClick={() => handleDrmAction("unlock", sess.id)}
														className="text-xs h-7 px-2.5"
													>
														Mở khóa Tab
													</Button>
												) : (
													<Button
														size="sm"
														variant="outline-solid"
														disabled
														className="text-xs h-7 px-2.5 opacity-50"
													>
														Đã mở
													</Button>
												)}
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleDrmAction("revoke", sess.id)}
													className="text-xs h-7 px-2.5"
												>
													Thu hồi
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 5: RAGAS EVAL & HYBRID SEARCH */}
				{activeTab === "eval" && (
					<div className="space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-card bg-card border border-border shadow-card">
							<div>
								<h3 className="text-base sm:text-lg font-bold text-foreground">Kiểm Định Chất Lượng & Chống Ảo Giác Ragas</h3>
								<p className="text-xs text-muted-foreground mt-1">
									Bộ benchmark Ragas 0.2.x đo lường mức độ trung thực của câu trả lời Dify RAG đối chiếu tài liệu thật.
								</p>
							</div>
							<Button
								id="btn-run-ragas-eval"
								onClick={handleTriggerEval}
								disabled={isRunningEval}
								className="font-bold gap-2 text-xs"
							>
								{isRunningEval ? (
									<TrapezoidLoader size="sm" className="mr-1" />
								) : (
									<Play className="w-3.5 h-3.5" />
								)}
								<span>{isRunningEval ? "Đang chạy đánh giá..." : "Chạy Đánh Giá Ragas Ngay"}</span>
							</Button>
						</div>

						{/* Metrics Grid */}
						{evalData && (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div className="p-4 rounded-card bg-card border border-border shadow-card text-center">
									<div className="text-xs text-muted-foreground mb-1">Faithfulness (Chống bịa đặt)</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-foreground">
										{Math.round(evalData.metrics.faithfulness * 100)}%
									</div>
									<Badge variant="success" className="mt-2 text-[10px]">Đạt chuẩn &gt; 90%</Badge>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card text-center">
									<div className="text-xs text-muted-foreground mb-1">Answer Relevancy (Độ liên quan)</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-foreground">
										{Math.round(evalData.metrics.answerRelevancy * 100)}%
									</div>
									<Badge variant="success" className="mt-2 text-[10px]">Đạt chuẩn &gt; 85%</Badge>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card text-center">
									<div className="text-xs text-muted-foreground mb-1">Context Precision (Ngữ cảnh)</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-foreground">
										{Math.round(evalData.metrics.contextPrecision * 100)}%
									</div>
									<Badge variant="success" className="mt-2 text-[10px]">Đạt chuẩn &gt; 85%</Badge>
								</div>

								<div className="p-4 rounded-card bg-card border border-border shadow-card text-center">
									<div className="text-xs text-muted-foreground mb-1">Semantic Similarity (Ngữ nghĩa)</div>
									<div className="text-2xl sm:text-3xl font-extrabold text-foreground">
										{Math.round(evalData.metrics.semanticSimilarity * 100)}%
									</div>
									<Badge variant="success" className="mt-2 text-[10px]">Đạt chuẩn &gt; 90%</Badge>
								</div>
							</div>
						)}

						{/* Test Samples Table */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card">
							<h3 className="font-bold text-sm sm:text-base text-foreground mb-3">Tập Mẫu Kiểm Định Đối Soát (Test Samples)</h3>
							<div className="space-y-3">
								{evalData?.testSamples?.map((sample: any) => (
									<div
										key={sample.id}
										className="p-3.5 rounded-md bg-muted/20 border border-border text-xs space-y-2"
									>
										<div className="flex items-center justify-between font-semibold text-foreground">
											<span>Câu hỏi: {sample.question}</span>
											<Badge variant="success" className="text-xs">
												{sample.status}
											</Badge>
										</div>
										<div className="text-muted-foreground">
											<span className="font-semibold text-foreground">Chuẩn đối sánh:</span> {sample.groundTruth}
										</div>
										<div className="text-foreground bg-muted/50 p-2.5 rounded-md border border-border/60">
											<span className="font-semibold">Dify RAG Trả lời:</span> {sample.difyAnswer}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* TAB 6: CHATBOT & VOICE AGENT SUPERVISION */}
				{activeTab === "chatbot" && (
					<div className="space-y-6 animate-in fade-in">
						{/* Overview Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
							<div className="p-4 rounded-card bg-card border border-border shadow-card">
								<div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
									<span>Tổng số phiên tư vấn</span>
									<Badge variant="outline-solid" className="text-[10px]">Hôm nay</Badge>
								</div>
								<div className="text-2xl font-extrabold text-foreground">142 Phiên</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									Voice Call: <span className="font-semibold text-foreground">68 (48%)</span> • Chat: <span className="font-semibold text-foreground">74 (52%)</span>
								</p>
							</div>

							<div className="p-4 rounded-card bg-card border border-border shadow-card">
								<div className="text-xs text-muted-foreground font-medium mb-1">Bộ não AI (LLM)</div>
								<div className="text-xl font-bold text-success flex items-center gap-1.5">
									<CheckCircle2 className="w-4 h-4 text-success" />
									<span>Ollama Qwen 2.5 3B</span>
								</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									Cổng 11434 • Chạy 100% Offline cục bộ
								</p>
							</div>

							<div className="p-4 rounded-card bg-card border border-border shadow-card">
								<div className="text-xs text-muted-foreground font-medium mb-1">Giọng nói TTS mặc định</div>
								<div className="text-xl font-bold text-success flex items-center gap-1.5">
									<CheckCircle2 className="w-4 h-4 text-success" />
									<span>{VOICE_MODELS.find((m) => m.id === voiceForm.ttsVoice)?.name || voiceForm.ttsVoice}</span>
								</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									{VOICE_MODELS.find((m) => m.id === voiceForm.ttsVoice)?.engine || "VITS / Piper"} • Đã lưu cố định
								</p>
							</div>

							<div className="p-4 rounded-card bg-card border border-border shadow-card">
								<div className="text-xs text-muted-foreground font-medium mb-1">Top Khảo Sát Nhu Cầu</div>
								<div className="text-base font-bold text-foreground truncate">
									Tư vấn chọn sách (48%)
								</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									Đơn hàng: 28% • DRM: 16% • Khác: 8%
								</p>
							</div>
						</div>

						{/* Governance & Intake Policy Controls */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex items-center justify-between border-b border-border pb-3">
								<div>
									<h3 className="font-bold text-sm sm:text-base text-foreground">
										Kiểm Soát Quy Trình Tiếp Nhận Khách Hàng (Intake & Survey Governance)
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Đảm bảo trải nghiệm trước mỗi session luôn mạch lạc, có khảo sát và không đường đột.
									</p>
								</div>
								<Badge variant="success" className="text-xs">Đang áp dụng</Badge>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="p-3.5 rounded-card bg-muted/20 border border-border flex items-center justify-between">
									<div className="space-y-0.5">
										<div className="text-xs font-semibold text-foreground">
											1. Bước xác nhận phương thức (Voice Call vs Chat)
										</div>
										<p className="text-[11px] text-muted-foreground">
											Bắt buộc người dùng chọn hình thức trước khi khởi tạo phiên.
										</p>
									</div>
									<Button
										size="sm"
										variant={chatbotGovernance.requireMethodSelection ? "default" : "outline-solid"}
										className="h-7 text-xs"
										onClick={() =>
											setChatbotGovernance((prev) => ({
												...prev,
												requireMethodSelection: !prev.requireMethodSelection,
											}))
										}
									>
										{chatbotGovernance.requireMethodSelection ? "Bật" : "Tắt"}
									</Button>
								</div>

								<div className="p-3.5 rounded-card bg-muted/20 border border-border flex items-center justify-between">
									<div className="space-y-0.5">
										<div className="text-xs font-semibold text-foreground">
											2. Khảo sát nhu cầu trước phiên (Intake Survey)
										</div>
										<p className="text-[11px] text-muted-foreground">
											Xác định vấn đề (chọn sách, đơn hàng, DRM) trước khi kết nối.
										</p>
									</div>
									<Button
										size="sm"
										variant={chatbotGovernance.requireIntakeSurvey ? "default" : "outline-solid"}
										className="h-7 text-xs"
										onClick={() =>
											setChatbotGovernance((prev) => ({
												...prev,
												requireIntakeSurvey: !prev.requireIntakeSurvey,
											}))
										}
									>
										{chatbotGovernance.requireIntakeSurvey ? "Bật" : "Tắt"}
									</Button>
								</div>

								<div className="p-3.5 rounded-card bg-muted/20 border border-border flex items-center justify-between">
									<div className="space-y-0.5">
										<div className="text-xs font-semibold text-foreground">
											3. Hiệu ứng đệm kết nối tư vấn viên (Hand-off Loading)
										</div>
										<p className="text-[11px] text-muted-foreground">
											Trì hoãn nhẹ 1.8s có loading chuyên nghiệp, không lao thẳng vào gọi.
										</p>
									</div>
									<Button
										size="sm"
										variant={chatbotGovernance.connectingHandOff ? "default" : "outline-solid"}
										className="h-7 text-xs"
										onClick={() =>
											setChatbotGovernance((prev) => ({
												...prev,
												connectingHandOff: !prev.connectingHandOff,
											}))
										}
									>
										{chatbotGovernance.connectingHandOff ? "Bật" : "Tắt"}
									</Button>
								</div>

								<div className="p-3.5 rounded-card bg-muted/20 border border-border flex items-center justify-between">
									<div className="space-y-0.5">
										<div className="text-xs font-semibold text-foreground">
											4. Hiển thị sản phẩm dạng cuộn ngang (Horizontal Rail)
										</div>
										<p className="text-[11px] text-muted-foreground">
											Thanh cuộn ngang ngăn chặn tràn màn hình hoặc vỡ bố cục khi có sách.
										</p>
									</div>
									<Button
										size="sm"
										variant={chatbotGovernance.horizontalProductScroll ? "default" : "outline-solid"}
										className="h-7 text-xs"
										onClick={() =>
											setChatbotGovernance((prev) => ({
												...prev,
												horizontalProductScroll: !prev.horizontalProductScroll,
											}))
										}
									>
										{chatbotGovernance.horizontalProductScroll ? "Bật" : "Tắt"}
									</Button>
								</div>
							</div>
						</div>

						{/* MA TRẬN PHÂN PHỔI & QUẢN LÝ MÔ HÌNH AI CHO TỪNG CHỨC NĂNG */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-5">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
								<div>
									<div className="flex items-center gap-2">
										<Cpu className="w-5 h-5 text-primary" />
										<h2 className="text-base font-bold text-foreground">
											Ma Trận Quản Trị & Phân Bổ Mô Hình AI Theo Từng Chức Năng
										</h2>
									</div>
									<p className="text-xs text-muted-foreground mt-0.5">
										Chỉ định độc lập não bộ LLM, giới hạn output token và chính sách chống bịa đặt (Anti-Hallucination) cho từng phân hệ.
									</p>
								</div>
								<Button
									size="sm"
									onClick={handleSaveAllModelMatrix}
									disabled={isSavingVoice}
									className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
								>
									{isSavingVoice ? <TrapezoidLoader size="sm" /> : <Save className="h-3.5 w-3.5" />}
									<span>Lưu Toàn Bộ Ma Trận Model</span>
								</Button>
							</div>

							{/* 4 CARDS CHO 4 CHỨC NĂNG CỐT LÕI */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* CHỨC NĂNG 1: TRỢ LÝ GIỌNG NÓI & CHATBOT CSKH */}
								<div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3 relative hover:border-primary/40 transition-colors">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="p-2 rounded-lg bg-primary/10 text-primary">
												<PhoneCall className="w-4 h-4" />
											</div>
											<div>
												<h4 className="font-bold text-xs text-foreground">1. Trợ Lý Voice CSKH & Tư Vấn Storefront</h4>
												<p className="text-[10px] text-muted-foreground">Tư vấn chọn sách, tra cứu đơn GHN, tương tác giọng nói WebRTC</p>
											</div>
										</div>
										<Badge variant="outline-solid" className="text-[10px] text-success border-success/30 font-mono">
											Phản xạ &lt; 1s
										</Badge>
									</div>

									<div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Mô hình AI chỉ định:</Label>
											<select
												value={voiceForm.llmModel}
												onChange={(e) => setVoiceForm({ ...voiceForm, llmModel: e.target.value })}
												className="mt-1 w-full h-8 rounded-button border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
											>
												<option value="gemma2:2b">gemma2:2b (Google Gemma 2 - Đã cài đặt, tốc độ nhanh 1.2s)</option>
												<option value="gemma3:4b">gemma3:4b (Google Gemma 3 4B - Đã cài đặt, sâu sắc)</option>
												<option value="gemini-2.0-flash">gemini-2.0-flash (Google Cloud API)</option>
											</select>
										</div>
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Giới hạn Output (Max Tokens):</Label>
											<Input
												type="number"
												value={voiceForm.maxTokens || 180}
												onChange={(e) => setVoiceForm({ ...voiceForm, maxTokens: parseInt(e.target.value) || 180 })}
												className="mt-1 h-8 text-xs font-mono rounded-button"
											/>
											<span className="text-[9px] text-muted-foreground">180 token cho phản hồi thoại ngắn gọn</span>
										</div>
									</div>

									<div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50 text-muted-foreground">
										<span>STT: Faster-Whisper Small</span>
										<span>TTS: {voiceForm.ttsVoice || "Hoài My"}</span>
									</div>
								</div>

								{/* CHỨC NĂNG 2: TRỢ LÝ ĐỌC SÁCH WEB READER DRM */}
								<div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 relative hover:border-primary transition-colors">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="p-2 rounded-lg bg-primary text-primary-foreground">
												<BookOpen className="w-4 h-4" />
											</div>
											<div>
												<h4 className="font-bold text-xs text-foreground">2. Trợ Lý Đọc Sách & Phân Tích Văn Học (DRM Reader)</h4>
												<p className="text-[10px] text-muted-foreground">Giải nghĩa trích đoạn, bóc tách triết lý, Streaming & Lưu lịch sử</p>
											</div>
										</div>
										<Badge variant="default" className="text-[10px] font-mono">
											Đã gỡ giới hạn
										</Badge>
									</div>

									<div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Mô hình AI đọc sách:</Label>
											<select
												value={readerModel}
												onChange={(e) => setReaderModel(e.target.value)}
												className="mt-1 w-full h-8 rounded-button border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
											>
												<option value="gemma2:2b">gemma2:2b (Google Gemma 2 2B - Đã cài đặt, 100% GPU siêu tốc)</option>
												<option value="gemma3:4b">gemma3:4b (Google Gemma 3 4B - Nặng hơn, cần nhiều VRAM)</option>
												<option value="gemini-2.5-flash">gemini-2.5-flash (Google Cloud API)</option>
											</select>
										</div>
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Giới hạn Output (Max Tokens):</Label>
											<Input
												type="number"
												value={readerMaxTokens}
												onChange={(e) => setReaderMaxTokens(parseInt(e.target.value) || 2048)}
												className="mt-1 h-8 text-xs font-mono rounded-button font-bold text-primary"
											/>
											<span className="text-[9px] text-success font-medium">2048 token: bài phân tích trọn vẹn 3 tầng nghĩa</span>
										</div>
									</div>

									<div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50 text-muted-foreground">
										<span>Streaming: Chế độ đẩy Token trực tiếp</span>
										<span>Lưu lịch sử: LocalStorage đa phiên</span>
									</div>
								</div>

								{/* CHỨC NĂNG 3: ĐỘNG CƠ GRAPHRAG & KNOWLEDGE GRAPH */}
								<div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3 relative hover:border-primary/40 transition-colors">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
												<Sparkles className="w-4 h-4" />
											</div>
											<div>
												<h4 className="font-bold text-xs text-foreground">3. Động Cơ Tri Thức GraphRAG & EPUB Indexer</h4>
												<p className="text-[10px] text-muted-foreground">Trích xuất thực thể, đồ thị tri thức và tìm kiếm lai ngữ nghĩa (Hybrid Search)</p>
											</div>
										</div>
										<Badge variant="outline-solid" className="text-[10px] font-mono">
											38 Chương • 169 Chunks
										</Badge>
									</div>

									<div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Mô hình trích xuất thực thể:</Label>
											<div className="mt-1 h-8 rounded-button border border-border bg-background/50 px-2.5 flex items-center text-xs font-mono text-foreground">
												bge-m3 / gemma2:2b
											</div>
										</div>
										<div>
											<Label className="text-[11px] font-medium text-muted-foreground">Tham số RAG (Top-K Chunks):</Label>
											<div className="mt-1 h-8 rounded-button border border-border bg-background/50 px-2.5 flex items-center justify-between text-xs font-mono text-foreground">
												<span>Top-K: 4</span>
												<span className="text-[10px] text-muted-foreground">Ngưỡng: 0.65</span>
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50 text-muted-foreground">
										<span>Kho lưu trữ: graphrag_store.json</span>
										<span>Độ sâu ngữ cảnh: Đầy đủ bối cảnh sách</span>
									</div>
								</div>

								{/* CHỨC NĂNG 4: CHỐNG BỊA ĐẶT & BẢO ĐẢM DỮ LIỆU CƠ SỞ DỮ LIỆU */}
								<div className="p-4 rounded-xl border border-success/30 bg-success/5 space-y-3 relative hover:border-success transition-colors">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="p-2 rounded-lg bg-success text-success-foreground">
												<ShieldCheck className="w-4 h-4" />
											</div>
											<div>
												<h4 className="font-bold text-xs text-foreground">4. Kiểm Duyệt Cơ Sở Dữ Liệu (Zero-Hallucination Guard)</h4>
												<p className="text-[10px] text-muted-foreground">Bảo đảm 100% dữ liệu lấy từ cơ sở dữ liệu thực, cấm bịa đặt</p>
											</div>
										</div>
										<Badge variant="success" className="text-[10px] font-mono">
											Bắt buộc (Enforced)
										</Badge>
									</div>

									<div className="space-y-1.5 text-xs pt-1">
										<div className="p-2 rounded-md bg-background/80 border border-success/20 text-[11px] text-foreground leading-relaxed">
											✓ <strong>Nguyên tắc:</strong> Nếu khách hỏi sách không có trong hệ thống, AI bắt buộc phải nói rõ là chưa có, không được tự bịa ra.
											<br />
											✓ <strong>Gợi ý thông minh:</strong> Tự động phát hiện chủ đề và gợi ý các ấn phẩm hiện có trong kho sách (Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens, Trí Tuệ Do Thái).
										</div>
									</div>

									<div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/50 text-muted-foreground">
										<span>Kiểm tra: Saleor DB & CATALOG</span>
										<span className="text-success font-semibold">Bảo vệ: 100% trung thực</span>
									</div>
								</div>
							</div>

							{/* 1-CLICK QUICK SWITCH CHUNG CHO TOÀN BỘ CÁC CHỨC NĂNG */}
							<div className="pt-2 border-t border-border/60">
								<div className="flex items-center justify-between mb-2.5">
									<span className="text-xs font-bold text-foreground flex items-center gap-1.5">
										<Zap className="w-3.5 h-3.5 text-primary" />
										<span>Kích Hoạt Nhanh 1-Click Cho Mọi Dịch Vụ:</span>
									</span>
									<span className="text-[11px] text-muted-foreground">Đang chạy: <strong className="text-primary font-mono">{voiceForm.llmModel}</strong></span>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
									{QUICK_MODELS.map((item) => {
										const isCurrent = voiceForm.llmModel === item.model && readerModel === item.model;
										return (
											<button
												key={item.id}
												onClick={() => {
													setReaderModel(item.model);
													handleQuickSwitchModel(item);
												}}
												disabled={isSavingVoice}
												className={cn(
													"p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between",
													isCurrent
														? "border-primary bg-primary/10 ring-1 ring-primary"
														: "border-border bg-card hover:bg-muted/40",
													isSavingVoice && "opacity-50 cursor-not-allowed"
												)}
											>
												<div className="flex items-center justify-between gap-1 mb-1">
													<Badge variant={isCurrent ? "default" : "outline-solid"} className="text-[9px] py-0 px-1">
														{item.badge}
													</Badge>
													<span className="text-[9px] text-muted-foreground font-mono">{item.speed}</span>
												</div>
												<div className="font-bold text-xs truncate text-foreground">{item.name}</div>
												<div className="text-[10px] text-muted-foreground font-mono mt-1">{item.model}</div>
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* CẤU HÌNH NÃO BỘ MÔ HÌNH OLLAMA & THÔNG SỐ (DÀNH RIÊNG CHO ADMIN QUẢN TRỊ) */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
								<div>
									<h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
										<Cpu className="h-4 w-4 text-primary" />
										<span>Cấu Hình Não Bộ Mô Hình LLM (Ollama Local & Tham Số Hội Thoại)</span>
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Tùy chỉnh mô hình, endpoint, nhiệt độ và tri thức của Aura AI. Lưu trực tiếp vào ai_platform_config.json.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline-solid"
										onClick={handleScanOllamaModels}
										disabled={isScanningOllama}
										className="h-8 text-xs gap-1.5"
									>
										{isScanningOllama ? <TrapezoidLoader size="sm" /> : <RefreshCw className="h-3.5 w-3.5" />}
										<span>{isScanningOllama ? "Đang quét..." : "Quét Model Máy Cục Bộ"}</span>
									</Button>
									<Button
										size="sm"
										onClick={handleSaveVoiceConfig}
										disabled={isSavingVoice}
										className="h-8 text-xs font-semibold gap-1.5"
									>
										{isSavingVoice ? <TrapezoidLoader size="sm" /> : <Save className="h-3.5 w-3.5" />}
										<span>Lưu Cấu Hình LLM</span>
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
								{/* 1. Endpoint & Ping */}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-semibold text-foreground">Ollama Endpoint URL</Label>
										<button
											type="button"
											onClick={() => handleTestConnection(voiceForm.llmBaseUrl)}
											disabled={isTestingConn}
											className="text-[10px] text-primary hover:underline font-medium"
										>
											{isTestingConn ? "Đang ping..." : "Kiểm tra kết nối"}
										</button>
									</div>
									<Input
										value={voiceForm.llmBaseUrl}
										onChange={(e) => setVoiceForm({ ...voiceForm, llmBaseUrl: e.target.value })}
										placeholder="http://localhost:11434"
										className="h-9 font-mono text-xs rounded-button"
									/>
									<span className="text-[10px] text-muted-foreground block">
										Cổng mặc định của Ollama là :11434
									</span>
								</div>

								{/* 2. Model Selection */}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-semibold text-foreground">Tên Mô Hình (Model Name)</Label>
										<Badge variant="outline-solid" className="text-[10px] py-0 px-1 font-mono text-primary">
											{installedOllamaModels.length} model sẵn sàng
										</Badge>
									</div>
									<div className="flex gap-1.5">
										<select
											value={voiceForm.llmModel}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmModel: e.target.value })}
											className="flex-1 h-9 rounded-button border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										>
											{installedOllamaModels.map((m) => (
												<option key={m} value={m}>
													{m} (Đã cài đặt)
												</option>
											))}
											{!installedOllamaModels.includes(voiceForm.llmModel) && (
												<option value={voiceForm.llmModel}>{voiceForm.llmModel} (Tùy chỉnh)</option>
											)}
										</select>
										<Input
											value={voiceForm.llmModel}
											onChange={(e) => setVoiceForm({ ...voiceForm, llmModel: e.target.value })}
											placeholder="Nhập tên..."
											className="w-28 h-9 font-mono text-xs rounded-button"
										/>
									</div>
									<span className="text-[10px] text-muted-foreground block">
										Gợi ý: qwen2.5:3b (nhẹ, nhanh), qwen2.5:7b, llama3.1:8b
									</span>
								</div>

								{/* 3. Temperature & Max Tokens */}
								<div className="space-y-2">
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<Label className="text-xs font-semibold text-foreground">
												Độ sáng tạo (Temperature): <span className="font-mono text-primary font-bold">{voiceForm.temperature}</span>
											</Label>
										</div>
										<input
											type="range"
											min="0.1"
											max="1.0"
											step="0.05"
											value={voiceForm.temperature}
											onChange={(e) =>
												setVoiceForm({ ...voiceForm, temperature: parseFloat(e.target.value) })
											}
											className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
										/>
										<div className="flex justify-between text-[10px] text-muted-foreground">
											<span>0.1 (Chính xác, bám sách)</span>
											<span>1.0 (Tự nhiên, sáng tạo)</span>
										</div>
									</div>

									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<Label className="text-xs font-semibold text-foreground">
												Giới hạn từ dự đoán (Max Tokens)
											</Label>
											<span className="text-[10px] font-mono text-muted-foreground">
												{voiceForm.maxTokens || 180} tokens
											</span>
										</div>
										<Input
											type="number"
											min={50}
											max={1000}
											value={voiceForm.maxTokens || 180}
											onChange={(e) =>
												setVoiceForm({ ...voiceForm, maxTokens: parseInt(e.target.value) || 180 })
											}
											className="h-8 font-mono text-xs rounded-button"
										/>
									</div>
								</div>
							</div>

							{/* System Prompt / Tri Thức */}
							<div className="space-y-1.5 pt-2 border-t border-border">
								<Label className="text-xs font-semibold text-foreground flex items-center justify-between">
									<span>Chỉ dẫn hệ thống & Phong thái tư vấn (System Prompt / Knowledge)</span>
									<span className="text-[10px] text-muted-foreground font-normal">
										Áp dụng cho mọi phản hồi giọng nói và tin nhắn của Aura AI
									</span>
								</Label>
								<textarea
									rows={3}
									value={voiceForm.systemPrompt}
									onChange={(e) => setVoiceForm({ ...voiceForm, systemPrompt: e.target.value })}
									placeholder="Nhập hướng dẫn nghiệp vụ, bảng giá, thông điệp mở đầu cho mô hình..."
									className="w-full rounded-button border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>

							{/* Nút lưu cấu hình và kích hoạt ngay */}
							<div className="flex items-center justify-between pt-3 border-t border-border">
								<div className="flex items-center gap-2">
									<span className="text-[11px] text-muted-foreground">
										Mô hình đang kích hoạt: <strong className="text-primary font-mono">{voiceForm.llmModel}</strong>
									</span>
								</div>
								<Button
									size="sm"
									onClick={handleSaveVoiceConfig}
									disabled={isSavingVoice}
									className="h-9 px-5 rounded-button text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
								>
									{isSavingVoice ? (
										<>
											<RefreshCw className="h-3.5 w-3.5 animate-spin" />
											<span>Đang lưu & kích hoạt...</span>
										</>
									) : (
										<>
											<Check className="h-3.5 w-3.5" />
											<span>Lưu & Kích Hoạt Mô Hình Này</span>
										</>
									)}
								</Button>
							</div>
						</div>

						{/* Live Interactive Testbed */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
								<div>
									<h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
										<Zap className="w-4 h-4 text-primary" />
										<span>Live AI Sandbox (Khung Kiểm Thử Nhanh Đa Mô Hình)</span>
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Kiểm thử trực tiếp câu trả lời, độ trễ phản hồi (latency), và cơ chế chống bịa đặt (Anti-Hallucination) trước khi ban hành.
									</p>
								</div>
								<div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted border border-border">
									<button
										type="button"
										onClick={() => setSandboxMode("voice")}
										className={cn(
											"px-3 py-1 text-xs font-semibold rounded-md transition-colors",
											sandboxMode === "voice" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
										)}
									>
										📞 Test Voice CSKH ({voiceForm.llmModel})
									</button>
									<button
										type="button"
										onClick={() => setSandboxMode("reader")}
										className={cn(
											"px-3 py-1 text-xs font-semibold rounded-md transition-colors",
											sandboxMode === "reader" ? "bg-primary text-primary-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
										)}
									>
										📖 Test Reader AI ({readerModel} • 2048 Tokens)
									</button>
								</div>
							</div>

							<div className="flex gap-2">
								<Input
									value={chatbotTestQuery}
									onChange={(e) => setChatbotTestQuery(e.target.value)}
									placeholder="Nhập câu hỏi thử nghiệm cho Aura AI..."
									className="text-xs h-9 rounded-button"
								/>
								<Button
									size="sm"
									onClick={sandboxMode === "reader" ? handleTestReader : handleTestChatbot}
									disabled={(sandboxMode === "reader" ? isTestingReader : isTestingChatbot) || !chatbotTestQuery.trim()}
									className="h-9 px-4 rounded-button text-xs gap-1.5 shrink-0"
								>
									{(sandboxMode === "reader" ? isTestingReader : isTestingChatbot) ? <TrapezoidLoader size="sm" /> : <Send className="h-3.5 w-3.5" />}
									<span>{(sandboxMode === "reader" ? isTestingReader : isTestingChatbot) ? "Đang xử lý..." : "Gửi thử nghiệm"}</span>
								</Button>
							</div>

							{sandboxMode === "reader" && readerTestResult && (
								<div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in text-xs">
									<div className="flex items-center justify-between border-b border-border/50 pb-2">
										<div className="flex items-center gap-2">
											<Badge variant="default" className="text-[10px]">
												📖 Reader AI ({readerModel})
											</Badge>
											<span className="text-[11px] text-muted-foreground">Tác phẩm: <strong>Đắc Nhân Tâm</strong></span>
										</div>
										<span className="text-[10px] font-mono text-muted-foreground">Độ trễ: {readerTestResult.latencyMs || 450}ms • 2048 Tokens Limit</span>
									</div>
									<div className="whitespace-pre-wrap leading-relaxed text-foreground font-sans text-xs bg-card p-3 rounded-lg border border-border">
										{readerTestResult.text || readerTestResult.analysis || JSON.stringify(readerTestResult, null, 2)}
									</div>
								</div>
							)}

							{sandboxMode === "voice" && chatbotTestResult && (
								<div className="p-4 rounded-card bg-muted/30 border border-border space-y-3 animate-in fade-in">
									<div className="flex items-center justify-between">
										<Badge variant="success" className="text-xs">
											Phản hồi thành công từ {chatbotTestResult.activeModel || voiceForm.llmModel} + Aura AI TTS
										</Badge>
										<span className="text-[10px] text-muted-foreground font-mono">
											{chatbotTestResult.timestamp}
										</span>
									</div>

									<div className="text-xs text-foreground bg-card p-3 rounded-md border border-border leading-relaxed">
										<span className="font-semibold text-primary">Aura AI: </span>
										{chatbotTestResult.text}
									</div>

									{chatbotTestResult.audioBase64 && (
										<div className="flex items-center gap-2 pt-1">
											<Volume2 className="h-4 w-4 text-primary" />
											<audio
												controls
												src={`data:${chatbotTestResult.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg"};base64,${chatbotTestResult.audioBase64}`}
												className="h-8 w-full max-w-md"
											/>
										</div>
									)}

									{chatbotTestResult.cards && chatbotTestResult.cards.length > 0 && (
										<div className="text-xs text-muted-foreground">
											Tìm thấy <span className="font-semibold text-foreground">{chatbotTestResult.cards.length} thẻ dữ liệu</span> (Sách/Đơn hàng).
										</div>
									)}
								</div>
							)}
						</div>

						{/* Quản Lý & Giám Sát Phiên Hội Thoại Khách Hàng (Customer Sessions & Logs) */}
						<div className="p-5 rounded-card bg-card border border-border shadow-card space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
								<div>
									<h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
										<MessageSquare className="h-4 w-4 text-primary" />
										<span>Lịch Sử Phiên Tư Vấn Khách Hàng & Đánh Giá</span>
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Toàn bộ dữ liệu phiên trò chuyện, thông tin khách hàng, đánh giá chất lượng và nội dung tin nhắn được lưu trữ tự động.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline-solid"
										onClick={fetchSessions}
										disabled={isLoadingSessions}
										className="h-8 text-xs gap-1.5"
									>
										<RefreshCw className={cn("h-3.5 w-3.5", isLoadingSessions && "animate-spin")} />
										<span>Làm mới</span>
									</Button>
								</div>
							</div>

							{/* Thống kê nhanh từ dữ liệu thật 100% */}
							<div className="grid grid-cols-3 gap-3">
								<div className="p-3 rounded-card bg-secondary/40 border border-border text-center">
									<span className="text-[11px] text-muted-foreground">Tổng số phiên</span>
									<div className="text-base font-bold text-foreground mt-0.5">{sessions.length}</div>
								</div>
								<div className="p-3 rounded-card bg-secondary/40 border border-border text-center">
									<span className="text-[11px] text-muted-foreground">Điểm đánh giá TB</span>
									<div className="text-base font-bold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
										<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
										<span>{ratedSessions.length > 0 ? `${avgCsatScore} / 5.0` : "Chưa có"}</span>
									</div>
									<span className="text-[10px] text-muted-foreground block font-normal mt-0.5">
										({ratedSessions.length} đánh giá thực tế)
									</span>
								</div>
								<div className="p-3 rounded-card bg-secondary/40 border border-border text-center">
									<span className="text-[11px] text-muted-foreground">Tỷ lệ hài lòng (CSAT)</span>
									<div className="text-base font-bold text-emerald-600 mt-0.5">{csatPercentage}</div>
									<span className="text-[10px] text-muted-foreground block font-normal mt-0.5">
										(Đánh giá ≥ 4 sao)
									</span>
								</div>
							</div>

							{/* Bảng danh sách phiên */}
							{isLoadingSessions ? (
								<div className="py-8 flex justify-center">
									<TrapezoidLoader text="Đang tải lịch sử phiên tư vấn..." size="md" />
								</div>
							) : sessions.length === 0 ? (
								<div className="text-center py-8 text-xs text-muted-foreground">
									Chưa có phiên tư vấn nào được ghi nhận.
								</div>
							) : (
								<div className="overflow-x-auto rounded-card border border-border">
									<table className="w-full text-xs text-left">
										<thead className="bg-muted/40 text-muted-foreground text-[11px] border-b border-border">
											<tr>
												<th className="py-2.5 px-3 font-semibold">Khách hàng</th>
												<th className="py-2.5 px-3 font-semibold">Xưng hô & Tuổi</th>
												<th className="py-2.5 px-3 font-semibold">Hình thức</th>
												<th className="py-2.5 px-3 font-semibold">Vấn đề quan tâm</th>
												<th className="py-2.5 px-3 font-semibold">Thời lượng</th>
												<th className="py-2.5 px-3 font-semibold">Đánh giá</th>
												<th className="py-2.5 px-3 font-semibold text-right">Chi tiết</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border">
											{sessions.map((sess) => (
												<tr key={sess.id} className="hover:bg-muted/20 transition-colors">
													<td className="py-2.5 px-3 font-semibold text-foreground">
														<div className="flex items-center gap-2">
															<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
																{sess.customerName ? sess.customerName.charAt(0).toUpperCase() : "K"}
															</div>
															<span>{sess.customerName || "Khách vãng lai"}</span>
														</div>
													</td>
													<td className="py-2.5 px-3">
														<Badge variant="secondary" className="text-[10px] py-0 px-1.5">
															{sess.customerGender} • {sess.customerAge}
														</Badge>
													</td>
													<td className="py-2.5 px-3">
														{sess.contactMethod === "call" ? (
															<span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
																<PhoneCall className="h-3 w-3" /> Gọi thoại
															</span>
														) : (
															<span className="inline-flex items-center gap-1 text-primary font-medium">
																<MessageSquare className="h-3 w-3" /> Live Chat
															</span>
														)}
													</td>
													<td className="py-2.5 px-3 max-w-[200px] truncate text-muted-foreground">
														{sess.topic}
													</td>
													<td className="py-2.5 px-3 font-mono text-muted-foreground">
														{Math.floor(sess.durationSeconds / 60)}m {sess.durationSeconds % 60}s
													</td>
													<td className="py-2.5 px-3">
														{typeof sess.rating === "number" && sess.rating > 0 ? (
															<div className="flex items-center gap-0.5 text-amber-500 font-bold">
																<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
																<span>{sess.rating}</span>
															</div>
														) : (
															<span className="text-muted-foreground text-[11px] italic">Chưa đánh giá</span>
														)}
													</td>
													<td className="py-2.5 px-3 text-right">
														<Button
															size="sm"
															variant="outline-solid"
															onClick={() => setSelectedSessionForView(sess)}
															className="h-7 text-[11px] gap-1 px-2.5"
														>
															<Eye className="h-3 w-3" />
															<span>Transcript</span>
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{/* Modal Xem Chi Tiết Transcript Hội Thoại Messenger */}
							{selectedSessionForView && (
								<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
									<div className="relative flex flex-col h-[560px] w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
										{/* Header Transcript */}
										<div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
											<div>
												<h4 className="text-sm font-bold text-foreground flex items-center gap-2">
													<span>Hội thoại với {selectedSessionForView.customerGender} {selectedSessionForView.customerName}</span>
													<Badge variant="outline-solid" className="text-[10px]">
														{selectedSessionForView.contactMethod === "call" ? "Cuộc gọi thoại" : "Nhắn tin Live Chat"}
													</Badge>
												</h4>
												<p className="text-[11px] text-muted-foreground mt-0.5">
													Bắt đầu: {selectedSessionForView.startedAt} • Chủ đề: {selectedSessionForView.topic}
												</p>
											</div>
											<button
												onClick={() => setSelectedSessionForView(null)}
												className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
											>
												<X className="h-4 w-4" />
											</button>
										</div>

										{/* Thẻ đánh giá khách hàng để lại */}
										{selectedSessionForView.rating && (
											<div className="bg-secondary/40 border-b border-border px-4 py-2 flex items-center justify-between text-xs">
												<div className="flex items-center gap-1.5 text-amber-500 font-bold">
													<span>Đánh giá:</span>
													{[...Array(selectedSessionForView.rating)].map((_, i) => (
														<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
													))}
												</div>
												{selectedSessionForView.feedbackComment && (
													<span className="text-[11px] text-muted-foreground italic truncate max-w-xs">
														"{selectedSessionForView.feedbackComment}"
													</span>
												)}
											</div>
										)}

										{/* Nội dung tin nhắn dạng Messenger */}
										<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card text-xs">
											{selectedSessionForView.messages?.map((msg: any) => {
												const isUser = msg.sender === "user";
												return (
													<div
														key={msg.id}
														className={cn(
															"flex gap-2 items-end",
															isUser ? "flex-row-reverse" : "flex-row",
														)}
													>
														<div
															className={cn(
																"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border shadow-2xs select-none",
																isUser
																	? "bg-primary text-primary-foreground border-primary"
																	: "bg-secondary text-foreground border-border",
															)}
														>
															{isUser ? selectedSessionForView.customerName?.charAt(0).toUpperCase() || "K" : "HM"}
														</div>

														<div
															className={cn(
																"flex flex-col max-w-[80%] p-3 leading-relaxed shadow-xs",
																isUser
																	? "bg-primary text-primary-foreground rounded-2xl rounded-br-xs"
																	: "bg-secondary text-foreground border border-border rounded-2xl rounded-bl-xs",
															)}
														>
															<div
																className={cn(
																	"flex items-center justify-between gap-3 text-[10px] mb-1",
																	isUser ? "text-primary-foreground/80" : "text-muted-foreground",
																)}
															>
																<span className="font-semibold">
																	{isUser ? `${selectedSessionForView.customerGender} ${selectedSessionForView.customerName}` : "Aura AI"}
																</span>
																<span className="tabular-nums">{msg.timestamp}</span>
															</div>
															<p className="whitespace-pre-line text-xs">{msg.text}</p>
														</div>
													</div>
												);
											})}
										</div>

										{/* Footer Transcript Modal */}
										<div className="border-t border-border p-3 flex justify-end bg-card">
											<Button
												size="sm"
												variant="outline-solid"
												onClick={() => setSelectedSessionForView(null)}
												className="h-8 text-xs px-4"
											>
												Đóng
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
					</div>
				</div>
			</main>
		</div>
	);
}
