"use client";

import { useState, useEffect } from "react";
import {
	Package,
	CheckCircle2,
	Clock,
	MapPin,
	RefreshCw,
	Copy,
	Check,
	Building2,
	Navigation,
	AlertCircle,
	ChevronDown,
	ChevronUp,
} from "lucide-react";

export interface GHNTrackingCheckpoint {
	status: string;
	statusName: string;
	description: string;
	time: string;
	location: string;
}

export interface GHNShipmentData {
	id: string;
	orderNumber: string;
	trackingCode: string;
	carrier: string;
	serviceType: string;
	serviceName: string;
	fee: number;
	codAmount: number;
	weightGrams: number;
	status: "ready_to_pick" | "picking" | "storing" | "delivering" | "delivered" | "cancel" | "returned";
	statusDisplay: string;
	sender: {
		name: string;
		phone: string;
		address: string;
		warehouseName: string;
	};
	recipient: {
		name: string;
		phone: string;
		address: string;
		province: string;
		district: string;
		ward?: string;
	};
	itemsSummary: string;
	createdAt: string;
	estimatedDeliveryDate: string;
	deliveredAt?: string;
	history: GHNTrackingCheckpoint[];
}

interface GHNOrderTrackingProps {
	orderNumber: string;
	initialShipment?: GHNShipmentData | null;
	onStatusChange?: (newStatus: string) => void;
}

const STEPS = [
	{ key: "ready_to_pick", label: "Tiếp nhận kho", desc: "Kho Tổng Hà Nội" },
	{ key: "storing", label: "Trung tâm GHN", desc: "Phân loại trung chuyển" },
	{ key: "delivering", label: "Đang giao", desc: "Shipper GHN đang phát" },
	{ key: "delivered", label: "Hoàn tất (Completed)", desc: "Giao thành công" },
];

/** Official full logo for Giao Hàng Nhanh (GHN) */
export function GHNLogo({ className = "h-8 w-auto" }: { className?: string }) {
	return (
		<img
			src="/images/ghn-logo.webp"
			alt="Giao Hàng Nhanh (GHN)"
			className={`object-contain bg-white rounded-md px-1.5 py-0.5 border border-border/40 shadow-sm ${className}`}
		/>
	);
}

