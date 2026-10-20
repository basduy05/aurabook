import fs from "fs";
import path from "path";

export interface VoiceChatMessage {
	id: string;
	sender: "user" | "agent" | "system";
	text: string;
	timestamp: string;
}

export interface VoiceSessionRecord {
	id: string;
	startedAt: string;
	endedAt?: string;
	durationSeconds: number;
	contactMethod: "call" | "chat";
	customerName: string;
	customerPhone?: string;
	customerGender: string; // "Anh" | "Chị" | "Bạn"
	customerAge: string; // "Dưới 18" | "18 - 24" | "25 - 35" | "Trên 35"
	topic: string;
	messages: VoiceChatMessage[];
	rating?: number; // 1 to 5 sao
	reviewTags?: string[];
	feedbackComment?: string;
	status: "completed" | "in_progress";
}

const STORAGE_FILE = path.join(process.cwd(), "..", "ecommerce-ai-platform", "data", "voice_sessions.json");

// Dữ liệu mẫu khởi tạo chuẩn chỉ để Admin có thể xem ngay
const INITIAL_DEMO_SESSIONS: VoiceSessionRecord[] = [
	{
		id: "sess-179201",
		startedAt: "2026-10-17 14:15:20",
		endedAt: "2026-10-17 14:18:45",
		durationSeconds: 205,
		contactMethod: "call",
		customerName: "Nguyễn Văn Tuấn",
		customerGender: "Anh",
		customerAge: "25 - 35",
		topic: "Tư vấn chọn sách & Sách bán chạy",
		messages: [
			{
				id: "m-1",
				sender: "agent",
				text: "Dạ em chào anh Tuấn! Em là Aura AI, chuyên viên tư vấn sách của AuraBook. Em đã nhận được chủ đề tư vấn chọn sách. Em có thể hỗ trợ gì cho anh Tuấn ạ?",
				timestamp: "14:15",
			},
			{
				id: "m-2",
				sender: "user",
				text: "Tôi muốn tìm một cuốn sách rèn luyện thói quen và tư duy làm việc hiệu quả.",
				timestamp: "14:16",
			},
			{
				id: "m-3",
				sender: "agent",
				text: "Dạ anh Tuấn ơi, cuốn Bốn Thỏa Ước của Don Miguel Ruiz cực kỳ phù hợp với anh! Sách chia sẻ phương pháp làm chủ tâm trí, loại bỏ niềm tin giới hạn và rèn luyện thói quen tinh thần tích cực, giá chỉ 49.000₫ ạ.",
				timestamp: "14:16",
			},
			{
				id: "m-4",
				sender: "user",
				text: "Hay quá, sách có kèm ebook DRM đọc trên điện thoại luôn không em?",
				timestamp: "14:17",
			},
			{
				id: "m-5",
				sender: "agent",
				text: "Dạ có ạ, sách hỗ trợ đầy đủ chuẩn Readium LCP đọc mượt mà trên Web Reader và đồng bộ tới 6 thiết bị ạ!",
				timestamp: "14:17",
			},
		],
		rating: 5,
		reviewTags: ["Giọng nói tự nhiên", "Gợi ý sách chuẩn xác", "Phản hồi nhanh"],
		feedbackComment: "Giọng Aura AI rất ấm áp, gợi ý sách đúng nhu cầu của tôi!",
		status: "completed",
	},
	{
		id: "sess-179202",
		startedAt: "2026-10-17 15:30:10",
		endedAt: "2026-10-17 15:32:40",
		durationSeconds: 150,
		contactMethod: "chat",
		customerName: "Trần Thị Mai Lan",
		customerGender: "Chị",
		customerAge: "18 - 24",
		topic: "Tra cứu đơn hàng & Thời gian giao hàng",
		messages: [
			{
				id: "m-1",
				sender: "agent",
				text: "Dạ em chào chị Lan ạ! Em là Aura AI. Em có thể kiểm tra đơn hàng nào giúp chị hôm nay ạ?",
				timestamp: "15:30",
			},
			{
				id: "m-2",
				sender: "user",
				text: "Kiểm tra giúp chị đơn hàng #AB-89264 đã giao tới đâu rồi em?",
				timestamp: "15:31",
			},
			{
				id: "m-3",
				sender: "agent",
				text: "Dạ chị Lan ơi, đơn #AB-89264 của chị gồm cuốn Sapiens đang được Giao Hàng Nhanh vận chuyển, dự kiến sẽ phát tới tay chị vào ngày mai ạ!",
				timestamp: "15:31",
			},
		],
		rating: 5,
		reviewTags: ["Tra cứu đơn nhanh", "Phản hồi nhanh"],
		feedbackComment: "Rất tiện lợi, đỡ phải vào app tra cứu mã vận đơn.",
		status: "completed",
	},
];

let memorySessions: VoiceSessionRecord[] = [...INITIAL_DEMO_SESSIONS];

function ensureDir(filePath: string) {
	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	} catch (e) {
		console.warn("[VoiceSessionStore] Không thể tạo thư mục lưu file:", e);
	}
}

export function getAllSessions(): VoiceSessionRecord[] {
	try {
		if (fs.existsSync(STORAGE_FILE)) {
			const content = fs.readFileSync(STORAGE_FILE, "utf-8");
			const parsed = JSON.parse(content) as VoiceSessionRecord[];
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch (e) {
		console.warn("[VoiceSessionStore] Đọc file lưu trữ thất bại, dùng bộ nhớ RAM:", e);
	}
	return memorySessions;
}

export function saveOrUpdateSession(record: VoiceSessionRecord): VoiceSessionRecord {
	const currentList = getAllSessions();
	const existingIdx = currentList.findIndex((s) => s.id === record.id);

	if (existingIdx >= 0) {
		currentList[existingIdx] = {
			...currentList[existingIdx],
			...record,
		};
	} else {
		currentList.unshift(record);
	}

	memorySessions = currentList;

	try {
		ensureDir(STORAGE_FILE);
		fs.writeFileSync(STORAGE_FILE, JSON.stringify(currentList, null, 2), "utf-8");
	} catch (e) {
		console.warn("[VoiceSessionStore] Lưu file JSON thất bại, đã lưu vào RAM:", e);
	}

	return record;
}
