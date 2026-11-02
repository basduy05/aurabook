const path = require("path");
const { graphRAGStore, BOOK_CATALOG_MAPPING } = require(path.resolve(__dirname, "../../../frontend/src/lib/graphrag/graph-store"));
const { stripVietnameseDiacritics, generateSemanticVector, searchVectorChunks, SEMANTIC_KEYWORDS } = require(path.resolve(__dirname, "../../../frontend/src/lib/graphrag/vector-store"));

const query = "tìm sách về phát triển bản thân";
const cleanQuery = query.trim().toLowerCase();
const unaccentedQuery = stripVietnameseDiacritics(cleanQuery).replace(/\s+/g, " ").trim();

console.log("cleanQuery:", cleanQuery);
console.log("unaccentedQuery:", unaccentedQuery);

const VIETNAMESE_STOP_WORDS_LIST = [
    "về", "của", "và", "các", "những", "trong", "cho", "với", "là", "có", "để", "được", "tôi", "bạn",
    "ở", "ra", "lại", "lên", "xuống", "một", "này", "đó", "thì", "mà", "sao", "gì", "ai", "đâu", "nào",
    "cuốn", "sách", "quyển", "muốn", "tìm", "đọc", "như", "thế", "hỏi", "giúp", "an", "ăn",
    "hay", "nên", "hướng", "dẫn", "cách", "làm", "biết", "mua", "giá", "bao", "nhiêu", "chiếc",
    "ve", "cua", "va", "cac", "nhung", "trong", "cho", "voi", "la", "co", "de", "duoc", "toi", "ban",
    "o", "ra", "lai", "len", "xuong", "mot", "nay", "do", "thi", "ma", "sao", "gi", "ai", "dau", "nao",
    "cuon", "sach", "quyen", "muon", "tim", "doc", "nhu", "the", "hoi", "giup",
    "nen", "huong", "dan", "cach", "lam", "biet", "gia", "nhieu", "chiec"
];
const VIETNAMESE_STOP_WORDS = new Set();
for (const w of VIETNAMESE_STOP_WORDS_LIST) {
    VIETNAMESE_STOP_WORDS.add(w.toLowerCase().trim());
    VIETNAMESE_STOP_WORDS.add(stripVietnameseDiacritics(w).toLowerCase().trim());
}

const tokenize = (text) =>
    stripVietnameseDiacritics(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

const queryTokens = tokenize(cleanQuery);
const meaningfulTokens = queryTokens.filter((w) => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));
console.log("meaningfulTokens:", meaningfulTokens);

const store = graphRAGStore.load();
const bookNodes = [...store.nodes.filter((n) => n.type === "book")];

// Check clusterMatches
const clusterMatches = {
    "dac-nhan-tam": ["dac nhan tam", "đắc nhân tâm", "giao tiep", "giao tiếp", "ung xu", "ứng xử", "doi nhan", "thu phuc long nguoi", "thu phục", "ket ban", "kết bạn", "dale carnegie", "how to win friends"],
    "bon-thoa-uoc": ["bon thoa uoc", "bốn thỏa ước", "thoa uoc", "thỏa ước", "toltec", "chua lanh", "chữa lành", "binh an", "bình an", "noi tam", "nội tâm", "tu do noi tam", "don miguel ruiz", "the four agreements"],
    "cach-nghi-de-thanh-cong": ["cach nghi de thanh cong", "cách nghĩ để thành công", "cach nghi", "thanh cong", "thành công", "napoleon hill", "nghi giau lam giau", "think and grow rich"],
};

for (const slug of Object.keys(clusterMatches)) {
    const targetCluster = clusterMatches[slug] || [];
    let matched = [];
    for (const kw of targetCluster) {
        const kwUnaccented = stripVietnameseDiacritics(kw).toLowerCase();
        if (cleanQuery.includes(kw) || unaccentedQuery.includes(kwUnaccented)) {
            matched.push(kw);
        }
    }
    console.log(`Slug ${slug} matched cluster:`, matched);
}
