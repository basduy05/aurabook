# Báo Cáo Khảo Sát & Phân Tích Nguyên Nhân Gốc Rễ: Phân Hệ AI Đọc Sách & Tích Hợp Dify RAG

**Người thực hiện**: Survey Explorer 1  
**Ngày thực hiện**: 2026-10-31  
**Mục tiêu**: Điều tra toàn diện luồng xử lý, kiến trúc, cấu hình, mã nguồn và nguyên nhân gây lỗi, trả lời lạc đề, thiếu grounding, timeout và unhandled exceptions trong phân hệ **AI Đọc Sách** (AI Reading Companion) và tích hợp **Dify RAG** của dự án Aurabook.

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp)

### 1.1. Luồng Giao Diện Đọc Sách (Web Reader UI)
- **Tập tin**: `frontend/src/ui/components/reader/drm-web-reader.tsx`
  * Dòng 3735-3739: `handleAskAIAboutQuote(text)` — Kích hoạt khi người dùng bôi đen đoạn trích và chọn hỏi AI:
    ```typescript
    const handleAskAIAboutQuote = (text: string) => {
        setIsAiOpen(true);
        setAiTab("chat");
        handleSendAIMessage(`Hãy diễn giải ý nghĩa triết lý và bối cảnh của trích dẫn này: "${text}"`, text);
    };
    ```
  * Dòng 3752-3786: `handleSendAIMessage` gửi yêu cầu đến backend thông qua endpoint nội bộ Next.js `/api/ai/reader-chat`:
    ```typescript
    // Dòng 3751 chú thích: "Send manual message to AI (connected to Dify RAG Knowledge Base & Smart literature engine)"
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
    ```
  * Dòng 3899-3910: Khối xử lý lỗi ngoại lệ (catch block) của `handleSendAIMessage`:
    ```typescript
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
    }
    ```
    *Nhận xét*: Bất cứ khi nào backend gặp lỗi mạng, HTTP 500 hoặc timeout, frontend hoàn toàn nuốt chửng lỗi (swallow exception) và hiển thị một câu trả lời mẫu cứng nhắc, không hề trả lời câu hỏi của người dùng và hoàn toàn mất grounding.

