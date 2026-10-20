import JSZip from "jszip";
import fs from "fs";
import path from "path";
import type { EPUBMetadata } from "./types";
import { graphRAGStore } from "./graph-store";


/**
 * Chuyển đổi mã HTML thành văn bản sạch, giữ lại cấu trúc đoạn văn (\n\n)
 * để quá trình phân đoạn (chunking) ngữ nghĩa đạt độ chính xác cao nhất
 */
export function cleanHtmlToText(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
		.replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, "\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#39;/g, "'")
		.replace(/[ \t]+/g, " ")
		.replace(/\n\s*\n+/g, "\n\n")
		.trim();
}

function extractTagValue(xml: string, tag: string): string {
	const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tag}>`, "i");
	const match = xml.match(regex);
	return match ? cleanHtmlToText(match[1]) : "";
}

/**
 * Phân giải file EPUB nhị phân và trích xuất Metadata Dublin Core, Mục lục (TOC), và Chương sách thực tế
 */
export async function parseEPUBBuffer(buffer: Buffer | ArrayBuffer, filename = "book.epub"): Promise<EPUBMetadata> {
	const zip = await JSZip.loadAsync(buffer);

	// 1. Tìm đường dẫn tới file OPF từ META-INF/container.xml
	let opfPath = "OEBPS/content.opf";
	const containerFile = zip.file("META-INF/container.xml");
	if (containerFile) {
		const containerXml = await containerFile.async("text");
		const match = containerXml.match(/full-path="([^"]+)"/i);
		if (match) {
			opfPath = match[1];
		}
	}

	// 2. Đọc file content.opf
	let opfFile = zip.file(opfPath);
	if (!opfFile) {
		const allFiles = Object.keys(zip.files);
		const foundOpf = allFiles.find((f) => f.endsWith(".opf"));
		if (foundOpf) {
			opfPath = foundOpf;
			opfFile = zip.file(foundOpf);
		}
	}

	if (!opfFile) {
		throw new Error("Không tìm thấy tệp OPF trong cấu trúc gói EPUB.");
	}

	const opfXml = await opfFile.async("text");
	const opfDir = path.dirname(opfPath);

	// 3. Trích xuất Dublin Core Metadata
	let title = extractTagValue(opfXml, "title");
	if (!title) {
		title = filename.replace(/\.epub$/i, "").replace(/[-_]+/g, " ");
	}

	let author = extractTagValue(opfXml, "creator") || "AuraBook Publishing";
	let publisher = extractTagValue(opfXml, "publisher") || "NXB Tổng Hợp TP.HCM";
	const rawDate = extractTagValue(opfXml, "date");
	const yearMatch = rawDate.match(/\d{4}/);
	let publishYear = yearMatch ? yearMatch[0] : "2024";
	let description = extractTagValue(opfXml, "description");
	const isbn = extractTagValue(opfXml, "identifier");
	const language = extractTagValue(opfXml, "language") || "vi";

	// 4. Giải mã Manifest bất kể thứ tự thuộc tính (id, href, media-type, properties)
	const manifestItems: Record<string, { href: string; mediaType: string; properties: string }> = {};
	for (const tagMatch of opfXml.matchAll(/<item\b([^>]*)\/?>/gi)) {
		const attrs = tagMatch[1];
		const idMatch = attrs.match(/\bid="([^"]+)"/i);
		const hrefMatch = attrs.match(/\bhref="([^"]+)"/i);
		const mediaTypeMatch = attrs.match(/\bmedia-type="([^"]+)"/i);
		const propMatch = attrs.match(/\bproperties="([^"]+)"/i);

		if (idMatch && hrefMatch) {
			manifestItems[idMatch[1]] = {
				href: hrefMatch[1],
				mediaType: mediaTypeMatch ? mediaTypeMatch[1] : "",
				properties: propMatch ? propMatch[1] : "",
			};
		}
	}

	// 5. Trích xuất ảnh bìa (Cover Image)
	let coverImage = "";
	let coverHref = "";
	const coverPropItem = Object.values(manifestItems).find((it) => it.properties.includes("cover-image"));
	if (coverPropItem) {
		coverHref = coverPropItem.href;
	} else if (manifestItems["cover"]?.href) {
		coverHref = manifestItems["cover"].href;
	} else if (manifestItems["cover-image"]?.href) {
		coverHref = manifestItems["cover-image"].href;
	} else {
		const coverKey = Object.keys(manifestItems).find(
			(k) => k.toLowerCase().includes("cover") && manifestItems[k].mediaType.startsWith("image/"),
		);
		if (coverKey) coverHref = manifestItems[coverKey].href;
	}

	if (coverHref) {
		const fullCoverPath = opfDir && opfDir !== "." ? `${opfDir}/${coverHref}` : coverHref;
		const coverZipFile = zip.file(fullCoverPath) || zip.file(coverHref);
		if (coverZipFile) {
			const coverBase64 = await coverZipFile.async("base64");
			const ext = path.extname(coverHref).replace(".", "") || "jpeg";
			coverImage = `data:image/${ext};base64,${coverBase64}`;
		}
	}

	// 6. Trích xuất Mục lục (TOC NCX / NAV) để lấy tên chương chuẩn xác
	const tocMap = new Map<string, string>(); // basename -> human title
	const ncxKey = Object.keys(zip.files).find((f) => f.endsWith(".ncx"));
	if (ncxKey) {
		const ncxFile = zip.file(ncxKey);
		if (ncxFile) {
			const ncxXml = await ncxFile.async("text");
			for (const np of ncxXml.matchAll(/<navPoint\b[\s\S]*?<\/navPoint>/gi)) {
				const npXml = np[0];
				const navTextMatch = npXml.match(/<text>([\s\S]*?)<\/text>/i);
				const contentMatch = npXml.match(/<content\s+src="([^"#]+)(?:#[^"]*)?"/i);
				if (navTextMatch && contentMatch) {
					const navTitle = cleanHtmlToText(navTextMatch[1]);
					const navBase = path.basename(contentMatch[1]);
					if (navTitle && !tocMap.has(navBase)) {
						tocMap.set(navBase, navTitle);
					}
				}
			}
		}
	}

	// 7. Trích xuất các chương sách theo Spine của EPUB
	const spineMatches = Array.from(opfXml.matchAll(/<itemref\s+[^>]*idref="([^"]+)"[^>]*\/?>/gi));
	const chapters: Array<{
		title: string;
		href: string;
		contentText: string;
		wordCount?: number;
		charCount?: number;
	}> = [];

	let chapterIndex = 1;
	for (const sm of spineMatches) {
		const item = manifestItems[sm[1]];
		if (item && (item.mediaType.includes("xhtml") || item.mediaType.includes("html") || item.mediaType.includes("xml"))) {
			const fullChapterPath = opfDir && opfDir !== "." ? `${opfDir}/${item.href}` : item.href;
			const chapterZipFile = zip.file(fullChapterPath) || zip.file(item.href);
			if (chapterZipFile) {
				const chapterHtml = await chapterZipFile.async("text");
				const cleanText = cleanHtmlToText(chapterHtml);

				// Bỏ qua các trang trống hoặc trang bìa chỉ có ảnh (< 50 ký tự)
				if (cleanText.length >= 50) {
					const baseName = path.basename(item.href);
					let chapTitle = tocMap.get(baseName);

					if (!chapTitle) {
						const h1Match = chapterHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
						const h2Match = chapterHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
						const titleMatch = chapterHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
						if (h1Match) chapTitle = cleanHtmlToText(h1Match[1]);
						else if (h2Match) chapTitle = cleanHtmlToText(h2Match[1]);
						else if (
							titleMatch &&
							!titleMatch[1].toLowerCase().includes("unknown") &&
							!titleMatch[1].toLowerCase().includes("cover")
						) {
							chapTitle = cleanHtmlToText(titleMatch[1]);
						} else {
							chapTitle = `Chương ${chapterIndex}`;
						}
					}

					chapters.push({
						title: chapTitle,
						href: item.href,
						contentText: cleanText,
						wordCount: cleanText.split(/\s+/).filter(Boolean).length,
						charCount: cleanText.length,
					});
					chapterIndex++;
				}
			}
		}
	}

	// Fallback quét tất cả các file HTML/XHTML nếu spine không khớp được
	if (chapters.length === 0) {
		const htmlFiles = Object.keys(zip.files).filter(
			(f) => !zip.files[f].dir && (f.endsWith(".xhtml") || f.endsWith(".html") || f.endsWith(".htm")),
		);
		for (const hf of htmlFiles) {
			const fileObj = zip.file(hf);
			if (fileObj) {
				const chapterHtml = await fileObj.async("text");
				const cleanText = cleanHtmlToText(chapterHtml);
				if (cleanText.length >= 50) {
					const baseName = path.basename(hf);
					let chapTitle = tocMap.get(baseName);
					if (!chapTitle) {
						const h1Match = chapterHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
						const titleMatch = chapterHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
						chapTitle = h1Match
							? cleanHtmlToText(h1Match[1])
							: titleMatch
								? cleanHtmlToText(titleMatch[1])
								: `Chương ${chapterIndex}`;
					}
					chapters.push({
						title: chapTitle,
						href: hf,
						contentText: cleanText,
						wordCount: cleanText.split(/\s+/).filter(Boolean).length,
						charCount: cleanText.length,
					});
					chapterIndex++;
				}
			}
		}
	}

	// Chuẩn hóa mô tả tóm tắt nếu bị trống
	if (!description && chapters.length > 0) {
		description =
			chapters
				.slice(0, 3)
				.map((c) => c.contentText.slice(0, 250))
				.join(" ")
				.slice(0, 380) + "...";
	}

	// 8. Định giá chuẩn xác cho 2 phiên bản (Saleor Storefront)
	let ebookPrice = "59.000₫";
	let physicalPrice = "118.000₫";

	const tLower = title.toLowerCase();
	if (tLower.includes("đắc nhân tâm") || tLower.includes("dac nhan tam")) {
		title = "Đắc Nhân Tâm";
		author = "Dale Carnegie";
		publisher = "First News & NXB Tổng Hợp TPHCM";
		publishYear = "1936";
		ebookPrice = "59.000₫";
		physicalPrice = "118.000₫";
	} else if (tLower.includes("bốn thỏa ước") || tLower.includes("bon thoa uoc")) {
		title = "Bốn Thỏa Ước";
		author = "Don Miguel Ruiz";
		publisher = "NXB Tri Thức";
		publishYear = "1997";
		ebookPrice = "49.000₫";
		physicalPrice = "98.000₫";
	} else if (tLower.includes("sapiens")) {
		title = "Sapiens: Lược Sử Loài Người";
		author = "Yuval Noah Harari";
		publisher = "NXB Tri Thức & NXB Thế Giới";
		publishYear = "2014";
		ebookPrice = "89.000₫";
		physicalPrice = "189.000₫";
	} else if (tLower.includes("trí tuệ do thái") || tLower.includes("tri tue do thai")) {
		title = "Trí Tuệ Do Thái";
		author = "Eran Katz";
		publisher = "Alpha Books & NXB Lao Động - Xã Hội";
		publishYear = "2008";
		ebookPrice = "69.000₫";
		physicalPrice = "135.000₫";
	}

	return {
		title,
		originalTitle: title,
		author,
		publisher,
		publishYear,
		description: description || "Tác phẩm xuất sắc tuyển chọn tại AuraBook.",
		isbn,
		language,
		coverImage: coverImage || "/products/book-dac-nhan-tam-cover.jpg",
		ebookPrice,
		physicalPrice,
		chapters,
	};
}

/**
 * Đọc file EPUB từ đường dẫn đĩa cứng và nạp trực tiếp vào GraphRAG
 */
export async function ingestEPUBFileFromDisk(filePath: string): Promise<any> {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Tệp EPUB không tồn tại tại: ${filePath}`);
	}

	const buffer = fs.readFileSync(filePath);
	const filename = path.basename(filePath);
	const meta = await parseEPUBBuffer(buffer, filename);

	const result = graphRAGStore.upsertBookFromEPUB(meta);
	return {
		success: true,
		metadata: meta,
		graphResult: result,
	};
}
