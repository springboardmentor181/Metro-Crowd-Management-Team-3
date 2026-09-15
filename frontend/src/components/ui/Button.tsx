"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",
    "whitespace-nowrap",
    "rounded-xl",
    "text-sm",
    "font-semibold",
    "transition-all",
    "duration-300",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-primary",
    "focus-visible:ring-offset-2",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25",

        secondary:
          "bg-secondary text-white hover:bg-cyan-600",

        outline:
          "border border-border bg-transparent hover:bg-muted",

        ghost:
          "hover:bg-muted",

        destructive:
          "bg-red-600 text-white hover:bg-red-700",

        success:
          "bg-emerald-600 text-white hover:bg-emerald-700",
      },

      size: {
        sm: "h-9 px-4",

        default: "h-11 px-6",

        lg: "h-12 px-8",

        xl: "h-14 px-10 text-base",

        icon: "h-11 w-11",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>((props, ref) => {
  const {
    className,
    variant,
    size,
    asChild = false,
    ...rest
  } = props;

  const Component = asChild ? Slot : "button";

  return (
    <Component
      ref={ref}
      className={cn(
        buttonVariants({
          variant,
          size,
        }),
        className
      )}
      {...rest}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };