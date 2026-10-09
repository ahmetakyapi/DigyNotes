/*
  LAYOUT: Fixed full-viewport atmosphere layer behind the app.
  - Two static, very faint light leaks (lime top-left, lilac bottom-right)
  - A fine grid fading out from the top edge
  - Film grain overlay above everything (pointer-events: none)
*/
export function GradientMesh() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden [contain:strict] [transform:translateZ(0)]"
      >
        <div className="absolute -left-[20%] -top-[30%] h-[80vmin] w-[80vmin] rounded-full bg-[radial-gradient(closest-side,rgb(var(--gold-rgb)/0.07),transparent)]" />
        <div className="absolute -bottom-[35%] -right-[20%] h-[90vmin] w-[90vmin] rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent-2-rgb)/0.06),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-[linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>
      <div aria-hidden className="dn-grain" />
    </>
  );
}
