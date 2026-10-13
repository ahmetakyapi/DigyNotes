/**
 * Spelled-out relative times ("Az önce", "3 saat önce"), never abbreviated (CLAUDE.md).
 * Render on the client only (or pass `now`), since the result depends on the clock.
 */
export function formatRelativeTime(value: string | number | Date, now: number = Date.now()) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";

  const minutes = Math.floor(Math.max(0, now - time) / 60_000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
}

/** Full date and time for a `title` tooltip ("13 Ekim 2026 14:05"). */
export function formatFullDateTime(value: string | number | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}