### 1.2. Luồng Xử Lý Phía Server Của AI Đọc Sách
- **Tập tin**: `frontend/src/app/api/ai/reader-chat/route.ts`
  * Dòng 95-98: Truy vấn ngữ cảnh sách:
    ```typescript
    const ragQueryStr = cleanQuote ? `${cleanQuote} ${cleanQuery}` : cleanQuery;
    const graphResult = graphRAGStore.queryGraphRAG(ragQueryStr, bookSlug);
    ```
    *Điểm mấu chốt*: `reader-chat` **HOÀN TOÀN KHÔNG GỌI DIFY RAG**! Không có bất kỳ dòng mã nào import hay fetch đến Dify API (`http://localhost:8080/v1` hay bất kỳ URL Dify nào). Nó hoàn toàn phụ thuộc vào `graphRAGStore` cục bộ.
  * Dòng 104-117: Đọc cấu hình từ `ecommerce-ai-platform/ai_platform_config.json`:
    ```typescript
    let llmBaseUrl = "http://localhost:11434";
    let temperature = 0.5;
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8")) as any;
            if (cfg.voice?.llmBaseUrl) llmBaseUrl = cfg.voice.llmBaseUrl.replace(/\/v1\/?$/, "");
            if (typeof cfg.reader?.temperature === "number") temperature = cfg.reader.temperature;
        }
    } catch (e) { ... }
    ```
  * Dòng 120-129: Cắt cụt (truncate) trích đoạn RAG đưa vào prompt:
    ```typescript
    const ragChunksText =
        graphResult.relevantChunks && graphResult.relevantChunks.length > 0
            ? graphResult.relevantChunks
                    .slice(0, 2)
                    .map(
                        (rc, idx) =>
                            `[Trích đoạn RAG ${idx + 1} - ${rc.chunk.chapterTitle || "Nội dung"}]:\n"${rc.chunk.content.slice(0, 300)}"`,
                    )
                    .join("\n\n")
            : "";
    ```
    *Điểm mấu chốt*: Chỉ lấy tối đa 2 chunk và cắt nhỏ mỗi chunk còn **300 ký tự** (`slice(0, 300)`). Tổng ngữ cảnh tri thức thực tế đưa vào LLM chỉ có tối đa khoảng 600 ký tự, quá ngắn để trả lời các câu hỏi chuyên sâu hoặc các đoạn trích dài.
  * Dòng 131-160: Prompt Engineering bị ép cứng cấu trúc tiểu luận 3 phần cho MỌI câu hỏi:
    ```markdown
    NGUYÊN TẮC PHÂN TÍCH & TRÌNH BÀY (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
    1. NGÔN NGỮ: BẮT BUỘC TRẢ LỜI 100% BẰNG TIẾNG VIỆT CHUẨN MỰC, GIÀU CHẤT VĂN HỌC, TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH.
    2. TRẢ LỜI ĐẦY ĐỦ, HOÀN CHỈNH, TUYỆT ĐỐI KHÔNG BỊ CẮT NGANG HOẶC BỎ DỞ DỞ DANG:
       - Trình bày mạch lạc, chia thành 3 mục rõ ràng bằng markdown chuẩn:
         ### 📖 Bối cảnh & Ý nghĩa
         ### 💡 Góc nhìn Triết lý & Tâm lý học
         ### 🌿 Bài học Thực tiễn
    ```
    Và dòng 159:
    ```typescript
    userMessageContent = `${cleanQuery} (Lưu ý: Bắt buộc trả lời bằng tiếng Việt đầy đủ, trọn vẹn 3 mục: Bối cảnh & Ý nghĩa, Triết lý & Tâm lý học, Bài học Thực tiễn).`;
    ```
    *Điểm mấu chốt*: Khi người dùng hỏi câu hỏi giao tiếp thông thường (như "Chào bạn", "Bạn có thể giúp gì?") hoặc câu hỏi nghiệp vụ tra cứu trực tiếp ("Ai là tác giả?", "Sách có mấy chương?", "Sách này xuất bản năm nào?", "Giá bao nhiêu?"), hệ thống vẫn ép buộc mô hình phải trả lời thành một bài văn triết học 3 phần dài dòng, dẫn đến hiện tượng **trả lời lạc đề, ngụy biện triết học, không đi vào trọng tâm**.
  * Dòng 182-207: Luồng gọi Ollama:
    ```typescript
    const candidateModels = ["gemma2:2b", "gemma3:4b"];
    for (const currentModel of candidateModels) {
        ...
        const ollamaRes = await fetch(`${llmBaseUrl}/api/chat`, {
            ...
            signal: AbortSignal.timeout(28000), // Timeout 28s mỗi model!
        });
    ```
    *Điểm mấu chốt*: Vòng lặp duyệt qua 2 model, mỗi model chờ tới 28 giây. Nếu Ollama không chạy hoặc model chưa được tải (`ollama pull`), thời gian chờ có thể lên tới gần 1 phút (56s), khiến HTTP connection bị drop hoặc trình duyệt ngắt kết nối trước khi nhận được phản hồi.
  * Dòng 254-257: Fallback sang Gemini bị vô hiệu hóa do điều kiện kiểm tra key:
    ```typescript
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey !== "your_gemini_api_key_here") {
        // Gọi Gemini 1.5 Flash
    }
    ```
    Trong file `.env` gốc, `GEMINI_API_KEY=your_gemini_api_key_here` (chuỗi mặc định). Do đó điều kiện này luôn `false`, Gemini không bao giờ được gọi khi Ollama thất bại.
  * Dòng 311-327: Fallback `generateDynamicFallback` (Dynamic Literary Synthesis):
    Khi không có LLM phản hồi, hệ thống gọi hàm `generateDynamicFallback` (dòng 20-60). Hàm này sinh ra một văn bản mẫu cố định có sẵn ("Tác phẩm xây dựng góc nhìn toàn diện về sự phát triển của tư duy, hành vi con người...") ghép với tên sách và tác giả. Đây là phản hồi giả mạo (pseudo-response), không hề trả lời đúng câu hỏi của người dùng.

