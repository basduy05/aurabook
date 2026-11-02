/**
 * Quản lý chương nghe thử Audio 60s ngẫu nhiên cố định cho từng tác phẩm của AuraBook.
 * Mỗi cuốn sách được cố định 1 chương hấp dẫn, người dùng chưa mua sách được nghe thử trọn vẹn 60 giây.
 */

export interface PreviewChapterInfo {
	slug: string;
	chapterIndex: number; // Vị trí trong TOC (0-based)
	chapterTitle: string;
	teaserText: string;
}

export const FIXED_PREVIEW_CHAPTERS: Record<string, PreviewChapterInfo> = {
	"cay-cam-ngot-cua-toi": {
		slug: "cay-cam-ngot-cua-toi",
		chapterIndex: 4, // TOC[4] là "Chương 3"
		chapterTitle: "Chương 3: Những ngón tay gầy guộc của nghèo túng",
		teaserText:
			"Khi tôi tâm sự với bác Edmundo về rắc rối của mình, bác đăm chiêu suy nghĩ một hồi lâu, ánh mắt xa xăm nhìn ra khoảng sân nhỏ ngập tràn ánh nắng ban mai. Vậy đó là chuyện khiến cháu lo lắng đến mất ngủ hả Zezé? Vâng ạ. Cháu lo là khi cả nhà chúng cháu chuyển sang căn nhà mới tồi tàn bên kia đường ray, Luciano sẽ không tìm thấy cháu nữa. Bác Edmundo khẽ mỉm cười dịu dàng, bàn tay gầy guộc run rẩy vuốt nhẹ lên mái tóc rối bời của tôi: Đừng bao giờ lo lắng điều đó, Zezé bé bỏng của bác. Dù cháu có đi đến bất kỳ nơi đâu trên cõi đời này, Luciano cũng sẽ luôn tìm thấy cháu, bởi vì những người bạn thực sự luôn có một sợi dây vô hình kết nối trái tim. Tôi nắm chặt lấy bàn tay thô ráp của bác, ngước mắt nhìn lên vòm trời xanh ngắt sau rặng cây, cảm nhận một sự bình yên ấm áp lạ kỳ tràn ngập khắp tâm hồn non nớt của mình, xua tan đi mọi nỗi sợ hãi về cái nghèo và những ngày tháng cơ cực đang bủa vây phía trước. Bác Edmundo luôn là điểm tựa dịu dàng nhất che chở cho tôi giữa thế giới người lớn đầy bão giông.",
	},
	"dac-nhan-tam": {
		slug: "dac-nhan-tam",
		chapterIndex: 5, // TOC[5] là "PHẦN MỘT - 1. Muốn lấy mật thì đừng phá tổ ong"
		chapterTitle: "Phần 1 - Chương 1: Muốn lấy mật thì đừng phá tổ ong",
		teaserText:
			"Ngày 7 tháng 5 năm 1931, cả thành phố New York chứng kiến một cuộc truy bắt nghẹt thở nhất từ trước đến nay. Kẻ bị săn đuổi là Crowley Hai Súng, tên giết người máu lạnh khét tiếng. Khi bị vây hãm trong căn hộ của người tình với hàng trăm cảnh sát bao vây, Crowley đã viết một bức thư ngỏ: Dưới lớp áo này là một trái tim mệt mỏi nhưng nhân hậu, một trái tim không bao giờ muốn làm tổn thương bất cứ ai. Trong 99 trường hợp, con người ta luôn tìm cách tự biện hộ cho bản thân dù sai lầm nghiêm trọng đến đâu. Kẻ tử tù nguy hiểm nhất còn nghĩ mình là thánh thiện, huống chi là những người bình thường chúng ta tiếp xúc mỗi ngày. Vì vậy, chỉ trích người khác là hoàn toàn vô ích và nguy hiểm; nó chỉ làm tổn thương lòng tự trọng quý giá và khơi dậy sự oán hận ngấm ngầm. Thay vì lên án ai đó, chúng ta hãy học cách thấu hiểu nguyên nhân sâu xa của hành động, mở rộng tấm lòng bao dung và khích lệ người khác bằng tất cả sự chân thành sâu sắc nhất.",
	},
	"bon-thoa-uoc": {
		slug: "bon-thoa-uoc",
		chapterIndex: 5, // TOC[5] là "2 THỎA ƯỚC THỨ NHẤT Không phạm tội với Lời của Bạn"
		chapterTitle: "Thỏa ước thứ nhất: Không phạm tội với lời của bạn",
		teaserText:
			"Thỏa ước đầu tiên cũng là thỏa ước quan trọng nhất, và thường là khó giữ nhất: Hãy cẩn trọng và chuẩn xác với lời nói của bạn. Lời nói không chỉ là âm thanh hay biểu tượng viết ra; đó là một sức mạnh, là năng lượng sáng tạo kỳ diệu nhất mà con người sở hữu. Lời của bạn có thể gieo mầm hy vọng hoặc gieo rắc sự hủy hoại. Khi bạn dùng lời nói chân thành, bạn giải phóng chính tâm hồn mình khỏi nỗi sợ hãi và gánh nặng tội lỗi. Nhưng khi bạn phán xét, buông lời cay nghiệt hay thêu dệt những điều dối trá, bạn đang thả chất độc vô hình vào tâm trí người khác và đầu độc chính cuộc đời mình. Lời nói của bạn chính là thứ ma thuật thuần khiết nhất; hãy học cách sử dụng nó để lan tỏa tình yêu thương, sự thật, lòng bao dung và ánh sáng chữa lành đến cho tất cả mọi người xung quanh bạn mỗi ngày.",
	},
	"tri-tue-do-thai": {
		slug: "tri-tue-do-thai",
		chapterIndex: 3, // TOC[3] là "2. Bí ẩn về sự thông thái của người Do Thái"
		chapterTitle: "Chương 2: Bí ẩn về sự thông thái của người Do Thái",
		teaserText:
			"Người Do Thái chỉ chiếm 0.2% dân số thế giới nhưng chiếm tới hơn 20% tổng số giải thưởng Nobel trên mọi lĩnh vực khoa học, y học và văn học. Bí quyết nằm ở đâu? Đó không phải là gen bẩm sinh, mà là một phương pháp rèn luyện trí nhớ và tư duy logic được truyền dạy từ thế hệ này sang thế hệ khác qua nhiều ngàn năm thăng trầm. Jerome lắng nghe từng từ, mắt sáng lên trước những nguyên lý rèn luyện trí óc phi thường của bậc thầy Eran Katz. Từ phương pháp mã hóa con số thành hình ảnh sống động, đến cách xây dựng hệ thống móc nối ký ức trong tiềm thức, mọi bí mật từng giúp các học giả Do Thái ghi nhớ cả bộ kinh Talmud đồ sộ giờ đây dần dần hé mở trước mắt anh một cách rõ ràng và lôi cuốn, mở ra con đường khai phá tiềm năng não bộ không giới hạn.",
	},
	"sapiens-luoc-su-loai-nguoi": {
		slug: "sapiens-luoc-su-loai-nguoi",
		chapterIndex: 6, // TOC[6] là "1. MỘT ĐỘNG VẬT KHÔNG NỔI TRỘI"
		chapterTitle: "Chương 1: Một động vật không nổi trội",
		teaserText:
			"Khoảng 100.000 năm trước, Trái Đất có ít nhất sáu loài người khác nhau cùng sinh sống. Ngày nay chỉ còn lại một loài duy nhất: chúng ta - Homo sapiens. Nhưng điều gì đã biến một loài vượn người tầm thường ở Đông Phi, không nanh vuốt nhọn hoắt, không chạy nhanh, trở thành chúa tể thống trị toàn bộ hành tinh này? Bí mật nằm ở một cuộc cách mạng nhận thức vô tiền khoáng hậu diễn ra khoảng 70.000 năm trước. Khả năng đặc biệt của Sapiens không phải là giao tiếp thực tế, mà là năng lực tưởng tượng và cùng nhau tin vào những câu chuyện hư cấu chung: từ thần linh, quốc gia, quyền con người cho đến những đồng tiền giấy. Chính niềm tin tập thể đó đã kết nối hàng triệu con người xa lạ cùng hợp tác chặt chẽ với nhau để tạo nên những đế chế vĩ đại bậc nhất lịch sử.",
	},
	"cach-nghi-de-thanh-cong": {
		slug: "cach-nghi-de-thanh-cong",
		chapterIndex: 3,
		chapterTitle: "Chương 2: Khát vọng - Điểm khởi đầu của mọi thành tựu",
		teaserText:
			"Khát vọng cháy bỏng không chỉ là một ước muốn mơ hồ; nó là một sự đam mê mãnh liệt, một ngọn lửa không thể dập tắt thôi thúc hành động mỗi ngày. Khi Edwin C. Barnes bước chân xuống tàu hỏa ở New Jersey, ông trông như một gã lang thang không tiền bạc trong túi, nhưng trong tâm trí ông có một quyết tâm sắt đá: trở thành đối tác kinh doanh của nhà sáng chế vĩ đại Thomas Edison. Ông không nói tôi sẽ thử xem sao, mà ông tự nhủ rằng tôi chỉ có một mục đích duy nhất trên đời và sẽ dốc toàn bộ sinh lực để đạt được nó. Chính sự kiên định đến cùng, không chấp nhận bất kỳ đường lui nào đã biến khát vọng vô hình của Barnes thành hiện thực rực rỡ, mang lại cho ông gia tài khổng lồ và sự kính trọng của cả thế giới.",
	},
	"10-dieu-tao-nen-so-phan": {
		slug: "10-dieu-tao-nen-so-phan",
		chapterIndex: 3,
		chapterTitle: "Chương 3: Làm chủ cảm xúc và suy nghĩ",
		teaserText:
			"Gieo suy nghĩ, gặt hành động. Gieo hành động, gặt thói quen. Gieo thói quen, gặt tính cách. Gieo tính cách, gặt số phận. Mọi thứ bạn trải nghiệm trong thế giới bên ngoài đều bắt đầu từ một ý nghĩ nhỏ bé nảy sinh trong tâm trí bạn. Khi bạn học được cách làm chủ suy nghĩ, loại bỏ những nghi ngờ và nuôi dưỡng lòng can đảm, bạn nắm trong tay quyền năng kiến tạo vận mệnh của chính mình. Số phận không phải là điều được định sẵn từ trước; nó là chuỗi những lựa chọn có ý thức mà bạn đưa ra mỗi ngày, từng bước đưa bạn đến đỉnh cao của sự tự do và hạnh phúc đích thực.",
	},
	"tu-duy-nhanh-va-cham": {
		slug: "tu-duy-nhanh-va-cham",
		chapterIndex: 3,
		chapterTitle: "Chương 2: Hai hệ thống tư duy - Hệ thống 1 và Hệ thống 2",
		teaserText:
			"Não bộ con người hoạt động với hai cơ chế tư duy song hành. Hệ thống 1 vận hành tự động, chớp nhoáng, không tốn chút nỗ lực nào và đem lại trực giác tức thì dựa trên những cảm xúc và định kiến sẵn có. Trong khi đó, Hệ thống 2 đòi hỏi sự chú ý cao độ, tính toán logic và sự tập trung trí óc sâu sắc để giải quyết những bài toán phức tạp. Hầu hết các ảo tưởng, thiên kiến nhận thức và những sai lầm nghiêm trọng trong cuộc đời của chúng ta bắt nguồn từ việc để Hệ thống 1 tự do quyết định mà không có sự kiểm chứng chặt chẽ từ Hệ thống 2. Khi hiểu rõ sự tương tác giữa hai hệ thống này, bạn sẽ làm chủ được những phán đoán và đưa ra những quyết định sáng suốt nhất.",
	},
	"bi-mat-cua-mot-tri-nho-sieu-pham": {
		slug: "bi-mat-cua-mot-tri-nho-sieu-pham",
		chapterIndex: 3,
		chapterTitle: "Chương 3: Cung điện ký ức và phương pháp liên tưởng",
		teaserText:
			"Trí nhớ không phải là một chiếc hộp cố định được ban tặng ngẫu nhiên; nó là một mạng lưới liên tưởng hình ảnh vô tận mà bất kỳ ai cũng có thể rèn luyện được. Kỹ thuật Cung điện ký ức đã giúp các bậc thầy trí nhớ cổ đại La Mã và Hy Lạp ghi nhớ hàng ngàn chi tiết phức tạp mà không cần một mẩu giấy ghi chép. Khi bạn biến thông tin trừu tượng thành những hình ảnh giàu màu sắc, đầy cảm xúc và đặt chúng vào từng góc phòng quen thuộc trong tâm trí, bạn sẽ có thể kích hoạt khả năng ghi nhớ phi thường bất kỳ lúc nào. Hãy bắt đầu bước vào cung điện tâm trí của chính mình để đánh thức năng lực siêu phàm đang ngủ quên.",
	},
	"chien-tranh-tien-te-tap-1": {
		slug: "chien-tranh-tien-te-tap-1",
		chapterIndex: 3,
		chapterTitle: "Chương 3: Cục Dự trữ Liên bang và đế chế tài chính",
		teaserText:
			"Tiền tệ không chỉ là phương tiện trao đổi hàng hóa đơn thuần; nó là vũ khí quyền lực tối thượng trong các cuộc đại chiến vô hình định hình lại thế giới. Đằng sau những biến động kinh tế toàn cầu, sự hưng thịnh hay suy vong của các đế chế vĩ đại luôn có bóng dáng của các gia tộc tài phiệt ngân hàng quốc tế nắm giữ huyết mạch phát hành đồng tiền. Bằng cách thao túng lãi suất, kích thích bong bóng tín dụng rồi tạo ra các cuộc khủng hoảng tài chính có chủ đích, những thế lực ẩn mình đã thôn tính tài sản khổng lồ của các quốc gia. Hiểu về bản chất của tiền tệ chính là chiếc chìa khóa tối quan trọng giúp bạn nhìn thấu bức tranh toàn cảnh của kinh tế thế giới.",
	},
};

