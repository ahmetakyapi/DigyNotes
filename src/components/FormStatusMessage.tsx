"use client";

type FormStatusMessageProps = {
  message: string;
};

export function FormStatusMessage({ message }: FormStatusMessageProps) {
  return (
    <div className="bg-[#e53e3e]/8 flex items-center gap-2 rounded-xl border border-[#e53e3e]/20 px-4 py-3 text-sm text-[#e53e3e]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
