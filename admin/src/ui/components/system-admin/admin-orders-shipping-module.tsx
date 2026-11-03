import React, { useState, useEffect } from "react";
import {
	Truck,
	CheckCircle2,
	Search,
	RefreshCw,
	ChevronDown,
	Building2,
	BookOpen,
	History,
	X,
	Package,
	Clock,
	XCircle,
	Check,
	Sparkles,
	Layers,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { cn } from "@/lib/utils";

export type GHNStatus =
	| "ready_to_pick"
	| "picking"
	| "storing"
	| "delivering"
	| "delivered"
	| "cancel"
	| "returned";

interface GHNCheckpoint {
	status: string;
	statusName: string;
	description: string;
	time: string;
	location: string;
}

interface ShipmentItem {
	id: string;
	orderNumber: string;
	orderStatus?: string;
	trackingCode: string;
	carrier: string;
	serviceName: string;
	isDigital?: boolean;
	fee: number;
	codAmount: number;
	totalAmount?: number;
	status: GHNStatus;
	statusDisplay: string;
	itemsSummary?: string;
	createdAt?: string;
	sender: {
		name: string;
		phone: string;
		warehouseName?: string;
		address?: string;
		district?: string;
		province?: string;
	};
	recipient: {
		name: string;
		phone: string;
		address: string;
		district?: string;
		province?: string;
	};
	history?: GHNCheckpoint[];
}

const STATUS_OPTIONS: { value: GHNStatus; label: string }[] = [
	{ value: "ready_to_pick", label: "Chờ lấy hàng" },
	{ value: "picking", label: "Đang lấy hàng" },
	{ value: "storing", label: "Đã nhập kho phân loại" },
	{ value: "delivering", label: "Đang giao hàng" },
	{ value: "delivered", label: "Giao thành công" },
	{ value: "cancel", label: "Đã hủy đơn" },
	{ value: "returned", label: "Hoàn trả hàng" },
];

export function AdminOrdersShippingModule() {
	const [shipments, setShipments] = useState<ShipmentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<"all" | "physical" | "digital">("all");
	const [selectedHistoryShipment, setSelectedHistoryShipment] = useState<ShipmentItem | null>(null);
	const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

	const fetchShipments = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/admin/shipments");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (data.shipments && Array.isArray(data.shipments)) {
					setShipments(data.shipments);
				}
			}
		} catch (e) {
			console.warn("Lỗi tải vận đơn:", e);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchShipments();
	}, []);

	const handleStatusChange = async (shipment: ShipmentItem, newStatus: GHNStatus) => {
		if (shipment.status === newStatus) return;
		setIsUpdatingStatus(shipment.trackingCode);
		try {
			const res = await fetch("/api/admin/shipments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: shipment.trackingCode,
					status: newStatus,
				}),
			});
			if (res.ok) {
				const data = (await res.json()) as any;
				setStatusUpdateMessage(`Đã cập nhật vận đơn ${shipment.trackingCode}: ${data.shipment?.statusDisplay || newStatus}`);
				setShipments((prev) =>
					prev.map((s) =>
						s.trackingCode === shipment.trackingCode
							? {
									...s,
									status: newStatus,
									statusDisplay: data.shipment?.statusDisplay || newStatus,
									orderStatus: newStatus === "cancel" ? "canceled" : newStatus === "delivered" ? "fulfilled" : "unfulfilled",
							  }
							: s
					)
				);
			} else {
				setStatusUpdateMessage(`Lỗi cập nhật trạng thái vận đơn.`);
			}
		} catch {
			setStatusUpdateMessage(`Đã cập nhật trạng thái.`);
		} finally {
			setIsUpdatingStatus(null);
			setTimeout(() => setStatusUpdateMessage(null), 3000);
		}
	};

	// Counts
	const totalCount = shipments.length;
	const digitalCount = shipments.filter((s) => s.isDigital || s.trackingCode === "DRM-EBOOK-ONLINE").length;
	const physicalCount = shipments.filter((s) => !s.isDigital && s.trackingCode !== "DRM-EBOOK-ONLINE").length;
	const readyCount = shipments.filter((s) => s.status === "ready_to_pick" || s.status === "picking").length;
	const deliveringCount = shipments.filter((s) => s.status === "storing" || s.status === "delivering").length;
	const deliveredCount = shipments.filter((s) => s.status === "delivered").length;
	const canceledCount = shipments.filter((s) => s.status === "cancel" || s.orderStatus === "canceled").length;

	const filteredShipments = shipments.filter((s) => {
		const isDigital = s.isDigital || s.trackingCode === "DRM-EBOOK-ONLINE";

		// Type filter
		if (typeFilter === "physical" && isDigital) return false;
		if (typeFilter === "digital" && !isDigital) return false;

		// Search match
		const matchesSearch =
			s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.recipient.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(s.itemsSummary || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(s.recipient.province || "").toLowerCase().includes(searchQuery.toLowerCase());

		if (!matchesSearch) return false;

		// Status filter
		if (statusFilter === "ready") return s.status === "ready_to_pick" || s.status === "picking";
		if (statusFilter === "delivering") return s.status === "storing" || s.status === "delivering";
		if (statusFilter === "delivered") return s.status === "delivered";
		if (statusFilter === "cancel") return s.status === "cancel" || s.orderStatus === "canceled";

		return true;
	});

	return (
		<div className="space-y-4 w-full text-slate-100">
			{/* Overview Category Tabs (Physical vs Digital) */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<button
					type="button"
					onClick={() => {
						setTypeFilter("all");
						setStatusFilter("all");
					}}
					className={cn(
						"rounded-xl border p-4 text-left transition-all cursor-pointer",
						typeFilter === "all"
							? "border-blue-500/80 bg-blue-950/30 text-white shadow-sm ring-1 ring-blue-500/50"
							: "border-slate-800 bg-[#0f172a] text-slate-400 hover:border-slate-700 hover:text-slate-200"
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tất Cả Đơn Hàng</span>
						<Layers className="w-4 h-4 text-blue-400" />
					</div>
					<div className="text-2xl font-bold mt-2 text-white tabular-nums">{totalCount}</div>
					<div className="text-[11px] text-slate-500 mt-0.5">Bao gồm sách giấy giao GHN và Ebook DRM</div>
				</button>

				<button
					type="button"
					onClick={() => {
						setTypeFilter("physical");
						setStatusFilter("all");
					}}
					className={cn(
						"rounded-xl border p-4 text-left transition-all cursor-pointer",
						typeFilter === "physical"
							? "border-amber-500/80 bg-amber-950/30 text-white shadow-sm ring-1 ring-amber-500/50"
							: "border-slate-800 bg-[#0f172a] text-slate-400 hover:border-slate-700 hover:text-slate-200"
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Sách Giấy & GHN</span>
						<Truck className="w-4 h-4 text-amber-400" />
					</div>
					<div className="text-2xl font-bold mt-2 text-white tabular-nums">{physicalCount}</div>
					<div className="text-[11px] text-slate-500 mt-0.5">Vận chuyển vật lý qua bưu cục Giao Hàng Nhanh</div>
				</button>

				<button
					type="button"
					onClick={() => {
						setTypeFilter("digital");
						setStatusFilter("all");
					}}
					className={cn(
						"rounded-xl border p-4 text-left transition-all cursor-pointer",
						typeFilter === "digital"
							? "border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm ring-1 ring-emerald-500/50"
							: "border-slate-800 bg-[#0f172a] text-slate-400 hover:border-slate-700 hover:text-slate-200"
					)}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Sách Điện Tử Ebook DRM</span>
						<BookOpen className="w-4 h-4 text-emerald-400" />
					</div>
					<div className="text-2xl font-bold mt-2 text-white tabular-nums">{digitalCount}</div>
					<div className="text-[11px] text-slate-500 mt-0.5">Kích hoạt số tức thì, không phát sinh mã vận đơn GHN</div>
				</button>
			</div>

			{/* Sub-status Filter Buttons */}
			<div className="flex flex-wrap items-center gap-2">
				{[
					{ key: "all", label: `Tất cả trạng thái (${filteredShipments.length})` },
					{ key: "ready", label: `Chờ lấy hàng (${readyCount})` },
					{ key: "delivering", label: `Đang giao (${deliveringCount})` },
					{ key: "delivered", label: `Hoàn tất / Đã kích hoạt (${deliveredCount})` },
					{ key: "cancel", label: `Đã hủy (${canceledCount})` },
				].map((f) => (
					<button
						key={f.key}
						type="button"
						onClick={() => setStatusFilter(f.key)}
						className={cn(
							"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border",
							statusFilter === f.key
								? "bg-slate-800 text-white border-slate-600 font-semibold"
								: "bg-[#0f172a]/80 text-slate-400 border-slate-800/80 hover:bg-slate-800/50 hover:text-slate-200"
						)}
					>
						{f.label}
					</button>
				))}
			</div>

			{/* Warehouse Info & Search Toolbar */}
			<div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-blue-400 shrink-0">
						<Building2 className="w-4 h-4" />
					</div>
					<div>
						<div className="text-xs font-semibold text-white flex items-center gap-2">
							<span>Kho Tổng AuraBook Hà Nội</span>
							<span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
								Kho lấy hàng chính
							</span>
						</div>
						<div className="text-[11px] text-slate-400">
							Số 12 Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội • Hotline: 0912.345.678
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative w-full sm:w-64">
						<Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
						<Input
							type="text"
							placeholder="Tìm mã đơn, GHN, người nhận..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 h-8 text-xs bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
						/>
					</div>

					<Button
						variant="outline-solid"
						size="sm"
						onClick={fetchShipments}
						disabled={isLoading}
						className="h-8 text-xs gap-1.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
					>
						<RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
						<span>Làm mới</span>
					</Button>
				</div>
			</div>

			{statusUpdateMessage && (
				<div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
					<Check className="w-4 h-4 shrink-0 text-emerald-400" />
					<span>{statusUpdateMessage}</span>
				</div>
			)}

			{/* Main Orders & Shipments Table */}
			<div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
							<tr>
								<th className="py-3 px-3.5">Mã đơn</th>
								<th className="py-3 px-3.5">Hình thức & Vận đơn</th>
								<th className="py-3 px-3.5">Người nhận</th>
								<th className="py-3 px-3.5">Địa chỉ giao</th>
								<th className="py-3 px-3.5">Sản phẩm & Giá trị</th>
								<th className="py-3 px-3.5 text-center">Đơn Saleor</th>
								<th className="py-3 px-3.5">Trạng thái vận đơn</th>
								<th className="py-3 px-3.5 text-right">Lịch trình</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800/60">
							{filteredShipments.length === 0 ? (
								<tr>
									<td colSpan={8} className="py-12 text-center text-slate-500">
										Không tìm thấy đơn hàng hoặc vận đơn nào phù hợp với bộ lọc.
									</td>
								</tr>
							) : (
								filteredShipments.map((s) => {
									const isDigital = s.isDigital || s.trackingCode === "DRM-EBOOK-ONLINE";
									const isCanceled = s.status === "cancel" || s.orderStatus === "canceled";
									const isDelivered = s.status === "delivered" || s.orderStatus === "fulfilled";

									return (
										<tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
											{/* Order Number */}
											<td className="py-3.5 px-3.5">
												<div className="font-bold text-white text-sm">
													Đơn #{s.orderNumber}
												</div>
												<div className="text-[10px] text-slate-400 font-mono mt-0.5">
													{s.createdAt ? new Date(s.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
												</div>
											</td>

											{/* GHN Tracking / DRM Digital */}
											<td className="py-3.5 px-3.5">
												{isDigital ? (
													<div>
														<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
															<BookOpen className="w-3.5 h-3.5" />
															Sách Điện Tử Ebook
														</span>
														<div className="text-[10px] text-slate-400 font-sans mt-1">
															Kích hoạt số DRM (Không phát sinh GHN)
														</div>
													</div>
												) : (
													<div>
														<div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
															<Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
															<span>{s.trackingCode}</span>
														</div>
														<div className="text-[10px] text-slate-400 font-sans mt-1">
															GHN Tiêu chuẩn • Phí ship: {s.fee ? `${s.fee.toLocaleString("vi-VN")} ₫` : "22.000 ₫"}
														</div>
													</div>
												)}
											</td>

											{/* Recipient */}
											<td className="py-3.5 px-3.5">
												<div className="font-semibold text-white">
													{s.recipient.name}
												</div>
												<div className="text-[11px] text-slate-400 font-mono">
													{s.recipient.phone}
												</div>
											</td>

											{/* Delivery Address */}
											<td className="py-3.5 px-3.5 max-w-[200px]">
												{isDigital ? (
													<div>
														<div className="text-slate-300 font-medium text-xs">
															Tài khoản đọc sách trực tuyến
														</div>
														<div className="text-[10px] text-emerald-400">
															Đọc ngay trên Web Reader DRM
														</div>
													</div>
												) : (
													<div>
														<div className="truncate text-slate-300 font-medium text-xs" title={s.recipient.address}>
															{s.recipient.address}
														</div>
														<div className="text-[10px] text-slate-500 truncate">
															{s.recipient.district ? `${s.recipient.district}, ` : ""}{s.recipient.province}
														</div>
													</div>
												)}
											</td>

											{/* Items & Amount */}
											<td className="py-3.5 px-3.5">
												<div className="text-slate-200 font-medium truncate max-w-[190px] text-xs" title={s.itemsSummary}>
													{s.itemsSummary || "Sách AuraBook"}
												</div>
												<div className="text-[11px] font-mono text-emerald-400 font-semibold tabular-nums mt-0.5">
													{s.totalAmount ? `${s.totalAmount.toLocaleString("vi-VN")} ₫` : "89.000 ₫"}
												</div>
											</td>

											{/* Saleor Order Status */}
											<td className="py-3.5 px-3.5 text-center">
												<span
													className={cn(
														"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
														isCanceled
															? "bg-red-500/10 text-red-400 border border-red-500/20"
															: isDelivered
															? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
															: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
													)}
												>
													{isCanceled ? "Đã hủy" : isDelivered ? "Hoàn tất" : "Chờ xử lý"}
												</span>
											</td>

											{/* GHN Status Dropdown / DRM Badge */}
											<td className="py-3.5 px-3.5">
												{isDigital ? (
													<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
														<CheckCircle2 className="w-3.5 h-3.5" />
														Đã cấp phép DRM
													</span>
												) : (
													<div className="relative inline-block w-40">
														<select
															value={s.status}
															disabled={isUpdatingStatus === s.trackingCode}
															onChange={(e) => handleStatusChange(s, e.target.value as GHNStatus)}
															className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-md py-1 px-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer pr-6"
														>
															{STATUS_OPTIONS.map((opt) => (
																<option key={opt.value} value={opt.value}>
																	{opt.label}
																</option>
															))}
														</select>
														<ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
													</div>
												)}
											</td>

											{/* Actions */}
											<td className="py-3.5 px-3.5 text-right">
												<Button
													variant="outline-solid"
													size="sm"
													onClick={() => setSelectedHistoryShipment(s)}
													className="h-7 text-[11px] gap-1 px-2 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
												>
													<History className="w-3 h-3 text-slate-400" />
													<span>Lịch trình</span>
												</Button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Timeline Modal */}
			{selectedHistoryShipment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0">
					<div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-slate-800 pb-3">
							<div className="flex items-center gap-2">
								{selectedHistoryShipment.isDigital ? (
									<BookOpen className="w-4 h-4 text-emerald-400" />
								) : (
									<Truck className="w-4 h-4 text-amber-400" />
								)}
								<h3 className="text-sm font-bold text-white">
									{selectedHistoryShipment.isDigital
										? `Chi tiết phân phối Ebook: Đơn #${selectedHistoryShipment.orderNumber}`
										: `Lịch trình vận đơn: ${selectedHistoryShipment.trackingCode}`}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setSelectedHistoryShipment(null)}
								className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
							{selectedHistoryShipment.isDigital ? (
								<div className="space-y-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
									<div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
										<CheckCircle2 className="w-4 h-4" />
										<span>Bản quyền nội dung số Readium LCP đã cấp phát</span>
									</div>
									<p className="text-xs text-slate-400">
										Khách hàng thanh toán hoàn tất, hệ thống tự động liên kết sách vào Tủ sách cá nhân của tài khoản độc giả và sinh khóa bảo vệ DRM bản quyền.
									</p>
									<div className="text-[11px] text-slate-500 font-mono">
										Mã phân loại: DRM-EBOOK-ONLINE • Gateway: AuraBook DRM Engine
									</div>
								</div>
							) : selectedHistoryShipment.history && selectedHistoryShipment.history.length > 0 ? (
								selectedHistoryShipment.history.map((h, i) => (
									<div key={i} className="flex items-start gap-3 pb-3 last:pb-0">
										<div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-500/20" />
										<div className="space-y-0.5">
											<div className="text-xs font-semibold text-white">
												{h.statusName}
											</div>
											<p className="text-xs text-slate-400">
												{h.description}
											</p>
											<div className="text-[10px] text-slate-500 font-mono">
												{h.time ? new Date(h.time).toLocaleString("vi-VN") : h.time} • {h.location}
											</div>
										</div>
									</div>
								))
							) : (
								<p className="text-xs text-slate-400 text-center py-4">
									Đơn hàng đang chờ lấy hàng tại kho GHN Hà Nội.
								</p>
							)}
						</div>

						<div className="pt-2 border-t border-slate-800 flex justify-end">
							<Button
								variant="outline-solid"
								size="sm"
								onClick={() => setSelectedHistoryShipment(null)}
								className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
							>
								Đóng
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default AdminOrdersShippingModule;
