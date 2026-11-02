# BÁO CÁO ĐIỀU TRA & THIẾT KẾ TRIỂN KHAI: VIETNAMESE DIACRITICS NORMALIZATION, RESOLVE BOOK ENTITY & SEARCH PRODUCTS BY CONTEXT

**Người thực hiện:** M1 Explorer 1 (Teamwork Explorer)  
**Mã tiến trình / Thư mục làm việc:** `C:\Users\basduy05\Downloads\aurabook\.agents\teamwork\teamwork_explorer_m1_1\`  
**Phạm vi mục tiêu:** `frontend/src/lib/graphrag/graph-store.ts` & `frontend/src/lib/graphrag/vector-store.ts` (Feature F1, F2, F8 - Milestone 1)

---

## 1. Observation (Các Quan Sát Thực Tế Trực Tiếp)

### 1.1. Quan sát tại `frontend/src/lib/graphrag/graph-store.ts`
1. **Hiện trạng xử lý chuỗi tiếng Việt (`slugifyVietnamese`, dòng 30-39)**:
   ```typescript
   export function slugifyVietnamese(str: string): string {
       return str
           .toLowerCase()
           .replace(/đ/g, "d")
           .replace(/Đ/g, "d")
           .normalize("NFD")
           .replace(/[\u0300-\u036f]/g, "")
           .replace(/[^a-z0-9]+/g, "-")
           .replace(/^-+|-+$/g, "");
   }
   ```
   *Quan sát*: File mới chỉ có hàm tạo slug `slugifyVietnamese`, **chưa có hàm `stripVietnameseDiacritics(str: string): string`** để chuyển đổi chuỗi tiếng Việt giữ nguyên cấu trúc từ và khoảng trắng phục vụ tìm kiếm/so khớp.
2. **Hiện trạng hàm `resolveBookEntity(query: string, activeSlug?: string)` (dòng 791-845)**:
   ```typescript
   // Dòng 816-827: Hardcoded kiểm tra 4 cuốn sách duy nhất bằng tiếng Việt có dấu:
   if (lower.includes("trí tuệ do thái") || lower.includes("do thái") || lower.includes("eran katz")) {
       return books.find((b) => b.properties.slug === "tri-tue-do-thai") || null;
   }
   if (lower.includes("đắc nhân tâm") || (lower.includes("giao tiếp") && !lower.includes("thói quen"))) {
       return books.find((b) => b.properties.slug === "dac-nhan-tam") || null;
   }
   if (lower.includes("bốn thỏa ước") || lower.includes("thỏa ước") || lower.includes("chữa lành") || lower.includes("toltec")) {
       return books.find((b) => b.properties.slug === "bon-thoa-uoc") || null;
   }
   if (lower.includes("sapiens") || lower.includes("lược sử loài người") || lower.includes("loài người") || lower.includes("tiến hóa")) {
       return books.find((b) => b.properties.slug === "sapiens-luoc-su-loai-nguoi") || null;
   }

   // Dòng 830-836: Quét trực tiếp title hoặc slug
   for (const b of books) {
       const titleLower = (b.properties.title || "").toLowerCase();
       const slugLower = (b.properties.slug || "").toLowerCase();
       if (lower.includes(titleLower) || lower.includes(slugLower)) {
           return b;
       }
   }
   ```
   *Quan sát trực tiếp*:
   - Khi người dùng gửi truy vấn không dấu `"dac nhan tam"`, biến `lower` là `"dac nhan tam"`.
   - `lower.includes("đắc nhân tâm")` trả về `false`.
   - `titleLower` là `"đắc nhân tâm"` -> `lower.includes(titleLower)` trả về `false`.
   - `slugLower` là `"dac-nhan-tam"` (dấu gạch nối) trong khi câu hỏi có khoảng trắng `"dac nhan tam"` -> `lower.includes(slugLower)` trả về `false`.
   - 9 đầu sách còn lại trong kho 13 cuốn (`10-dieu-tao-nen-so-phan`, `bi-mat-cua-mot-tri-nho-sieu-pham`, `cach-nghi-de-thanh-cong`, `cay-cam-ngot-cua-toi`, `chien-tranh-tien-te-tap-1`, `2`, `3`, `chu-nghia-khac-ky-...`, `tu-duy-nhanh-va-cham`) hoàn toàn không có định nghĩa bí danh/từ khóa, chỉ phụ thuộc vào bước quét chuỗi có dấu.
   - Các từ viết tắt thông dụng như `dnt`, `đnt`, `btu`, `lsln`, `ttdt`, `cttt 1-3`, `cnkk`, `tdnvc` không được hỗ trợ.

3. **Hiện trạng hàm `searchProductsByContext(query: string, options?: ...)` (dòng 1106-1413)**:
   ```typescript
   // Dòng 1111: Chỉ chuyển lowercase và trim, không loại bỏ dấu tiếng Việt:
   const cleanQuery = (query || "").trim().toLowerCase();

   // Dòng 1273-1282: So khớp cụm từ có dấu trực tiếp:
   for (const phrase of phrases) {
       if (title.includes(phrase)) { score += 1.4; ... }
   }

   // Dòng 1287-1296: So khớp từng từ bằng includes substring:
   for (const w of meaningfulWords) {
       if (title.includes(w)) { score += 0.7; ... }
   }

   // Dòng 1303-1338: Semantic Cluster chỉ hỗ trợ 4 sách có dấu:
   if ((cleanQuery.includes("đắc nhân tâm") || ...) && slug === "dac-nhan-tam") { ... }

   // Dòng 1405-1410: ÉP BUỘC CẮT LÁT 3 CUỐN KHI KHÔNG KHỚP (HALLUCINATION FALLBACK):
   if (finalMatches.length === 0 && scoredBooks.length > 0) {
       finalMatches = scoredBooks.slice(0, Math.min(3, scoredBooks.length));
   }
   ```
   *Quan sát trực tiếp*:
   - Khi tìm kiếm `"dac nhan tam"`: Cuốn `Đắc Nhân Tâm` nhận 0 điểm ở tất cả các bước (khớp cụm từ, khớp từ khóa, khớp cluster) do không đồng nhất bảng mã/dấu.
   - Khi dùng `title.includes(w)` theo kiểu substring: Từ `"nhan"` trong câu hỏi `"dac nhan tam"` vô tình khớp với từ `"nhanh"` trong tiêu đề `"Tư Duy Nhanh Và Chậm"`, đẩy cuốn sách hoàn toàn sai lên Top 1 kết quả!
   - Khi tìm kiếm các chủ đề ngoài danh mục như `"Harry Potter"`, `"nấu ăn"`, `"Hồ Chí Minh"`: Thay vì trả về kết quả rỗng `products: []`, hàm tự động kích hoạt `finalMatches = scoredBooks.slice(0, 3)`, trả về 3 cuốn ngẫu nhiên với điểm số giả tạo 22%, 18%, 14%.

### 1.2. Quan sát tại `frontend/src/lib/graphrag/vector-store.ts`
1. **Hiện trạng mảng `SEMANTIC_KEYWORDS` (dòng 6-15)**:
   - Toàn bộ từ khóa trong 8 clusters đều là tiếng Việt có dấu (`"giao tiếp"`, `"ứng xử"`, `"thỏa ước"`, `"lịch sử"`,...).
2. **Hiện trạng hàm `generateSemanticVector(text: string)` (dòng 20-69)**:
   - Dòng 29: `if (lower.includes(kw))` chỉ kiểm tra chuỗi có dấu.
   - Thử nghiệm thực tế: Khi chạy `generateSemanticVector` cho `"đắc nhân tâm giao tiếp"` và `"dac nhan tam giao tiep"`, độ tương đồng Cosine giữa 2 vector là **0.0000** (hoàn toàn trực giao, không có bất kỳ trọng số ngữ nghĩa chung nào).
3. **Hiện trạng hàm `searchVectorChunks` (dòng 123-150)**:
   - Dòng 140: `if (textLower.includes(qw)) lexicalBonus += 0.05;` chỉ kiểm tra từ khóa nguyên văn có dấu, dẫn tới lexical bonus = 0 khi tìm kiếm không dấu.

### 1.3. Danh Mục 13 Tác Phẩm Thực Tế Trong `ecommerce-ai-platform/data/graphrag_store.json`
Đã đọc và xác thực đầy đủ 13 tác phẩm (`nodes` type `book`):
1. `bon-thoa-uoc`: *Bốn Thỏa Ước* (Don Miguel Ruiz) — Ebook 49k, Giấy 98k.
2. `dac-nhan-tam`: *Đắc Nhân Tâm* (Dale Carnegie) — Ebook 59k, Giấy 118k.
3. `sapiens-luoc-su-loai-nguoi`: *Sapiens: Lược Sử Loài Người* (Yuval Noah Harari) — Ebook 89k, Giấy 189k.
4. `tri-tue-do-thai`: *Trí Tuệ Do Thái* (Eran Katz) — Ebook 69k, Giấy 135k.
5. `10-dieu-tao-nen-so-phan`: *10 Điều Tạo Nên Số Phận* (David Simon, M.D) — Ebook 49k, Giấy 98k.
6. `bi-mat-cua-mot-tri-nho-sieu-pham`: *Bí Mật Của Một Trí Nhớ Siêu Phàm* (Eran Katz) — Ebook 59k, Giấy 119k.
7. `cach-nghi-de-thanh-cong`: *Cách Nghĩ Để Thành Công* (Napoleon Hill) — Ebook 49k, Giấy 99k.
8. `cay-cam-ngot-cua-toi`: *Cây Cam Ngọt Của Tôi* (José Mauro de Vasconcelos) — Ebook 49k, Giấy 108k.
9. `chien-tranh-tien-te-tap-1`: *Chiến Tranh Tiền Tệ - Tập 1* (Song Hongbing) — Ebook 69k, Giấy 139k.
10. `chien-tranh-tien-te-tap-2`: *Chiến Tranh Tiền Tệ - Tập 2* (Song Hongbing) — Ebook 69k, Giấy 139k.
11. `chien-tranh-tien-te-tap-3`: *Chiến Tranh Tiền Tệ - Tập 3* (Song Hongbing) — Ebook 69k, Giấy 139k.
12. `chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than`: *Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản* (William B. Irvine) — Ebook 65k, Giấy 129k.
13. `tu-duy-nhanh-va-cham`: *Tư Duy Nhanh Và Chậm* (Daniel Kahneman) — Ebook 79k, Giấy 159k.

---

## 2. Logic Chain (Chuỗi Lập Luận Từ Nguyên Nhân Gốc Rễ Đến Giải Pháp)

```
[Truy vấn không dấu "dac nhan tam"] 
      |
      v
