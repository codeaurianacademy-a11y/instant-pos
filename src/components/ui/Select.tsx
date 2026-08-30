import { cn } from "@/lib/cn";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
            error && "border-danger focus:ring-danger focus:border-danger",
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
