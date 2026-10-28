export interface PresetAvatar {
	id: string;
	category: "doraemon" | "shin";
	categoryName: string;
	name: string;
	description: string;
	url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [

	// Doraemon
	{
		id: "doraemon-cat",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Doraemon",
		description: "Chú mèo máy thông minh đến từ tương lai",
		url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "doraemon-nobita",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Nobi Nobita",
		description: "Cậu bé ham ngủ, bắn súng thiện xạ",
		url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "doraemon-shizuka",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Minamoto Shizuka",
		description: "Cô bé dịu dàng yêu thích đàn violin và bánh khoai",
		url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "doraemon-suneo",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Honekawa Suneo",
		description: "Thiếu gia mỏ nhọn đam mê mô hình lắp ráp",
		url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "doraemon-jaian",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Gouda Takeshi (Jaian)",
		description: "Anh chàng to khỏe với giọng hát 'hủy diệt'",
		url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "doraemon-dorami",
		category: "doraemon",
		categoryName: "Doraemon",
		name: "Dorami",
		description: "Cô em gái mèo máy chu đáo và tài giỏi",
		url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
	},

	// Shin Cậu bé bút chì (Crayon Shin-chan)
	{
		id: "shin-chan",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Nohara Shinnosuke (Shin-chan)",
		description: "Cậu bé 5 tuổi hài hước mê Choco-bi",
		url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "shin-shiro",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Bạch Tuyết (Shiro)",
		description: "Chú cún trắng thông minh biết làm trò bông kẹo",
		url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "shin-himawari",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Nohara Himawari",
		description: "Em bé nghịch ngợm mê trai đẹp và đồ trang sức",
		url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "shin-kazama",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Kazama Toru",
		description: "Cậu bạn quý tộc học sinh giỏi của lớp Hướng Dương",
		url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "shin-nene",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Sakurada Nene",
		description: "Cô bé thích chơi trò gia đình chân thực và thỏ bông",
		url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
	},
	{
		id: "shin-bo",
		category: "shin",
		categoryName: "Shin - Cậu bé bút chì",
		name: "Bo (Cậu bé mũi dãi)",
		description: "Nhân vật điềm tĩnh, bậc thầy sưu tầm đá lạ",
		url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
	},
];
