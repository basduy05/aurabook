"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Loader } from "@/ui/atoms/loader";

export function ContactFormClient({ isVi = true }: { isVi?: boolean }) {
	const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [formData, setFormData] = useState({
		fullName: "",
		email: "",
		phone: "",
		subject: "order",
		message: "",
	});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setStatus("submitting");

		// Simulate request
		await new Promise((resolve) => setTimeout(resolve, 800));
		setStatus("success");
	};

	if (status === "success") {
		return (
			<div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
					<CheckCircle2 className="h-6 w-6" />
				</div>
				<h3 className="text-lg font-bold text-foreground">
					{isVi ? "Gửi thông tin thành công!" : "Message Sent Successfully!"}
				</h3>
				<p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
					{isVi
						? "Cảm ơn bạn đã liên hệ với AuraBook. Đội ngũ chăm sóc độc giả sẽ phản hồi bạn qua email trong vòng 2 - 4 giờ làm việc."
						: "Thank you for reaching out. Our support team will get back to you via email within 2-4 business hours."}
				</p>
				<button
					type="button"
					onClick={() => {
						setStatus("idle");
						setFormData({ fullName: "", email: "", phone: "", subject: "order", message: "" });
					}}
					className="mt-6 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
				>
					{isVi ? "Gửi câu hỏi khác" : "Send another message"}
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="fullName" className="block text-xs font-semibold text-foreground mb-1.5">
						{isVi ? "Họ và tên *" : "Full Name *"}
					</label>
					<input
						id="fullName"
						type="text"
						required
						value={formData.fullName}
						onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
						placeholder={isVi ? "Nguyễn Văn A" : "John Doe"}
						className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
					/>
				</div>
				<div>
					<label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
						{isVi ? "Địa chỉ Email *" : "Email Address *"}
					</label>
					<input
						id="email"
						type="email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						placeholder="reader@aurabook.vn"
						className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
					/>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="phone" className="block text-xs font-semibold text-foreground mb-1.5">
						{isVi ? "Số điện thoại" : "Phone Number"}
					</label>
					<input
						id="phone"
						type="tel"
						value={formData.phone}
						onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
						placeholder="0988 xxx xxx"
						className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
					/>
				</div>
				<div>
					<label htmlFor="subject" className="block text-xs font-semibold text-foreground mb-1.5">
						{isVi ? "Chủ đề cần hỗ trợ *" : "Topic *"}
					</label>
					<select
						id="subject"
						value={formData.subject}
						onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
						className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
					>
						<option value="order">{isVi ? "Hỗ trợ đơn hàng & vận chuyển" : "Order & Shipping Support"}</option>
						<option value="book_request">{isVi ? "Tìm sách & yêu cầu nhập sách" : "Book Request"}</option>
						<option value="partnership">{isVi ? "Hợp tác xuất bản / tác giả" : "Publishing Partnership"}</option>
						<option value="feedback">{isVi ? "Góp ý & cải thiện dịch vụ" : "Feedback & Suggestions"}</option>
						<option value="other">{isVi ? "Nội dung khác" : "Other Inquiries"}</option>
					</select>
				</div>
			</div>

			<div>
				<label htmlFor="message" className="block text-xs font-semibold text-foreground mb-1.5">
					{isVi ? "Nội dung tin nhắn *" : "Message Content *"}
				</label>
				<textarea
					id="message"
					rows={4}
					required
					value={formData.message}
					onChange={(e) => setFormData({ ...formData, message: e.target.value })}
					placeholder={isVi ? "Hãy cho AuraBook biết bạn cần chúng tôi trợ giúp điều gì..." : "How can AuraBook help you today?"}
					className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
				/>
			</div>

			<button
				type="submit"
				disabled={status === "submitting"}
				className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
			>
				{status === "submitting" ? (
					<>
						<Loader size="sm" className="mr-1 text-primary-foreground fill-primary-foreground" />
						{isVi ? "Đang gửi thông tin..." : "Sending..."}
					</>
				) : (
					<>
						<Send className="h-4 w-4" />
						{isVi ? "Gửi thông tin liên hệ" : "Send Message"}
					</>
				)}
			</button>
		</form>
	);
}
