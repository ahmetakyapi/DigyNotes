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
  if (ongoing.includes(status)) return "var(--gold)";
  return "#6b7280";
}

function getStatusStyles(status: string) {
  const color = getStatusColor(status);
  const completed = ["İzlendi", "Okundu", "Tamamlandı", "Gidildi"];
  const ongoing = ["İzleniyor", "Okunuyor", "Devam Ediyor", "Oynanıyor"];

  if (completed.includes(status)) {
    return {
      textColor: "#e2ff7a",
      borderColor: "rgba(212, 245, 60, 0.32)",
      backgroundColor: "rgba(11, 11, 10, 0.72)",
      dotColor: "#d4f53c",
      boxShadow: "none",
    };
  }

  if (ongoing.includes(status)) {
    return {
      textColor: "#cfc6ff",
      borderColor: "rgba(177, 164, 255, 0.34)",
      backgroundColor: "rgba(11, 11, 10, 0.72)",
      dotColor: "#b1a4ff",
      boxShadow: "none",
    };
  }

  return {
    textColor: "#cbc6bb",
    borderColor: "rgba(242, 239, 232, 0.2)",
    backgroundColor: "rgba(11, 11, 10, 0.72)",
    dotColor: color,
    boxShadow: "none",
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
      className={`dn-mono inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-[0.1em] backdrop-blur-md ${textSize} ${padding}`}
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
