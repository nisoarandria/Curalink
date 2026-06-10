import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LOTTIE_LOADING } from "@/lib/lottie-assets";
import { LottieAnimation } from "@/components/ui/lottie-animation";

type PageLoaderProps = {
  show?: boolean;
  message?: string;
  description?: string;
  className?: string;
};

function PageLoader({
  show = true,
  message = "Chargement en cours",
  description = "Veuillez patienter un instant…",
  className,
}: PageLoaderProps) {
  if (!show) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center bg-slate-50/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-4 flex w-full max-w-sm flex-col items-center rounded-3xl border border-border/50 bg-white/90 px-8 py-10 text-center shadow-xl shadow-primary/10">
        <LottieAnimation
          src={LOTTIE_LOADING}
          className="h-40 w-40"
          ariaLabel="Chargement de la page"
        />
        <p className="mt-2 text-base font-bold tracking-tight text-foreground">
          {message}
        </p>
        {description && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

export { PageLoader };
