/**
 * Framer Motion Animasyon Varyantları
 * Kaynak: dev-starter/templates/landing — tüm projelerde ortak
 */

export const EASE = [0.22, 1, 0.36, 1] as const

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const fadeUpLarge = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
}

export const staggerContainer = (stagger = 0.1) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: stagger } },
})

/* ── Shared CTA gradient tokens ── */

export const CTA_GRADIENT = {
  light: {
    bg: "linear-gradient(160deg, #10b981 0%, #059669 40%, #047857 75%, #065f46 100%)",
    bgHover: "linear-gradient(160deg, #34d399 0%, #10b981 35%, #059669 70%, #047857 100%)",
    shadow:
      "0 8px 28px rgba(5,150,105,0.28), 0 0 0 1px rgba(16,185,129,0.08) inset, 0 1px 0 rgba(255,255,255,0.2) inset",
  },
  dark: {
    bg: "linear-gradient(160deg, #34d399 0%, #10b981 30%, #059669 65%, #047857 100%)",
    bgHover: "linear-gradient(160deg, #6ee7b7 0%, #34d399 28%, #10b981 60%, #059669 100%)",
    shadow:
      "0 8px 28px rgba(16,185,129,0.32), 0 0 0 1px rgba(52,211,153,0.1) inset, 0 1px 0 rgba(255,255,255,0.14) inset",
  },
} as const;

export const slideDown = {
  hidden:  { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.2, ease: EASE } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
}
