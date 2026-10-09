/*
  LAYOUT: Inline typographic wordmark — "Digy" grotesk + "notes" serif italic,
  with a lime signal dot. Scales with font-size of the parent (size prop).
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
      <span aria-hidden className="font-sans font-extrabold tracking-[-0.055em]">
        Digy
      </span>
      <span aria-hidden className="dn-display -ml-[0.02em] text-[1.12em] italic tracking-[-0.02em]">
        notes
      </span>
      <span
        aria-hidden
        className="ml-[0.12em] inline-block h-[0.26em] w-[0.26em] translate-y-[-0.05em] rounded-full bg-[var(--gold)]"
      />
    </span>
  );
}
