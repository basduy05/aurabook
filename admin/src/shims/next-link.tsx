import React from "react";

export default function Link({
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