### 1.3. Kho Tri Thức Cục Bộ (GraphRAG Store & Vector Store)
- **Tập tin**: `frontend/src/lib/graphrag/graph-store.ts` và `vector-store.ts`
  * `graphRAGStore` đọc dữ liệu từ `ecommerce-ai-platform/data/graphrag_store.json` (dung lượng ~6.1MB).
  * File JSON này chỉ chứa dữ liệu mẫu của đúng **4 đầu sách**:
    1. *Bốn Thỏa Ước* (`bon-thoa-uoc`)
    2. *Đắc Nhân Tâm* (`dac-nhan-tam`)
    3. *Sapiens: Lược Sử Loài Người* (`sapiens-luoc-su-loai-nguoi`)
    4. *Trí Tuệ Do Thái* (`tri-tue-do-thai`)
  * Bất kỳ cuốn sách nào khác trong cơ sở dữ liệu Saleor (PostgreSQL) đều KHÔNG CÓ chunk nội dung trong `graphrag_store.json`, dẫn đến `relevantChunks = []`.
  * `vector-store.ts` (dòng 20-68): Hàm `generateSemanticVector(text)` sử dụng vector giả 64 chiều (dựa trên 8 danh sách từ khóa cố định + hash ký tự mod 32). Đây không phải là mô hình embedding ngữ nghĩa thực (như bge-m3 hay text-embedding-004), khiến việc truy hồi đoạn trích (retrieval) rất thiếu chính xác khi từ ngữ của người dùng không trùng khớp chính xác với bộ từ khóa.

### 1.4. Tình Trạng Tích Hợp Dify RAG Trong Dự Án
- **Tập tin cấu hình**: `ecommerce-ai-platform/ai_platform_config.json`
  ```json
  "rag": {
    "apiUrl": "http://localhost:8080/v1",
    "apiKey": "app-aurabook-rag-dev-key",
    "datasetId": "dataset-aurabook-literature-01",
    "topK": 4,
    "scoreThreshold": 0.65
  }
  ```
- **Tập tin**: `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`
  * Dòng 89-95:
    ```python
    if not api_key or api_key in ["app-your-dify-api-key", "app-aurabook-rag-dev-key"]:
        logger.warning("[Dify RAG] DIFY_API_KEY chưa cấu hình thực tế hoặc dùng key dev. Trả lời từ tri thức mặc định.")
        return (
            f"[Tri thức AuraBook Local] Về '{query}': "
            "AuraBook hỗ trợ đọc sách điện tử bảo mật chuẩn Readium LCP DRM trên Web Reader. "
            "Chính sách bảo mật cho phép đọc đơn tab bảo vệ quyền tác giả."
        )
    ```
    *Điểm mấu chốt*: Code Python chặn thẳng các API key mang tên `app-aurabook-rag-dev-key` hoặc `app-your-dify-api-key`. Vì trong `ai_platform_config.json` key chính là `"app-aurabook-rag-dev-key"`, cuộc gọi đến Dify bị đoản mạch (short-circuit) 100% thời gian, luôn trả về chuỗi văn bản cứng về Readium LCP DRM!
