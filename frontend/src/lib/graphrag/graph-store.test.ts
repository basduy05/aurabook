import { describe, it, expect } from "vitest";
import {
	graphRAGStore,
	stripVietnameseDiacritics,
	normalizeVietnameseQuery,
	BOOK_CATALOG_MAPPING,
} from "./graph-store";

describe("Vietnamese Diacritics Normalization", () => {
	it("should strip all Vietnamese accents correctly", () => {
		const accented = "Đắc Nhân Tâm - Cuộc đời & Lịch sử loài người; Cây cam ngọt của tôi!";
		const expected = "Dac Nhan Tam - Cuoc doi & Lich su loai nguoi; Cay cam ngot cua toi!";
		expect(stripVietnameseDiacritics(accented)).toBe(expected);
	});

	it("should convert đ and Đ to d and D", () => {
		expect(stripVietnameseDiacritics("đ")).toBe("d");
		expect(stripVietnameseDiacritics("Đ")).toBe("D");
		expect(stripVietnameseDiacritics("đường đời")).toBe("duong doi");
	});

	it("should leave ASCII text and numbers unchanged", () => {
		expect(stripVietnameseDiacritics("10 dieu tao nen so phan")).toBe("10 dieu tao nen so phan");
		expect(stripVietnameseDiacritics("Sapiens 2024")).toBe("Sapiens 2024");
	});

	it("should handle empty or null string gracefully", () => {
		expect(stripVietnameseDiacritics("")).toBe("");
		expect(stripVietnameseDiacritics(null as any)).toBe("");
		expect(stripVietnameseDiacritics(undefined as any)).toBe("");
	});

	it("should normalize queries with whitespace and lowercase", () => {
		expect(normalizeVietnameseQuery("   ĐẮC   NHÂN   TÂM   ")).toBe("dac nhan tam");
		expect(normalizeVietnameseQuery("Chiến Tranh Tiền Tệ - Tập 2")).toBe("chien tranh tien te - tap 2");
	});
});

describe("BOOK_CATALOG_MAPPING", () => {
	it("should contain all 13 books", () => {
		expect(BOOK_CATALOG_MAPPING.length).toBe(13);
		const slugs = BOOK_CATALOG_MAPPING.map((b) => b.slug);
		expect(slugs).toContain("dac-nhan-tam");
		expect(slugs).toContain("bon-thoa-uoc");
		expect(slugs).toContain("sapiens-luoc-su-loai-nguoi");
		expect(slugs).toContain("tri-tue-do-thai");
		expect(slugs).toContain("10-dieu-tao-nen-so-phan");
		expect(slugs).toContain("bi-mat-cua-mot-tri-nho-sieu-pham");
		expect(slugs).toContain("cach-nghi-de-thanh-cong");
		expect(slugs).toContain("cay-cam-ngot-cua-toi");
		expect(slugs).toContain("chien-tranh-tien-te-tap-1");
		expect(slugs).toContain("chien-tranh-tien-te-tap-2");
		expect(slugs).toContain("chien-tranh-tien-te-tap-3");
		expect(slugs.some(s => s === "chu-nghia-khac-ky-phong-cach-song-ban-linh-va-binh-than" || s === "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than")).toBe(true);
		expect(slugs).toContain("tu-duy-nhanh-va-cham");
	});
});

describe("GraphStore.resolveBookEntity", () => {
	const store = graphRAGStore;

	it("should resolve book by accented Vietnamese title", () => {
		const book = store.resolveBookEntity("Đắc Nhân Tâm");
		expect(book).not.toBeNull();
		expect(book?.properties.slug).toBe("dac-nhan-tam");
	});

	it("should resolve book by unaccented Vietnamese title", () => {
		const book = store.resolveBookEntity("dac nhan tam");
		expect(book).not.toBeNull();
		expect(book?.properties.slug).toBe("dac-nhan-tam");
	});

	it("should resolve book by slug directly", () => {
		const book = store.resolveBookEntity("dac-nhan-tam");
		expect(book).not.toBeNull();
		expect(book?.properties.slug).toBe("dac-nhan-tam");
	});

	it("should resolve book by abbreviation (dnt, btu, cttt 2)", () => {
		const dnt = store.resolveBookEntity("dnt");
		expect(dnt?.properties.slug).toBe("dac-nhan-tam");

		const dntAccented = store.resolveBookEntity("đnt");
		expect(dntAccented?.properties.slug).toBe("dac-nhan-tam");

		const btu = store.resolveBookEntity("btu");
		expect(btu?.properties.slug).toBe("bon-thoa-uoc");

		const cttt2 = store.resolveBookEntity("cttt 2");
		expect(cttt2?.properties.slug).toBe("chien-tranh-tien-te-tap-2");
	});

	it("should resolve book by author name", () => {
		const book = store.resolveBookEntity("Dale Carnegie");
		expect(book?.properties.slug).toBe("dac-nhan-tam");

		const sapiens = store.resolveBookEntity("Yuval Noah Harari");
		expect(sapiens?.properties.slug).toBe("sapiens-luoc-su-loai-nguoi");
	});

	it("should resolve book from natural conversational queries", () => {
		const book = store.resolveBookEntity("cho toi hoi gia cuon dac nhan tam");
		expect(book?.properties.slug).toBe("dac-nhan-tam");
	});

	it("should resolve anaphoric reference when activeSlug is provided", () => {
		const book = store.resolveBookEntity("cho toi mua no", "bon-thoa-uoc");
		expect(book?.properties.slug).toBe("bon-thoa-uoc");

		const book2 = store.resolveBookEntity("cuon nay gia bao nhieu", "tri-tue-do-thai");
		expect(book2?.properties.slug).toBe("tri-tue-do-thai");
	});

	it("should return null for out-of-catalog books", () => {
		const book = store.resolveBookEntity("Harry Potter và Hòn đá phù thủy");
		expect(book).toBeNull();

		const book2 = store.resolveBookEntity("Doraemon");
		expect(book2).toBeNull();
	});
});

