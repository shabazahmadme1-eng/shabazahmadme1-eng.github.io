import { useState } from 'react'
import { useWidth } from '../lib/useWidth'
import { PR_START, PR_DAYS } from '../prdays.js'

const UP = 96
const DOWN = 52
const MAX = Math.max(...PR_DAYS.flat())
const start = new Date(`${PR_START}T00:00:00Z`)
const dayOf = (iso) => Math.round((new Date(`${iso}T00:00:00Z`) - start) / 86400000)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const label = (i) => {
  const d = new Date(start.getTime() + i * 86400000)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
const MINE = PR_DAYS.reduce((s, d) => s + d[0], 0)
const OTHER = PR_DAYS.reduce((s, d) => s + d[1], 0)
const PEAK = PR_DAYS.findIndex((d) => d[0] === Math.max(...PR_DAYS.map((x) => x[0])))

// Every merged Purser PR, one column per day: mine above the line, everyone
// else's below. Real counts from the GitHub API.
export default function PrStrip() {
  const [ref, W] = useWidth(900)
  const [tip, setTip] = useState(null)
  const n = PR_DAYS.length
  // on narrow screens the three annotations stack on separate rows
  const narrow = W < 640
  const TOP = narrow ? 56 : 24
  const BASE = TOP + UP + 8
  const H = BASE + DOWN + 50
  const step = W / n
  const bw = Math.max(2, step - (step > 6 ? 2 : 1))
  const x = (i) => i * step
  const marks = [
    [dayOf('2026-08-07'), 'first PR'],
    [PEAK, `${PR_DAYS[PEAK][0]} in one day`],
    [dayOf('2026-10-16'), 'pilot run'],
  ]

  return (
    <figure className="strip">
      <div className="strip-plot" ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Merged pull requests per day: ${MINE} by me, ${OTHER} by everyone else`}>
          {[['2026-09-01', 'Sep'], ['2026-10-01', 'Oct']].map(([d, m]) => (
            <g key={m}>
              <line x1={x(dayOf(d))} x2={x(dayOf(d))} y1={18} y2={H - 22} className="strip-month" />
              <text x={x(dayOf(d)) + 6} y={H - 8} className="strip-tick">
                {m}
              </text>
            </g>
          ))}
          <text x={2} y={H - 8} className="strip-tick">
            Aug
          </text>
          {PR_DAYS.map(([m, o], i) => (
            <g key={i}>
              {m > 0 && <rect x={x(i)} y={BASE - (m / MAX) * UP} width={bw} height={(m / MAX) * UP} className="strip-mine" />}
              {o > 0 && <rect x={x(i)} y={BASE + 3} width={bw} height={(o / MAX) * DOWN} className="strip-other" />}
              <rect
                x={x(i)}
                y={0}
                width={step}
                height={H}
                fill="transparent"
                onPointerEnter={() => setTip({ x: x(i) + step / 2, text: `${label(i)} · ${m} mine · ${o} others` })}
                onPointerLeave={() => setTip(null)}
              />
            </g>
          ))}
          <line x1={0} x2={W} y1={BASE + 1.5} y2={BASE + 1.5} className="strip-base" />
          {marks.map(([i, t], k) => {
            const ty = narrow ? 12 + k * 15 : 14
            const right = x(i) > W * 0.55
            return (
              <g key={t} className="strip-mark">
                <line x1={x(i) + bw / 2} x2={x(i) + bw / 2} y1={ty - 8} y2={BASE - (PR_DAYS[i][0] / MAX) * UP - 4} />
                <text x={x(i) + bw / 2 + (right ? -6 : 6)} y={ty} textAnchor={right ? 'end' : 'start'}>
                  {t} · {label(i)}
                </text>
              </g>
            )
          })}
        </svg>
        {tip && (
          <span className="strip-tip" style={{ left: tip.x }}>
            {tip.text}
          </span>
        )}
      </div>
      <figcaption className="strip-cap">
        <span>
          <i className="sw sw-mine" /> my merged PRs, {MINE}
        </span>
        <span>
          <i className="sw sw-other" /> everyone else, {OTHER}
        </span>
        <span>one column per day, 5 Aug – 19 Oct 2026</span>
      </figcaption>
    </figure>
  )
}