- **Tập tin**: `frontend/src/app/api/ai/admin/dify/route.ts`
  * Dòng 121-124: Gọi Dify `/chat-messages` với timeout chỉ 4000ms:
    ```typescript
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${rag.apiUrl}/chat-messages`, ...);
    ```
  * Dòng 165-240: Khi Dify offline (container chưa chạy hoặc timeout 4s), code bắt lỗi và fallback sang Ollama sinh câu trả lời, nhưng lại **trả về metadata trích dẫn giả mạo**:
    ```typescript
    metadata: {
        retriever_resources: [{ document_name: "AuraBook Ground Truth Catalog 2026", score: 0.94 }],
    }
    ```
- **Hạ tầng Dify Docker**:
  * Thư mục `ecommerce-ai-platform/core-rag/dify/docker/docker-compose.yaml` có định nghĩa cụm dịch vụ Dify (Nginx, API, Worker, Redis, DB, Weaviate/Chroma).
  * Tuy nhiên, trong `ecommerce-ai-platform/core-rag/dify/docker/envs/`, toàn bộ các file chỉ là `.env.example`, chưa được khởi tạo thành `.env` chuẩn.
  * Container Dify mặc định chưa được khởi tạo database (`install`), chưa có tài khoản admin, chưa có dataset chứa nội dung toàn bộ sách và chính sách của AuraBook.

### 1.5. Backend Cũ (Saleor / Django `backend/aurabook_apps/ai_search/`)
- `backend/aurabook_apps/ai_search/views.py`:
  * Có `HybridSearchView` (`/aurabook/search/hybrid`) và `RAGQueryView` (`/aurabook/search/rag`).
  * Sử dụng `gemini_client.py` (`google.genai.Client(api_key=GEMINI_API_KEY)`).
  * Trong `backend/.env` hoặc root `.env`: `GEMINI_API_KEY=your_gemini_api_key_here` (chưa điền key thật). Do đó `gemini_client.py` trả về vector 0 hoặc lỗi `"GEMINI_API_KEY chưa được cấu hình"`.
  * Endpoint `frontend/src/app/api/search/ai/route.ts` gọi sang `http://localhost:8000/aurabook/search/hybrid`, nhưng không có bất kỳ component UI nào trên storefront gọi vào `/api/search/ai`. Storefront hiện dùng trực tiếp `graphRAGStore.searchProductsByContext`.

---

## 2. Logic Chain (Chuỗi Lập Luận Suy Ra Nguyên Nhân Gốc Rễ)

1. **Từ Quan sát 1.2 & 1.4 -> Kết luận về Sự Đứt Đoạn Kiến Trúc (Architectural Disconnect)**:
   - *Luận cứ*: UI Đọc sách (`drm-web-reader.tsx`) gọi `/api/ai/reader-chat`. Tuy nhiên, trong `reader-chat/route.ts` không hề có một dòng mã nào liên kết với Dify API. Trong khi đó, `ai_platform_config.json` và `vietnamese_cskh_agent.py` cấu hình Dify RAG, nhưng lại bị vô hiệu hóa bởi dev key `app-aurabook-rag-dev-key`.
   - *Hệ quả*: Phân hệ Đọc sách hoàn toàn bị cô lập khỏi kho tri thức Dify RAG. Mọi dữ liệu tri thức đưa lên Dify đều không thể đến được với người đọc sách.

2. **Từ Quan sát 1.2 -> Kết luận về Nguyên Nhân Trả Lời Lạc Đề & Thiếu Grounding**:
   - *Luận cứ*: Prompt trong `reader-chat/route.ts` ép buộc 100% câu hỏi phải trả lời theo cấu trúc tiểu luận triết học 3 phần (`Bối cảnh & Ý nghĩa`, `Góc nhìn Triết lý & Tâm lý học`, `Bài học Thực tiễn`). Ngữ cảnh sách đưa vào prompt bị cắt ngắn còn 600 ký tự.
   - *Hệ quả*:
     - Với câu hỏi giao tiếp thông thường: Người dùng chào hỏi, AI phản hồi thành một bài phân tích nhân sinh triết lý -> Lạc đề nghiêm trọng.
     - Với câu hỏi tra cứu dữ liệu (tác giả, số chương, giá sách, ngày phát hành): AI không trả lời trực tiếp mà diễn giải triết lý chung chung -> Không đúng trọng tâm.
     - Với câu hỏi phân tích nội dung sách: Do context chỉ có 600 ký tự và vector search giả (hash mod 32), AI không có đủ dữ liệu thực tế -> Bịa đặt thông tin (hallucination) hoặc trả về mẫu `generateDynamicFallback` rập khuôn.

