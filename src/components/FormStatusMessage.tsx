"use client";
import { WarningCircleIcon } from "@phosphor-icons/react";

type FormStatusMessageProps = {
  readonly message: string;
};

export function FormStatusMessage({ message }: FormStatusMessageProps) {
  return (
    <div className="bg-danger/8 flex items-center gap-2 rounded-xl border border-danger/20 px-4 py-3 text-sm text-danger">
      <WarningCircleIcon size={14} />
      <span>{message}</span>
    </div>
  );
}