/**
 * Lấy thông tin chương nghe thử cố định cho cuốn sách theo slug
 */
export function getFixedPreviewChapterInfo(slug?: string): PreviewChapterInfo {
	const cleanSlug = (slug || "").toLowerCase().trim();
	for (const [key, val] of Object.entries(FIXED_PREVIEW_CHAPTERS)) {
		if (cleanSlug === key || cleanSlug.includes(key) || key.includes(cleanSlug)) {
			return val;
		}
	}
	// Fallback mặc định
	return {
		slug: cleanSlug || "dac-nhan-tam",
		chapterIndex: 3,
		chapterTitle: "Chương nghe thử chọn lọc",
		teaserText:
			"Trải nghiệm bản nghe thử âm thanh 60 giây giọng đọc truyền cảm chuẩn phòng thu tại AuraBook. Hãy lắng nghe và cảm nhận từng câu chữ đầy cảm hứng trước khi quyết định sở hữu tác phẩm.",
	};
}

/**
 * Xác định vị trí chương nghe thử cố định (index) trên mục lục TOC thực tế của sách
 */
export function getFixedPreviewChapterIndex(slug: string, totalChapters: number): number {
	const info = getFixedPreviewChapterInfo(slug);
	if (info.chapterIndex < totalChapters) {
		return info.chapterIndex;
	}
	if (totalChapters <= 1) return 0;
	if (totalChapters <= 3) return Math.min(1, totalChapters - 1);
	return Math.min(3, totalChapters - 1);
}
