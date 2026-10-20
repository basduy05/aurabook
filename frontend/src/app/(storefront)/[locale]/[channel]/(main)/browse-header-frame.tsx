import { Suspense } from "react";
import { Logo } from "@/ui/components/logo";
import { Logo as SharedLogo } from "@/ui/components/shared/logo";
import { UserMenuSkeleton } from "@/ui/components/nav/components/user-menu/user-menu-container";
import {
	HeaderActionsSlot,
	HeaderMobileMenuSlot,
	HeaderNavSlot,
	HeaderSearchSlot,
	type BrowseRouteParams,
} from "./browse-chrome-slots";

function HeaderActionsSkeleton() {
	return (
		<>
			<UserMenuSkeleton />
			<div className="h-10 w-10" aria-hidden="true" />
		</>
	);
}

function HeaderLogoFallback() {
	return (
		<div className="flex shrink-0 items-center" aria-hidden="true">
			<SharedLogo className="h-7 w-auto" />
		</div>
	);
}

export function BrowseHeaderFrame({ params }: { params: BrowseRouteParams }) {
	return (
		<header
			id="storefront-header"
			className="relative sticky top-0 z-40 border-b border-border bg-background"
		>
			<div className="container-nav px-3 sm:px-6">
				<div className="flex h-16 items-center justify-between gap-3 lg:gap-4">
					<Suspense fallback={<HeaderLogoFallback />}>
						<Logo />
					</Suspense>

					<Suspense
						fallback={
							<nav className="hidden flex-1 justify-center lg:flex lg:mx-3 xl:mx-6 min-w-0" aria-hidden="true">
								<div className="h-4 w-48 animate-pulse rounded bg-secondary" />
							</nav>
						}
					>
						<HeaderNavSlot params={params} />
					</Suspense>

					<Suspense
						fallback={
							<div
								className="hidden md:flex md:w-56 lg:w-60 xl:w-72 md:justify-end shrink-0"
								aria-hidden="true"
							>
								<div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
							</div>
						}
					>
						<HeaderSearchSlot params={params} />
					</Suspense>

					<div className="flex items-center gap-1">
						<Suspense fallback={<HeaderActionsSkeleton />}>
							<HeaderActionsSlot params={params} />
						</Suspense>
						<Suspense fallback={null}>
							<HeaderMobileMenuSlot params={params} />
						</Suspense>
					</div>
				</div>
			</div>
		</header>
	);
}
