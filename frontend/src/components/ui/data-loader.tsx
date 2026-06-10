import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LOTTIE_LOADING } from "@/lib/lottie-assets";
import { LottieAnimation } from "@/components/ui/lottie-animation";

const dataLoaderVariants = cva("flex items-center justify-center", {
  variants: {
    size: {
      sm: "gap-2 py-4",
      md: "gap-3 py-6",
      lg: "gap-4 py-8",
    },
    layout: {
      row: "flex-row text-left",
      column: "flex-col text-center",
    },
    variant: {
      card: "rounded-2xl border border-border/50 bg-white px-6 shadow-sm",
      plain: "",
      inline: "py-2",
    },
  },
  defaultVariants: {
    size: "md",
    layout: "column",
    variant: "card",
  },
});

const lottieSizeMap = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

type DataLoaderProps = VariantProps<typeof dataLoaderVariants> & {
  message?: string;
  description?: string;
  className?: string;
};

function DataLoader({
  size = "md",
  layout = "column",
  variant = "card",
  message = "Chargement…",
  description,
  className,
}: DataLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(dataLoaderVariants({ size, layout, variant }), className)}
    >
      <LottieAnimation
        src={LOTTIE_LOADING}
        className={cn("shrink-0", lottieSizeMap[size ?? "md"])}
        ariaLabel={message}
      />
      <div className={cn(layout === "column" ? "text-center" : "min-w-0")}>
        <p
          className={cn(
            "font-semibold tracking-tight text-foreground",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {message}
        </p>
        {description && (
          <p
            className={cn(
              "font-medium text-muted-foreground",
              size === "sm" ? "text-[11px]" : "text-xs",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export { DataLoader };
