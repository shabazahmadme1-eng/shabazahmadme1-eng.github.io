import { useCanvas, MONO, C, RGB } from '../lib/useCanvas'

// First 48 residues of KRAS, one of the genes in the MIPO-NDD corpus.
const SEQ = 'MTEYKLVVVGAGGVGKSALTIQLIQNHFVDEYDPTIEDSYRKQVVIDG'
const HOTSPOTS = [
  { pos: 12, label: 'G12D' },
  { pos: 13, label: 'G13D' },
  { pos: 35, label: 'T35S' },
  { pos: 12, label: 'G12V' },
  { pos: 16, label: 'K16N' },
]
const D2R = Math.PI / 180

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const rgb = (a) => `rgb(${a.map(Math.round).join(',')})`
const CYAN = hex('#6E6B63')
const ACID = hex(C.paper)
const HOT = hex(C.signal)

// An alpha helix turning in place. Each mutation sends a perturbation field
// through its neighbours, the shape of the model's residue-level output.
export default function Helix() {
  const ref = useCanvas((ctx, { w, h, t }) => {
    const N = SEQ.length
    const m = 26
    const R = h * 0.17
    const mid = h * 0.5
    const rot = t * 0.9
    const period = 2.6
    const hs = HOTSPOTS[Math.floor(t / period) % HOTSPOTS.length]
    const local = (t % period) / period
    const mi = hs.pos - 1

    const pts = []
    for (let i = 0; i < N; i++) {
      const a = i * 100 * D2R + rot
      pts.push({
        i,
        x: m + (i * (w - 2 * m)) / (N - 1),
        y: mid + R * Math.sin(a),
        z: Math.cos(a),
        field: Math.exp(-((i - mi) ** 2) / 10) * (1 - local * 0.6),
      })
    }

    ctx.clearRect(0, 0, w, h)

    ctx.lineWidth = 1.4
    for (let i = 1; i < N; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      ctx.strokeStyle = `rgba(${RGB.paper},${0.12 + 0.3 * ((a.z + b.z + 2) / 4)})`
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }

    ctx.font = `500 9px ${MONO}`
    for (const p of [...pts].sort((a, b) => a.z - b.z)) {
      const depth = (p.z + 1) / 2
      ctx.globalAlpha = 0.35 + 0.65 * depth
      ctx.fillStyle = rgb(lerp(lerp(CYAN, ACID, depth), HOT, Math.min(1, p.field * 1.4)))
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.2 + 3.2 * depth + p.field * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // mutation pulse
    const mp = pts[mi]
    ctx.strokeStyle = `rgba(${RGB.signal},${1 - local})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(mp.x, mp.y, 6 + 26 * local, 0, Math.PI * 2)
    ctx.stroke()

    const tag = `KRAS · ${hs.label}`
    ctx.font = `700 10px ${MONO}`
    const tw = ctx.measureText(tag).width + 10
    const tx = Math.min(w - tw - 8, Math.max(8, mp.x - tw / 2))
    ctx.fillStyle = C.signal
    ctx.fillRect(tx, 36, tw, 16)
    ctx.fillStyle = C.ink
    ctx.fillText(tag, tx + 5, 47.5)
    ctx.strokeStyle = `rgba(${RGB.signal},0.6)`
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(mp.x, 52)
    ctx.lineTo(mp.x, mp.y - 8)
    ctx.stroke()
    ctx.setLineDash([])

    // sequence strip
    ctx.font = `500 ${Math.max(7, Math.min(11, (w - 2 * m) / N))}px ${MONO}`
    const sy = h - 20
    for (let i = 0; i < N; i++) {
      const x = m + (i * (w - 2 * m)) / (N - 1)
      ctx.fillStyle = i === mi ? C.signal : `rgba(${RGB.paper},${0.3 + pts[i].field * 0.7})`
      const ch = i === mi ? hs.label.slice(-1) : SEQ[i]
      ctx.fillText(ch, x - 3, sy)
    }
  })

  return <canvas ref={ref} aria-hidden="true" />
}
