import { useCanvas, MONO, C, RGB } from '../lib/useCanvas'

// A simulated viewer looking at a split stimulus — a face (social) beside a
// geometric pattern — the classic setup for gaze-based autism screening.
export default function Scanpath() {
  const ref = useCanvas((ctx, { w, h, dt, t, state }) => {
    const face = { x: w * 0.28, y: h * 0.47, r: Math.min(w, h) * 0.24 }
    const geo = { x: w * 0.72, y: h * 0.47, r: Math.min(w, h) * 0.24 }

    function pickTarget() {
      if (Math.random() < 0.55) {
        const spots = [
          [-0.38, -0.18],
          [0.38, -0.18],
          [0, 0.42],
          [0, 0.05],
        ]
        const [dx, dy] = spots[(Math.random() * spots.length) | 0]
        return { x: face.x + dx * face.r + (Math.random() - 0.5) * 14, y: face.y + dy * face.r + (Math.random() - 0.5) * 14 }
      }
      const a = Math.random() * Math.PI * 2
      const rr = Math.random() * geo.r * 0.9
      return { x: geo.x + Math.cos(a) * rr, y: geo.y + Math.sin(a) * rr }
    }

    if (!state.init || state.sizedAt !== state.sized) {
      state.init = true
      state.sizedAt = state.sized
      state.g = { x: face.x, y: face.y }
      state.target = pickTarget()
      state.hold = 0.4
      state.fix = []
      state.dwell = state.dwell || { social: 0, geo: 0 }
    }

    // gaze dynamics: fast saccade, then a fixation of random length
    const k = 1 - Math.exp(-dt * 22)
    state.g.x += (state.target.x - state.g.x) * k
    state.g.y += (state.target.y - state.g.y) * k
    state.hold -= dt
    if (state.hold <= 0) {
      state.fix.push({ x: state.g.x, y: state.g.y, dur: 0.22 + Math.random() * 0.45 })
      if (state.fix.length > 9) state.fix.shift()
      state.target = pickTarget()
      state.hold = 0.22 + Math.random() * 0.45
    }
    const inFace = Math.hypot(state.g.x - face.x, state.g.y - face.y) < face.r * 1.15
    const inGeo = Math.hypot(state.g.x - geo.x, state.g.y - geo.y) < geo.r * 1.15
    if (inFace) state.dwell.social += dt
    else if (inGeo) state.dwell.geo += dt

    ctx.clearRect(0, 0, w, h)

    // stimulus: face line art
    ctx.strokeStyle = `rgba(${RGB.paper},0.45)`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.ellipse(face.x, face.y, face.r * 0.82, face.r, 0, 0, Math.PI * 2)
    ctx.stroke()
    for (const dx of [-0.38, 0.38]) {
      ctx.beginPath()
      ctx.ellipse(face.x + dx * face.r, face.y - 0.18 * face.r, face.r * 0.13, face.r * 0.07, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(face.x, face.y + 0.25 * face.r, face.r * 0.25, 0.2 * Math.PI, 0.8 * Math.PI)
    ctx.stroke()

    // stimulus: rotating geometry
    ctx.save()
    ctx.translate(geo.x, geo.y)
    for (let i = 0; i < 5; i++) {
      ctx.rotate(t * 0.25 + i * 0.15)
      const s = geo.r * (0.25 + i * 0.17)
      ctx.strokeStyle = `rgba(${RGB.sky},${0.2 + i * 0.08})`
      ctx.strokeRect(-s / 2, -s / 2, s, s)
    }
    ctx.restore()

    // AOI frames
    ctx.save()
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = `rgba(${RGB.paper},0.25)`
    ctx.lineWidth = 1
    for (const a of [face, geo]) ctx.strokeRect(a.x - a.r * 1.15, a.y - a.r * 1.15, a.r * 2.3, a.r * 2.3)
    ctx.restore()
    ctx.font = `500 9px ${MONO}`
    ctx.fillStyle = `rgba(${RGB.paper},0.6)`
    ctx.fillText('AOI · SOCIAL', face.x - face.r * 1.15, face.y - face.r * 1.15 - 6)
    ctx.fillText('AOI · GEOMETRIC', geo.x - geo.r * 1.15, geo.y - geo.r * 1.15 - 6)

    // scanpath
    const pts = [...state.fix, { ...state.g, dur: 0 }]
    ctx.strokeStyle = `rgba(${RGB.signal},0.6)`
    ctx.lineWidth = 1
    ctx.beginPath()
    pts.forEach((f, i) => (i ? ctx.lineTo(f.x, f.y) : ctx.moveTo(f.x, f.y)))
    ctx.stroke()
    state.fix.forEach((f, i) => {
      const a = 0.25 + (0.75 * (i + 1)) / state.fix.length
      ctx.strokeStyle = `rgba(${RGB.signal},${a})`
      ctx.beginPath()
      ctx.arc(f.x, f.y, 4 + f.dur * 22, 0, Math.PI * 2)
      ctx.stroke()
    })

    // gaze point
    ctx.fillStyle = C.paper
    ctx.beginPath()
    ctx.arc(state.g.x, state.g.y, 4.5, 0, Math.PI * 2)
    ctx.fill()
    
    // live dwell split
    const total = state.dwell.social + state.dwell.geo || 1
    const sp = state.dwell.social / total
    const bw = w - 28
    const by = h - 22
    ctx.fillStyle = `rgba(${RGB.paper},0.1)`
    ctx.fillRect(14, by, bw, 4)
    ctx.fillStyle = C.signal
    ctx.fillRect(14, by, bw * sp, 4)
    ctx.fillStyle = C.sky
    ctx.fillRect(14 + bw * sp, by, bw * (1 - sp), 4)
    ctx.fillStyle = `rgba(${RGB.paper},0.75)`
    ctx.fillText(`social ${Math.round(sp * 100)}%`, 14, by - 7)
    const right = `geometric ${Math.round((1 - sp) * 100)}%`
    ctx.fillText(right, w - 14 - ctx.measureText(right).width, by - 7)
  })

  return <canvas ref={ref} aria-hidden="true" />
}
