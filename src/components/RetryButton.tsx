"use client";

interface RetryButtonProps {
  label?: string;
  className?: string;
}

export function RetryButton({
  label = "Tekrar Dene",
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
