import { useWidth } from '../lib/useWidth'
import { PURSER_STATIONS } from '../content.js'

// The path of one guest message, drawn as a metro line. The one model step is
// orange; the step where code decides is solid ink.
export default function PurserMetro() {
  const [ref, W] = useWidth(1000)
  const wide = W >= 820
  const n = PURSER_STATIONS.length
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (wide) {
    const H = 330
    const Y = 120
    const x0 = 24
    const x1 = W - 24
    const sx = (i) => x0 + (i * (x1 - x0)) / (n - 1)
    const decide = sx(5)
    // end labels hang inward so they never poke past the edges
    const anchor = (i) => (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle')
    const lx = (i) => (i === 0 ? sx(i) - 10 : i === n - 1 ? sx(i) + 10 : sx(i))
    return (
      <div className="metro" ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The path of one guest message through Purser">
          <path d={`M${x0},${Y + 46} H${x1}`} className="metro-trace" />
          <path d={`M${decide},${Y} C${decide},${Y + 100} ${decide + 18},${Y + 160} ${decide + 56},${Y + 182}`} className="metro-branch" />
          <circle cx={decide + 56} cy={Y + 182} r={8} className="metro-st end" />
          <text x={decide + 72} y={Y + 178} className="metro-name">
            Staff job
          </text>
          <text x={decide + 72} y={Y + 196} className="metro-sub">
            Accept / Done on WhatsApp
          </text>
          <path d={`M${x0},${Y} H${x1}`} className="metro-line" />
          {!reduced && (
            <circle r={7} className="metro-packet">
              <animateMotion dur="6s" repeatCount="indefinite" path={`M${x0},${Y} H${x1}`} />
            </circle>
          )}
          {PURSER_STATIONS.map(([name, sub, kind], i) => {
            const up = i % 2 === 1
            return (
              <g key={name}>
                <circle cx={sx(i)} cy={Y} r={kind ? 12 : 9} className={`metro-st ${kind || ''}`} />
                <text x={lx(i)} y={up ? Y - 44 : Y + 98} className="metro-name" textAnchor={anchor(i)}>
                  {name}
                </text>
                <text x={lx(i)} y={up ? Y - 26 : Y + 116} className="metro-sub" textAnchor={anchor(i)}>
                  {sub}
                </text>
                <line x1={sx(i)} x2={sx(i)} y1={up ? Y - 20 : Y + 20} y2={up ? Y - 14 : Y + 80} className="metro-tick" />
              </g>
            )
          })}
        </svg>
        <p className="metro-cap">Dashed line: every step writes a typed trace event that can be replayed in the Lab.</p>
      </div>
    )
  }

  const ROW = 64
  const H = 30 + n * ROW
  const X = 26
  const sy = (i) => 26 + i * ROW
  return (
    <div className="metro" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The path of one guest message through Purser">
        <path d={`M${X - 14},${sy(0)} V${sy(n - 1)}`} className="metro-trace" />
        <path d={`M${X},${sy(0)} V${sy(n - 1)}`} className="metro-line" />
        {PURSER_STATIONS.map(([name, sub, kind], i) => (
          <g key={name}>
            <circle cx={X} cy={sy(i)} r={kind ? 11 : 8} className={`metro-st ${kind || ''}`} />
            <text x={X + 24} y={sy(i) - 2} className="metro-name">
              {name}
            </text>
            <text x={X + 24} y={sy(i) + 16} className="metro-sub">
              {sub}
              {i === 5 ? ' → staff job, Accept / Done' : ''}
            </text>
          </g>
        ))}
      </svg>
      <p className="metro-cap">Dashed line: every step writes a typed trace event that can be replayed in the Lab.</p>
    </div>
  )
}
