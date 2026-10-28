import React, { useState } from "react";
import { Mic, Sparkles, MessageSquare, Sliders } from "lucide-react";
import { AIAdminDashboard, type TabKey as AITabKey } from "@/ui/components/ai-admin/ai-admin-dashboard";

export function AdminAiPlatformModule() {
	const [activeSubTab, setActiveSubTab] = useState<"voice" | "graphrag" | "chatbot" | "eval">("voice");

	return (
		<div className="space-y-5 w-full">
			{/* Sub Navigation Strip */}
			<div className="flex items-center gap-2 bg-card border border-border p-3.5 rounded-xl shadow-2xs flex-wrap">
				<button
					type="button"
					onClick={() => setActiveSubTab("voice")}
					className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
						activeSubTab === "voice"
							? "bg-primary text-primary-foreground shadow-2xs"
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<Mic className="w-3.5 h-3.5" />
					<span>Trợ Lý Voice & Giọng Nói TTS</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveSubTab("graphrag")}
					className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
						activeSubTab === "graphrag"
							? "bg-primary text-primary-foreground shadow-2xs"
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<Sparkles className="w-3.5 h-3.5" />
					<span>GraphRAG & Tri Thức Sách</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveSubTab("chatbot")}
					className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
						activeSubTab === "chatbot"
							? "bg-primary text-primary-foreground shadow-2xs"
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<MessageSquare className="w-3.5 h-3.5" />
					<span>Giám Sát Hội Thoại & CSAT</span>
				</button>

				<button
					type="button"
					onClick={() => setActiveSubTab("eval")}
					className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
						activeSubTab === "eval"
							? "bg-primary text-primary-foreground shadow-2xs"
							: "text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<Sliders className="w-3.5 h-3.5" />
					<span>Đánh Giá Benchmark Ragas</span>
				</button>
			</div>

			{/* Authentic AI Admin Dashboard embedded directly */}
			<div className="w-full">
				<AIAdminDashboard
					embedded
					hideSidebar
					activeTab={activeSubTab as AITabKey}
					onTabChange={(tab) => {
						if (["voice", "graphrag", "chatbot", "eval"].includes(tab)) {
							setActiveSubTab(tab as any);
						}
					}}
				/>
			</div>
		</div>
	);
}
