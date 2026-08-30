import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
            error && "border-danger focus:ring-danger focus:border-danger",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
