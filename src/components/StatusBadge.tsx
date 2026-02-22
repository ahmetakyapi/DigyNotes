import React from "react";

export function getStatusOptions(category: string): string[] {
  const lower = category.toLowerCase();
  if (lower === "film") return ["İzlendi", "İzleniyor", "İzlenecek"];
  if (lower === "dizi") return ["İzlendi", "İzleniyor", "İzlenecek"];
  if (lower === "kitap") return ["Okundu", "Okunuyor", "Okunacak"];
  return ["Tamamlandı", "Devam Ediyor", "Planlandı"];
}

function getStatusColor(status: string): string {
  const completed = ["İzlendi", "Okundu", "Tamamlandı"];
  const ongoing = ["İzleniyor", "Okunuyor", "Devam Ediyor"];
  if (completed.includes(status)) return "#22c55e";
  if (ongoing.includes(status)) return "#c9a84c";
  return "#6b7280";
}

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.1em] ${textSize} ${padding}`}
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
