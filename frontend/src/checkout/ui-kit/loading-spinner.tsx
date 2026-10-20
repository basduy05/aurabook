import { Loader } from "@/ui/atoms/loader";

interface LoadingSpinnerProps {
	/** Size of the spinner. Defaults to "sm" */
	size?: "sm" | "md" | "lg";
	/** Additional class names */
	className?: string;
}

/**
 * System loading spinner for checkout flow.
 * Powered by AuraBook's official Loader atom.
 */
export const LoadingSpinner = ({ size = "sm", className }: LoadingSpinnerProps) => (
	<Loader size={size} className={className} />
);
