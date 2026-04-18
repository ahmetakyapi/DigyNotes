"use client";

import React from "react";

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      containerClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = `
      w-full px-3 py-2 rounded-lg border border-[var(--border)]
      bg-[var(--bg-raised)] text-[var(--text-primary)] placeholder-[var(--text-muted)]
      focus:outline-none focus:border-[var(--gold)]/60 focus:ring-1 focus:ring-[var(--gold)]/15
      disabled:bg-[var(--bg-card)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed
      transition-all duration-150
      ${error ? "border-[var(--danger)]/50 focus:border-[var(--danger)]/70 focus:ring-[var(--danger)]/10" : ""}
      ${leftAddon ? "pl-10" : ""}
      ${rightAddon ? "pr-10" : ""}
      ${className}
    `.trim();

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            className={inputClasses}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />

          {rightAddon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {rightAddon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${id}-error`}
            className="mt-1 text-xs text-[var(--danger)] font-medium"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={`${id}-hint`}
            className="mt-1 text-xs text-[var(--text-muted)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
