import React from "react";

export function Image({
	src,
	alt,
	width,
	height,
	className,
	unoptimized,
	...props
}: {
	src: string;
	alt: string;
	width?: number | string;
	height?: number | string;
	className?: string;
	unoptimized?: boolean;
	[key: string]: any;
}) {
	return (
		<img
			src={src}
			alt={alt || ""}
			width={width}
			height={height}
			className={className}
			{...props}
		/>
	);
}

export function Link({
	href,
	children,
	className,
	target,
	rel,
	...props
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
	target?: string;
	rel?: string;
	[key: string]: any;
}) {
	return (
		<a
			href={href}
			className={className}
			target={target}
			rel={rel}
			{...props}
		>
			{children}
		</a>
	);
}

export function useRouter() {
	return {
		push: (url: string) => {
			window.history.pushState({}, "", url);
			window.dispatchEvent(new Event("popstate"));
		},
		replace: (url: string) => {
			window.history.replaceState({}, "", url);
			window.dispatchEvent(new Event("popstate"));
		},
		back: () => {
			window.history.back();
		},
		forward: () => {
			window.history.forward();
		},
		refresh: () => {
			window.location.reload();
		},
	};
}

export function useSearchParams() {
	const [search, setSearch] = React.useState(
		typeof window !== "undefined" ? window.location.search : ""
	);

	React.useEffect(() => {
		const handlePop = () => {
			setSearch(window.location.search);
		};
		window.addEventListener("popstate", handlePop);
		return () => {
			window.removeEventListener("popstate", handlePop);
		};
	}, []);

	return new URLSearchParams(search);
}

export function usePathname() {
	const [pathname, setPathname] = React.useState(
		typeof window !== "undefined" ? window.location.pathname : "/"
	);

	React.useEffect(() => {
		const handlePop = () => {
			setPathname(window.location.pathname);
		};
		window.addEventListener("popstate", handlePop);
		return () => {
			window.removeEventListener("popstate", handlePop);
		};
	}, []);

	return pathname;
}

export default {
	Image,
	Link,
	useRouter,
	useSearchParams,
	usePathname,
};
