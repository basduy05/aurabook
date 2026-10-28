import React from "react";

export function useRouter() {
	return {
		push: (url: string, _options?: any) => {
			window.history.pushState({}, "", url);
			window.dispatchEvent(new Event("popstate"));
		},
		replace: (url: string, _options?: any) => {
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
		prefetch: (_url: string) => {},
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
	useRouter,
	useSearchParams,
	usePathname,
};
