'use client'

import { useRef, useCallback } from 'react'
import { useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion'

/**
 * 3D kart eğim + holografik parlaklık efekti.
 * Kart üzerindeki fare pozisyonuna göre rotateX/Y ve radial gradient shine üretir.
 *
 * @param rotationDeg  - Maksimum eğim derecesi (varsayılan 6)
 * @param shineRadius  - Parlaklık circle yarıçapı px (varsayılan 480)
 *
 * @example
 * const { ref, rx, ry, shine, onMove, onLeave } = useCardTilt()
 * <motion.div ref={ref} style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
 *   onMouseMove={onMove} onMouseLeave={onLeave}>
 *   <motion.div className="pointer-events-none absolute inset-0" style={{ background: shine }} />
 * </motion.div>
 */
export function useCardTilt(rotationDeg = 6, shineRadius = 480) {
  const ref = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)

  const rx = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })
  const ry = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 })

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return
      const r = ref.current.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      rx.set(-(ny - 0.5) * rotationDeg)
      ry.set( (nx - 0.5) * rotationDeg)
      mx.set(nx)
      my.set(ny)
    },
    [rx, ry, mx, my, rotationDeg],
  )

  const onLeave = useCallback(() => {
    rx.set(0)
    ry.set(0)
    mx.set(0.5)
    my.set(0.5)
  }, [rx, ry, mx, my])

  const shineX = useTransform(mx, [0, 1], ['0%', '100%'])
  const shineY = useTransform(my, [0, 1], ['0%', '100%'])
  const shine  = useMotionTemplate`radial-gradient(${shineRadius}px circle at ${shineX} ${shineY}, rgba(16,185,129,0.08), rgba(6,182,212,0.04), transparent 70%)`

  return { ref, rx, ry, shine, onMove, onLeave }
}
