"use client";

import * as React from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      fullWidth = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === "password";

    const inputType =
      isPassword && showPassword ? "text" : type;

    return (
      <div
        className={cn(
          "space-y-2",
          fullWidth && "w-full"
        )}
      >
        {label && (
          <label className="text-sm font-semibold text-foreground">
            {label}
          </label>
        )}

        <div
          className={cn(
            "group relative flex items-center overflow-hidden rounded-xl border bg-card transition-all duration-300",
            error
              ? "border-red-500 focus-within:ring-red-500/30"
              : "border-border focus-within:border-primary",
            "focus-within:ring-4 focus-within:ring-primary/10",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {startIcon && (
            <div className="pl-4 text-muted">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              "h-12 w-full bg-transparent px-4 text-sm outline-none placeholder:text-muted",
              startIcon && "pl-3",
              (endIcon || isPassword) && "pr-12",
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              className="absolute right-3 rounded-md p-1 transition hover:bg-muted"
            >
              {showPassword ? (
                <EyeOff
                  size={18}
                  className="text-muted"
                />
              ) : (
                <Eye
                  size={18}
                  className="text-muted"
                />
              )}
            </button>
          )}

          {!isPassword && endIcon && (
            <div className="absolute right-4">
              {endIcon}
            </div>
          )}
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : (
          helperText && (
            <p className="text-sm text-muted">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
