import { useCanvas, MONO, C, RGB } from '../lib/useCanvas'

const VW = 560
const VX0 = 72 // the visible window, cropped tight around the figure
const VWV = 380
const VY0 = 150
const VH = 312
const GROUND_Y = 330
const TRACE_TOP = 372
const TRACE_BOT = 452
const CYCLE_S = 1.15
const D2R = Math.PI / 180
const P = (a) => `rgba(${RGB.paper},${a})`

function joint(p, aDeg, len) {
  const a = aDeg * D2R
  return { x: p.x + Math.sin(a) * len, y: p.y + Math.cos(a) * len }
}

export function buildPose(phi) {
  const pelvis = { x: 262, y: 244 - 5 * Math.cos(2 * phi) }
  const neck = { x: pelvis.x + 5 + 3 * Math.sin(phi), y: pelvis.y - 46 }
  const head = { x: neck.x + 5, y: neck.y - 14 }
  const shoulder = { x: pelvis.x + (neck.x - pelvis.x) * 0.82, y: pelvis.y + (neck.y - pelvis.y) * 0.82 }

  function leg(swing, ph) {
    const flex = 10 + 46 * Math.pow(Math.max(0, Math.sin(ph)), 1.6)
    const knee = joint(pelvis, swing, 40)
    const ankle = joint(knee, swing - flex, 38)
    const pitch = 14 * Math.max(0, Math.sin(ph + 0.6)) - 8 * Math.min(0, Math.sin(ph))
    const toe = { x: ankle.x + 15 * Math.cos(pitch * D2R), y: ankle.y + 15 * Math.sin(pitch * D2R) }
    return { knee, ankle, toe }
  }
  function arm(swing, ph) {
    const elbow = joint(shoulder, swing, 29)
    const wrist = joint(elbow, swing - (26 + 12 * Math.max(0, Math.sin(ph))), 26)
    return { elbow, wrist }
  }
  const s = 26 * Math.sin(phi)
  return {
    pelvis,
    neck,
    head,
    shoulder,
    L: { ...leg(s, phi), ...arm(-16 * Math.sin(phi), phi) },
    R: { ...leg(-s, phi + Math.PI), ...arm(16 * Math.sin(phi), phi + Math.PI) },
  }
}

function line(ctx, a, b) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

function limbs(ctx, p, side, color, width) {
  const l = p[side]
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineWidth = width
  line(ctx, p.pelvis, l.knee)
  line(ctx, l.knee, l.ankle)
  line(ctx, l.ankle, l.toe)
  line(ctx, p.shoulder, l.elbow)
  line(ctx, l.elbow, l.wrist)
}

function dot(ctx, j, r, fill, ring) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(j.x, j.y, r, 0, Math.PI * 2)
  ctx.fill()
  if (ring) {
    ctx.strokeStyle = ring
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

// The gait study as a flat, poster-style figure on cobalt: a skeletal walk
// cycle with multi-scale graph edges (the MS-G3D idea) and a joint-angle trace.
export default function Walker() {
  const ref = useCanvas((ctx, { w, h, dt, t, state }) => {
    if (state.phi == null) {
      state.phi = 1.05
      state.ghosts = []
      state.trace = []
      state.flash = -10
      state.last = -10
    }
    state.phi += dt * ((Math.PI * 2) / CYCLE_S)
    const phi = state.phi
    const s = Math.min(w / VWV, h / VH)
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate((w - VWV * s) / 2, (h - VH * s) / 2)
    ctx.scale(s, s)
    ctx.translate(-VX0, -VY0)

    const p = buildPose(phi)
    const scroll = t * 62

    // ground
    ctx.strokeStyle = P(0.35)
    ctx.lineWidth = 1
    for (let x = -(scroll % 40); x < VW; x += 40) line(ctx, { x, y: GROUND_Y }, { x: x - 8, y: GROUND_Y + 10 })
    ctx.strokeStyle = P(0.9)
    ctx.lineWidth = 2
    line(ctx, { x: 0, y: GROUND_Y }, { x: VW, y: GROUND_Y })

    if ((phi % (Math.PI * 2)) < 0.14 && t - state.last > 0.4) {
      const foot = Math.sin(phi) > 0 ? p.R : p.L
      state.last = t
      state.flash = t
      state.fx = foot.ankle.x
      state.fy = foot.ankle.y
    }

    // motion ghosts
    for (let i = 0; i < state.ghosts.length; i++) limbs(ctx, state.ghosts[i], 'L', P(0.05 + 0.02 * i), 2)

    // multi-scale graph edges between joints that are not physically linked
    const edges = [
      [p.L.knee, p.R.knee],
      [p.L.wrist, p.L.knee],
      [p.R.wrist, p.R.ankle],
      [p.head, p.L.ankle],
      [p.shoulder, p.R.toe],
      [p.L.elbow, p.pelvis],
    ]
    ctx.save()
    ctx.setLineDash([2, 5])
    ctx.lineWidth = 1
    edges.forEach(([a, b], i) => {
      ctx.strokeStyle = P(0.18 + 0.32 * Math.abs(Math.sin(t * 1.7 + i * 1.3)))
      line(ctx, a, b)
    })
    ctx.restore()

    limbs(ctx, p, 'R', P(0.45), 3)
    ctx.strokeStyle = C.paper
    ctx.lineWidth = 4
    line(ctx, p.pelvis, p.neck)
    dot(ctx, p.head, 10, C.paper)
    limbs(ctx, p, 'L', C.paper, 4)

    for (const j of [p.L.knee, p.L.ankle, p.L.toe, p.L.elbow, p.L.wrist, p.pelvis, p.shoulder]) dot(ctx, j, 4.5, C.signal, C.cobalt)

    // annotation column to the right of the figure, with leader lines
    ctx.font = `500 9px ${MONO}`
    const LX = 340
    let lastY = -1e9
    for (const [name, j] of [
      ['R_WRIST', p.R.wrist],
      ['L_KNEE', p.L.knee],
      ['L_ANKLE', p.L.ankle],
    ]) {
      const ly = Math.max(j.y, lastY + 18)
      lastY = ly
      ctx.strokeStyle = P(0.35)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(j.x + 7, j.y)
      ctx.lineTo(LX - 30, ly)
      ctx.lineTo(LX - 6, ly)
      ctx.stroke()
      ctx.fillStyle = P(0.85)
      ctx.fillText(name, LX, ly + 3)
    }

    const age = t - state.flash
    if (age < 0.45) {
      const k = age / 0.45
      ctx.strokeStyle = `rgba(${RGB.signal},${1 - k})`
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(state.fx, state.fy, 4 + 26 * k, 0, Math.PI * 2)
      ctx.stroke()
    }

    // trace band
    const mid = (TRACE_TOP + TRACE_BOT) / 2
    const off = (scroll * 0.85) % 40
    ctx.lineWidth = 1
    for (let x = VX0 - off; x < VX0 + VWV; x += 8) {
      ctx.strokeStyle = Math.round(x + off) % 40 === 0 ? P(0.2) : P(0.07)
      line(ctx, { x, y: TRACE_TOP }, { x, y: TRACE_BOT })
    }
    const spike = Math.exp(-Math.max(0, t - state.flash) / 0.16) * 1.3
    state.trace.push(0.5 * Math.sin(2 * phi) + 0.22 * Math.sin(3 * phi + 1.1) + spike)
    if (state.trace.length > VWV) state.trace.shift()
    ctx.strokeStyle = C.signal
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const start = VX0 + VWV - state.trace.length
    state.trace.forEach((v, i) => {
      const y = mid - v * 26
      if (i === 0) ctx.moveTo(start + i, y)
      else ctx.lineTo(start + i, y)
    })
    ctx.stroke()

    ctx.restore()

    state.ghosts.push(p)
    if (state.ghosts.length > 6) state.ghosts.shift()
  })

  return <canvas ref={ref} aria-hidden="true" />
}
