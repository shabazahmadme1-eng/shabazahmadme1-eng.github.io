import { useEffect, useRef } from 'react'

// Runs render(ctx, frame) on a DPR-scaled canvas. Pauses while offscreen and
// draws a single still frame when the visitor prefers reduced motion.
export function useCanvas(render) {
  const ref = useRef(null)
  const renderRef = useRef(render)
  renderRef.current = render

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const state = {}
    const t0 = performance.now()
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let last = t0
    let visible = false

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderRef.current(ctx, { w, h, t: (now - t0) / 1000, dt, now, state, reduced })
    }

    function loop(now) {
      frame(now)
      if (visible && !reduced) raf = requestAnimationFrame(loop)
    }

    function resize() {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      state.sized = (state.sized || 0) + 1
      frame(performance.now())
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        cancelAnimationFrame(raf)
        if (visible && !reduced) {
          last = performance.now()
          raf = requestAnimationFrame(loop)
        }
      },
      { rootMargin: '120px' },
    )
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return ref
}

export const MONO = '"JetBrains Mono", ui-monospace, monospace'
export const C = {
  ink: '#0E0E0C',
  paper: '#EDEAE2',
  signal: '#E4002B',
  cobalt: '#2337FF',
  sky: '#8EA0FF',
  sun: '#FFC94A',
}

// "r,g,b" strings for building rgba() with a varying alpha
export const RGB = {
  paper: '237,234,226',
  signal: '228,0,43',
  sky: '142,160,255',
}
