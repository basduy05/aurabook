import React, { useState } from "react";
import { Lock, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { SystemAdminDashboard } from "./ui/components/system-admin/system-admin-dashboard";

export function App() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
		return localStorage.getItem("aurabook_admin_auth") === "true";
	});
	const [passwordInput, setPasswordInput] = useState("");
	const [authError, setAuthError] = useState("");

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = passwordInput.trim();
		if (trimmed === "aurabook@2026" || trimmed === "admin" || trimmed === "aurabook") {
			localStorage.setItem("aurabook_admin_auth", "true");
			setIsAuthenticated(true);
			setAuthError("");
		} else {
			setAuthError("Mật khẩu không chính xác. Vui lòng nhập 'aurabook@2026' hoặc 'admin'.");
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("aurabook_admin_auth");
		setIsAuthenticated(false);
	};

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
				<div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
					<div className="flex items-center justify-center w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl mx-auto mb-6">
						<Lock className="w-8 h-8 text-blue-400" />
					</div>
					<h1 className="text-xl font-bold text-center text-white mb-2">
						Cổng Quản Trị Hệ Thống Aurabook
					</h1>
					<p className="text-xs text-center text-slate-400 mb-6">
						Khu vực kiểm soát độc lập (Cổng riêng :3001) dành riêng cho Quản trị viên
					</p>

					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label className="block text-xs font-semibold text-slate-300 mb-2">
								Mật khẩu Quản trị viên
							</label>
							<input
								type="password"
								placeholder="Nhập mật khẩu (mặc định: aurabook@2026)..."
								value={passwordInput}
								onChange={(e) => setPasswordInput(e.target.value)}
								autoFocus
								className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
							/>
						</div>

						{authError && (
							<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium">
								{authError}
							</div>
						)}

						<button
							type="submit"
							className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
						>
							<span>Đăng nhập Bảng điều khiển</span>
							<ChevronRight className="w-4 h-4" />
						</button>
					</form>

					<div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
						<span className="flex items-center gap-1.5">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
							Bảo mật cổng :3001
						</span>
						<span>Gợi ý: <code>aurabook@2026</code></span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-background text-foreground flex flex-col">
			{/* Admin Session Strip */}
			<div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
				<div className="flex items-center gap-2">
					<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
					<span className="font-semibold text-slate-200">Aurabook Dedicated Admin</span>
					<span className="text-slate-500">|</span>
					<span className="text-slate-400">Port 3001 (Độc lập Saleor Dashboard)</span>
				</div>
				<div className="flex items-center gap-4">
					<a
						href="http://localhost:3000"
						target="_blank"
						rel="noreferrer"
						className="hover:text-white transition-colors"
					>
						Storefront (:3000)
					</a>
					<a
						href="http://localhost:9000/dashboard/"
						target="_blank"
						rel="noreferrer"
						className="hover:text-white transition-colors"
					>
						Saleor (:9000)
					</a>
					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium cursor-pointer"
					>
						<LogOut className="w-3 h-3" />
						<span>Đăng xuất</span>
					</button>
				</div>
			</div>

			{/* Authentic System Admin Dashboard with all original tabs & logic */}
			<div className="flex-1">
				<SystemAdminDashboard />
			</div>
		</div>
	);
}

export default App;
