import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { cn } from "@/lib/utils";
import { fetchLottieAsset } from "@/lib/lottie-assets";

type LottieAnimationProps = {
  src: string;
  className?: string;
  loop?: boolean;
  ariaLabel?: string;
};

function LottieFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      aria-hidden
    >
      <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  );
}

function LottieAnimation({
  src,
  className,
  loop = true,
  ariaLabel = "Animation",
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const destroyAnimation = () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };

    setStatus("loading");
    destroyAnimation();

    fetchLottieAsset(src)
      .then((animationData) => {
        if (cancelled || !containerRef.current) return;

        destroyAnimation();

        animationRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay: true,
          animationData,
        });

        const handleReady = () => {
          if (!cancelled) setStatus("ready");
        };

        const handleFailed = () => {
          if (!cancelled) setStatus("error");
        };

        animationRef.current.addEventListener("DOMLoaded", handleReady);
        animationRef.current.addEventListener("data_failed", handleFailed);

        if (animationRef.current.isLoaded) {
          handleReady();
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      destroyAnimation();
    };
  }, [src, loop]);

  if (status === "error") {
    return <LottieFallback className={className} />;
  }

  return (
    <div
      className={cn("relative", className)}
      role="img"
      aria-label={ariaLabel}
      aria-busy={status === "loading"}
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full",
          status === "loading" && "opacity-0",
        )}
      />
    </div>
  );
}

export { LottieAnimation };
