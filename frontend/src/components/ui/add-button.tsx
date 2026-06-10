import * as React from "react";
import { Button } from "@/components/ui/button";
import { Add01Icon, Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function AddButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("gap-1.5", className)} {...props}>
      <Icon icon={Add01Icon} className="size-4" strokeWidth={2.5} />
      {children}
    </Button>
  );
}

export { AddButton };
