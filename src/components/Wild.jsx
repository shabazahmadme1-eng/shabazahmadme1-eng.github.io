import { useEffect, useState } from 'react'

// Rev-up: the name slams in once per session, then the page is revealed.
export function Intro() {
  const [on, setOn] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
      if (sessionStorage.getItem('rev')) return false
      sessionStorage.setItem('rev', '1')
      return true
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!on) return
    document.documentElement.classList.add('is-revving')
    return () => document.documentElement.classList.remove('is-revving')
  }, [on])
  // hold the slam until the display face is in, so it never flashes a fallback
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!on) return
    let done = false
    const go = () => {
      if (!done) {
        done = true
        setReady(true)
      }
    }
    const fonts = document.fonts
    // `load` can resolve before the face is usable; poll `check` until it is
    const poll = setInterval(() => {
      if (fonts?.check('900 100px Archivo')) go()
    }, 30)
    fonts?.load('900 100px Archivo').then(() => fonts.check('900 100px Archivo') && go(), () => {})
    // never hold a black screen on a slow network: slam with whatever face is in
    const t = setTimeout(go, 1200)
    return () => {
      clearInterval(poll)
      clearTimeout(t)
    }
  }, [on])
  // the slam runs 1.25s from the moment it starts, then the page is revealed
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setOn(false), 1250)
    return () => clearTimeout(t)
  }, [ready])
  if (!on) return null
  return (
    <div className={`rev${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <div className="rev-streaks" />
      <div className="rev-name">SHABAZ</div>
      <div className="rev-flash" />
    </div>
  )
}

// Scroll velocity → a CSS variable the display type leans with.
export function useScrollLean() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    let lastY = window.scrollY
    let lastT = performance.now()
    let v = 0
    let raf = 0
    function loop(now) {
      const dt = Math.max(1, now - lastT)
      const y = window.scrollY
      const inst = ((y - lastY) / dt) * 16 // px per frame
      lastY = y
      lastT = now
      v += (inst - v) * 0.18
      if (Math.abs(v) < 0.05) v = 0
      // ~50 px per frame is a hard flick: full 6° lean
      const lean = Math.max(-6, Math.min(6, v * 0.12 * 20))
      root.style.setProperty('--lean', `${lean.toFixed(2)}deg`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
}

const ITEMS = ['224 merged PRs', '93.3% accuracy', '0.979 AUC', '110/110 routed right', '102/102 food orders', '2 patents filed', '2 papers submitted', '10 weeks to pilot']

// Pit-board results strip.
export function Board() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="board" aria-hidden="true">
      <div className="board-track">
        {row.map((t, i) => (
          <span key={i}>
            {t}
            <i>//</i>
          </span>
        ))}
      </div>
    </div>
  )
}
