import { useEffect, useRef } from 'react'

const HOT = 'a, button, [data-cursor]'
const PAD = 6
const pad4 = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0')

// Mouse-only "target lock" cursor: a crosshair that, over anything clickable,
// snaps detection brackets around the element with a class label — the same
// boxes the runway detector draws. Inside [data-coords] it adds full-screen
// measuring hairlines with live readouts.
export default function Cursor() {
  const blend = useRef(null)
  const ui = useRef(null)
  const cross = useRef(null)
  const hline = useRef(null)
  const vline = useRef(null)
  const rx = useRef(null)
  const ry = useRef(null)
  const box = useRef(null)
  const tag = useRef(null)
  const ping = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let x = -100
    let y = -100
    let ready = false
    let hot = null
    let coords = false
    let raf = 0
    let last = performance.now()
    const b = { x: -100, y: -100, w: 0, h: 0 }

    function setHot(el) {
      const next = el?.closest?.(HOT) || null
      if (next !== hot) {
        hot = next
        ui.current.classList.toggle('is-locked', Boolean(hot))
        blend.current.classList.toggle('is-locked', Boolean(hot))
        if (hot) {
          const name = hot.dataset.cursor || (hot.tagName === 'A' ? 'link' : 'button')
          tag.current.textContent = name
        }
      }
      const c = Boolean(el?.closest?.('[data-coords]'))
      if (c !== coords) {
        coords = c
        blend.current.classList.toggle('show-lines', c)
        ui.current.classList.toggle('show-lines', c)
      }
    }
    function move(e) {
      if (e.pointerType && e.pointerType !== 'mouse') {
        root.classList.remove('has-cursor')
        ready = false
        return
      }
      x = e.clientX
      y = e.clientY
      if (!ready) {
        ready = true
        b.x = x
        b.y = y
        root.classList.add('has-cursor')
      }
      root.classList.remove('cursor-out')
      setHot(e.target)
    }
    function scroll() {
      if (ready) setHot(document.elementFromPoint(x, y))
    }
    function down() {
      const p = ping.current
      p.style.transform = `translate3d(${x}px, ${y}px, 0)`
      p.classList.remove('is-on')
      void p.offsetWidth
      p.classList.add('is-on')
      ui.current.classList.add('is-down')
    }
    const up = () => ui.current.classList.remove('is-down')
    const out = () => root.classList.add('cursor-out')

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let tx = x - 12
      let ty = y - 12
      let tw = 24
      let th = 24
      if (hot) {
        const r = hot.getBoundingClientRect()
        tx = r.left - PAD
        ty = r.top - PAD
        tw = r.width + PAD * 2
        th = r.height + PAD * 2
      }
      const k = reduced ? 1 : 1 - Math.exp(-dt * 22)
      b.x += (tx - b.x) * k
      b.y += (ty - b.y) * k
      b.w += (tw - b.w) * k
      b.h += (th - b.h) * k

      cross.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      box.current.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
      box.current.style.width = `${b.w}px`
      box.current.style.height = `${b.h}px`
      tag.current.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
      if (coords) {
        hline.current.style.transform = `translate3d(0, ${y}px, 0)`
        vline.current.style.transform = `translate3d(${x}px, 0, 0)`
        rx.current.style.transform = `translate3d(${x + 8}px, 72px, 0)`
        ry.current.style.transform = `translate3d(10px, ${y + 6}px, 0)`
        rx.current.textContent = `x ${pad4(x)}`
        ry.current.textContent = `y ${pad4(y)}`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('blur', out)
    document.addEventListener('mouseleave', out)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('has-cursor', 'cursor-out')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('blur', out)
      document.removeEventListener('mouseleave', out)
    }
  }, [])

  return (
    <>
      <div className="xh-blend" ref={blend} aria-hidden="true">
        <div className="xh-line xh-h" ref={hline} />
        <div className="xh-line xh-v" ref={vline} />
        <div className="xh-cross" ref={cross} />
        <div className="xh-box" ref={box}>
          <i className="tl" />
          <i className="tr" />
          <i className="bl" />
          <i className="br" />
        </div>
      </div>
      <div className="xh-ui" ref={ui} aria-hidden="true">
        <span className="xh-read" ref={rx} />
        <span className="xh-read" ref={ry} />
        <span className="xh-tag" ref={tag} />
        <span className="xh-ping" ref={ping} />
      </div>
    </>
  )
}
