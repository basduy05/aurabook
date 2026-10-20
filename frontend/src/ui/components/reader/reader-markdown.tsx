import React from "react";

interface ReaderMarkdownProps {
	content: string;
	className?: string;
	isSepia?: boolean;
}

export function ReaderMarkdown({ content, className = "", isSepia = false }: ReaderMarkdownProps) {
	if (!content) return null;

	const lines = content.split("\n");
	const elements: React.ReactNode[] = [];
	let inList: "ul" | "ol" | null = null;
	let listItems: React.ReactNode[] = [];

	const flushList = (keyPrefix: string) => {
		if (inList === "ul") {
			elements.push(
				<ul key={`ul-${keyPrefix}`} className="my-2 space-y-1 list-disc list-inside text-[13.5px]">
					{listItems}
				</ul>,
			);
		} else if (inList === "ol") {
			elements.push(
				<ol key={`ol-${keyPrefix}`} className="my-2 space-y-1 list-decimal list-inside text-[13.5px]">
					{listItems}
				</ol>,
			);
		}
		inList = null;
		listItems = [];
	};

	const renderInline = (text: string): React.ReactNode => {
		const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
		return parts.map((part, idx) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				return (
					<strong key={idx} className={`font-bold ${isSepia ? "text-[#2e2316]" : "text-foreground"}`}>
						{part.slice(2, -2)}
					</strong>
				);
			}
			if (part.startsWith("*") && part.endsWith("*")) {
				return (
					<em key={idx} className="italic opacity-90">
						{part.slice(1, -1)}
					</em>
				);
			}
			if (part.startsWith("`") && part.endsWith("`")) {
				return (
					<code
						key={idx}
						className={`px-1 py-0.5 rounded text-xs font-mono ${
							isSepia ? "bg-[#ede2cd] text-[#433422]" : "bg-muted text-foreground"
						}`}
					>
						{part.slice(1, -1)}
					</code>
				);
			}
			return part;
		});
	};

	lines.forEach((line, lineIdx) => {
		const trimmed = line.trim();

		if (!trimmed) {
			flushList(`empty-${lineIdx}`);
			return;
		}

		// Heading 3: ### Tiêu đề
		if (trimmed.startsWith("### ")) {
			flushList(`h3-${lineIdx}`);
			const titleText = trimmed.slice(4).trim();
			elements.push(
				<h4
					key={`h3-${lineIdx}`}
					className={`mt-3.5 mb-1.5 font-bold text-[14px] flex items-center gap-1.5 border-b pb-1 ${
						isSepia ? "text-[#5c3a1e] border-[#d8cbb0]" : "text-primary border-border/60"
					}`}
				>
					{renderInline(titleText)}
				</h4>,
			);
			return;
		}

		// Heading 2: ## Tiêu đề
		if (trimmed.startsWith("## ")) {
			flushList(`h2-${lineIdx}`);
			const titleText = trimmed.slice(3).trim();
			elements.push(
				<h3
					key={`h2-${lineIdx}`}
					className={`mt-4 mb-2 font-bold text-[15px] flex items-center gap-1.5 border-b pb-1 ${
						isSepia ? "text-[#433422] border-[#d8cbb0]" : "text-foreground border-border"
					}`}
				>
					{renderInline(titleText)}
				</h3>,
			);
			return;
		}

		// Blockquote: > Trích dẫn
		if (trimmed.startsWith("> ")) {
			flushList(`quote-${lineIdx}`);
			elements.push(
				<blockquote
					key={`quote-${lineIdx}`}
					className={`my-2 pl-3 py-1 border-l-3 text-[13px] italic rounded-r-md font-serif ${
						isSepia
							? "border-[#8b5a00] bg-[#f4ebd0]/70 text-[#433422]"
							: "border-primary bg-primary/5 text-foreground/90"
					}`}
					style={{ fontFamily: "'Literata', 'Merriweather', 'Lora', Georgia, serif" }}
				>
					{renderInline(trimmed.slice(2).trim())}
				</blockquote>,
			);
			return;
		}

		// List unordered: - hoặc *
		if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
			if (inList !== "ul") {
				flushList(`switch-ul-${lineIdx}`);
				inList = "ul";
			}
			listItems.push(
				<li key={`li-${lineIdx}`} className="leading-relaxed">
					{renderInline(trimmed.slice(2).trim())}
				</li>,
			);
			return;
		}

		// List ordered: 1. 2. 3.
		const matchOrdered = trimmed.match(/^(\d+)\.\s+(.+)$/);
		if (matchOrdered) {
			if (inList !== "ol") {
				flushList(`switch-ol-${lineIdx}`);
				inList = "ol";
			}
			listItems.push(
				<li key={`li-${lineIdx}`} className="leading-relaxed">
					{renderInline(matchOrdered[2].trim())}
				</li>,
			);
			return;
		}

		// Đoạn văn bình thường
		flushList(`p-${lineIdx}`);
		elements.push(
			<p key={`p-${lineIdx}`} className="my-1.5 text-[13.5px] leading-relaxed">
				{renderInline(trimmed)}
			</p>,
		);
	});

	flushList("final");

	return <div className={`reader-markdown space-y-1 ${className}`}>{elements}</div>;
}
