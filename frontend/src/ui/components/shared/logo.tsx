/**
 * Shared Logo Component
 *
 * - /public/logo.png — default (light backgrounds)
 * - /public/logo-dark.png — inverted surfaces (e.g. footer on bg-foreground)
 *
 * @example
 * <Logo className="h-7 w-auto" />
 * <Logo className="h-7 w-auto" inverted />
 */

interface LogoProps {
	className?: string;
	/** Accessible label for the logo */
	ariaLabel?: string;
	/** Light logo for dark/inverted backgrounds (footer) */
	inverted?: boolean;
}

export const Logo = ({ className, ariaLabel = "Aurabook", inverted = false }: LogoProps) => {
	const src = inverted ? "/logo-dark.png" : "/logo.png";

	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={src}
			alt={ariaLabel}
			width={3412}
			height={741}
			className={`aspect-[3412/741] object-contain ${className ?? ""}`}
		/>
	);
};
