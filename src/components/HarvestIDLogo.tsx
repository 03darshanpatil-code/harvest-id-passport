import { cn } from "@/lib/utils";

/**
 * Reusable HarvestID brand logo. Renders the single official asset
 * (public/logo/harvestID logo.jpeg) everywhere — one source of truth,
 * no duplicate or derived logos. The official mark is square, so the
 * width/height sizing preserves its exact proportions.
 */
export function HarvestIDLogo({
  variant = "icon",
  size = 36,
  decorative = false,
  className,
  imgClassName,
}: {
  /** "icon" renders the compact mark; "full" is the same official logo sized up for header/sidebar use. */
  variant?: "icon" | "full";
  /** Size of the logo in px (the official asset is square, so aspect ratio is preserved). */
  size?: number;
  /** True when this instance is a decorative duplicate (hidden from screen readers). */
  decorative?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src="/logo/harvestID logo.jpeg"
        alt={decorative ? "" : "HarvestID logo"}
        aria-hidden={decorative || undefined}
        width={size}
        height={size}
        draggable={false}
        className={cn("shrink-0 object-contain", imgClassName)}
      />
    </span>
  );
}
