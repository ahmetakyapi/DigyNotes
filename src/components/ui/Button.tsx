"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children">;

interface ButtonProps extends MotionButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[#0a0f1e] font-semibold shadow-sm hover:shadow-md disabled:opacity-50",
  secondary:
    "border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--gold)]/60 text-[var(--text-primary)] disabled:opacity-50",
  ghost:
    "text-[var(--text-primary)] hover:bg-[var(--bg-card)] disabled:opacity-50",
  danger:
    "bg-[var(--danger)] hover:bg-[var(--danger-light)] text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-md gap-1.5",
  md: "px-4 py-2 text-sm font-medium rounded-lg gap-2",
  lg: "px-6 py-3 text-base font-medium rounded-lg gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] disabled:cursor-not-allowed";

    const focusRing =
      variant === "primary" || variant === "secondary"
        ? "focus:ring-[var(--gold)]/40"
        : variant === "danger"
          ? "focus:ring-[var(--danger)]/40"
          : "focus:ring-[var(--text-primary)]/30";

    const classes = [
      baseClasses,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      focusRing,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <motion.button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: variant === "danger" ? 0.94 : 0.96 } : undefined}
        whileHover={!isDisabled ? { scale: 1.01 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
