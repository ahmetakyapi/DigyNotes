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
    bg: "linear-gradient(160deg, var(--gold) 0%, var(--gold-dark) 40%, var(--gold-dark) 75%, #065f46 100%)",
    bgHover: "linear-gradient(160deg, var(--gold-light) 0%, var(--gold) 35%, var(--gold-dark) 70%, var(--gold-dark) 100%)",
    shadow:
      "0 8px 28px rgb(var(--gold-rgb)/0.28), 0 0 0 1px rgb(var(--gold-rgb)/0.08) inset, 0 1px 0 rgba(255,255,255,0.2) inset",
  },
  dark: {
    bg: "linear-gradient(160deg, var(--gold-light) 0%, var(--gold) 30%, var(--gold-dark) 65%, var(--gold-dark) 100%)",
    bgHover: "linear-gradient(160deg, var(--gold-light) 0%, var(--gold-light) 28%, var(--gold) 60%, var(--gold-dark) 100%)",
    shadow:
      "0 8px 28px rgb(var(--gold-rgb)/0.32), 0 0 0 1px rgb(var(--gold-light-rgb)/0.1) inset, 0 1px 0 rgba(255,255,255,0.14) inset",
  },
} as const;

export const slideDown = {
  hidden:  { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.2, ease: EASE } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
}

export const modalBackdrop = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const modalPanel = {
  hidden:  { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: EASE } },
  exit:    { opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } },
}

export const likeHeart = {
  initial:  { scale: 1 },
  animate:  { scale: [1, 1.35, 1], transition: { duration: 0.6, ease: EASE } },
}
