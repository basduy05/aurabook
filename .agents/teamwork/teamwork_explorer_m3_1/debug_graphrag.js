const path = require("path");
const { graphRAGStore } = require(path.resolve(__dirname, "../../../frontend/src/lib/graphrag/graph-store"));

console.log("Investigating searchProductsByContext...");
const q = "tìm sách về phát triển bản thân";
const res = graphRAGStore.searchProductsByContext(q);
console.log("Result:", JSON.stringify({
    totalCount: res.totalCount,
    hasDirectMatch: res.hasDirectMatch,
    matchedConcepts: res.matchedConcepts,
    queryInterpretation: res.queryInterpretation,
    reasoningSummary: res.reasoningSummary,
    productsLength: res.products ? res.products.length : 0
}, null, 2));
