import { Modal } from "@/components/ui/modal";

type ConfirmationModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "default" | "destructive";
};

function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  variant = "destructive",
}: ConfirmationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      onConfirm={onConfirm}
      confirmLabel={loading ? "Chargement…" : confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant={variant}
      confirmLoading={loading}
      confirmDisabled={loading}
    />
  );
}

export { ConfirmationModal };
