import Link from "next/link";
import type { MenuItem } from "@/lib/menus/get-menu-data";
import { getMenuItemHref, getMenuItemLabel } from "@/lib/menus/menu-item-utils";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import { NavHrefLink } from "@/ui/atoms/nav-href-link";
const defaultFooterLinks = {
	support: [
		{ label: "Contact Us", href: "/contact" },
		{ label: "FAQs", href: "/faq" },
		{ label: "Shipping", href: "/shipping" },
	],
	company: [
		{ label: "About", href: "/about" },
		{ label: "Sustainability", href: "/sustainability" },
		{ label: "Careers", href: "/careers" },
		{ label: "Press", href: "/press" },
	],
};

const defaultFooterLinksVi = {
	support: [
		{ label: "Liên hệ chúng tôi", href: "/contact" },
		{ label: "Câu hỏi thường gặp", href: "/faq" },
		{ label: "Chính sách vận chuyển", href: "/shipping" },
	],
	company: [
		{ label: "Giới thiệu Aurabook", href: "/about" },
		{ label: "Phát triển bền vững", href: "/sustainability" },
		{ label: "Cơ hội nghề nghiệp", href: "/careers" },
		{ label: "Báo chí & Truyền thông", href: "/press" },
	],
};

function FooterMenuChildLink({ child, locale }: { child: MenuItem; locale?: string }) {
	const href = getMenuItemHref(child);
	const label = getMenuItemLabel(child, locale);
	if (!href || !label) return null;

	if (child.category || child.collection || child.page) {
		return (
			<LinkWithChannel
				href={href}
				prefetch={false}
				className="text-sm text-inverse-subtle transition-colors hover:text-inverse"
			>
				{label}
			</LinkWithChannel>
		);
	}

	return (
		<NavHrefLink
			href={href}
			prefetch={false}
			className="text-sm text-inverse-subtle transition-colors hover:text-inverse"
		>
			{label}
		</NavHrefLink>
	);
}

export function FooterMenuColumns({ items, locale }: { items: MenuItem[]; locale?: string }) {
	const isVi = locale === "vi";
	const currentLinks = isVi ? defaultFooterLinksVi : defaultFooterLinks;
	const supportTitle = isVi ? "Hỗ trợ khách hàng" : "Support";
	const companyTitle = isVi ? "Về chúng tôi" : "Company";

	// Filter out any stale Saleor demo items or removed policy items
	const sanitizedItems = items
		.filter(
			(item) => !item.name.toLowerCase().includes("saleor") && !item.name.toLowerCase().includes("graphql"),
		)
		.map((item) => ({
			...item,
			children: item.children?.filter((child) => {
				const href = (child.url || "").toLowerCase();
				const name = (child.name || "").toLowerCase();
				return !href.includes("/returns") && !name.includes("đổi trả") && !name.includes("returns");
			}),
		}));

	if (sanitizedItems.length === 0) {
		return (
			<>
				<div>
					<h4 className="mb-4 text-sm font-medium text-inverse">{supportTitle}</h4>
					<ul className="space-y-3">
						{currentLinks.support.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									prefetch={false}
									className="text-sm text-inverse-subtle transition-colors hover:text-inverse"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h4 className="mb-4 text-sm font-medium text-inverse">{companyTitle}</h4>
					<ul className="space-y-3">
						{currentLinks.company.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									prefetch={false}
									className="text-sm text-inverse-subtle transition-colors hover:text-inverse"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</>
		);
	}

	return (
		<>
			{sanitizedItems.map((item) => (
				<div key={item.id}>
					<h4 className="mb-4 text-sm font-medium text-inverse">{item.name}</h4>
					<ul className="space-y-3">
						{item.children?.map((child) => (
							<li key={child.id}>
								<FooterMenuChildLink child={child} locale={locale} />
							</li>
						))}
					</ul>
				</div>
			))}
		</>
	);
}