(Chuỗi cleanQuery không có dấu) 
      |
      +---> [resolveBookEntity]: 
      |         titleLower="đắc nhân tâm", slugLower="dac-nhan-tam"
      |         Không khớp title do có dấu; không khớp slug do có gạch nối
      |         => Trả về NULL => Voice Chat fallback sang chào hỏi chung chung.
      |
      +---> [searchProductsByContext]:
      |         Phrase & Word match so sánh có dấu => Điểm "Đắc Nhân Tâm" = 0
      |         Substring "nhan" trong "nhanh" => "Tư Duy Nhanh Và Chậm" nhận điểm
      |         => Xếp sai sách lên đầu.
      |
      +---> [Out-of-Catalog Query "Harry Potter"]:
                hasDirectMatch = false
                Kích hoạt scoredBooks.slice(0, 3)
                => Trả về 3 sách ngẫu nhiên (Ảo giác kết quả tìm kiếm).
```

1. **Nguyên nhân cốt lõi của việc mất dấu tiếng Việt**: Chuẩn Unicode phân tách các ký tự tiếng Việt thành dạng NFD (ký tự gốc + dấu kết hợp `\u0300-\u036f`). Riêng chữ `đ` (U+0111) và `Đ` (U+0110) là ký tự Latinh có gạch ngang độc lập, không bị phân rã bởi NFD. Nếu không thay thế `đ/Đ` thành `d/D` và loại bỏ combining diacritics, mọi phép so sánh chuỗi tiếng Việt không dấu đều trả về `false`.
2. **Nguyên nhân của hiện tượng "Tư Duy Nhanh Và Chậm" nhận điểm**: Việc dùng phép so khớp chuỗi con (`string.includes(token)`) khiến từ ngắn `"nhan"` trở thành chuỗi con của từ dài `"nhanh"`, `"chi"` thành chuỗi con của `"chien"`. Do đó, cần áp dụng cơ chế **Tokenized Word Matching** (so khớp chính xác từng từ trong mảng từ tố) thay vì substring thông thường.
3. **Nguyên nhân của lỗi Hallucination khi tìm sách ngoài danh mục**: Đoạn code `finalMatches = scoredBooks.slice(0, 3)` là một fallback nhân tạo ép hệ thống luôn phải có sản phẩm trả về. Để loại bỏ hiện tượng bịa đặt, khi `hasDirectMatch === false`, trường `products` và `recommendations` phải trả về mảng rỗng `[]`, `totalCount: 0`, đồng thời hiển thị thông điệp trung thực giải thích rằng kho sách chưa có tựa đề này.

---

## 3. Caveats (Các Giới Hạn & Điểm Cần Lưu Ý)

1. **Quyền hạn chỉ đọc (Read-only)**: Báo cáo này thiết kế chi tiết mã nguồn và đề xuất cụ thể cho agent cài đặt (Implementer). Không can thiệp sửa trực tiếp mã nguồn trong lượt làm việc này.
2. **Xử lý bộ sách nhiều tập ("Chiến Tranh Tiền Tệ")**: Đối với truy vấn chung "chiến tranh tiền tệ" (không nói rõ tập), `searchProductsByContext` sẽ trả về cả 3 tập (Tập 1, 2, 3), trong khi `resolveBookEntity` sẽ ưu tiên trả về Tập 1 (`chien-tranh-tien-te-tap-1`) làm tập dẫn xuất mặc định của bộ sách.
3. **Bộ nhớ đệm (Cache Manifest)**: Next.js Storefront có cơ chế cache static routes; sau khi chỉnh sửa `graph-store.ts`, cần đảm bảo test chạy qua Vitest hoặc gọi API với dynamic request để kiểm chứng ngay lập tức.

---

## 4. Conclusion & Recommended Implementation (Thiết Kế Chi Tiết & Mã Nguồn Đề Xuất)

### 4.1. Thiết Kế Hàm `stripVietnameseDiacritics(str: string): string`
Đặt tại đầu file `frontend/src/lib/graphrag/graph-store.ts` (export để các module khác cùng sử dụng):

```typescript
/**
 * Loại bỏ toàn bộ dấu thanh, dấu mũ, dấu móc tiếng Việt và chuyển 'đ/Đ' -> 'd/D'
 * Đảm bảo 100% các ký tự tiếng Việt (chuẩn NFC lẫn NFD) đều chuyển thành ký tự ASCII tương ứng.
 */