3. **Từ Quan sát 1.1, 1.2 & 1.5 -> Kết luận về Nguyên Nhân Gây Ra Timeout & Nuốt Lỗi Ngoại Lệ**:
   - *Luận cứ*: `reader-chat/route.ts` thiết lập timeout 28s cho Ollama, lặp qua 2 model (tối đa 56s). Nếu Ollama chưa bật, request bị nghẽn (blocking). Gemini fallback bị chặn bởi điều kiện `GEMINI_API_KEY !== "your_gemini_api_key_here"`. Khi request thất bại hoặc timeout, `drm-web-reader.tsx` bắt exception và gán câu trả lời tĩnh mặc định.
   - *Hệ quả*: Người dùng thấy spinner xoay rất lâu (gần 30-50s) rồi đột ngột nhận được câu thông báo tĩnh "Tôi đã nhận câu hỏi của bạn về tác phẩm...", hoàn toàn không có nội dung giải đáp.

4. **Từ Quan sát 1.3 -> Kết luận về Thiếu Hụt Dữ Liệu Sách Của Hệ Thống**:
   - *Luận cứ*: `graphrag_store.json` chỉ có dữ liệu của 4 cuốn sách. Các cuốn sách khác trong danh mục hệ thống hoàn toàn không có node chapter hoặc vector chunk.
   - *Hệ quả*: Khi người đọc mở bất kỳ cuốn sách nào ngoài 4 cuốn trên (hoặc sách mới thêm), RAG trả về rỗng, AI hoàn toàn mất căn cứ dữ liệu (zero grounding).

---

## 3. Caveats (Các Điểm Giới Hạn & Giả Định)

1. **Phạm vi khảo sát**: Báo cáo này tập trung chuyên sâu vào phân hệ **AI Đọc Sách** (`drm-web-reader.tsx`, `/api/ai/reader-chat`, GraphRAG store) và sự tích hợp với **Dify RAG**. Khảo sát chi tiết của phân hệ AI Tìm Kiếm (Hybrid Search) và Voice Chat (LiveKit agent) do các Explorer khác phụ trách phối hợp.
2. **Trạng thái môi trường runtime**:
   - Docker container Dify (`core-rag/dify/docker/docker-compose.yaml`) chưa được kích hoạt và cấu hình thực tế trong session khảo sát.
   - Ollama local daemon (`localhost:11434`) có thể không có sẵn model `gemma2:2b` hoặc `gemma3:4b` nếu máy trạm chưa thực hiện `ollama pull`.
3. **Quyền hạn**: Theo quy định khảo sát (read-only), toàn bộ phân tích dựa trên kiểm tra mã nguồn, cấu hình và luồng dữ liệu, chưa thực hiện ghi/sửa code ứng dụng.

---

## 4. Conclusion (Kết Luận & Đề Xuất Giải Pháp Toàn Diện)

### 4.1. Bảng Tổng Hợp Tập Tin, Hàm & Luồng Dữ Liệu Liên Quan

