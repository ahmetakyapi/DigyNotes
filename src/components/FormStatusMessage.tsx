"use client";
import { WarningCircleIcon } from "@phosphor-icons/react";

type FormStatusMessageProps = {
  readonly message: string;
};

export function FormStatusMessage({ message }: FormStatusMessageProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
    >
      <WarningCircleIcon size={14} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
