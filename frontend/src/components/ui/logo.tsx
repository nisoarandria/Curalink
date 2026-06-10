import { Link } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const logoImageVariants = cva(
  "shrink-0 rounded-xl object-cover shadow-sm transition-all",
  {
    variants: {
      size: {
        xs: "h-6 w-6 rounded-lg",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16 rounded-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const logoTextVariants = cva("font-bold tracking-tight text-foreground", {
  variants: {
    size: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type LogoProps = VariantProps<typeof logoImageVariants> & {
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  imageClassName?: string;
};

function Logo({
  size = "md",
  showText = true,
  subtitle,
  href,
  className,
  imageClassName,
}: LogoProps) {
  const content = (
    <>
      <img
        src="/logo.jpg"
        alt="Curalink"
        className={cn(logoImageVariants({ size }), imageClassName)}
      />
      {showText && (
        <div className="min-w-0">
          <p className={cn(logoTextVariants({ size }), "leading-none")}>
            Curalink
          </p>
          {subtitle && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </>
  );

  const wrapperClass = cn("flex items-center gap-2.5 group", className);

  if (href) {
    return (
      <Link to={href} className={cn(wrapperClass, "transition-opacity hover:opacity-80")}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

export { Logo };
