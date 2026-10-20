import { buildPose } from './Walker.jsx'

const FRAMES = 8
const CLIP = 150

function Bones({ p, side, far }) {
  const l = p[side]
  const segs = [
    [p.pelvis, l.knee],
    [l.knee, l.ankle],
    [l.ankle, l.toe],
    [p.shoulder, l.elbow],
    [l.elbow, l.wrist],
  ]
  return segs.map(([a, b], i) => (
    <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={far ? 'fr-bone far' : 'fr-bone'} />
  ))
}

// What the model reads: a clip is 150 frames of a 25-joint skeleton. Eight
// evenly spaced frames of the same walk cycle, drawn as small multiples.
export default function GaitFrames({ current, onPick }) {
  const frames = Array.from({ length: FRAMES }, (_, i) => ({
    f: Math.round((i / FRAMES) * CLIP),
    p: buildPose(1.05 + (i / FRAMES) * Math.PI * 2),
  }))

  return (
    <figure className="frames">
      <div className="frames-row">
        {frames.map(({ f, p }) => (
          <button
            type="button"
            className={`frame${current != null && Math.abs(current - f) < CLIP / FRAMES / 2 ? ' is-on' : ''}`}
            key={f}
            onClick={() => onPick && onPick(f)}
            data-cursor="pose"
            aria-label={`Show frame ${f} on the walking figure`}
          >
            <svg viewBox="188 158 150 186" role="img" aria-label={`skeleton at frame ${f}`}>
              <line x1={188} x2={338} y1={331} y2={331} className="fr-ground" />
              <Bones p={p} side="R" far />
              <line x1={p.pelvis.x} y1={p.pelvis.y} x2={p.neck.x} y2={p.neck.y} className="fr-bone" />
              <circle cx={p.head.x} cy={p.head.y} r={9} className="fr-head" />
              <Bones p={p} side="L" />
              {[p.L.knee, p.L.ankle, p.L.toe, p.L.elbow, p.L.wrist, p.pelvis, p.shoulder].map((j, i) => (
                <circle key={i} cx={j.x} cy={j.y} r={3.6} className="fr-joint" />
              ))}
            </svg>
            <span>f{String(f).padStart(3, '0')}</span>
          </button>
        ))}
      </div>
      <figcaption>
        Every clip is 150 frames × 25 joints. Eight frames of one cycle shown; the model sees all of them, as
        joints and as bones. Click a frame to pose the figure above.
      </figcaption>
    </figure>
  )
}
