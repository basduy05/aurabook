"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { type NavMenuItem, hasNavMenuChildren, isExternalNavHref } from "@/lib/menus/serialize-menu-for-nav";
import { formatContentLabel } from "@/lib/content/format-label";
import type { NavChromeContent } from "@/lib/content/types";
import { buildStorefrontPath } from "@/lib/storefront-path";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/ui/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { LinkWithChannel } from "@/ui/atoms/link-with-channel";
import useSelectedPathname from "@/hooks/use-selected-pathname";
import { MegaMenuCloseContext, MegaMenuColumnHeader, MegaMenuLeafLink } from "./mega-menu-link";

const STOREFRONT_HEADER_NAV_SELECTOR = "#storefront-header nav";

/** Equal-width columns in a single row; right panel reserved for future featured content. */
const MEGA_MENU_NAV_COLUMN_CLASS = "min-w-0 flex-1";

function MegaMenuColumn({ item }: { item: NavMenuItem }) {
	const children = item.children ?? [];

	if (children.length === 0) {
		if (!item.href) {
			return null;
		}

		return (
			<div className={MEGA_MENU_NAV_COLUMN_CLASS}>
				<MegaMenuColumnHeader item={item} />
			</div>
		);
	}

	return (
		<div className={MEGA_MENU_NAV_COLUMN_CLASS}>
			<MegaMenuColumnHeader item={item} />
			<ul className="mt-2 space-y-2">
				{children.map((child) => (
					<MegaMenuLeafLink key={child.id} item={child} />
				))}
			</ul>
		</div>
	);
}

// Ánh xạ nhãn hiển thị tinh gọn cho thanh header điều hướng chính (tránh tràn viền, vỡ dòng)
export const SHORT_NAV_LABELS: Record<string, string> = {
	"sách kỹ năng - phát triển bản thân": "Sách Kỹ Năng",
	"tư duy - trí tuệ & triết lý sống": "Tư Duy & Triết Lý",
	"lịch sử - khoa học & xã hội": "Lịch Sử & Khoa Học",
	"kinh doanh - khởi nghiệp & đầu tư": "Kinh Doanh & Đầu Tư",
	"văn học & tiểu thuyết tuyển chọn": "Văn Học Tuyển Chọn",
};

export const DEFAULT_SUBCATEGORIES: Record<string, Array<{ id: string; label: string; href: string }>> = {
	"sách kỹ năng - phát triển bản thân": [
		{
			id: "sub-giao-tiep",
			label: "Nghệ Thuật Giao Tiếp & Ứng Xử",
			href: "/categories/nghe-thuat-giao-tiep-ung-xu",
		},
		{
			id: "sub-quan-tri-tam-tri",
			label: "Quản Trị Tâm Trí & Thói Quen",
			href: "/categories/quan-tri-tam-tri-thoi-quen",
		},
	],
	"tư duy - trí tuệ & triết lý sống": [
		{
			id: "sub-minh-triet",
			label: "Minh Triết Sống & Khai Phóng",
			href: "/categories/minh-triet-song-khai-phong",
		},
		{
			id: "sub-tri-tue-do-thai",
			label: "Trí Tuệ Do Thái & Danh Nhân",
			href: "/categories/tri-tue-do-thai-danh-nhan",
		},
	],
	"lịch sử - khoa học & xã hội": [
		{
			id: "sub-luoc-su",
			label: "Lược Sử Nhân Loại & Nền Văn Minh",
			href: "/categories/luoc-su-nhan-loai-van-minh",
		},
		{
			id: "sub-khoa-hoc",
			label: "Khoa Học, Vũ Trụ & Tương Lai",
			href: "/categories/khoa-hoc-vu-tru-tuong-lai",
		},
	],
	"kinh doanh - khởi nghiệp & đầu tư": [
		{
			id: "sub-quan-tri-doanh-nghiep",
			label: "Quản Trị Doanh Nghiệp & Lãnh Đạo",
			href: "/categories/quan-tri-doanh-nghiep-lanh-dao",
		},
		{
			id: "sub-tai-chinh",
			label: "Tài Chính Cá Nhân & Đầu Tư",
			href: "/categories/tai-chinh-ca-nhan-dau-tu",
		},
	],
	"văn học & tiểu thuyết tuyển chọn": [
		{
			id: "sub-van-hoc-kinh-dien",
			label: "Văn Học Kinh Điển Thế Giới",
			href: "/categories/van-hoc-kinh-dien-the-gioi",
		},
		{
			id: "sub-truyen-ngan",
			label: "Truyện Ngắn & Tản Văn Cảm Xúc",
			href: "/categories/truyen-ngan-tan-van-cam-xuc",
		},
	],
};

