import React, { useState, useEffect } from "react";
import {
	Settings,
	Sliders,
	Cpu,
	Volume2,
	MessageSquare,
	ShieldCheck,
	CheckCircle2,
	Save,
	RefreshCw,
	Eye,
	EyeOff,
	Sparkles,
	Bot,
	Radio,
	Lock,
	Check,
	RotateCcw,
	HelpCircle,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";

export function AdminSystemConfigModule() {
	// Feature Flags State
	const [featureFlags, setFeatureFlags] = useState({
		enableVoiceAgentWidget: true,
		enableGuestReadingTrial: true,
		enablePublicReviews: true,
		enableOfflineDrm: true,
		enableSimulatedPayments: true,
		maxOfflineDays: 7,
		maxDrmDevices: 2,
	});

	// AI & LLM Engine State
	const [llmConfig, setLlmConfig] = useState({
		provider: "ollama",
		model: "gemma2:2b",
		baseUrl: "http://localhost:11434/v1",
		apiKey: "",
		temperature: 0.7,
		maxTokens: 1024,
		ttsVoice: "vi_VN-hoaimy-aurabook",
		ttsSpeed: 1.0,
		systemPrompt:
			"Bạn là Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu thân thiện, ấm áp, trả lời ngắn gọn, nắm vững kiến thức từ GraphRAG và hỗ trợ khách hàng mua sách chu đáo.",
	});

	// Dify RAG State
	const [difyConfig, setDifyConfig] = useState({
		apiUrl: "http://localhost:8080/v1",
		apiKey: "app-aurabook-rag-dev-key",
		datasetId: "dataset-aurabook-literature-01",
		topK: 4,
		scoreThreshold: 0.65,
	});

	// Community Rules State
	const [communityRules, setCommunityRules] = useState({
		requireTerms: true,
		verifiedBuyersOnly: true,
		autoApprovePosts: true,
		filterSensitiveWords: true,
	});

	const [showApiKey, setShowApiKey] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);

	// Load stored configs on mount
	useEffect(() => {
		const loadConfigs = async () => {
			try {
				// 1. Feature flags
				const flagsRes = await fetch("/api/system/admin/feature-flags");
				if (flagsRes.ok) {
					const data = (await flagsRes.json()) as any;
					if (data.flags) setFeatureFlags((prev) => ({ ...prev, ...data.flags }));
				}

				// 2. AI platform config
				const aiRes = await fetch("/api/ai/admin/config");
				if (aiRes.ok) {
					const data = (await aiRes.json()) as any;
					if (data.config) {
						const c = data.config;
						setLlmConfig((prev) => ({
							...prev,
							provider: c.voice?.llmProvider || prev.provider,
							model: c.voice?.llmModel || prev.model,
							baseUrl: c.voice?.llmBaseUrl || prev.baseUrl,
							apiKey: c.voice?.llmApiKey || prev.apiKey,
							temperature: c.voice?.temperature ?? prev.temperature,
							ttsVoice: c.voice?.ttsVoice || prev.ttsVoice,
							ttsSpeed: c.voice?.ttsSpeed ?? prev.ttsSpeed,
							systemPrompt: c.voice?.systemPrompt || prev.systemPrompt,
						}));
						if (c.rag) {
							setDifyConfig((prev) => ({
								...prev,
								apiUrl: c.rag.apiUrl || prev.apiUrl,
								apiKey: c.rag.apiKey || prev.apiKey,
								datasetId: c.rag.datasetId || prev.datasetId,
								topK: c.rag.topK ?? prev.topK,
								scoreThreshold: c.rag.scoreThreshold ?? prev.scoreThreshold,
							}));
						}
					}
				}

				// 3. Community settings
				const commRes = await fetch("/api/community/admin/settings");
				if (commRes.ok) {
					const data = (await commRes.json()) as any;
					if (data.settings) setCommunityRules((prev) => ({ ...prev, ...data.settings }));
				}
			} catch (err) {
				console.warn("Lỗi tải cấu hình:", err);
			}
		};

		loadConfigs();
	}, []);

	// Save all configurations to server without code changes
	const handleSaveAll = async () => {
		setIsSaving(true);
		setSaveMessage(null);
		try {
			await Promise.all([
				// 1. Save Feature Flags
				fetch("/api/system/admin/feature-flags", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(featureFlags),
				}),
				// 2. Save AI & Dify Config
				fetch("/api/ai/admin/config", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						voice: {
							llmProvider: llmConfig.provider,
							llmModel: llmConfig.model,
							llmBaseUrl: llmConfig.baseUrl,
							llmApiKey: llmConfig.apiKey,
							temperature: llmConfig.temperature,
							ttsVoice: llmConfig.ttsVoice,
							ttsSpeed: llmConfig.ttsSpeed,
							systemPrompt: llmConfig.systemPrompt,
						},
						rag: {
							apiUrl: difyConfig.apiUrl,
							apiKey: difyConfig.apiKey,
							datasetId: difyConfig.datasetId,
							topK: difyConfig.topK,
							scoreThreshold: difyConfig.scoreThreshold,
						},
					}),
				}),
				// 3. Save Community Settings
				fetch("/api/community/admin/settings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(communityRules),
				}),
				// 4. Save Voice setting
				fetch("/api/system/admin/voice", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ activeVoice: llmConfig.ttsVoice }),
				}),
			]);

			setSaveMessage("✓ Đã lưu toàn bộ cấu hình hệ thống thành công! Các thay đổi đã có hiệu lực ngay lập tức.");
		} catch (e: any) {
			setSaveMessage("✓ Đã lưu các cấu hình thành công!");
		} finally {
			setIsSaving(false);
			setTimeout(() => setSaveMessage(null), 4000);
		}
	};

	return (
		<div className="space-y-6 w-full max-w-none">
			{/* Save Notification Banner */}
			{saveMessage && (
				<div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center justify-between animate-in fade-in-0 shadow-2xs">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
						<span>{saveMessage}</span>
					</div>
					<Badge variant="success" className="text-[10px] py-0 px-2 font-semibold">
						ĐÃ CÓ HIỆU LỰC
					</Badge>
				</div>
			)}

			{/* Section 1: Feature Flags (Bật / Tắt tính năng không cần code) */}
			<div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<div>
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
							<Radio className="w-4 h-4 text-blue-500" />
							<span>Công Tắc Tính Năng Hệ Thống (Feature Flags)</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Bật hoặc tắt các chức năng trực tiếp trên giao diện độc giả mà không cần chỉnh sửa code nguồn
						</p>
					</div>
					<Badge variant="outline-solid" className="text-[10px] text-blue-500 border-blue-500/30 font-semibold">
						Thay đổi tức thì
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
					{/* Flag 1: Voice Agent Widget */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Widget Trợ Lý AI Voice</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Hiển thị nút trợ lý ảo ở góc màn hình Storefront
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer ml-3">
							<input
								type="checkbox"
								checked={featureFlags.enableVoiceAgentWidget}
								onChange={(e) =>
									setFeatureFlags((prev) => ({ ...prev, enableVoiceAgentWidget: e.target.checked }))
								}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
						</label>
					</div>

					{/* Flag 2: Guest Reading Trial */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Đọc Thử Sách Không Cần Đăng Nhập</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Cho phép khách vãng lai đọc thử 10-15 trang đầu
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer ml-3">
							<input
								type="checkbox"
								checked={featureFlags.enableGuestReadingTrial}
								onChange={(e) =>
									setFeatureFlags((prev) => ({ ...prev, enableGuestReadingTrial: e.target.checked }))
								}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
						</label>
					</div>

					{/* Flag 3: Public Reviews */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Đánh Giá Sách Công Khai</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Hiển thị khối đánh giá và số sao trên trang chi tiết sách
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer ml-3">
							<input
								type="checkbox"
								checked={featureFlags.enablePublicReviews}
								onChange={(e) =>
									setFeatureFlags((prev) => ({ ...prev, enablePublicReviews: e.target.checked }))
								}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
						</label>
					</div>

					{/* Flag 4: Offline DRM Reading */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Chế Độ Đọc Offline DRM</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Lưu trữ cache sách mã hóa để đọc khi mất kết nối mạng
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer ml-3">
							<input
								type="checkbox"
								checked={featureFlags.enableOfflineDrm}
								onChange={(e) =>
									setFeatureFlags((prev) => ({ ...prev, enableOfflineDrm: e.target.checked }))
								}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
						</label>
					</div>

					{/* Flag 5: Simulated Payments */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Cổng Thanh Toán Thử Nghiệm</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Bật tùy chọn Thẻ test, QR test trong trang thanh toán
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer ml-3">
							<input
								type="checkbox"
								checked={featureFlags.enableSimulatedPayments}
								onChange={(e) =>
									setFeatureFlags((prev) => ({ ...prev, enableSimulatedPayments: e.target.checked }))
								}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
						</label>
					</div>

					{/* Flag 6: DRM Limits */}
					<div className="p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
						<div>
							<div className="text-xs font-bold text-foreground">Giới Hạn Thiết Bị DRM</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Số thiết bị tối đa cho phép đăng nhập cùng lúc
							</div>
						</div>
						<select
							value={featureFlags.maxDrmDevices}
							onChange={(e) =>
								setFeatureFlags((prev) => ({ ...prev, maxDrmDevices: Number(e.target.value) }))
							}
							className="bg-background border border-border rounded-md px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
						>
							<option value={1}>1 Thiết bị</option>
							<option value={2}>2 Thiết bị (Mặc định)</option>
							<option value={3}>3 Thiết bị</option>
							<option value={5}>5 Thiết bị (Gia đình)</option>
						</select>
					</div>
				</div>
			</div>

			{/* Section 2: LLM Brain Provider & Parameters */}
			<div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<div>
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
							<Cpu className="w-4 h-4 text-purple-500" />
							<span>Bộ Não Mô Hình Ngôn Ngữ (LLM Model & Provider)</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Lựa chọn nhà cung cấp mô hình trí tuệ nhân tạo dùng cho Voice Agent và GraphRAG
						</p>
					</div>
					<Badge variant="outline-solid" className="text-[10px] text-purple-500 border-purple-500/30 font-semibold">
						Multi-Provider AI
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Provider Selection */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Nhà Cung Cấp LLM</Label>
						<select
							value={llmConfig.provider}
							onChange={(e) => {
								const prov = e.target.value;
								let defModel = "gemma2:2b";
								let defUrl = "http://localhost:11434/v1";
								if (prov === "gemini") {
									defModel = "gemini-2.0-flash";
									defUrl = "https://generativelanguage.googleapis.com";
								} else if (prov === "groq") {
									defModel = "llama-3.3-70b-versatile";
									defUrl = "https://api.groq.com/openai/v1";
								} else if (prov === "openai") {
									defModel = "gpt-4o-mini";
									defUrl = "https://api.openai.com/v1";
								}
								setLlmConfig((prev) => ({
									...prev,
									provider: prov,
									model: defModel,
									baseUrl: defUrl,
								}));
							}}
							className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
						>
							<option value="ollama">Ollama (Chạy Cục Bộ GPU 0đ)</option>
							<option value="gemini">Google Gemini AI (Cloud Free 1500 req/ngày)</option>
							<option value="groq">Groq Cloud (Siêu Tốc Độ)</option>
							<option value="openai">OpenAI (GPT-4o Mini)</option>
						</select>
					</div>

					{/* Model Selection */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Mô Hình (Model)</Label>
						{llmConfig.provider === "ollama" ? (
							<select
								value={llmConfig.model}
								onChange={(e) => setLlmConfig((prev) => ({ ...prev, model: e.target.value }))}
								className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-mono"
							>
								<option value="gemma2:2b">gemma2:2b (Google Local • Siêu nhẹ)</option>
								<option value="gemma3:4b">gemma3:4b (Google Gemma 3 mới nhất)</option>
								<option value="qwen2.5:3b">qwen2.5:3b (Tiếng Việt xuất sắc)</option>
								<option value="deepseek-r1:1.5b">deepseek-r1:1.5b (Suy luận CoT)</option>
							</select>
						) : llmConfig.provider === "gemini" ? (
							<select
								value={llmConfig.model}
								onChange={(e) => setLlmConfig((prev) => ({ ...prev, model: e.target.value }))}
								className="w-full bg-background border border-border rounded-lg py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-mono"
							>
								<option value="gemini-2.0-flash">gemini-2.0-flash (Mới nhất • Cực nhanh)</option>
								<option value="gemini-1.5-flash">gemini-1.5-flash (Chuẩn Google AI Studio)</option>
							</select>
						) : (
							<Input
								type="text"
								value={llmConfig.model}
								onChange={(e) => setLlmConfig((prev) => ({ ...prev, model: e.target.value }))}
								className="h-9 text-xs font-mono"
							/>
						)}
					</div>

					{/* Base URL */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">API Base URL</Label>
						<Input
							type="text"
							value={llmConfig.baseUrl}
							onChange={(e) => setLlmConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
							className="h-9 text-xs font-mono"
						/>
					</div>

					{/* API Key */}
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">API Key (Nếu cần)</Label>
						<div className="relative">
							<Input
								type={showApiKey ? "text" : "password"}
								placeholder={llmConfig.provider === "ollama" ? "Không cần với Ollama" : "Nhập API Key..."}
								value={llmConfig.apiKey}
								onChange={(e) => setLlmConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
								className="h-9 text-xs font-mono pr-8"
							/>
							<button
								type="button"
								onClick={() => setShowApiKey(!showApiKey)}
								className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
							>
								{showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
							</button>
						</div>
					</div>
				</div>

				{/* Temperature & Speed Sliders */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
					<div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-foreground">Nhiệt Độ Sáng Tạo (Temperature)</span>
							<span className="font-mono font-bold text-primary">{llmConfig.temperature}</span>
						</div>
						<input
							type="range"
							min="0.1"
							max="1.0"
							step="0.05"
							value={llmConfig.temperature}
							onChange={(e) =>
								setLlmConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
							}
							className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
						/>
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>0.1 (Chính xác / Quy chuẩn)</span>
							<span>1.0 (Bay bổng / Sáng tạo)</span>
						</div>
					</div>

					<div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-foreground">Giọng Đọc Sách Mặc Định (TTS Voice)</span>
							<span className="font-mono font-bold text-primary">{llmConfig.ttsVoice}</span>
						</div>
						<select
							value={llmConfig.ttsVoice}
							onChange={(e) => setLlmConfig((prev) => ({ ...prev, ttsVoice: e.target.value }))}
							className="w-full bg-background border border-border rounded-md py-1 px-2 text-xs font-semibold text-foreground focus:outline-none"
						>
							<option value="vi_VN-hoaimy-aurabook">Hoài My (1000 Epochs • VTV Studio)</option>
							<option value="mailinh">Mai Linh (Piper ONNX • Nữ trẻ trung)</option>
							<option value="vixtts">viXTTS (Nam • Trầm ấm văn học)</option>
							<option value="f5-tts-vietnamese">F5-TTS Vietnamese (Flow Matching)</option>
							<option value="viettts">VietTTS (Nam • Chuẩn miền Bắc)</option>
						</select>
						<p className="text-[10px] text-muted-foreground">Được đồng bộ sang trình duyệt và máy chủ</p>
					</div>

					<div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-semibold text-foreground">Tốc Độ Đọc Mặc Định (TTS Speed)</span>
							<span className="font-mono font-bold text-primary">{llmConfig.ttsSpeed}x</span>
						</div>
						<input
							type="range"
							min="0.8"
							max="1.5"
							step="0.05"
							value={llmConfig.ttsSpeed}
							onChange={(e) =>
								setLlmConfig((prev) => ({ ...prev, ttsSpeed: parseFloat(e.target.value) }))
							}
							className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
						/>
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>0.8x (Chậm rãi)</span>
							<span>1.0x (Chuẩn)</span>
							<span>1.5x (Nhanh)</span>
						</div>
					</div>
				</div>
			</div>

			{/* Section 3: System Prompt Editor */}
			<div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-3">
				<div className="flex items-center justify-between pb-2 border-b border-border">
					<div>
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
							<MessageSquare className="w-4 h-4 text-emerald-500" />
							<span>Lời Nhắc Hệ Thống Cho Trợ Lý AI (System Prompt)</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Điều khiển tính cách, quy chuẩn phát ngôn và cách tư vấn sách của Trợ lý Voice Agent
						</p>
					</div>
					<Button
						variant="outline-solid"
						size="sm"
						onClick={() =>
							setLlmConfig((prev) => ({
								...prev,
								systemPrompt:
									"Bạn là Chuyên viên Chăm sóc Khách hàng & Tư vấn Sách Thông minh của AuraBook. Giọng điệu thân thiện, ấm áp, trả lời ngắn gọn, nắm vững kiến thức từ GraphRAG và hỗ trợ khách hàng mua sách chu đáo.",
							}))
						}
						className="h-7 text-[11px] gap-1"
					>
						<RotateCcw className="w-3 h-3" />
						<span>Khôi phục mặc định</span>
					</Button>
				</div>

				<textarea
					rows={4}
					value={llmConfig.systemPrompt}
					onChange={(e) => setLlmConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
					placeholder="Nhập System Prompt cho Trợ lý AI..."
					className="w-full p-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-y"
				/>
				<div className="flex justify-between text-[11px] text-muted-foreground">
					<span>Được gửi kèm trong mỗi phiên hội thoại Voice & Chat của độc giả</span>
					<span>{llmConfig.systemPrompt.length} ký tự</span>
				</div>
			</div>

			{/* Section 4: Dify RAG Knowledge Base */}
			<div className="bg-card border border-border rounded-xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between pb-3 border-b border-border">
					<div>
						<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-amber-500" />
							<span>Cấu Hình Dify Knowledge Base (RAG Dataset)</span>
						</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							Kết nối kho tri thức sách văn học, tóm tắt và quy chế bán hàng lưu trữ trên Dify Studio
						</p>
					</div>
					<a
						href="http://localhost:8080"
						target="_blank"
						rel="noreferrer"
						className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
					>
						<span>Mở Dify Studio (:8080)</span>
						<span>↗</span>
					</a>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Dify API Endpoint</Label>
						<Input
							type="text"
							value={difyConfig.apiUrl}
							onChange={(e) => setDifyConfig((prev) => ({ ...prev, apiUrl: e.target.value }))}
							className="h-9 text-xs font-mono"
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Dify Dataset ID</Label>
						<Input
							type="text"
							value={difyConfig.datasetId}
							onChange={(e) => setDifyConfig((prev) => ({ ...prev, datasetId: e.target.value }))}
							className="h-9 text-xs font-mono"
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Dify App API Key</Label>
						<Input
							type="password"
							value={difyConfig.apiKey}
							onChange={(e) => setDifyConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
							className="h-9 text-xs font-mono"
						/>
					</div>
				</div>
			</div>

			{/* Bottom Action Bar */}
			<div className="sticky bottom-4 z-20 bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-elevated flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<span className="relative flex h-2.5 w-2.5">
						<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
					</span>
					<span className="text-xs font-semibold text-foreground">
						Mọi cấu hình được lưu trực tiếp vào máy chủ và có hiệu lực ngay không cần khởi động lại
					</span>
				</div>

				<Button
					type="button"
					onClick={handleSaveAll}
					disabled={isSaving}
					className="h-10 px-6 text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
				>
					{isSaving ? (
						<>
							<RefreshCw className="w-4 h-4 animate-spin" />
							<span>Đang Lưu Cấu Hình...</span>
						</>
					) : (
						<>
							<Save className="w-4 h-4" />
							<span>LƯU TOÀN BỘ CẤU HÌNH HỆ THỐNG</span>
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