| Phân hệ / Vai trò | Đường dẫn tập tin | Hàm / Thành phần chính | Vấn đề hiện tại |
|---|---|---|---|
| **Reader UI** | `frontend/src/ui/components/reader/drm-web-reader.tsx` | `handleSendAIMessage`, `handleAskAIAboutQuote` (dòng 3735-3913) | Nuốt lỗi ngoại lệ (catch block), hiển thị text tĩnh vô nghĩa khi API lỗi. |
| **Reader Chat API** | `frontend/src/app/api/ai/reader-chat/route.ts` | `POST`, `generateDynamicFallback` | Không kết nối Dify; prompt ép 3 phần cho mọi câu hỏi; context bị cắt còn 600 ký tự; timeout 28s x 2 model; Gemini fallback bị vô hiệu hóa bởi placeholder key. |
| **Dify Admin API** | `frontend/src/app/api/ai/admin/dify/route.ts` | `GET`, `POST` (dòng 66-241) | Timeout 4s; trả metadata trích dẫn giả khi Dify offline; chưa đồng bộ sang `reader-chat`. |
| **GraphRAG Store** | `frontend/src/lib/graphrag/graph-store.ts` | `queryGraphRAG`, `resolveBookEntity` | Chỉ có 4 cuốn sách mẫu; thiếu cơ chế đồng bộ tự động từ database sách Saleor. |
| **Vector Store** | `frontend/src/lib/graphrag/vector-store.ts` | `generateSemanticVector`, `searchVectorChunks` | Vector giả 64 chiều (keyword match + hash mod 32), không phải semantic dense embedding thực tế. |
| **AI Platform Config** | `ecommerce-ai-platform/ai_platform_config.json` | Cấu hình `rag`, `voice`, `reader` | `apiKey` là `"app-aurabook-rag-dev-key"` (dummy), `datasetId` là dummy, bị code voice agent chặn. |
| **Voice Agent Backend** | `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py` | `DifyRAGService.query_dify` (dòng 78-147) | Chặn key dev `app-aurabook-rag-dev-key`, trả về text tĩnh về DRM mà không gọi Dify. |
| **Backend AI Search** | `backend/aurabook_apps/ai_search/views.py` & `gemini_client.py` | `RAGQueryView`, `HybridSearchView` | Dùng `GEMINI_API_KEY` chưa cấu hình; không được kết nối với reader storefront. |

---

### 4.2. Khuyến Nghị Kỹ Thuật Khắc Phục Triệt Để (Actionable Recommendations)

#### A. Kiến Trúc Lại Endpoint `reader-chat/route.ts` Tích Hợp Đa Tầng (Multi-Tier RAG Pipeline)
1. **Tích hợp Dify RAG Thực Tế**:
   - Đọc cấu hình Dify (`apiUrl`, `apiKey`, `datasetId`) từ `ai_platform_config.json` và biến môi trường.
   - Thêm bước gọi Dify Knowledge Retrieval (`${apiUrl}/datasets/${datasetId}/retrieve` hoặc `${apiUrl}/chat-messages`).
   - Nếu Dify khả dụng: lấy context chuẩn xác từ Dify Knowledge Base đưa vào prompt.
   - Nếu Dify không khả dụng hoặc chưa có key: chuyển sang tầng GraphRAG nội bộ (`graphRAGStore`) làm fallback đáng tin cậy.

2. **Thiết Kế Lại Prompt Phân Biệt Ý Định (Intent-Adaptive Prompting)**:
   - Thay vì ép buộc 100% câu hỏi trả lời thành 3 mục triết học dài dòng, phân loại ý định người dùng thành 3 nhóm rõ ràng:
     * **Nhóm 1: Giao tiếp thông thường (Greeting / Chit-chat)** (ví dụ: "Chào bạn", "Cảm ơn", "Bạn là ai?"): Trả lời tự nhiên, lịch sự, ngắn gọn (1-2 câu), giới thiệu bản thân là Trợ lý AI Đọc sách của AuraBook.
     * **Nhóm 2: Tra cứu thông tin tác phẩm / Nghiệp vụ (Factual / Metadata / Policy)** (ví dụ: "Ai là tác giả?", "Sách có mấy chương?", "Giá bao nhiêu?", "Chính sách bản quyền DRM thế nào?"): Trả lời trực diện, chính xác theo số liệu trong CSDL/RAG, kèm nguồn dẫn chứng cụ thể.
     * **Nhóm 3: Phân tích trích đoạn / Ý nghĩa văn học (Literary Analysis / Deep Dive)** (khi người dùng bôi đen đoạn trích hoặc hỏi sâu về tư tưởng, ý nghĩa): Mới kích hoạt định dạng phân tích sâu sắc theo cấu trúc Bối cảnh & Ý nghĩa, Góc nhìn Triết lý, Bài học Thực tiễn.

3. **Mở Rộng Context Grounding Của RAG**:
   - Loại bỏ việc cắt cụt 300 ký tự (`slice(0, 300)`). Cho phép nạp toàn bộ nội dung của chunk (1000 - 2000 ký tự).
   - Nạp từ 3 - 5 chunks liên quan nhất và cung cấp tiêu đề chương mục rõ ràng để LLM trích dẫn chính xác.

