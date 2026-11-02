import { describe, it, expect } from "vitest";
import {
	graphRAGStore,
	stripVietnameseDiacritics,
	normalizeVietnameseQuery,
	slugifyVietnamese,
} from "./graph-store";

describe("Adversarial Suite: Vietnamese Diacritics & Normalization", () => {
	it("strips all complex Vietnamese tone marks and combined vowels", () => {
		const complex = "Thuở ấy, Nguyễn Ái Quốc bôn ba tìm đường cứu nước; Hoà bình, ngoằn ngoèo, khuỷu tay";
		const unaccented = stripVietnameseDiacritics(complex);
		expect(unaccented).toBe("Thuo ay, Nguyen Ai Quoc bon ba tim duong cuu nuoc; Hoa binh, ngoan ngoeo, khuyu tay");
	});

	it("preserves casing while stripping diacritics", () => {
		expect(stripVietnameseDiacritics("ĐẮC NHÂN TÂM")).toBe("DAC NHAN TAM");
		expect(stripVietnameseDiacritics("bốn THỎA ước")).toBe("bon THOA uoc");
		expect(stripVietnameseDiacritics("TƯ DUY NHANH VÀ CHẬM")).toBe("TU DUY NHANH VA CHAM");
	});

	it("handles tricky mixed casing and dirty whitespace in normalizeVietnameseQuery", () => {
		expect(normalizeVietnameseQuery("   \t  ĐẮC    nhân \n TÂM  \r  ")).toBe("dac nhan tam");
		expect(normalizeVietnameseQuery("")).toBe("");
		expect(normalizeVietnameseQuery("   ")).toBe("");
	});

	it("slugifyVietnamese creates URL-safe slugs with 'd' for 'đ/Đ'", () => {
		expect(slugifyVietnamese("Đắc Nhân Tâm")).toBe("dac-nhan-tam");
		expect(slugifyVietnamese("10 Điều Tạo Nên Số Phận!")).toBe("10-dieu-tao-nen-so-phan");
		expect(slugifyVietnamese("Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản")).toBe(
			"chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than",
		);
	});
});

