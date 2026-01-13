import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-border/30 placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:shadow-sm aria-invalid:border-destructive/40 dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-lg border bg-white px-3 py-2 text-base transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };