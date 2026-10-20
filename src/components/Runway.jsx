import { useCanvas, MONO } from '../lib/useCanvas'

const CLASSES = [
  { name: 'crack', color: '#E4002B', p: 0.5 },
  { name: 'spalling', color: '#FFC94A', p: 0.3 },
  { name: 'FOD', color: '#8EA0FF', p: 0.2 },
]

function asphalt(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  const g = c.getContext('2d')
  g.fillStyle = '#17191c'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < w * h * 0.05; i++) {
    const v = 30 + Math.random() * 50
    g.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + Math.random() * 0.4})`
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5)
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 20 + Math.random() * 60
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, 'rgba(0,0,0,0.18)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  return c
}

function spawn(w) {
  let roll = Math.random()
  const cls = CLASSES.find((c) => (roll -= c.p) < 0) || CLASSES[0]
  const o = { cls, x: w * (0.14 + Math.random() * 0.72), y: -70, conf: 0.71 + Math.random() * 0.25 }
  if (cls.name === 'crack') {
    o.pts = [[0, 0]]
    let x = 0
    let y = 0
    for (let i = 0; i < 8; i++) {
      x += (Math.random() - 0.5) * 22
      y += 7 + Math.random() * 8
      o.pts.push([x, y])
    }
  } else if (cls.name === 'spalling') {
    o.pts = []
    const n = 9
    const R = 14 + Math.random() * 12
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = R * (0.65 + Math.random() * 0.5)
      o.pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.75])
    }
  } else {
    o.rot = Math.random() * Math.PI
  }
  const xs = o.pts ? o.pts.map((p) => p[0]) : [-9, 9]
  const ys = o.pts ? o.pts.map((p) => p[1]) : [-6, 6]
  o.box = [Math.min(...xs) - 7, Math.min(...ys) - 7, Math.max(...xs) + 7, Math.max(...ys) + 7]
  return o
}

// A drone pass over a runway, with detector-style boxes. This is a render of
// what the pipeline does, not live model output.
export default function Runway() {
  const ref = useCanvas((ctx, { w, h, dt, state }) => {
    if (state.texFor !== state.sized) {
      state.tex = asphalt(w, h)
      state.texFor = state.sized
      state.objs = state.objs || []
      state.scroll = state.scroll || 0
      state.next = state.next || 0
    }
    const speed = h * 0.24
    state.scroll = (state.scroll + speed * dt) % h
    state.next -= dt
    if (state.next <= 0) {
      state.objs.push(spawn(w))
      state.next = 0.6 + Math.random() * 0.7
    }

    const y0 = state.scroll
    ctx.drawImage(state.tex, 0, y0 - h, w, h)
    ctx.drawImage(state.tex, 0, y0, w, h)

    // markings
    ctx.fillStyle = 'rgba(238,241,234,0.32)'
    ctx.fillRect(w * 0.08, 0, 3, h)
    ctx.fillRect(w * 0.92 - 3, 0, 3, h)
    ctx.fillStyle = 'rgba(238,241,234,0.7)'
    const dash = h * 0.13
    const gap = h * 0.1
    for (let y = (y0 % (dash + gap)) - dash - gap; y < h; y += dash + gap) ctx.fillRect(w * 0.5 - 3, y, 6, dash)

    const zone = h * 0.3
    for (const o of state.objs) {
      o.y += speed * dt
      ctx.save()
      ctx.translate(o.x, o.y)
      if (o.cls.name === 'crack') {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)'
        ctx.lineWidth = 2.2
        ctx.beginPath()
        o.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.stroke()
        ctx.strokeStyle = 'rgba(120,120,125,0.5)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      } else if (o.cls.name === 'spalling') {
        ctx.fillStyle = 'rgba(44,46,50,0.95)'
        ctx.strokeStyle = 'rgba(90,92,98,0.8)'
        ctx.beginPath()
        o.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.rotate(o.rot)
        ctx.fillStyle = '#c9ccd1'
        ctx.fillRect(-8, -2.5, 16, 5)
        ctx.beginPath()
        ctx.arc(8, 0, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      if (o.y > zone) {
        const [x1, y1, x2, y2] = o.box
        const L = 7
        const bx = o.x + x1
        const by = o.y + y1
        const bw = x2 - x1
        const bh = y2 - y1
        ctx.strokeStyle = o.cls.color
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(bx, by + L)
        ctx.lineTo(bx, by)
        ctx.lineTo(bx + L, by)
        ctx.moveTo(bx + bw - L, by)
        ctx.lineTo(bx + bw, by)
        ctx.lineTo(bx + bw, by + L)
        ctx.moveTo(bx + bw, by + bh - L)
        ctx.lineTo(bx + bw, by + bh)
        ctx.lineTo(bx + bw - L, by + bh)
        ctx.moveTo(bx + L, by + bh)
        ctx.lineTo(bx, by + bh)
        ctx.lineTo(bx, by + bh - L)
        ctx.stroke()
        ctx.font = `700 9px ${MONO}`
        const tag = `${o.cls.name} ${o.conf.toFixed(2)}`
        const tw = ctx.measureText(tag).width + 8
        ctx.fillStyle = o.cls.color
        ctx.fillRect(bx, by - 14, tw, 13)
        ctx.fillStyle = '#0E0E0C'
        ctx.fillText(tag, bx + 4, by - 4.5)
      }
    }
    state.objs = state.objs.filter((o) => o.y < h + 90)

    // inference line
    ctx.save()
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(237,234,226,0.6)'
    ctx.beginPath()
    ctx.moveTo(0, zone)
    ctx.lineTo(w, zone)
    ctx.stroke()
    ctx.restore()

    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75)
    v.addColorStop(0, 'rgba(14,14,12,0)')
    v.addColorStop(1, 'rgba(14,14,12,0.75)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, w, h)
  })

  return <canvas ref={ref} aria-hidden="true" />
}
