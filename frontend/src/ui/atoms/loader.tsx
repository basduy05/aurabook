import { cn } from "@/lib/utils";

type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizePxMap: Record<LoaderSize, number> = {
	xs: 16,
	sm: 20,
	md: 32,
	lg: 48,
	xl: 64,
};

export function Loader({
	className,
	size = "md",
	text,
}: {
	className?: string;
	size?: LoaderSize | number;
	text?: string;
} = {}) {
	const px = typeof size === "number" ? size : sizePxMap[size] ?? 32;

	// Exact vertices of Saleor Trapezoid (Hinh thang)
	// Top: (12, 15) -> (36, 15)
	// Right: (36, 15) -> (30, 25)
	// Bottom: (30, 25) -> (6, 25)
	// Left: (6, 25) -> (12, 15)
	const vertices = [
		{ x: 12, y: 15 },
		{ x: 36, y: 15 },
		{ x: 30, y: 25 },
		{ x: 6, y: 25 },
	];
	const pathD = `M ${vertices.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
	const pathLength = 89;
	const beamLength = 20;

	return (
		<span
			className={cn(
				"inline-flex flex-col items-center justify-center text-center select-none text-foreground",
				className,
			)}
			aria-busy="true"
			role="status"
		>
			<svg
				width={px}
				height={px}
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="Loading"
				role="progressbar"
				className="shrink-0 overflow-visible"
			>
				<style>
					{`
						@keyframes aurabook-trapezoid-beam {
							0% { stroke-dashoffset: ${pathLength}; }
							100% { stroke-dashoffset: 0; }
						}
					`}
				</style>

				{/* Faint static background track */}
				<path
					d={pathD}
					stroke="currentColor"
					strokeWidth={1}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
					opacity={0.18}
				/>

				{/* Glowing moving beam around trapezoid */}
				<path
					d={pathD}
					stroke="currentColor"
					strokeWidth={1.8}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
					style={{
						strokeDasharray: `${beamLength} ${pathLength - beamLength}`,
						animation: "aurabook-trapezoid-beam 1s linear infinite",
					}}
				/>
			</svg>
			{text ? (
				<span className="mt-3 text-xs font-medium opacity-85 text-foreground animate-pulse">
					{text}
				</span>
			) : (
				<span className="sr-only">Loading...</span>
			)}
		</span>
	);
}

