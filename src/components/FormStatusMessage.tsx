"use client";
import { WarningCircleIcon } from "@phosphor-icons/react";

type FormStatusMessageProps = {
  readonly message: string;
};

export function FormStatusMessage({ message }: FormStatusMessageProps) {
  return (
    <div className="bg-[#e53e3e]/8 flex items-center gap-2 rounded-xl border border-[#e53e3e]/20 px-4 py-3 text-sm text-[#e53e3e]">
      <WarningCircleIcon size={14} />
      <span>{message}</span>
    </div>
  );
}
