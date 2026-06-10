import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Cancel01Icon, Icon, Search01Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const searchBarVariants = cva(
  "w-full min-w-0 rounded-4xl border border-input bg-input/30 py-1 pl-9 pr-3 text-sm transition-colors outline-none placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 text-xs",
        md: "h-9 text-sm",
        lg: "h-11 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

type SearchBarProps = Omit<React.ComponentProps<"input">, "type" | "size"> &
  VariantProps<typeof searchBarVariants> & {
    containerClassName?: string;
    onValueChange?: (value: string) => void;
    onClear?: () => void;
  };

function SearchBar({
  className,
  containerClassName,
  size,
  value = "",
  onChange,
  onValueChange,
  onClear,
  placeholder = "Rechercher…",
  ...props
}: SearchBarProps) {
  const hasValue = String(value).length > 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const handleClear = () => {
    const emptyEvent = {
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange?.(emptyEvent);
    onValueChange?.("");
    onClear?.();
  };

  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className={cn("relative", containerClassName)}>
      {hasValue ? (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
            iconSize,
          )}
          aria-label="Effacer la recherche"
          tabIndex={-1}
        >
          <Icon icon={Cancel01Icon} className="size-full" />
        </button>
      ) : (
        <Icon
          icon={Search01Icon}
          className={cn(
            "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
            iconSize,
          )}
        />
      )}
      <input
        type="search"
        data-slot="search-bar"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(searchBarVariants({ size }), className)}
        {...props}
      />
    </div>
  );
}

export { SearchBar };
