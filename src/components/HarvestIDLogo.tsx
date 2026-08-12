import { cn } from "@/lib/utils";

/**
 * Reusable HarvestID brand logo. One official asset (public/logo/harvestid-mark.svg)
 * is used everywhere; the wordmark is typeset in the brand font so it scales
 * crisply and follows the active theme (text-foreground in light/dark modes).
 */
export function HarvestIDLogo({
  variant = "icon",
  size = 36,
  decorative = false,
  className,
  wordmarkClassName,
}: {
  /** "icon" renders only the mark; "full" adds the HarvestID wordmark. */
  variant?: "icon" | "full";
  /** Height of the mark in px; the wordmark scales proportionally. */
  size?: number;
  /** True when this instance is a decorative duplicate (hidden from screen readers). */
  decorative?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <img
        src="/logo/harvestid-mark.svg"
        alt={decorative ? "" : "HarvestID"}
        aria-hidden={decorative || undefined}
        width={size}
        height={size}
        draggable={false}
        className="shrink-0"
      />
      {variant === "full" ? (
        <span
          aria-hidden={decorative || undefined}
          className={cn(
            "whitespace-nowrap font-display font-semibold leading-none tracking-tight text-foreground",
            wordmarkClassName,
          )}
          style={{ fontSize: Math.max(12, Math.round(size * 0.52)) }}
        >
          HarvestID
        </span>
      ) : null}
    </span>
  );
}
