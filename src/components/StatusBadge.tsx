import React from "react";
import { normalizeCategory } from "@/lib/categories";

export function getStatusOptions(category: string): string[] {
  const normalized = normalizeCategory(category);
  if (normalized === "movies") return ["İzlendi", "İzleniyor", "İzlenecek"];
  if (normalized === "series") return ["İzlendi", "İzleniyor", "İzlenecek"];
  if (normalized === "book") return ["Okundu", "Okunuyor", "Okunacak"];
  if (normalized === "game") return ["Tamamlandı", "Oynanıyor", "Oynanacak"];
  if (normalized === "travel") return ["Gidildi", "Planlandı"];
  return ["Tamamlandı", "Devam Ediyor", "Planlandı"];
}

function getStatusColor(status: string): string {
  const completed = ["İzlendi", "Okundu", "Tamamlandı", "Gidildi"];
  const ongoing = ["İzleniyor", "Okunuyor", "Devam Ediyor", "Oynanıyor"];
  if (completed.includes(status)) return "#22c55e";
  if (ongoing.includes(status)) return "#c4a24b";
  return "#6b7280";
}

function getStatusStyles(status: string) {
  const color = getStatusColor(status);
  const completed = ["İzlendi", "Okundu", "Tamamlandı", "Gidildi"];
  const ongoing = ["İzleniyor", "Okunuyor", "Devam Ediyor", "Oynanıyor"];

  if (completed.includes(status)) {
    return {
      textColor: "#9bf2bc",
      borderColor: "rgba(34, 197, 94, 0.4)",
      backgroundColor: "rgba(10, 46, 25, 0.78)",
      dotColor: color,
      boxShadow: "0 10px 24px rgba(10, 46, 25, 0.28)",
    };
  }

  if (ongoing.includes(status)) {
    return {
      textColor: "#f5dd96",
      borderColor: "rgba(196, 162, 75, 0.42)",
      backgroundColor: "rgba(57, 42, 9, 0.74)",
      dotColor: color,
      boxShadow: "0 10px 24px rgba(57, 42, 9, 0.22)",
    };
  }

  return {
    textColor: "#d5d8e1",
    borderColor: "rgba(148, 163, 184, 0.34)",
    backgroundColor: "rgba(24, 30, 44, 0.76)",
    dotColor: color,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
  };
}

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const styles = getStatusStyles(status);
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.1em] backdrop-blur-md ${textSize} ${padding}`}
      style={{
        color: styles.textColor,
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
      }}
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: styles.dotColor }}
      />
      {status}
    </span>
  );
}