export function GHNOrderTracking({ orderNumber, initialShipment, onStatusChange }: GHNOrderTrackingProps) {
	const [shipment, setShipment] = useState<GHNShipmentData | null>(initialShipment || null);
	const [loading, setLoading] = useState(!initialShipment);
	const [updating, setUpdating] = useState(false);
	const [copied, setCopied] = useState(false);
	const [notification, setNotification] = useState<string | null>(null);
	// Default to collapsed as requested
	const [isCollapsed, setIsCollapsed] = useState(true);

	// Load shipment if not provided
	useEffect(() => {
		let isMounted = true;
		async function fetchShipment() {
			try {
				setLoading(true);
				const res = await fetch(`/api/shipping/ghn/tracking?code=${orderNumber}`);
				if (res.ok) {
					const data = (await res.json()) as { shipment?: GHNShipmentData };
					if (isMounted && data.shipment) {
						setShipment(data.shipment);
					}
				}
			} catch (err) {
				console.error("Failed to load GHN shipment", err);
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		if (!initialShipment) {
			fetchShipment();
		}
		return () => {
			isMounted = false;
		};
	}, [orderNumber, initialShipment]);

	const copyTrackingCode = (code: string) => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSimulateStatus = async (newStatus: "ready_to_pick" | "delivering" | "delivered") => {
		if (!shipment) return;
		setUpdating(true);
		setNotification(null);

		try {
			const res = await fetch("/api/shipping/ghn/update-status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					trackingCode: shipment.trackingCode,
					orderNumber: shipment.orderNumber,
					status: newStatus,
				}),
			});

			const data = (await res.json()) as { shipment?: GHNShipmentData; error?: string };
			if (res.ok && data.shipment) {
				setShipment(data.shipment);
				if (newStatus === "delivered") {
					setNotification("🎉 GHN đã giao hàng thành công! Đơn hàng được cập nhật thành trạng thái Hoàn tất (Completed).");
				} else {
					setNotification(`🚚 Đã cập nhật trạng thái GHN: ${data.shipment.statusDisplay}`);
				}
				if (onStatusChange) {
					onStatusChange(newStatus);
				}
			} else {
				setNotification(`❌ Lỗi cập nhật: ${data.error || "Không thể cập nhật"}`);
			}
		} catch (e) {
			setNotification("❌ Lỗi mạng khi kết nối GHN");
		} finally {
			setUpdating(false);
		}
	};

	if (loading) {
		return (
			<div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
				<div className="flex items-center gap-3">
					<RefreshCw className="h-5 w-5 animate-spin text-primary" />
					<p className="text-sm font-medium text-muted-foreground">
						Đang tải dữ liệu vận chuyển Giao Hàng Nhanh (GHN)...
					</p>
				</div>
			</div>
		);
	}

	if (!shipment) {
		return null;
	}

	// Calculate step index
	let currentStepIndex = 0;
	if (shipment.status === "ready_to_pick" || shipment.status === "picking") {
		currentStepIndex = 0;
	} else if (shipment.status === "storing") {
		currentStepIndex = 1;
	} else if (shipment.status === "delivering") {
		currentStepIndex = 2;
	} else if (shipment.status === "delivered") {
		currentStepIndex = 3;
	}

	const isCompleted = shipment.status === "delivered";

	return (
		<div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all">
			{/* Top Header / Collapsed Summary Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<GHNLogo className="h-9 w-auto shrink-0" />
					<div>
						<div className="flex items-center gap-2">
							<span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground border border-border">
								Kho Hà Nội
							</span>
							<p className="text-xs text-muted-foreground">
								Vận đơn:{" "}
								<span className="font-mono font-semibold text-foreground">{shipment.trackingCode}</span>
							</p>
						</div>
						{isCollapsed && (
							<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
								<span className="font-medium text-foreground">Người nhận:</span> {shipment.recipient.name} ({shipment.recipient.phone}) — {shipment.recipient.address}, {shipment.recipient.district}, {shipment.recipient.province}
							</p>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => copyTrackingCode(shipment.trackingCode)}
						className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
						title="Sao chép mã vận đơn"
					>
						{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
						{copied ? "Đã chép" : "Sao chép mã"}
					</button>

					<span
						className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
							isCompleted
								? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400"
								: "bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground"
						}`}
					>
						{isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
						{isCompleted ? "Đã hoàn tất (Completed)" : shipment.statusDisplay}
					</span>

					{/* Accordion toggle button */}
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
						title={isCollapsed ? "Mở rộng chi tiết vận đơn GHN" : "Thu gọn chi tiết"}
					>
						<span>{isCollapsed ? "Chi tiết" : "Thu gọn"}</span>
						{isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
					</button>
				</div>
			</div>

			{/* Collapsible Content */}
			{!isCollapsed && (
				<div className="mt-5 border-t border-border pt-4 space-y-5 animate-in fade-in-50 duration-200">
					{/* Notification message */}
					{notification && (
						<div
							className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
								notification.startsWith("🎉")
									? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:text-emerald-400"
									: notification.startsWith("❌")
									? "bg-destructive/10 text-destructive border border-destructive/30"
									: "bg-secondary text-secondary-foreground border border-border"
							}`}
						>
							<AlertCircle className="h-4 w-4 shrink-0" />
							<span>{notification}</span>
						</div>
					)}

					{/* Origin and Destination Info Cards */}
					<div className="grid gap-3 sm:grid-cols-2 text-xs">
						<div className="rounded-lg border border-border bg-card p-3">
							<div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
								<Building2 className="h-3.5 w-3.5 text-primary" />
								<span>Kho gửi (Hà Nội, Việt Nam):</span>
							</div>
							<p className="font-medium text-foreground">{shipment.sender.warehouseName}</p>
							<p className="text-muted-foreground mt-0.5">{shipment.sender.address}</p>
							<p className="text-muted-foreground">Hotline: {shipment.sender.phone}</p>
						</div>

						<div className="rounded-lg border border-border bg-card p-3">
							<div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
								<Navigation className="h-3.5 w-3.5 text-primary" />
								<span>Địa chỉ nhận hàng:</span>
							</div>
							<p className="font-medium text-foreground">
								{shipment.recipient.name} ({shipment.recipient.phone})
							</p>
							<p className="text-muted-foreground mt-0.5">
								{shipment.recipient.address}, {shipment.recipient.district}, {shipment.recipient.province}
							</p>
							<p className="text-muted-foreground">Dịch vụ: {shipment.serviceName}</p>
						</div>
					</div>

					{/* Stepper progress */}
					<div className="pt-2">
						<div className="relative">
							{/* Progress connecting line */}
							<div className="absolute left-0 top-3.5 h-1 w-full bg-secondary -z-0">
								<div
									className="h-1 bg-primary transition-all duration-500"
									style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
								/>
							</div>

							<div className="relative z-10 flex justify-between">
								{STEPS.map((step, idx) => {
									const isPassed = idx <= currentStepIndex;
									const isCurrent = idx === currentStepIndex;
									return (
										<div key={step.key} className="flex flex-col items-center text-center">
											<div
												className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
													idx < currentStepIndex || (isCompleted && idx === 3)
														? "border-emerald-500 bg-emerald-500 text-white"
														: isCurrent
														? "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20"
														: "border-border bg-background text-muted-foreground"
												}`}
											>
												{idx < currentStepIndex || (isCompleted && idx === 3) ? (
													<Check className="h-3.5 w-3.5" />
												) : (
													idx + 1
												)}
											</div>
											<p
												className={`mt-2 text-xs ${
													isCurrent
														? "font-bold text-foreground"
														: isPassed
														? "font-medium text-foreground"
														: "text-muted-foreground"
												}`}
											>
												{step.label}
											</p>
											<p className="hidden text-[11px] text-muted-foreground sm:block">{step.desc}</p>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Timeline Details */}
					<div className="rounded-lg border border-border bg-muted/30 p-4">
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Lịch sử luân chuyển bưu kiện (GHN Checkpoints)
							</h4>
							<span className="text-[11px] text-muted-foreground">
								{shipment.history.length} mốc thời gian
							</span>
						</div>

						<div className="space-y-3">
							{shipment.history.map((cp, idx) => (
								<div key={idx} className="flex items-start gap-3 text-xs">
									<div
										className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
											idx === 0 ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/40"
										}`}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center justify-between gap-1">
											<span className={`font-semibold ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}>
												{cp.statusName}
											</span>
											<span className="text-[11px] text-muted-foreground">
												{new Date(cp.time).toLocaleTimeString("vi-VN", {
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												- {new Date(cp.time).toLocaleDateString("vi-VN")}
											</span>
										</div>
										<p className="text-muted-foreground mt-0.5">{cp.description}</p>
										<p className="text-[11px] text-primary/80 flex items-center gap-1 mt-0.5">
											<MapPin className="h-3 w-3 inline" />
											{cp.location}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Quick Admin/Demo Simulation Controls */}
					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Package className="h-3.5 w-3.5 text-primary" />
							<span className="font-medium">Mô phỏng trạng thái GHN (Kiểm thử):</span>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<button
								disabled={updating || shipment.status === "ready_to_pick"}
								onClick={() => handleSimulateStatus("ready_to_pick")}
								className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
							>
								Chờ lấy hàng
							</button>
							<button
								disabled={updating || shipment.status === "delivering"}
								onClick={() => handleSimulateStatus("delivering")}
								className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
							>
								Đang giao
							</button>
							<button
								disabled={updating || isCompleted}
								onClick={() => handleSimulateStatus("delivered")}
								className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
							>
								{updating ? (
									<RefreshCw className="h-3.5 w-3.5 animate-spin" />
								) : (
									<CheckCircle2 className="h-3.5 w-3.5" />
								)}
								Giao thành công (Completed)
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
