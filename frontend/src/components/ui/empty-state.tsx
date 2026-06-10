import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LOTTIE_NODATA } from "@/lib/lottie-assets";
import { LottieAnimation } from "@/components/ui/lottie-animation";

const emptyStateVariants = cva("flex flex-col items-center text-center", {
  variants: {
    size: {
      sm: "gap-2 p-4",
      md: "gap-3 p-8",
      lg: "gap-4 p-12",
    },
    variant: {
      card: "rounded-2xl border-2 border-dashed border-border/60 bg-white/70",
      plain: "",
      table: "py-4",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "card",
  },
});

const lottieSizeMap = {
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-40 w-40",
} as const;

type EmptyStateProps = VariantProps<typeof emptyStateVariants> & {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({
  title,
  description,
  action,
  size = "md",
  variant = "card",
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(emptyStateVariants({ size, variant }), className)}
    >
      <LottieAnimation
        src={LOTTIE_NODATA}
        className={lottieSizeMap[size ?? "md"]}
        ariaLabel={title}
      />
      <div className="space-y-1">
        <h3
          className={cn(
            "font-bold tracking-tight text-foreground",
            size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base",
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "font-medium text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
