import type { VectorChunk } from "./types";

const VECTOR_DIM = 64;

// Từ điển đặc trưng ngữ nghĩa theo chuyên mục tri thức sách tiếng Việt
export const SEMANTIC_KEYWORDS: string[][] = [
	["giao tiếp", "ứng xử", "thu phục", "lòng người", "kết bạn", "quan hệ", "dale carnegie", "đắc nhân tâm"],
	["tâm lý", "chữa lành", "nội tâm", "bình an", "hạnh phúc", "thỏa ước", "toltec", "bốn thỏa ước"],
	["lịch sử", "loài người", "sapiens", "tiến hóa", "cách mạng", "văn minh", "yuval noah harari", "nhận thức"],
	["do thái", "trí tuệ", "trí nhớ", "thiên tài", "ghi nhớ", "eran katz", "thông minh", "tư duy"],
	["thói quen", "atomic habits", "kỷ luật", "năng suất", "thay đổi", "nhỏ bé", "james clear", "tiến bộ"],
	["lập trình", "code", "mã sạch", "clean code", "phần mềm", "kiến trúc", "robert martin", "refactor"],
	["kinh doanh", "đầu tư", "tài chính", "tiền bạc", "làm giàu", "quản trị", "khởi nghiệp", "kinh tế"],
	["phát triển", "bản thân", "kỹ năng", "thành công", "mục tiêu", "động lực", "lãnh đạo", "quản lý"],
];

/**
 * Tạo vector đặc trưng ngữ nghĩa L2-normalized 64 chiều (Deterministic Dense Semantic Vectorizer)
 */
export function generateSemanticVector(text: string): number[] {
	const lower = (text || "").toLowerCase();
	const vector = new Array(VECTOR_DIM).fill(0);

	// 1. Phân bổ điểm cho các cụm từ khóa ngữ nghĩa chính (8 clusters x 4 slots = 32 dimensions)
	for (let cIdx = 0; cIdx < SEMANTIC_KEYWORDS.length; cIdx++) {
		const cluster = SEMANTIC_KEYWORDS[cIdx];
		let matchCount = 0;
		for (const kw of cluster) {
			if (lower.includes(kw)) {
				matchCount += 1;
			}
		}
		if (matchCount > 0) {
			const baseSlot = cIdx * 4;
			vector[baseSlot] = matchCount * 1.5;
			vector[baseSlot + 1] = Math.log(1 + matchCount);
			vector[baseSlot + 2] = matchCount > 2 ? 1.0 : 0.5;
			vector[baseSlot + 3] = Math.sqrt(matchCount);
		}
	}

	// 2. Phân bổ điểm băm ký tự n-gram cho 32 chiều còn lại để bao quát từ vựng mở rộng
	const words = lower.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
	for (const w of words) {
		let hash = 0;
		for (let i = 0; i < w.length; i++) {
			hash = (hash << 5) - hash + w.charCodeAt(i);
			hash |= 0;
		}
		const slot = 32 + (Math.abs(hash) % 32);
		vector[slot] += 1;
	}

	// 3. Chuẩn hóa L2-norm
	let norm = 0;
	for (let i = 0; i < VECTOR_DIM; i++) {
		norm += vector[i] * vector[i];
	}
	norm = Math.sqrt(norm);
	if (norm > 0) {
		for (let i = 0; i < VECTOR_DIM; i++) {
			vector[i] = Number((vector[i] / norm).toFixed(6));
		}
	} else {
		vector[0] = 1.0;
	}

	return vector;
}

/**
 * Thử sinh vector qua Ollama Local Embedding API (/api/embeddings), nếu không có thì dùng Dense Vectorizer
 */
export async function getHybridEmbedding(text: string, ollamaUrl = "http://localhost:11434"): Promise<number[]> {
	try {
		const res = await fetch(`${ollamaUrl}/api/embeddings`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: "bge-m3",
				prompt: text.slice(0, 500),
			}),
			signal: AbortSignal.timeout(1500),
		});

		if (res.ok) {
			const data = (await res.json()) as any;
			if (Array.isArray(data.embedding) && data.embedding.length > 0) {
				return data.embedding;
			}
		}
	} catch (_e) {
		// Ollama embedding service chưa sẵn sàng hoặc chưa pull bge-m3 -> fallback tự động
	}

	return generateSemanticVector(text);
}

/**
 * Tính Cosine Similarity giữa 2 vector
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
	const len = Math.min(vecA.length, vecB.length);
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < len; i++) {
		dotProduct += vecA[i] * vecB[i];
		normA += vecA[i] * vecA[i];
		normB += vecB[i] * vecB[i];
	}

	const denom = Math.sqrt(normA) * Math.sqrt(normB);
	if (denom === 0) return 0;
	return Number((dotProduct / denom).toFixed(4));
}

/**
 * Tìm kiếm các Vector Chunks tương đồng nhất với câu truy vấn
 */
export function searchVectorChunks(
	queryText: string,
	queryEmbedding: number[],
	chunks: VectorChunk[],
	topK = 3,
	filterBookSlug?: string,
): Array<{ chunk: VectorChunk; score: number }> {
	const scored = chunks
		.filter((c) => (!filterBookSlug ? true : c.bookSlug === filterBookSlug))
		.map((c) => {
			const sim = cosineSimilarity(queryEmbedding, c.embedding);
			// Bonus nhẹ cho từ khóa xuất hiện nguyên văn
			const textLower = c.content.toLowerCase();
			const qLower = queryText.toLowerCase();
			let lexicalBonus = 0;
			const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
			for (const qw of qWords) {
				if (textLower.includes(qw)) {
					lexicalBonus += 0.05;
				}
			}
			const finalScore = Number(Math.min(1.0, sim + lexicalBonus).toFixed(4));
			return { chunk: c, score: finalScore };
		});

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, topK);
}
