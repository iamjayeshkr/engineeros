import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md bg-base-900 border border-border px-3 text-sm text-zinc-200",
        "placeholder:text-zinc-500 focus-visible:border-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