export function formatHeaderNavLabel(label: string): string {
	const lower = label.toLowerCase().trim();
	if (SHORT_NAV_LABELS[lower]) {
		return SHORT_NAV_LABELS[lower];
	}
	if (label.includes(" - ") && label.length > 20) {
		const parts = label.split(" - ");
		if (parts[0] && parts[0].trim().length >= 4) {
			return parts[0].trim();
		}
	}
	return label;
}

const megaMenuTriggerClassName =
	"inline-flex items-center justify-start h-auto rounded-none border-b-2 border-transparent bg-transparent px-0 py-1 text-xs xl:text-sm font-medium text-muted-foreground whitespace-nowrap no-underline hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:border-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground transition-colors";

const megaMenuDropdownTriggerClassName = cn(
	megaMenuTriggerClassName,
	"[&>svg]:ml-1 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:self-center [&>svg]:relative [&>svg]:top-0 [&>svg]:text-muted-foreground [&>svg]:transition-transform [&>svg]:duration-200 group-data-[state=open]:[&>svg]:rotate-180 group-data-[state=open]:[&>svg]:text-foreground",
);

function MegaMenuTriggerLabel({ item, onClose }: { item: NavMenuItem; onClose: () => void }) {
	const router = useRouter();
	const params = useParams<{ locale?: string; channel?: string }>();

	const navigate = () => {
		if (!item.href) {
			return;
		}

		onClose();

		if (isExternalNavHref(item.href)) {
			window.location.assign(item.href);
			return;
		}

		if (!params.locale || !params.channel) {
			window.location.assign(item.href);
			return;
		}

		router.push(buildStorefrontPath(params.locale, params.channel, item.href));
	};

	const getPointerType = (event: ReactPointerEvent | MouseEvent) => {
		if ("pointerType" in event) {
			return event.pointerType;
		}

		const nativeEvent = event.nativeEvent;
		return "pointerType" in nativeEvent ? (nativeEvent as PointerEvent).pointerType : "mouse";
	};

	const isMousePointer = (event: ReactPointerEvent | MouseEvent) => getPointerType(event) === "mouse";

	return (
		<span
			role="link"
			tabIndex={0}
			className="cursor-pointer hover:text-foreground whitespace-nowrap"
			onPointerDown={(event) => {
				// On touch, let the trigger open the mega menu instead of navigating.
				if (isMousePointer(event)) {
					event.stopPropagation();
				}
			}}
			onClick={(event) => {
				if (!isMousePointer(event)) {
					return;
				}
				event.stopPropagation();
				event.preventDefault();
				navigate();
			}}
			onKeyDown={(event) => {
				if (event.key !== "Enter" && event.key !== " ") {
					return;
				}
				event.stopPropagation();
				event.preventDefault();
				navigate();
			}}
		>
			{formatHeaderNavLabel(item.label)}
		</span>
	);
}

function MegaMenuPanel({
	item,
	nav,
	onClose,
}: {
	item: NavMenuItem;
	nav: NavChromeContent;
	onClose: () => void;
}) {
	const children = item.children ?? [];

	return (
		<div className="w-full">
			<div className="container-nav py-6">
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
					{children.map((child) => (
						<MegaMenuColumn key={child.id} item={child} />
					))}
				</div>
				{item.href ? (
					<div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
						<LinkWithChannel
							href={item.href}
							className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 transition-colors"
							onClick={onClose}
						>
							<span>{formatContentLabel(nav.viewAllLabel, { label: item.label })}</span>
							<span>→</span>
						</LinkWithChannel>
					</div>
				) : null}
			</div>
		</div>
	);
}

function MegaMenuTopItem({
	item,
	nav,
	onClose,
}: {
	item: NavMenuItem;
	nav: NavChromeContent;
	onClose: () => void;
}) {
	const pathname = useSelectedPathname();
	const displayLabel = formatHeaderNavLabel(item.label);

	if (hasNavMenuChildren(item)) {
		const isActive = Boolean(item.href && !isExternalNavHref(item.href) && pathname === item.href);

		return (
			<NavigationMenuItem value={item.id}>
				<NavigationMenuTrigger
					className={cn(megaMenuDropdownTriggerClassName, isActive && "border-foreground text-foreground")}
				>
					{item.href ? <MegaMenuTriggerLabel item={item} onClose={onClose} /> : displayLabel}
				</NavigationMenuTrigger>
				<NavigationMenuContent>
					<MegaMenuPanel item={item} nav={nav} onClose={onClose} />
				</NavigationMenuContent>
			</NavigationMenuItem>
		);
	}

	if (!item.href) {
		return null;
	}

	const isActive = !isExternalNavHref(item.href) && pathname === item.href;
	const linkClassName = cn(megaMenuTriggerClassName, isActive && "border-foreground text-foreground");

	if (isExternalNavHref(item.href)) {
		return (
			<NavigationMenuItem value={item.id}>
				<NavigationMenuLink asChild>
					<a href={item.href} className={linkClassName} rel="noopener noreferrer" onClick={onClose}>
						{displayLabel}
					</a>
				</NavigationMenuLink>
			</NavigationMenuItem>
		);
	}

	return (
		<NavigationMenuItem value={item.id}>
			<NavigationMenuLink asChild>
				<LinkWithChannel href={item.href} className={linkClassName} onClick={onClose}>
					{displayLabel}
				</LinkWithChannel>
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
}

export function MegaMenuDesktop({ items, nav }: { items: NavMenuItem[]; nav: NavChromeContent }) {
	const pathname = useSelectedPathname();

	// Remount on route change so open menu state resets without an effect.
	return <MegaMenuDesktopMenu key={pathname} items={items} nav={nav} pathname={pathname} />;
}

function MegaMenuDesktopMenu({
	items,
	nav,
	pathname,
}: {
	items: NavMenuItem[];
	nav: NavChromeContent;
	pathname: string;
}) {
	const params = useParams<{ locale?: string; channel?: string }>();
	const [openItem, setOpenItem] = useState("");
	const closeMenu = useCallback(() => setOpenItem(""), []);

	useEffect(() => {
		if (!openItem) {
			return;
		}

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}

			if (target.closest("[data-slot=mega-menu-panel]")) {
				return;
			}

			if (target.closest(`${STOREFRONT_HEADER_NAV_SELECTOR} button`)) {
				return;
			}

			closeMenu();
		};

		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [openItem, closeMenu]);

	const allProductsClassName = cn(
		megaMenuTriggerClassName,
		pathname === "/products" && "border-foreground text-foreground",
	);

	const visibleItems = useMemo(() => {
		const EXCLUDED_HEADER_ITEMS = new Set([
			"apparel",
			"accessories",
			"groceries",
			"quần áo",
			"phụ kiện",
			"cửa hàng tạp hóa",
			"cửa hàng tạp hoá",
			"tạp hóa",
			"tạp hoá",
		]);

		return items
			.filter((item) => {
				const labelLower = item.label?.toLowerCase().trim();
				if (EXCLUDED_HEADER_ITEMS.has(labelLower)) return false;
				if (item.href) {
					const hrefLower = item.href.toLowerCase();
					if (
						hrefLower.includes("/apparel") ||
						hrefLower.includes("/accessories") ||
						hrefLower.includes("/groceries") ||
						hrefLower.includes("/quan-ao") ||
						hrefLower.includes("/phu-kien") ||
						hrefLower.includes("/tap-hoa")
					) {
						return false;
					}
				}
				return true;
			})
			.map((item) => {
				const labelLower = item.label?.toLowerCase().trim();
				const hasChildren = (item.children?.length ?? 0) > 0;
				if (!hasChildren && DEFAULT_SUBCATEGORIES[labelLower]) {
					return {
						...item,
						children: DEFAULT_SUBCATEGORIES[labelLower].map((sub) => ({
							id: sub.id,
							label: sub.label,
							href: sub.href,
						})),
					};
				}
				return item;
			});
	}, [items]);

	return (
		<MegaMenuCloseContext.Provider value={closeMenu}>
			<NavigationMenu
				className="max-w-none items-center justify-start"
				delayDuration={0}
				skipDelayDuration={0}
				value={openItem}
				onValueChange={setOpenItem}
			>
				<NavigationMenuList className="items-center gap-2 lg:gap-3 xl:gap-5 flex-nowrap">
					<NavigationMenuItem key="community-nav-item" value="community">
						<NavigationMenuLink asChild>
							<LinkWithChannel
								href="/community"
								className={cn(
									megaMenuTriggerClassName,
									pathname.startsWith("/community") && "border-foreground text-foreground",
									"relative inline-flex items-center gap-1.5",
								)}
								onClick={closeMenu}
							>
								<span>{params?.locale === "en" ? "Community" : "Cộng đồng"}</span>
								<span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
									{params?.locale === "en" ? "New" : "Mới"}
								</span>
							</LinkWithChannel>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem key="all-products-nav-item" value="all-products">
						<NavigationMenuLink asChild>
							<LinkWithChannel href="/products" className={allProductsClassName} onClick={closeMenu}>
								{/* Default (auto) prefetch — not `prefetch={true}`. This link is on every
								    browse page; a full prefetch would resolve `/products` searchParams
								    (and the listing) on every view. */}
								{nav.allProductsLabel}
							</LinkWithChannel>
						</NavigationMenuLink>
					</NavigationMenuItem>
					{visibleItems.map((item) => (
						<MegaMenuTopItem key={item.id} item={item} nav={nav} onClose={closeMenu} />
					))}
				</NavigationMenuList>
			</NavigationMenu>
		</MegaMenuCloseContext.Provider>
	);
}
