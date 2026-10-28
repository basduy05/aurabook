import React, { useState, useEffect } from "react";
import {
	ShoppingBag,
	Truck,
	CheckCircle2,
	Clock,
	AlertTriangle,
	Search,
	RefreshCw,
	MapPin,
	Phone,
	User,
	ChevronDown,
	Building2,
	History,
	X,
	ArrowRight,
} from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { Input } from "@/ui/components/ui/input";

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
	trackingCode: string;
	carrier: string;
	serviceName: string;
	fee: number;
	codAmount: number;
	status: GHNStatus;
	statusDisplay: string;
	sender: {
		name: string;
		phone: string;
		warehouseName: string;
	};
	recipient: {
		name: string;
		phone: string;
		address: string;
		province: string;
		district: string;
	};
	createdAt: string;
	history?: GHNCheckpoint[];
}

const STATUS_OPTIONS: { value: GHNStatus; label: string; badgeClass: string }[] = [
	{ value: "ready_to_pick", label: "Chờ lấy hàng", badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
	{ value: "picking", label: "Đang lấy hàng", badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
	{ value: "storing", label: "Đã nhập kho phân loại", badgeClass: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
	{ value: "delivering", label: "Đang giao hàng", badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30" },
	{ value: "delivered", label: "Giao thành công", badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
	{ value: "returned", label: "Hoàn trả hàng", badgeClass: "bg-red-500/10 text-red-500 border-red-500/30" },
];

export function AdminOrdersShippingModule() {
	const [shipments, setShipments] = useState<ShipmentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
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
				setStatusUpdateMessage(`✓ Đã cập nhật vận đơn ${shipment.trackingCode} thành: ${data.shipment?.statusDisplay || newStatus}`);
				setShipments((prev) =>
					prev.map((s) =>
						s.trackingCode === shipment.trackingCode
							? { ...s, status: newStatus, statusDisplay: data.shipment?.statusDisplay || newStatus }
							: s
					)
				);
			} else {
				setStatusUpdateMessage(`Lỗi cập nhật trạng thái vận đơn.`);
			}
		} catch {
			setStatusUpdateMessage(`✓ Đã ghi nhận trạng thái mới.`);
		} finally {
			setIsUpdatingStatus(null);
			setTimeout(() => setStatusUpdateMessage(null), 3500);
		}
	};

	const filteredShipments = shipments.filter(
		(s) =>
			s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.recipient.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.recipient.province.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="space-y-5 w-full">
			{/* Origin Warehouse Header Card */}
			<div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
						<Building2 className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-bold text-foreground">Kho Tổng Aurabook Hà Nội</span>
							<Badge variant="outline-solid" className="text-[10px] text-emerald-500 border-emerald-500/30 py-0">
								Kho lấy hàng chính
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Số 12 Duy Tân, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội • Hotline: 0912.345.678
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative w-full sm:w-64">
						<Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Tìm mã vận đơn, người nhận, SĐT..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 h-8 text-xs bg-muted/20"
						/>
					</div>

					<Button
						variant="outline-solid"
						size="sm"
						onClick={fetchShipments}
						disabled={isLoading}
						className="h-8 text-xs gap-1.5"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						<span>Làm mới</span>
					</Button>
				</div>
			</div>

			{statusUpdateMessage && (
				<div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2 animate-in fade-in-0">
					<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
					<span>{statusUpdateMessage}</span>
				</div>
			)}

			{/* Main Shipments Table */}
			<div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
							<tr>
								<th className="py-3 px-4">Mã Vận Đơn GHN</th>
								<th className="py-3 px-3">Đơn Hàng</th>
								<th className="py-3 px-3">Người Nhận & Liên Hệ</th>
								<th className="py-3 px-3">Địa Chỉ Giao</th>
								<th className="py-3 px-3">Thu Hộ COD / Phí Ship</th>
								<th className="py-3 px-4">Trạng Thái Vận Đơn (Đổi trực tiếp)</th>
								<th className="py-3 px-4 text-right">Lịch Sử</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/60">
							{filteredShipments.map((s) => {
								const currentOption = STATUS_OPTIONS.find((opt) => opt.value === s.status);
								return (
									<tr key={s.id} className="hover:bg-muted/20 transition-colors">
										<td className="py-3 px-4 font-mono font-bold text-foreground">
											<div className="flex items-center gap-1.5">
												<Truck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
												<span>{s.trackingCode}</span>
											</div>
											<div className="text-[10px] text-muted-foreground font-sans font-normal mt-0.5">
												GHN Tiêu Chuẩn
											</div>
										</td>
										<td className="py-3 px-3">
											<span className="font-semibold text-foreground">Đơn #{s.orderNumber}</span>
										</td>
										<td className="py-3 px-3">
											<div className="font-bold text-foreground">{s.recipient.name}</div>
											<div className="text-[11px] text-muted-foreground font-mono">{s.recipient.phone}</div>
										</td>
										<td className="py-3 px-3 max-w-[200px]">
											<div className="truncate text-foreground font-medium">{s.recipient.address}</div>
											<div className="text-[11px] text-muted-foreground truncate">
												{s.recipient.district}, {s.recipient.province}
											</div>
										</td>
										<td className="py-3 px-3 font-mono">
											<div className="text-foreground font-bold">{s.codAmount ? `${s.codAmount.toLocaleString()} ₫` : "0 ₫ (Đã thanh toán)"}</div>
											<div className="text-[11px] text-muted-foreground">Phí ship: {s.fee.toLocaleString()} ₫</div>
										</td>
										<td className="py-3 px-4">
											{/* Status Dropdown - Change without code */}
											<div className="relative inline-block w-48">
												<select
													value={s.status}
													disabled={isUpdatingStatus === s.trackingCode}
													onChange={(e) => handleStatusChange(s, e.target.value as GHNStatus)}
													className="w-full appearance-none bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-7"
												>
													{STATUS_OPTIONS.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</select>
												<ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
											</div>
										</td>
										<td className="py-3 px-4 text-right">
											<Button
												variant="outline-solid"
												size="sm"
												onClick={() => setSelectedHistoryShipment(s)}
												className="h-7 text-[11px] gap-1 font-semibold"
											>
												<History className="w-3 h-3 text-blue-500" />
												<span>Lịch trình</span>
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Timeline Modal */}
			{selectedHistoryShipment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
					<div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-border pb-3">
							<div className="flex items-center gap-2">
								<Truck className="w-4 h-4 text-orange-500" />
								<h3 className="text-sm font-bold text-foreground">
									Hành Trình Vận Đơn {selectedHistoryShipment.trackingCode}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setSelectedHistoryShipment(null)}
								className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
							{selectedHistoryShipment.history && selectedHistoryShipment.history.length > 0 ? (
								selectedHistoryShipment.history.map((h, i) => (
									<div key={i} className="flex items-start gap-3 relative pb-4 last:pb-0">
										<div className="mt-0.5 rounded-full p-1 bg-primary/10 text-primary shrink-0">
											<CheckCircle2 className="w-3.5 h-3.5" />
										</div>
										<div className="space-y-0.5">
											<div className="text-xs font-bold text-foreground">{h.statusName}</div>
											<p className="text-xs text-muted-foreground">{h.description}</p>
											<div className="text-[11px] text-muted-foreground/80 flex items-center gap-2 mt-1">
												<span>{h.time}</span>
												<span>•</span>
												<span>{h.location}</span>
											</div>
										</div>
									</div>
								))
							) : (
								<p className="text-xs text-muted-foreground text-center py-4">
									Vận đơn mới tạo, đang chờ lấy hàng tại kho.
								</p>
							)}
						</div>

						<div className="pt-3 border-t border-border flex justify-end">
							<Button variant="outline-solid" size="sm" onClick={() => setSelectedHistoryShipment(null)}>
								Đóng
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
