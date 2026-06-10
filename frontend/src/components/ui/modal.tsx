import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modalPanelVariants = cva(
  "flex w-full flex-col rounded-2xl border border-border/60 bg-white shadow-xl",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-h-[92vh] max-w-6xl",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  },
);

type ModalProps = VariantProps<typeof modalPanelVariants> & {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  error?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  confirmVariant?: "default" | "destructive";
  hideFooter?: boolean;
  hideConfirm?: boolean;
  contentClassName?: string;
  className?: string;
};

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  error,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmLoading = false,
  confirmVariant = "default",
  hideFooter = false,
  hideConfirm = false,
  size = "lg",
  contentClassName,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const showDefaultFooter =
    !hideFooter && !footer && (onConfirm || cancelLabel || !hideConfirm);

  const resolvedCancelLabel =
    cancelLabel ?? (onConfirm && !hideConfirm ? "Annuler" : "Fermer");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn(modalPanelVariants({ size }), className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border/60 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h3
              id="modal-title"
              className="text-lg font-extrabold tracking-tight"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>

        {children && (
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-5 py-4",
              contentClassName,
            )}
          >
            {children}
          </div>
        )}

        {footer}

        {showDefaultFooter && (
          <div className="shrink-0 space-y-3 border-t border-border/60 px-5 py-4">
            {error}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={confirmLoading}>
                {resolvedCancelLabel}
              </Button>
              {onConfirm && !hideConfirm && (
                <Button
                  variant={confirmVariant}
                  onClick={onConfirm}
                  disabled={confirmDisabled || confirmLoading}
                >
                  {confirmLoading ? "Chargement…" : confirmLabel ?? "Valider"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export { Modal };
