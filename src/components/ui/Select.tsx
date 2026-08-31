"use client";

import { cn } from "@/lib/cn";
import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  className,
  disabled,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "relative flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 text-sm text-left text-foreground shadow-xs transition-all",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50",
            error && "border-danger focus:ring-danger focus:border-danger",
            isOpen && "border-accent ring-2 ring-accent/20",
            className
          )}
        >
          <span className="truncate">{selectedOption?.label || "Select..."}</span>
          <span className="pointer-events-none flex items-center justify-center">
            <svg 
              className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1">
            <ul className="flex flex-col">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center py-2 pl-3 pr-9 text-sm font-medium transition-colors hover:bg-slate-50",
                      option.value === value ? "bg-accent/10 text-accent hover:bg-accent/15" : "text-slate-700"
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-accent">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {error && <p className="text-sm text-danger font-medium">{error}</p>}
    </div>
  );
}
