import React from "react";

export default function Image({
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
