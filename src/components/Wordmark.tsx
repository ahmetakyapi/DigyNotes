/*
  LAYOUT: Inline typographic wordmark — "Digy" grotesk + "Notes" serif italic.
  No trailing dot (removed 2026-10-10 at the owner's request). Scales with `size`.
*/
type WordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[19px]",
  md: "text-[22px]",
  lg: "text-[30px]",
};

export function Wordmark({ className = "", size = "md" }: WordmarkProps) {
  return (
    <span
      className={`inline-flex select-none items-baseline leading-none text-[var(--text-primary)] ${SIZE[size]} ${className}`}
      aria-label="DigyNotes"
    >
      <span aria-hidden className="font-sans font-extrabold tracking-[-0.035em]">
        Digy
      </span>
      <span aria-hidden className="dn-display ml-[0.03em] text-[1.08em] italic tracking-[-0.015em]">
        Notes
      </span>
    </span>
  );
}
