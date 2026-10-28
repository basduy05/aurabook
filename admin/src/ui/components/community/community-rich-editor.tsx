"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Quote,
	AtSign,
} from "lucide-react";
interface MentionUser {
	id: string;
	username: string;
	displayName: string;
	avatar?: string;
}

interface RichToolbarProps {
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	value: string;
	onChange: (val: string) => void;
	onOpenMention?: () => void;
	size?: "sm" | "md";
}

export function RichToolbar({
	textareaRef,
	value,
	onChange,
	onOpenMention,
	size = "md",
}: RichToolbarProps) {
	const insertFormatting = (prefix: string, suffix: string = "", defaultText: string = "") => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = value.substring(start, end) || defaultText;
		const replacement = `${prefix}${selectedText}${suffix}`;

		const newValue = value.substring(0, start) + replacement + value.substring(end);
		onChange(newValue);

		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + prefix.length + selectedText.length;
			textarea.setSelectionRange(start + prefix.length, newCursorPos);
		}, 0);
	};

	const insertLinePrefix = (linePrefix: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const before = value.substring(0, start);
		const selected = value.substring(start, end) || "nội dung";
		const after = value.substring(end);

		// If at start of a line or adding on new line
		const isStartOfLine = start === 0 || value[start - 1] === "\n";
		const insertion = isStartOfLine ? `${linePrefix}${selected}` : `\n${linePrefix}${selected}`;

		const newValue = before + insertion + after;
		onChange(newValue);

		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + insertion.length, start + insertion.length);
		}, 0);
	};

	const btnClass =
		size === "sm"
			? "h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
			: "h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors";

	const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

	return (
		<div className="flex items-center gap-1 py-1 px-1.5 rounded-xl bg-muted/40 border border-border/60 w-fit">
			<button
				type="button"
				onClick={() => insertFormatting("**", "**", "văn bản đậm")}
				className={btnClass}
				title="Bôi đen / In đậm (**văn bản**)"
			>
				<Bold className={iconSize} />
			</button>
			<button
				type="button"
				onClick={() => insertFormatting("*", "*", "văn bản nghiêng")}
				className={btnClass}
				title="In nghiêng (*văn bản*)"
			>
				<Italic className={iconSize} />
			</button>
			<span className="h-4 w-px bg-border/80 mx-0.5" />
			<button
				type="button"
				onClick={() => insertLinePrefix("1. ")}
				className={btnClass}
				title="Đánh số thứ tự (1. danh sách)"
			>
				<ListOrdered className={iconSize} />
			</button>
			<button
				type="button"
				onClick={() => insertLinePrefix("• ")}
				className={btnClass}
				title="Gạch đầu dòng (• danh sách)"
			>
				<List className={iconSize} />
			</button>
			<button
				type="button"
				onClick={() => insertLinePrefix("> ")}
				className={btnClass}
				title="Trích dẫn / Quote (> trích dẫn)"
			>
				<Quote className={iconSize} />
			</button>
			<span className="h-4 w-px bg-border/80 mx-0.5" />
			<button
				type="button"
				onClick={() => {
					if (onOpenMention) {
						onOpenMention();
					} else {
						insertFormatting("@", " ", "username");
					}
				}}
				className={`${btnClass} text-primary font-bold`}
				title="Tag người dùng (@username)"
			>
				<AtSign className={iconSize} />
			</button>
		</div>
	);
}

// Mention suggestion list popup
interface MentionDropdownProps {
	isOpen: boolean;
	query: string;
	onSelectUser: (username: string) => void;
	onClose: () => void;
}

