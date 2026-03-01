"use client";

interface RetryButtonProps {
  label?: string;
  className?: string;
}

export function RetryButton({
  label = "Tekrar dene",
  className = "",
}: RetryButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={className}
    >
      {label}
    </button>
  );
}
