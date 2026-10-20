import { useEffect, useRef } from 'react'
import { useCanvas, MONO, C, RGB } from '../lib/useCanvas'

const FIX_RADIUS = 38 // px a sample may drift and still count as the same fixation
const MIN_FIX_MS = 110
const LIFE_MS = 9000
const IDLE_MS = 2500 // after this long without real input, a simulated viewer takes over
const MAX_FIX = 10
const DRAW_MS = 200 // how long a new scanpath segment takes to draw in

// Treats the visitor's cursor as a gaze signal: fixations, saccades, a heat
// layer and a scanpath, the way a webcam eye-tracker would. Nothing sits
// still: fixations breathe and expire, segments draw in, the live point
// trembles, and when the visitor stops moving a simulated viewer carries on.
export default function GazeField({ nameRef, onStats }) {
  const input = useRef({ samples: [], lastReal: -1e9, last: null })

  const ref = useCanvas((ctx, { w, h, now, dt, state }) => {
    if (!state.init) {
      Object.assign(state, {
        init: true,
        fix: [],
        cur: null,
        sim: null,
        nextId: 0,
        total: 0,
        sumDur: 0,
        path: 0,
        nameDur: 0,
        allDur: 0,
        lastFix: null,
        lastStats: 0,
        nameRect: null,
        nameAt: 0,
      })
    }

    if (now - state.nameAt > 500 && nameRef.current) {
      const c = ctx.canvas.getBoundingClientRect()
      const n = nameRef.current.getBoundingClientRect()
      state.nameRect = { x: n.left - c.left, y: n.top - c.top, w: n.width, h: n.height }
      state.nameAt = now
    }
    const nr = state.nameRect
    const onName = (p) => nr && p.x >= nr.x && p.x <= nr.x + nr.w && p.y >= nr.y && p.y <= nr.y + nr.h

    function finalize(t) {
      const c = state.cur
      state.cur = null
      if (!c) return
      const dur = t - c.start
      if (dur < MIN_FIX_MS) return
      const f = { x: c.x, y: c.y, dur, born: t, id: state.nextId++ }
      if (state.lastFix) state.path += Math.hypot(f.x - state.lastFix.x, f.y - state.lastFix.y)
      state.lastFix = f
      state.fix.push(f)
      if (state.fix.length > MAX_FIX) state.fix.shift()
      state.total += 1
      state.sumDur += dur
      state.allDur += dur
      if (onName(f)) state.nameDur += dur
    }
    function feed(x, y, t) {
      const c = state.cur
      if (c && Math.hypot(x - c.x, y - c.y) < FIX_RADIUS) {
        c.n += 1
        c.sx += x
        c.sy += y
        c.x = c.sx / c.n
        c.y = c.sy / c.n
      } else {
        finalize(t)
        state.cur = { x, y, start: t, n: 1, sx: x, sy: y }
      }
    }
    function pickTarget() {
      return nr && Math.random() < 0.55
        ? { x: nr.x + Math.random() * nr.w, y: nr.y + Math.random() * nr.h }
        : { x: w * (0.08 + Math.random() * 0.84), y: h * 0.12 + Math.random() * ((nr ? nr.y + nr.h : h * 0.7) - h * 0.12) }
    }

    const inp = input.current
    if (inp.samples.length) state.sim = null
    for (const s of inp.samples) feed(s.x, s.y, s.t)
    inp.samples.length = 0

    // simulated viewer: saccade → fixation → saccade, starting where the visitor left off
    if (now - inp.lastReal > IDLE_MS) {
      if (!state.sim) {
        const start = state.cur || inp.last || { x: w * 0.4, y: h * 0.5 }
        finalize(now)
        state.sim = { x: start.x, y: start.y, fromX: start.x, fromY: start.y, phase: 'pick', until: now + 120 }
      }
      const s = state.sim
      if (s.phase === 'pick' && now >= s.until) {
        const p = pickTarget()
        s.fromX = s.x
        s.fromY = s.y
        s.tx = p.x
        s.ty = p.y
        s.phase = 'saccade'
      }
      if (s.phase === 'saccade') {
        const k = 1 - Math.exp(-dt * 24)
        s.x += (s.tx - s.x) * k
        s.y += (s.ty - s.y) * k
        if (Math.hypot(s.tx - s.x, s.ty - s.y) < 1.5) {
          s.phase = 'fix'
          s.until = now + 220 + Math.random() * 680
          state.cur = { x: s.x, y: s.y, start: now, n: 1, sx: s.x, sy: s.y }
        }
      }
      if (now - (state.gazeAt || 0) > 90) {
        state.gazeAt = now
        const r = ctx.canvas.getBoundingClientRect()
        window.dispatchEvent(new CustomEvent('gaze', { detail: { x: r.left + s.x, y: r.top + s.y } }))
      }
      if (s.phase === 'fix' && now >= s.until) {
        finalize(now)
        s.phase = 'pick'
        s.until = now + 30 + Math.random() * 90
      }
    }

    ctx.clearRect(0, 0, w, h)
    const lifeOf = (f) => Math.max(0, 1 - (now - f.born) / LIFE_MS)
    const fixes = state.fix

    // heat, gently pulsing
    ctx.globalCompositeOperation = 'lighter'
    for (const f of fixes) {
      const L = lifeOf(f)
      if (!L) continue
      const pulse = 1 + 0.1 * Math.sin(now / 650 + f.id * 1.7)
      const r = Math.min(180, 50 + Math.sqrt(f.dur) * 3.4) * pulse
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r)
      g.addColorStop(0, `rgba(${RGB.sky},${0.2 * L})`)
      g.addColorStop(0.5, `rgba(${RGB.sky},${0.07 * L})`)
      g.addColorStop(1, `rgba(${RGB.sky},0)`)
      ctx.fillStyle = g
      ctx.fillRect(f.x - r, f.y - r, r * 2, r * 2)
    }
    ctx.globalCompositeOperation = 'source-over'

    // scanpath: each new segment draws itself in
    ctx.lineWidth = 1
    for (let i = 1; i < fixes.length; i++) {
      const a = fixes[i - 1]
      const b = fixes[i]
      const p = Math.min(1, (now - b.born) / DRAW_MS)
      ctx.strokeStyle = `rgba(${RGB.paper},${0.4 * lifeOf(b)})`
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p)
      ctx.stroke()
    }

    // fixations: pop in, breathe, spin, shrink as they fade
    ctx.font = `500 10px ${MONO}`
    fixes.forEach((f, i) => {
      const L = lifeOf(f)
      if (!L) return
      const t = Math.min(1, (now - f.born) / 280)
      const pop = 1 + 0.25 * Math.sin(t * Math.PI) * (1 - t) // small overshoot
      const base = Math.min(34, 5 + Math.sqrt(f.dur) * 0.9)
      const r = base * (0.55 + 0.45 * t) * pop * (0.7 + 0.3 * L) * (1 + 0.05 * Math.sin(now / 420 + f.id))

      ctx.strokeStyle = `rgba(${RGB.signal},${0.95 * L})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2)
      ctx.stroke()

      const rot = (now / 900) * (f.id % 2 ? 1 : -1) + f.id
      ctx.strokeStyle = `rgba(${RGB.signal},${0.5 * L})`
      ctx.beginPath()
      ctx.arc(f.x, f.y, r + 5, rot, rot + 0.9)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(f.x, f.y, r + 5, rot + Math.PI, rot + Math.PI + 0.9)
      ctx.stroke()

      ctx.fillStyle = `rgba(${RGB.signal},${L})`
      ctx.beginPath()
      ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2)
      ctx.fill()

      if (i >= fixes.length - 3) {
        const idx = state.total - (fixes.length - 1 - i)
        ctx.fillStyle = `rgba(${RGB.paper},${0.6 * L * t})`
        ctx.fillText(`F${idx} · ${Math.round(f.dur)}ms`, f.x + r + 8, f.y - 4)
      }
    })

    // a simulated saccade in flight
    const s = state.sim
    if (s && s.phase === 'saccade') {
      const g = ctx.createLinearGradient(s.fromX, s.fromY, s.x, s.y)
      g.addColorStop(0, `rgba(${RGB.signal},0)`)
      g.addColorStop(1, `rgba(${RGB.signal},0.9)`)
      ctx.strokeStyle = g
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s.fromX, s.fromY)
      ctx.lineTo(s.x, s.y)
      ctx.stroke()
      ctx.fillStyle = C.signal
      ctx.beginPath()
      ctx.arc(s.x, s.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // the live fixation, with a little physiological tremor
    const c = state.cur
    if (c) {
      const dur = now - c.start
      if (dur > MIN_FIX_MS) {
        const jx = c.x + 1.2 * Math.sin(now / 41) + 0.8 * Math.sin(now / 67 + 1)
        const jy = c.y + 1.0 * Math.cos(now / 47) + 0.7 * Math.sin(now / 59 + 2)
        const r = Math.min(34, 5 + Math.sqrt(dur) * 0.9)
        ctx.save()
        ctx.strokeStyle = C.paper
        ctx.lineWidth = 1.4
        ctx.setLineDash([4, 4])
        ctx.lineDashOffset = -now / 40
        ctx.beginPath()
        ctx.arc(jx, jy, r + 4, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        ctx.fillStyle = C.paper
        ctx.beginPath()
        ctx.arc(jx, jy, 2.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillText(`fixating ${Math.round(dur)}ms`, jx + r + 10, jy + 14)
      }
    }

    if (onStats && now - state.lastStats > 250) {
      state.lastStats = now
      onStats({
        count: state.total,
        mean: state.total ? state.sumDur / state.total : 0,
        path: state.path,
        name: state.allDur ? state.nameDur / state.allDur : 0,
        auto: Boolean(state.sim),
      })
    }
  })

  useEffect(() => {
    const canvas = ref.current
    const host = canvas.parentElement
    function move(e) {
      const r = canvas.getBoundingClientRect()
      const p = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }
      input.current.samples.push(p)
      input.current.last = p
      input.current.lastReal = p.t
    }
    host.addEventListener('pointermove', move, { passive: true })
    return () => host.removeEventListener('pointermove', move)
  }, [ref])

  return <canvas ref={ref} className="gaze-canvas" aria-hidden="true" />
}