describe("GraphStore.searchProductsByContext", () => {
	const store = graphRAGStore;

	it("should return correct book when searching unaccented 'dac nhan tam'", () => {
		const res = store.searchProductsByContext("dac nhan tam");
		expect(res.hasDirectMatch).toBe(true);
		expect(res.products.length).toBeGreaterThan(0);
		expect(res.products[0].slug).toBe("dac-nhan-tam");
	});

	it("should NOT match 'tu-duy-nhanh-va-cham' when searching 'dac nhan tam'", () => {
		const res = store.searchProductsByContext("dac nhan tam");
		const slugs = res.products.map((p) => p.slug);
		expect(slugs).not.toContain("tu-duy-nhanh-va-cham");
	});

	it("should return all 3 volumes for general 'chien tranh tien te'", () => {
		const res = store.searchProductsByContext("chien tranh tien te");
		expect(res.hasDirectMatch).toBe(true);
		const slugs = res.products.map((p) => p.slug);
		expect(slugs).toContain("chien-tranh-tien-te-tap-1");
		expect(slugs).toContain("chien-tranh-tien-te-tap-2");
		expect(slugs).toContain("chien-tranh-tien-te-tap-3");
	});

	it("should rank volume 2 first for 'chien tranh tien te tap 2'", () => {
		const res = store.searchProductsByContext("chien tranh tien te tap 2");
		expect(res.hasDirectMatch).toBe(true);
		expect(res.products[0].slug).toBe("chien-tranh-tien-te-tap-2");
	});

	it("should return empty results without forced slice(0, 3) fallback for out-of-catalog queries", () => {
		const resHarryPotter = store.searchProductsByContext("Harry Potter và Hòn đá phù thủy");
		expect(resHarryPotter.hasDirectMatch).toBe(false);
		expect(resHarryPotter.products.length).toBe(0);
		expect(resHarryPotter.totalCount).toBe(0);
		expect(resHarryPotter.recommendations.length).toBe(0);

		const resCooking = store.searchProductsByContext("day nau an ngon");
		expect(resCooking.hasDirectMatch).toBe(false);
		expect(resCooking.products.length).toBe(0);
		expect(resCooking.totalCount).toBe(0);
	});

	it("should match personal development books for 'tìm sách về phát triển bản thân'", () => {
		const res = store.searchProductsByContext("tìm sách về phát triển bản thân");
		expect(res.hasDirectMatch).toBe(true);
		expect(res.products.length).toBeGreaterThan(0);
		const slugs = res.products.map((p) => p.slug);
		expect(slugs).toContain("cach-nghi-de-thanh-cong");
		expect(slugs).toContain("dac-nhan-tam");
		expect(slugs).toContain("10-dieu-tao-nen-so-phan");
		// Verify Cách Nghĩ Để Thành Công is top result
		expect(res.products[0].slug).toBe("cach-nghi-de-thanh-cong");
	});

	it("should match learning and mind development books for 'Tôi muốn tìm kiếm quyển sách liên quan đến học tập và phát triển'", () => {
		const res = store.searchProductsByContext("Tôi muốn tìm kiếm quyển sách liên quan đến học tập và phát triển");
		expect(res.hasDirectMatch).toBe(true);
		expect(res.products.length).toBeGreaterThan(0);
		const slugs = res.products.map((p) => p.slug);
		expect(slugs.some((s) => ["tu-duy-nhanh-va-cham", "tri-tue-do-thai", "dac-nhan-tam", "cach-nghi-de-thanh-cong"].includes(s))).toBe(true);
	});

	it("should match economics and wealth creation books for 'tôi muốn tạo ra nhiều giá trị thặng dư'", () => {
		const res = store.searchProductsByContext("tôi muốn tạo ra nhiều giá trị thặng dư");
		expect(res.hasDirectMatch).toBe(true);
		expect(res.products.length).toBeGreaterThan(0);
		const slugs = res.products.map((p) => p.slug);
		expect(slugs.some((s) => s.startsWith("chien-tranh-tien-te") || s === "cach-nghi-de-thanh-cong" || s === "tri-tue-do-thai")).toBe(true);
	});
});
