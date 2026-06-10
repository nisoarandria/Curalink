import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Delete01Icon,
  Icon,
  InformationCircleIcon,
  PencilEdit01Icon,
} from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ActionType = "edit" | "delete" | "info";

const ACTION_CONFIG: Record<
  ActionType,
  { label: string; variant: "outline" | "destructive" | "ghost"; className?: string }
> = {
  edit: { label: "Modifier", variant: "outline" },
  delete: {
    label: "Supprimer",
    variant: "destructive",
    className: "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/40",
  },
  info: { label: "Informations", variant: "outline" },
};

const ACTION_ICONS = {
  edit: PencilEdit01Icon,
  delete: Delete01Icon,
  info: InformationCircleIcon,
} as const;

type ActionButtonProps = React.ComponentProps<typeof Button> & {
  action: ActionType;
  loading?: boolean;
};

function ActionButton({
  action,
  loading = false,
  className,
  disabled,
  variant,
  size = "icon-sm",
  ...props
}: ActionButtonProps) {
  const config = ACTION_CONFIG[action];

  return (
    <Button
      type="button"
      variant={variant ?? config.variant}
      size={size}
      aria-label={config.label}
      title={config.label}
      disabled={disabled || loading}
      className={cn("rounded-full", config.className, className)}
      {...props}
    >
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon icon={ACTION_ICONS[action]} className="size-4" />
      )}
    </Button>
  );
}

export { ActionButton };