4. **Tối Ưu Hóa Timeout & Fallback Chống Treo**:
   - Giảm timeout của Ollama từ 28s xuống **6s - 8s**. Nếu local LLM không phản hồi trong 8s, lập tức chuyển sang Gemini hoặc provider đám mây.
   - Xử lý `GEMINI_API_KEY`: Hỗ trợ key cấu hình từ `.env` hoặc cho phép người dùng cấu hình qua AI Admin Dashboard.
   - Trong `drm-web-reader.tsx`: Thay vì hiển thị câu xin lỗi chung chung khi có lỗi, hiển thị thông báo lỗi rõ ràng hoặc câu trả lời từ kho tri thức tóm tắt đã lưu sẵn của cuốn sách đang đọc.

#### B. Cấu Hình Đồng Bộ Dữ Liệu Sách & Tri Thức Dify
1. **Chuẩn hóa biến môi trường**:
   - Bổ sung vào `.env` và `.env.example`:
     ```env
     DIFY_API_URL=http://localhost:8080/v1
     DIFY_API_KEY=app-aurabook-rag-dev-key
     DIFY_DATASET_ID=dataset-aurabook-literature-01
     OLLAMA_BASE_URL=http://localhost:11434
     OLLAMA_MODEL=gemma2:2b
     ```
2. **Khởi tạo dữ liệu thực tế cho Dify & GraphRAG**:
   - Đồng bộ hóa toàn bộ danh mục sách từ Saleor PostgreSQL sang `graphrag_store.json` (không để chỉ dừng lại ở 4 cuốn sách).
   - Đảm bảo kịch bản khởi chạy Dify có tài liệu tri thức đầy đủ về danh mục sách, chính sách DRM LCP, quy định đổi trả/giao hàng.

---

## 5. Verification Method (Phương Pháp Kiểm Chứng Độc Lập)

Người nhận bàn giao có thể kiểm chứng độc lập các phát hiện trên thông qua các bước sau:

1. **Kiểm chứng mã nguồn `reader-chat/route.ts` không gọi Dify**:
   - Mở file `frontend/src/app/api/ai/reader-chat/route.ts`.
   - Tìm kiếm từ khóa `dify` hoặc `8080` -> Xác nhận không có bất kỳ kết quả nào.
2. **Kiểm chứng prompt ép 3 phần cho mọi câu hỏi**:
   - Kiểm tra dòng 145-160 trong `frontend/src/app/api/ai/reader-chat/route.ts`.
   - Thấy rõ dòng: `userMessageContent = `${cleanQuery} (Lưu ý: Bắt buộc trả lời bằng tiếng Việt đầy đủ, trọn vẹn 3 mục: Bối cảnh & Ý nghĩa, Triết lý & Tâm lý học, Bài học Thực tiễn).`;`
3. **Kiểm chứng việc cắt cụt context 300 ký tự**:
   - Kiểm tra dòng 126 trong `frontend/src/app/api/ai/reader-chat/route.ts`: `rc.chunk.content.slice(0, 300)`.
4. **Kiểm chứng đoản mạch Dify API Key trong Voice Agent**:
   - Mở file `ecommerce-ai-platform/voice-agent/backend/vietnamese_cskh_agent.py`.
   - Kiểm tra dòng 89: `if not api_key or api_key in ["app-your-dify-api-key", "app-aurabook-rag-dev-key"]:`
   - Đối chiếu với `ecommerce-ai-platform/ai_platform_config.json` dòng 16: `"apiKey": "app-aurabook-rag-dev-key"` -> Xác nhận luôn bị chặn và trả về text cứng.
5. **Kiểm chứng số lượng sách trong GraphRAG Store**:
   - Mở file `ecommerce-ai-platform/data/graphrag_store.json`.
   - Lọc các node có `"type": "book"` -> Xác nhận chỉ có 4 đầu sách tồn tại.

---
*Báo cáo được hoàn thành và sẵn sàng chuyển giao cho Orchestrator và các agent triển khai.*
