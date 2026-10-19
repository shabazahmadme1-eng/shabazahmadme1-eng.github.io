import { useEffect, useRef } from 'react'

// Letters near the pointer swell in width and weight on Archivo's variable axes.
export default function Kinetic({ text, className = '', radius = 150 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const chars = [...el.querySelectorAll('.k-ch')]
    let px = -1e4
    let py = -1e4
    let raf = 0
    let inView = false

    function apply() {
      raf = 0
      const rects = chars.map((c) => c.getBoundingClientRect())
      chars.forEach((c, i) => {
        const r = rects[i]
        const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py)
        const k = Math.exp(-(d * d) / (2 * radius * radius))
        c.style.fontVariationSettings = `"wdth" ${Math.round(75 + 50 * k)}, "wght" ${Math.round(560 + 340 * k)}`
      })
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    function move(e) {
      if (!inView) return
      px = e.clientX
      py = e.clientY
      schedule()
    }
    function leave() {
      px = py = -1e4
      schedule()
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (!inView) leave()
    })
    io.observe(el)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [radius])

  return (
    <span ref={ref} className={`k ${className}`}>
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} className="k-ch" aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}