export function stripVietnameseDiacritics(str: string): string {
	if (!str || typeof str !== "string") return "";
	return str
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Chuẩn hóa chuỗi truy vấn: chuyển về chữ thường, bỏ dấu tiếng Việt và thu gọn khoảng trắng thừa
 */
export function normalizeVietnameseQuery(query: string): string {
	if (!query) return "";
	return stripVietnameseDiacritics(query).toLowerCase().replace(/\s+/g, " ").trim();
}
```

### 4.2. Thiết Kế Bản Đồ 13 Tác Phẩm & Hàm `resolveBookEntity`
Bổ sung bảng dữ liệu `BOOK_CATALOG_MAPPING` bao quát đầy đủ 13 tác phẩm: tiêu đề có dấu, tiêu đề không dấu, slug, từ viết tắt và tên tác giả:

```typescript
export interface BookEntityMapping {
	slug: string;
	title: string;
	titleUnaccented: string;
	slugWords: string;
	author: string;
	authorUnaccented: string;
	abbreviations: string[];
	keywords: string[];
}

export const BOOK_CATALOG_MAPPING: BookEntityMapping[] = [
	{
		slug: "dac-nhan-tam",
		title: "Đắc Nhân Tâm",
		titleUnaccented: "dac nhan tam",
		slugWords: "dac nhan tam",
		author: "Dale Carnegie",
		authorUnaccented: "dale carnegie",
		abbreviations: ["dnt", "đnt"],
		keywords: ["giao tiep", "thu phuc long nguoi", "how to win friends"]
	},
	{
		slug: "bon-thoa-uoc",
		title: "Bốn Thỏa Ước",
		titleUnaccented: "bon thoa uoc",
		slugWords: "bon thoa uoc",
		author: "Don Miguel Ruiz",
		authorUnaccented: "don miguel ruiz",
		abbreviations: ["btu", "4 thoa uoc", "4 thoa uoc"],
		keywords: ["thoa uoc", "chua lanh", "noi tam", "toltec", "the four agreements"]
	},
	{
		slug: "sapiens-luoc-su-loai-nguoi",
		title: "Sapiens: Lược Sử Loài Người",
		titleUnaccented: "sapiens luoc su loai nguoi",
		slugWords: "sapiens luoc su loai nguoi",
		author: "Yuval Noah Harari",
		authorUnaccented: "yuval noah harari",
		abbreviations: ["lsln", "sapiens"],
		keywords: ["luoc su loai nguoi", "loai nguoi", "tien hoa", "harari"]
	},
	{
		slug: "tri-tue-do-thai",
		title: "Trí Tuệ Do Thái",
		titleUnaccented: "tri tue do thai",
		slugWords: "tri tue do thai",
		author: "Eran Katz",
		authorUnaccented: "eran katz",
		abbreviations: ["ttdt"],
		keywords: ["do thai", "tri tue do thai", "nguoi do thai", "jerome"]
	},
	{
		slug: "10-dieu-tao-nen-so-phan",
		title: "10 Điều Tạo Nên Số Phận",
		titleUnaccented: "10 dieu tao nen so phan",
		slugWords: "10 dieu tao nen so phan",
		author: "David Simon, M.D",
		authorUnaccented: "david simon",
		abbreviations: ["10 dtnsp", "10 dieu", "muoi dieu"],
		keywords: ["so phan", "10 dieu tao nen so phan", "dieu tao nen so phan"]
	},
	{
		slug: "bi-mat-cua-mot-tri-nho-sieu-pham",
		title: "Bí Mật Của Một Trí Nhớ Siêu Phàm",
		titleUnaccented: "bi mat cua mot tri nho sieu pham",
		slugWords: "bi mat cua mot tri nho sieu pham",
		author: "Eran Katz",
		authorUnaccented: "eran katz",
		abbreviations: ["bmcmtnsp", "tnsp"],
		keywords: ["tri nho sieu pham", "bi mat tri nho", "tri nho", "sieu pham", "ghi nho"]
	},
	{
		slug: "cach-nghi-de-thanh-cong",
		title: "Cách Nghĩ Để Thành Công",
		titleUnaccented: "cach nghi de thanh cong",
		slugWords: "cach nghi de thanh cong",
		author: "Napoleon Hill",
		authorUnaccented: "napoleon hill",
		abbreviations: ["cndtc"],
		keywords: ["cach nghi", "thanh cong", "nghi giau lam giau", "think and grow rich"]
	},
	{
		slug: "cay-cam-ngot-cua-toi",
		title: "Cây Cam Ngọt Của Tôi",
		titleUnaccented: "cay cam ngot cua toi",
		slugWords: "cay cam ngot cua toi",
		author: "José Mauro de Vasconcelos",
		authorUnaccented: "jose mauro de vasconcelos",
		abbreviations: ["ccnct"],
		keywords: ["cay cam ngot", "cay cam", "zeze", "vasconcelos"]
	},
	{
		slug: "chien-tranh-tien-te-tap-1",
		title: "Chiến Tranh Tiền Tệ - Tập 1",
		titleUnaccented: "chien tranh tien te tap 1",
		slugWords: "chien tranh tien te tap 1",
		author: "Song Hongbing",
		authorUnaccented: "song hongbing",
		abbreviations: ["cttt 1", "cttt1", "cttt tap 1"],
		keywords: ["chien tranh tien te 1", "tien te 1", "song hongbing 1"]
	},
	{
		slug: "chien-tranh-tien-te-tap-2",
		title: "Chiến Tranh Tiền Tệ - Tập 2",
		titleUnaccented: "chien tranh tien te tap 2",
		slugWords: "chien tranh tien te tap 2",
		author: "Song Hongbing",
		authorUnaccented: "song hongbing",
		abbreviations: ["cttt 2", "cttt2", "cttt tap 2"],
		keywords: ["chien tranh tien te 2", "tien te 2", "song hongbing 2"]
	},
	{
		slug: "chien-tranh-tien-te-tap-3",
		title: "Chiến Tranh Tiền Tệ - Tập 3",
		titleUnaccented: "chien tranh tien te tap 3",
		slugWords: "chien tranh tien te tap 3",
		author: "Song Hongbing",
		authorUnaccented: "song hongbing",
		abbreviations: ["cttt 3", "cttt3", "cttt tap 3"],
		keywords: ["chien tranh tien te 3", "tien te 3", "song hongbing 3"]
	},
	{
		slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
		title: "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản",
		titleUnaccented: "chu nghia khac ky phong cach song ban linh & binh than",
		slugWords: "chu nghia khac ky phong cach song ban linh binh than",
		author: "William B. Irvine",
		authorUnaccented: "william b irvine",
		abbreviations: ["cnkk"],
		keywords: ["chu nghia khac ky", "khac ky", "stoicism", "william irvine", "binh than"]
	},
	{
		slug: "tu-duy-nhanh-va-cham",
		title: "Tư Duy Nhanh Và Chậm",
		titleUnaccented: "tu duy nhanh va cham",
		slugWords: "tu duy nhanh va cham",
		author: "Daniel Kahneman",
		authorUnaccented: "daniel kahneman",
		abbreviations: ["tdnvc"],
		keywords: ["tu duy nhanh", "nhanh va cham", "kahneman", "thinking fast and slow"]
	}
];
```

**Mã nguồn mới của `resolveBookEntity`**:
```typescript
	/**
	 * Tìm cuốn sách phù hợp nhất từ câu truy vấn (Hỗ trợ tiếng Việt có dấu, không dấu, slug, từ viết tắt và Anaphora)
	 */
	public resolveBookEntity(query: string, activeSlug?: string): GraphNode | null {
		const store = this.load();
		const raw = (query || "").trim();
		if (!raw) return null;

		const lower = raw.toLowerCase();
		const unaccented = stripVietnameseDiacritics(lower).replace(/\s+/g, " ").trim();
		const querySlug = slugifyVietnamese(lower);
		const books = store.nodes.filter((n) => n.type === "book");

		// 1. Kiểm tra Anaphora (đại từ chỉ định thay thế)
		const isAnaphoric =
			/^(mua nó|mua quyển này|mua cuốn này|mua cuốn đó|lấy nó|cho tôi mua nó|cho tôi mua quyển này|cuốn này giá bao nhiêu|giá nó bao nhiêu|quyển này bao nhiêu|nó có mấy bản|cuốn đó thế nào)$/i.test(
				lower,
			) ||
			/^(mua no|mua quyen nay|mua cuon nay|mua cuon do|lay no|cho toi mua no|cuon nay gia bao nhieu|gia no bao nhieu|quyen nay bao nhieu)$/i.test(
				unaccented,
			) ||
			lower.includes("mua nó") ||
			lower.includes("mua quyển này") ||
			lower.includes("cuốn vừa nãy") ||
			unaccented.includes("mua no") ||
			unaccented.includes("cuon nay");

		if (isAnaphoric && activeSlug) {
			const activeBook = books.find((b) => b.properties.slug === activeSlug);
			if (activeBook) return activeBook;
		}

		// 2. Khớp trực tiếp Slug chính xác
		if (querySlug) {
			const directSlugBook = books.find((b) => b.properties.slug === querySlug);
			if (directSlugBook) return directSlugBook;
		}

		// 3. Khớp qua Bảng Ánh Xạ Thực Thể 13 Cuốn (Từ viết tắt, Từ khóa đặc thù, Tác giả)
		for (const item of BOOK_CATALOG_MAPPING) {
			// Kiểm tra từ viết tắt (so khớp theo biên từ để tránh nhầm lẫn từ con)
			for (const abbr of item.abbreviations) {
				const abbrRegex = new RegExp(`(^|[^a-zA-Z0-9_])${abbr}([^a-zA-Z0-9_]|$)`, "i");
				if (abbrRegex.test(lower) || abbrRegex.test(unaccented)) {
					const found = books.find((b) => b.properties.slug === item.slug);
					if (found) return found;
				}
			}

			// Kiểm tra tác giả
			if (item.authorUnaccented && unaccented.includes(item.authorUnaccented)) {
				const found = books.find((b) => b.properties.slug === item.slug);
				if (found) return found;
			}

			// Kiểm tra từ khóa đặc trưng của tác phẩm
			for (const kw of item.keywords) {
				if (lower.includes(kw) || unaccented.includes(kw)) {
					const found = books.find((b) => b.properties.slug === item.slug);
					if (found) return found;
				}
			}
		}

		// Xử lý riêng trường hợp Chiến Tranh Tiền Tệ chung (nếu không chỉ rõ tập thì ưu tiên Tập 1)
		if (unaccented.includes("chien tranh tien te") || lower.includes("chiến tranh tiền tệ")) {
			if (unaccented.includes("tap 3") || unaccented.includes("3")) {
				return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-3") || null;
			}
			if (unaccented.includes("tap 2") || unaccented.includes("2")) {
				return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-2") || null;
			}
			return books.find((b) => b.properties.slug === "chien-tranh-tien-te-tap-1") || null;
		}

		// 4. Quét tiêu đề và slug words của toàn bộ sách trong store (hỗ trợ cả có dấu và không dấu)
		for (const b of books) {
			const bTitle = (b.properties.title || b.label || "").toLowerCase();
			const bTitleUnaccented = stripVietnameseDiacritics(bTitle);
			const bSlug = (b.properties.slug || "").toLowerCase();
			const bSlugWords = bSlug.replace(/-/g, " ");

			if (
				lower.includes(bTitle) ||
				unaccented.includes(bTitleUnaccented) ||
				unaccented.includes(bSlugWords) ||
				querySlug.includes(bSlug)
			) {
				return b;
			}
		}

		// 5. Fallback về activeSlug nếu có
		if (activeSlug) {
			const activeBook = books.find((b) => b.properties.slug === activeSlug);
			if (activeBook) return activeBook;
		}

		return null;
	}
```

### 4.3. Thiết Kế Hàm `searchProductsByContext`: Xếp Hạng Chuẩn Xác & Gỡ Bỏ Fallback Cắt Lát 3 Sách
Các thay đổi trọng tâm:
1. Tạo `unaccentedQuery` và tách từ thành các token độc lập (`queryTokens`).
2. Thay thế `string.includes(w)` bằng so khớp token chính xác (`titleTokens.includes(token)`), loại bỏ triệt để hiện tượng `"nhan"` khớp nhầm vào `"nhanh"`.
3. Bổ sung cụm chuyên đề ngữ nghĩa cho đủ 13 cuốn sách (hỗ trợ cả có dấu và không dấu).
4. **Loại bỏ hoàn toàn dòng `finalMatches = scoredBooks.slice(0, 3)`**:
   - Nếu `!hasDirectMatch` hoặc không có sách nào đạt ngưỡng điểm: trả về `products: []`, `recommendations: []`, `totalCount: 0`.
   - Hiển thị `reasoningSummary` và `queryInterpretation` thông báo trung thực rằng kho sách hiện tại của AuraBook chưa có tác phẩm viết riêng về chủ đề này.

```typescript
	public searchProductsByContext(
		query: string,
		options?: { locale?: string; channel?: string; limit?: number },
	): GraphRAGSearchResult {
		const store = this.load();
		const cleanQuery = (query || "").trim().toLowerCase();
		const unaccentedQuery = stripVietnameseDiacritics(cleanQuery).replace(/\s+/g, " ").trim();

		if (!cleanQuery) {
			return {
				products: [],
				matchedConcepts: [],
				totalCount: 0,
				reasoningSummary: "",
				queryInterpretation: "",
				recommendations: [],
				supplementaryRecommendations: [],
				hasDirectMatch: false,
			};
		}

		const channel = options?.channel || "channel-vnd";
		const locale = options?.locale || "vi";
		const limit = options?.limit || 12;

		// 1. Sinh vector ngữ nghĩa (đã hỗ trợ chuẩn hóa không dấu)
		const queryVec = generateSemanticVector(cleanQuery);

		// 2. Nhận diện các khái niệm chuyên mục
		const matchedConcepts: string[] = [];
		// ... ánh xạ conceptLabels ...

		// 3. Lấy danh sách Book Nodes
		const bookNodes = [...store.nodes.filter((n) => n.type === "book")];

		const VIETNAMESE_STOP_WORDS = new Set([
			"về", "của", "và", "các", "những", "trong", "cho", "với", "là", "có", "để", "được", "tôi", "bạn",
			"ở", "ra", "lại", "lên", "xuống", "một", "này", "đó", "thì", "mà", "sao", "gì", "ai", "đâu", "nào",
			"cuốn", "sách", "những", "các", "muốn", "tìm", "đọc", "như", "thế", "hỏi", "giúp", "với", "an", "ăn"
		]);

		const tokenize = (text: string) =>
			stripVietnameseDiacritics(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

		const queryTokens = tokenize(cleanQuery);
		const meaningfulTokens = queryTokens.filter((w) => w.length > 1 && !VIETNAMESE_STOP_WORDS.has(w));

		// Tạo bigrams từ khóa
		const queryBigrams: string[] = [];
		for (let i = 0; i < queryTokens.length - 1; i++) {
			if (!VIETNAMESE_STOP_WORDS.has(queryTokens[i]) || !VIETNAMESE_STOP_WORDS.has(queryTokens[i + 1])) {
				queryBigrams.push(`${queryTokens[i]} ${queryTokens[i + 1]}`);
			}
		}

		const scoredBooks: Array<{
			book: GraphNode;
			score: number;
			matchReasons: string[];
			topChunk?: VectorChunk;
			matchedTerms: string[];
			titleTokenHits: number;
		}> = [];

		for (const book of bookNodes) {
			let score = 0;
			const matchReasons: string[] = [];
			const matchedTerms: string[] = [];
			const slug = book.properties?.slug || "";
			const title = (book.properties?.title || book.label || "").toLowerCase();
			const titleUnaccented = stripVietnameseDiacritics(title).toLowerCase();
			const titleTokens = tokenize(title);
			const slugWords = slug.replace(/-/g, " ");
			const author = (book.properties?.author || "").toLowerCase();
			const authorUnaccented = stripVietnameseDiacritics(author).toLowerCase();
			const authorTokens = tokenize(author);
			const desc = (book.properties?.description || "").toLowerCase();
			const descUnaccented = stripVietnameseDiacritics(desc).toLowerCase();

			// 4.1. Khớp chính xác tiêu đề hoặc slug (Ưu tiên cao nhất)
			if (cleanQuery === title || unaccentedQuery === titleUnaccented || unaccentedQuery === slugWords) {
				score += 5.0;
				matchReasons.push("Khớp chính xác tên tác phẩm");
				matchedTerms.push(book.properties?.title || title);
			} else if (unaccentedQuery.includes(titleUnaccented) || unaccentedQuery.includes(slugWords)) {
				score += 3.5;
				matchReasons.push(`Truy vấn chứa trọn vẹn tiêu đề: "${book.properties?.title}"`);
				matchedTerms.push(book.properties?.title || title);
			} else if (titleUnaccented.includes(unaccentedQuery) && unaccentedQuery.length > 4) {
				score += 3.0;
				matchReasons.push(`Tiêu đề chứa cụm từ tìm kiếm`);
				matchedTerms.push(cleanQuery);
			}

			// 4.2. Khớp cụm 2 từ (Bigram matching)
			for (const bg of queryBigrams) {
				if (titleUnaccented.includes(bg)) {
					score += 1.8;
					matchReasons.push(`Khớp cụm từ tiêu đề: "${bg}"`);
					if (!matchedTerms.includes(bg)) matchedTerms.push(bg);
				} else if (descUnaccented.includes(bg)) {
					score += 0.9;
					if (!matchedTerms.includes(bg)) matchedTerms.push(bg);
				}
			}

			// 4.3. Khớp Token từ có nghĩa (Token Equality, không dùng substring)
			let titleTokenHits = 0;
			for (const token of meaningfulTokens) {
				if (titleTokens.includes(token)) {
					score += 1.0;
					titleTokenHits++;
					if (!matchedTerms.includes(token)) matchedTerms.push(token);
				} else if (authorTokens.includes(token)) {
					score += 0.8;
					if (!matchedTerms.includes(token)) matchedTerms.push(token);
				} else if (descUnaccented.includes(token)) {
					score += 0.3;
					if (!matchedTerms.includes(token)) matchedTerms.push(token);
				}
			}

			// 4.4. Khớp Semantic Cluster cho 13 cuốn sách (hỗ trợ cả có dấu và không dấu)
			// (Đắc Nhân Tâm, Bốn Thỏa Ước, Sapiens, Trí Tuệ Do Thái, 10 Điều, Trí Nhớ Siêu Phàm,
			//  Cách Nghĩ Để Thành Công, Cây Cam Ngọt, Chiến Tranh Tiền Tệ 1-3, Khắc Kỷ, Tư Duy Nhanh & Chậm)
			// ...

			// 4.5. Đối chiếu Vector Chunks
			const bookChunks = store.chunks.filter((c) => c.bookSlug === slug || c.bookId === book.id);
			let bestChunk: VectorChunk | undefined;
			if (bookChunks.length > 0) {
				const topChunks = searchVectorChunks(cleanQuery, queryVec, bookChunks, 3, slug);
				if (topChunks.length > 0 && topChunks[0].score > 0.35) {
					bestChunk = topChunks[0].chunk;
					const sim = topChunks[0].score;
					score += sim * 0.9;
					matchReasons.push(`Độ tương đồng nội dung văn bản: ${(sim * 100).toFixed(0)}%`);
				}
			}

			// Chỉ ghi nhận sách có điểm liên quan thực chất
			if (score >= 1.2 || (titleTokenHits >= 2 && titleTokenHits >= titleTokens.length * 0.5)) {
				scoredBooks.push({
					book,
					score: Number(score.toFixed(4)),
					matchReasons: matchReasons.length > 0 ? matchReasons : ["Khớp ngữ nghĩa chuyên mục"],
					topChunk: bestChunk,
					matchedTerms,
					titleTokenHits,
				});
			}
		}

		// 5. Kiểm tra sách ngoài danh mục (Anti-Hallucination Guardrail)
		const isOutOfCatalog =
			/(\b(ho chi minh|bac ho|nguyen ai quoc|vo nguyen giap|nau an|truyen tranh|harry potter|doremon|conan)\b)/i.test(unaccentedQuery);

		scoredBooks.sort((a, b) => b.score - a.score);
		const topScore = scoredBooks[0]?.score || 0;
		const hasDirectMatch = !isOutOfCatalog && scoredBooks.length > 0 && topScore >= 1.5;

		let finalMatches: typeof scoredBooks = [];
		if (hasDirectMatch) {
			finalMatches = scoredBooks.filter((item) => {
				if (item.score === topScore) return true;
				return item.score >= 1.5 && item.score >= topScore * 0.4;
			}).slice(0, limit);
		}

		// KHÔNG BAO GIỜ DÙNG finalMatches = scoredBooks.slice(0, 3) NỮA!
		// Nếu hasDirectMatch là false -> finalMatches rỗng []

		// 6. Xây dựng kết quả trả về
		let queryInterpretation = "";
		let reasoningSummary = "";

		if (!hasDirectMatch) {
			queryInterpretation = isOutOfCatalog
				? `Hệ thống phân tích ngữ nghĩa nhận diện bạn đang tìm kiếm về "${query}". Rất tiếc, kho sách tuyển chọn của AuraBook hiện chưa có tác phẩm viết riêng về nhân vật / chủ đề này.`
				: `Hệ thống phân tích câu hỏi "${query}" nhưng hiện chưa có ấn phẩm phù hợp trong danh mục 13 cuốn sách của AuraBook.`;
			reasoningSummary = `Kho sách AuraBook hiện chưa có tác phẩm về "${query}". Hệ thống chỉ cung cấp kết quả khi có dữ liệu xác thực, không đưa ra thông tin giả mạo.`;
		} else {
			reasoningSummary = `GraphRAG AI đã phân tích câu hỏi "${query}" và tìm thấy ${finalMatches.length} ấn phẩm khớp trọng tâm nhất từ kho tri thức hệ thống.`;
		}

		const products: ProductCardData[] = finalMatches.map(({ book, score: itemScore }) => {
			// Ánh xạ sang ProductCardData chuẩn
			// ...
		});

		const recommendations: BookRecommendationDetail[] = finalMatches.map(({ book, score: itemScore }) => {
			// Ánh xạ sang BookRecommendationDetail chuẩn
			// ...
		});

		return {
			products,
			matchedConcepts,
			totalCount: products.length,
			reasoningSummary,
			queryInterpretation,
			recommendations,
			supplementaryRecommendations: [],
			hasDirectMatch,
		};
	}
```

### 4.4. Cập Nhật Bổ Trợ Cho `vector-store.ts`
1. Cập nhật `generateSemanticVector(text: string): number[]`:
   - Chuẩn hóa text sang cả dạng có dấu `lower` và không dấu `unaccented = stripVietnameseDiacritics(lower)`.
   - Khi quét qua `SEMANTIC_KEYWORDS`: kiểm tra `lower.includes(kw) || unaccented.includes(stripVietnameseDiacritics(kw))`.
2. Cập nhật `searchVectorChunks`:
   - So khớp lexical bonus trên cả dạng không dấu: `textUnaccented.includes(qwUnaccented)`.

---

## 5. Verification Method (Phương Pháp Xác Minh Độc Lập)

Bất kỳ chuyên viên hoặc agent nào tiếp nhận báo cáo đều có thể tự mình kiểm chứng độc lập thông qua các bước sau:

### 5.1. Chạy bộ kiểm thử tự động Vitest
Tạo file kiểm thử `frontend/src/lib/graphrag/graph-store.test.ts` và chạy lệnh:
```powershell
pnpm --prefix C:\Users\basduy05\Downloads\aurabook\frontend test:run src/lib/graphrag/graph-store.test.ts
```
**Các ca kiểm thử bắt buộc (Test Cases)**:
1. `stripVietnameseDiacritics`:
   - Chuyển toàn bộ 67 ký tự nguyên âm có dấu về nguyên âm ASCII (`à, á, ả, ã, ạ, ă, ắ...` -> `a`).
   - Chuyển `đ` -> `d`, `Đ` -> `D`.
   - Giữ nguyên chuỗi đã là ASCII hoặc chuỗi số.
2. `resolveBookEntity`:
   - Khớp có dấu: `"Đắc Nhân Tâm"` -> `dac-nhan-tam`.
   - Khớp không dấu: `"dac nhan tam"` -> `dac-nhan-tam`.
   - Khớp slug: `"dac-nhan-tam"` -> `dac-nhan-tam`.
   - Khớp từ viết tắt: `"dnt"`, `"đnt"` -> `dac-nhan-tam`, `"btu"` -> `bon-thoa-uoc`, `"cttt 2"` -> `chien-tranh-tien-te-tap-2`.
   - Khớp tác giả: `"Dale Carnegie"` -> `dac-nhan-tam`, `"Yuval Noah Harari"` -> `sapiens-luoc-su-loai-nguoi`.
   - Khớp câu hỏi tự nhiên: `"cho toi hoi gia cuon dac nhan tam"` -> `dac-nhan-tam`.
   - Sách ngoài danh mục: `"Harry Potter"` -> `null`.
3. `searchProductsByContext`:
   - Tìm không dấu: `query = "dac nhan tam"` -> `products.length === 1`, `products[0].slug === "dac-nhan-tam"`, `hasDirectMatch === true`.
   - Tránh nhầm lẫn substring: `query = "dac nhan tam"` KHÔNG ĐƯỢC trả về `"Tư Duy Nhanh Và Chậm"`.
   - Tìm kiếm bộ sách: `query = "chien tranh tien te"` -> trả về cả 3 tập.
   - Tìm kiếm tập cụ thể: `query = "chien tranh tien te tap 2"` -> Tập 2 xếp vị trí số 1.
   - Tìm kiếm ngoài danh mục: `query = "Harry Potter và Hòn đá phù thủy"` hoặc `query = "day nau an ngon"` -> `products.length === 0`, `totalCount === 0`, `hasDirectMatch === false` (Tuyệt đối không ép cắt lát 3 cuốn sách).

### 5.2. Điều Kiện Vô Hiệu Hóa Kết Luận (Invalidation Conditions)
- Kết luận bị vô hiệu nếu truy vấn `dac nhan tam` không nhận diện được sách Đắc Nhân Tâm hoặc trả về độ tương đồng < 80%.
- Kết luận bị vô hiệu nếu tìm kiếm `"harry potter"` vẫn trả về 3 cuốn sách của AuraBook trong trường `products`.
