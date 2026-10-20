import { useEffect, useRef } from 'react'

// Letters near the pointer swell in width and weight on Archivo's variable axes.
export default function Kinetic({ text, className = '', radius = 150, wdth = [75, 125], wght = [560, 900] }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

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
        c.style.fontVariationSettings = `"wdth" ${Math.round(wdth[0] + (wdth[1] - wdth[0]) * k)}, "wght" ${Math.round(wght[0] + (wght[1] - wght[0]) * k)}`
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
    // the hero's simulated viewer looks at the name; the letters it looks at swell
    function gaze(e) {
      if (!inView) return
      px = e.detail.x
      py = e.detail.y
      schedule()
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (!inView) leave()
    })
    io.observe(el)
    if (fine) window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('gaze', gaze)
    document.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('gaze', gaze)
      document.removeEventListener('mouseleave', leave)
    }
  }, [radius, wdth[0], wdth[1], wght[0], wght[1]])

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