export function MentionDropdown({
	isOpen,
	query,
	onSelectUser,
	onClose,
}: MentionDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [users, setUsers] = useState<MentionUser[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) return;
		const fetchUsers = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/community/sidebar");
				if (res.ok) {
					const data = (await res.json()) as {
						topReaders?: Array<{ username: string; name: string; avatar?: string }>;
					};
					if (data.topReaders) {
						setUsers(
							data.topReaders.map((r, idx: number) => ({
								id: `user-${idx}`,
								username: r.username,
								displayName: r.name,
								avatar: r.avatar,
							})),
						);
					}
				}
			} catch (e) {
				console.error("Failed to load users for mention dropdown:", e);
			} finally {
				setIsLoading(false);
			}
		};
		fetchUsers();
	}, [isOpen]);

	if (!isOpen) return null;

	const cleanQ = query.toLowerCase().replace(/^@/, "");
	const filtered = users.filter(
		(u) =>
			u.displayName.toLowerCase().includes(cleanQ) ||
			u.username.toLowerCase().includes(cleanQ),
	);

	return (
		<div className="absolute left-0 top-full mt-1 w-64 max-h-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
			<div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border/60">
				Gợi ý người dùng để nhắc đến (@tag)
			</div>
			{isLoading ? (
				<div className="p-3 text-center text-[12px] text-muted-foreground">Đang tải...</div>
			) : filtered.length === 0 ? (
				<div className="p-3 text-center text-[12px] text-muted-foreground">
					Không tìm thấy người dùng phù hợp
				</div>
			) : (
				<div className="divide-y divide-border/40">
					{filtered.map((u) => (
						<button
							key={u.username}
							type="button"
							onClick={() => onSelectUser(u.username)}
							className="w-full text-left p-2 hover:bg-muted/60 transition-colors flex items-center gap-2.5 rounded-lg group"
						>
							<div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
								<Image
									src={
										u.avatar ||
										`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}`
									}
									alt={u.displayName}
									fill
									sizes="28px"
									className="object-cover"
									unoptimized
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
									{u.displayName}
								</div>
								<div className="text-[11px] text-muted-foreground truncate">
									{u.username.startsWith("@") ? u.username : `@${u.username}`}
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// Rich formatted content renderer
interface FormattedCommunityContentProps {
	content: string;
	onTagClick?: (username: string) => void;
	className?: string;
}

export function FormattedCommunityContent({
	content,
	onTagClick,
	className = "",
}: FormattedCommunityContentProps) {
	if (!content) return null;

	const lines = content.split("\n");

	const renderInline = (text: string) => {
		// Split by tokens: **bold**, *italic*, @username
		const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|@[a-zA-Z0-9_]+)/g;
		const parts = text.split(tokenRegex);

		return parts.map((part, idx) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				return (
					<strong key={idx} className="font-bold text-foreground">
						{part.slice(2, -2)}
					</strong>
				);
			}
			if (part.startsWith("*") && part.endsWith("*")) {
				return (
					<em key={idx} className="italic text-foreground">
						{part.slice(1, -1)}
					</em>
				);
			}
			if (part.startsWith("@")) {
				const username = part;
				return (
					<button
						key={idx}
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onTagClick?.(username);
						}}
						className="inline-flex items-center text-primary font-bold hover:underline bg-primary/10 hover:bg-primary/20 px-1 py-0.5 rounded text-[13px] mx-0.5 transition-colors align-baseline"
						title={`Xem hồ sơ của ${username}`}
					>
						{username}
					</button>
				);
			}
			return <span key={idx}>{part}</span>;
		});
	};

	return (
		<div className={`space-y-1.5 leading-relaxed text-[13.5px] ${className}`}>
			{lines.map((line, idx) => {
				const trimmed = line.trim();

				// Quote: starts with >
				if (trimmed.startsWith(">")) {
					const quoteText = line.replace(/^\s*>\s*/, "");
					return (
						<blockquote
							key={idx}
							className="border-l-3 border-primary/70 bg-primary/5 pl-3 py-1 my-1 italic rounded-r text-foreground/90 font-medium"
						>
							{renderInline(quoteText)}
						</blockquote>
					);
				}

				// Numbered list: starts with number.
				const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
				if (numMatch) {
					return (
						<div key={idx} className="flex items-start gap-1.5 pl-2 text-foreground">
							<span className="font-bold text-primary shrink-0 text-[13px]">
								{numMatch[2]}.
							</span>
							<span className="flex-1">{renderInline(numMatch[3])}</span>
						</div>
					);
				}

				// Bullet list: starts with • or -
				if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
					const bulletText = line.replace(/^\s*[•\-]\s*/, "");
					return (
						<div key={idx} className="flex items-start gap-2 pl-2 text-foreground">
							<span className="text-primary font-bold shrink-0">•</span>
							<span className="flex-1">{renderInline(bulletText)}</span>
						</div>
					);
				}

				// Empty line -> paragraph break
				if (!trimmed) {
					return <div key={idx} className="h-1.5" />;
				}

				// Normal paragraph line
				return (
					<p key={idx} className="text-foreground/90">
						{renderInline(line)}
					</p>
				);
			})}
		</div>
	);
}