describe("Adversarial Suite: Entity Resolution (resolveBookEntity)", () => {
	const store = graphRAGStore;

	describe("Ground Truth: All 13 Catalog Books Resolved Unaccented & Accented", () => {
		const testBooks = [
			{ accented: "Đắc Nhân Tâm", unaccented: "dac nhan tam", slug: "dac-nhan-tam" },
			{ accented: "Bốn Thỏa Ước", unaccented: "bon thoa uoc", slug: "bon-thoa-uoc" },
			{ accented: "Sapiens: Lược Sử Loài Người", unaccented: "sapiens luoc su loai nguoi", slug: "sapiens-luoc-su-loai-nguoi" },
			{ accented: "Trí Tuệ Do Thái", unaccented: "tri tue do thai", slug: "tri-tue-do-thai" },
			{ accented: "10 Điều Tạo Nên Số Phận", unaccented: "10 dieu tao nen so phan", slug: "10-dieu-tao-nen-so-phan" },
			{ accented: "Bí Mật Của Một Trí Nhớ Siêu Phàm", unaccented: "bi mat cua mot tri nho sieu pham", slug: "bi-mat-cua-mot-tri-nho-sieu-pham" },
			{ accented: "Cách Nghĩ Để Thành Công", unaccented: "cach nghi de thanh cong", slug: "cach-nghi-de-thanh-cong" },
			{ accented: "Cây Cam Ngọt Của Tôi", unaccented: "cay cam ngot cua toi", slug: "cay-cam-ngot-cua-toi" },
			{ accented: "Chiến Tranh Tiền Tệ - Tập 1", unaccented: "chien tranh tien te tap 1", slug: "chien-tranh-tien-te-tap-1" },
			{ accented: "Chiến Tranh Tiền Tệ - Tập 2", unaccented: "chien tranh tien te tap 2", slug: "chien-tranh-tien-te-tap-2" },
			{ accented: "Chiến Tranh Tiền Tệ - Tập 3", unaccented: "chien tranh tien te tap 3", slug: "chien-tranh-tien-te-tap-3" },
			{ accented: "Chủ Nghĩa Khắc Kỷ: Phong Cách Sống Bản Lĩnh & Bình Thản", unaccented: "chu nghia khac ky phong cach song ban linh & binh than", slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than" },
			{ accented: "Tư Duy Nhanh Và Chậm", unaccented: "tu duy nhanh va cham", slug: "tu-duy-nhanh-va-cham" },
		];

		for (const b of testBooks) {
			it(`resolves accented: "${b.accented}" -> ${b.slug}`, () => {
				const res = store.resolveBookEntity(b.accented);
				expect(res).not.toBeNull();
				expect(res?.properties.slug).toBe(b.slug);
			});

			it(`resolves unaccented: "${b.unaccented}" -> ${b.slug}`, () => {
				const res = store.resolveBookEntity(b.unaccented);
				expect(res).not.toBeNull();
				expect(res?.properties.slug).toBe(b.slug);
			});

			it(`resolves slug directly: "${b.slug}"`, () => {
				const res = store.resolveBookEntity(b.slug);
				expect(res).not.toBeNull();
				expect(res?.properties.slug).toBe(b.slug);
			});
		}
	});

	describe("Authors & Distinctive Character Names", () => {
		const authorTests = [
			{ query: "Dale Carnegie", slug: "dac-nhan-tam" },
			{ query: "dale carnegie", slug: "dac-nhan-tam" },
			{ query: "Don Miguel Ruiz", slug: "bon-thoa-uoc" },
			{ query: "don miguel ruiz", slug: "bon-thoa-uoc" },
			{ query: "Yuval Noah Harari", slug: "sapiens-luoc-su-loai-nguoi" },
			{ query: "harari", slug: "sapiens-luoc-su-loai-nguoi" },
			{ query: "Eran Katz", slug: "tri-tue-do-thai" },
			{ query: "David Simon", slug: "10-dieu-tao-nen-so-phan" },
			{ query: "Napoleon Hill", slug: "cach-nghi-de-thanh-cong" },
			{ query: "José Mauro de Vasconcelos", slug: "cay-cam-ngot-cua-toi" },
			{ query: "vasconcelos", slug: "cay-cam-ngot-cua-toi" },
			{ query: "zeze", slug: "cay-cam-ngot-cua-toi" },
			{ query: "Song Hongbing", slug: "chien-tranh-tien-te-tap-1" },
			{ query: "song hongbing", slug: "chien-tranh-tien-te-tap-1" },
			{ query: "William B. Irvine", slug: "chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than" },
			{ query: "Daniel Kahneman", slug: "tu-duy-nhanh-va-cham" },
			{ query: "kahneman", slug: "tu-duy-nhanh-va-cham" },
		];

		for (const a of authorTests) {
			it(`resolves query "${a.query}" -> ${a.slug}`, () => {
				const res = store.resolveBookEntity(a.query);
				expect(res).not.toBeNull();
				expect(res?.properties.slug).toBe(a.slug);
			});
		}
	});

	describe("Abbreviations and Series Disambiguation", () => {
		it("resolves dnt / đnt -> dac-nhan-tam", () => {
			expect(store.resolveBookEntity("dnt")?.properties.slug).toBe("dac-nhan-tam");
			expect(store.resolveBookEntity("đnt")?.properties.slug).toBe("dac-nhan-tam");
		});

		it("resolves btu -> bon-thoa-uoc", () => {
			expect(store.resolveBookEntity("btu")?.properties.slug).toBe("bon-thoa-uoc");
		});

		it("resolves cttt 1, cttt 2, cttt 3 correctly", () => {
			expect(store.resolveBookEntity("cttt 1")?.properties.slug).toBe("chien-tranh-tien-te-tap-1");
			expect(store.resolveBookEntity("cttt 2")?.properties.slug).toBe("chien-tranh-tien-te-tap-2");
			expect(store.resolveBookEntity("cttt 3")?.properties.slug).toBe("chien-tranh-tien-te-tap-3");
			expect(store.resolveBookEntity("cttt1")?.properties.slug).toBe("chien-tranh-tien-te-tap-1");
			expect(store.resolveBookEntity("cttt2")?.properties.slug).toBe("chien-tranh-tien-te-tap-2");
			expect(store.resolveBookEntity("cttt3")?.properties.slug).toBe("chien-tranh-tien-te-tap-3");
		});

		it("resolves general 'chien tranh tien te' to tap 1 by default", () => {
			expect(store.resolveBookEntity("chien tranh tien te")?.properties.slug).toBe("chien-tranh-tien-te-tap-1");
		});
	});

	describe("Anaphora Pronoun Resolution", () => {
		it("resolves anaphora with activeSlug", () => {
			expect(store.resolveBookEntity("mua nó", "dac-nhan-tam")?.properties.slug).toBe("dac-nhan-tam");
			expect(store.resolveBookEntity("mua quyển này", "bon-thoa-uoc")?.properties.slug).toBe("bon-thoa-uoc");
			expect(store.resolveBookEntity("cuon nay gia bao nhieu", "tu-duy-nhanh-va-cham")?.properties.slug).toBe("tu-duy-nhanh-va-cham");
		});

		it("returns null for anaphora without activeSlug", () => {
			expect(store.resolveBookEntity("mua nó")).toBeNull();
			expect(store.resolveBookEntity("cuon nay gia bao nhieu")).toBeNull();
		});
	});

	describe("Out-of-Catalog Entities MUST RETURN NULL (Zero Hallucination)", () => {
		const outOfCatalogQueries = [
			"Harry Potter",
			"harry potter va hon da phu thuy",
			"day nau an",
			"dạy nấu ăn ngon",
			"Hồ Chí Minh",
			"tiểu sử Bác Hồ",
			"nguyễn ái quốc",
			"đại tướng võ nguyên giáp",
			"truyen tranh doremon",
			"thám tử lừng danh conan",
			"chúa tể những chiếc nhẫn",
			"Lord of the Rings",
			"lập trình python cơ bản",
			"machine learning co ban",
			"mua iphone 15 pro max",
			"thời tiết hôm nay",
			"giá vàng 9999",
			"xe máy honda wave",
			"bóng đá champion league",
		];

		for (const q of outOfCatalogQueries) {
			it(`rejects out-of-catalog query: "${q}"`, () => {
				const res = store.resolveBookEntity(q);
				expect(res).toBeNull();
			});
		}
	});

	describe("Edge Cases: Empty, Whitespace, Symbols", () => {
		it("handles empty or whitespace strings", () => {
			expect(store.resolveBookEntity("")).toBeNull();
			expect(store.resolveBookEntity("   ")).toBeNull();
			expect(store.resolveBookEntity("\t\n")).toBeNull();
		});

		it("handles special characters and punctuation", () => {
			expect(store.resolveBookEntity("!@#$%^&*()")).toBeNull();
			expect(store.resolveBookEntity("????")).toBeNull();
		});
	});
});

describe("Adversarial Suite: Context Search (searchProductsByContext)", () => {
	const store = graphRAGStore;

	describe("Out-of-Catalog Queries MUST NEVER Return Random Sliced Books", () => {
		const outOfCatalogQueries = [
			"Harry Potter",
			"harry potter va hon da phu thuy",
			"day nau an",
			"dạy nấu ăn",
			"học nấu ăn ngon",
			"cách nấu phở bò",
			"ẩm thực việt nam",
			"món ăn hà nội",
			"Hồ Chí Minh",
			"bác hồ",
			"nguyễn ái quốc",
			"võ nguyên giáp",
			"truyện tranh doremon",
			"doremon chu meo may",
			"thám tử lừng danh conan",
			"chúa tể những chiếc nhẫn",
			"lập trình python",
			"mua xe máy",
			"thời tiết đà nẵng",
			"giá vàng sjc",
		];

		for (const q of outOfCatalogQueries) {
			it(`returns 0 products and honest explanation for: "${q}"`, () => {
				const result = store.searchProductsByContext(q);
				expect(result.products).toHaveLength(0);
				expect(result.totalCount).toBe(0);
				expect(result.recommendations).toHaveLength(0);
				expect(result.hasDirectMatch).toBe(false);
				expect(result.reasoningSummary).toMatch(/chưa có tác phẩm|không đưa ra thông tin giả mạo/);
			});
		}
	});

	describe("In-Catalog Relevant Semantic Queries", () => {
		it("finds Đắc Nhân Tâm for giao tiếp / thu phục lòng người", () => {
			const res = store.searchProductsByContext("giao tiếp ứng xử và thu phục lòng người");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("dac-nhan-tam");
		});

		it("finds Bốn Thỏa Ước for chữa lành nội tâm / toltec", () => {
			const res = store.searchProductsByContext("chữa lành tổn thương và tự do nội tâm");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("bon-thoa-uoc");
		});

		it("finds Sapiens for tiến hóa loài người", () => {
			const res = store.searchProductsByContext("lịch sử tiến hóa loài người và văn minh");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("sapiens-luoc-su-loai-nguoi");
		});

		it("finds Trí Tuệ Do Thái for trí tuệ và người do thái", () => {
			const res = store.searchProductsByContext("trí tuệ và phương pháp tư duy người do thái");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("tri-tue-do-thai");
		});

		it("finds Tư Duy Nhanh Và Chậm for kahneman / tư duy nhanh", () => {
			const res = store.searchProductsByContext("tư duy nhanh và chậm của kahneman");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("tu-duy-nhanh-va-cham");
		});

		it("finds Cây Cam Ngọt Của Tôi for zeze / cây cam ngọt", () => {
			const res = store.searchProductsByContext("tuổi thơ của chú bé zeze");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("cay-cam-ngot-cua-toi");
		});

		it("finds Chủ Nghĩa Khắc Kỷ for stoicism / khắc kỷ", () => {
			const res = store.searchProductsByContext("triết lý sống khắc kỷ stoicism bản lĩnh");
			expect(res.hasDirectMatch).toBe(true);
			expect(res.products.length).toBeGreaterThan(0);
			expect(res.products[0].slug).toBe("chu-nghia-khac-ky-phong-cach-song-ban-linh-binh-than");
		});
	});

	describe("Substring Discrimination ('nhan' vs 'nhanh')", () => {
		it("does NOT confuse 'nhan' (Đắc Nhân Tâm) with 'nhanh' (Tư Duy Nhanh)", () => {
			const resDacNhan = store.searchProductsByContext("dac nhan");
			expect(resDacNhan.hasDirectMatch).toBe(true);
			expect(resDacNhan.products[0].slug).toBe("dac-nhan-tam");
			// Must not place tu-duy-nhanh-va-cham above dac-nhan-tam
			expect(resDacNhan.products[0].slug).not.toBe("tu-duy-nhanh-va-cham");

			const resNhanh = store.searchProductsByContext("tu duy nhanh");
			expect(resNhanh.hasDirectMatch).toBe(true);
			expect(resNhanh.products[0].slug).toBe("tu-duy-nhanh-va-cham");
			expect(resNhanh.products[0].slug).not.toBe("dac-nhan-tam");
		});
	});

	describe("Empty and Boundary Handling", () => {
		it("returns empty result on empty string", () => {
			const res = store.searchProductsByContext("");
			expect(res.products).toHaveLength(0);
			expect(res.totalCount).toBe(0);
			expect(res.hasDirectMatch).toBe(false);
		});

		it("returns empty result on whitespace string", () => {
			const res = store.searchProductsByContext("   \t  \n  ");
			expect(res.products).toHaveLength(0);
			expect(res.totalCount).toBe(0);
			expect(res.hasDirectMatch).toBe(false);
		});

		it("does not crash on 2000 character input", () => {
			const longStr = "sách ".repeat(400);
			expect(() => store.searchProductsByContext(longStr)).not.toThrow();
		});
	});
});
