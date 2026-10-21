import { useState } from 'react'
import { useWidth } from '../lib/useWidth'

// Every number here is read from the QuantCrate repo's research outputs
// (quant/out/*.json, back/nifty500-backtest.json, PREREGISTRATION.md).

// Out-of-sample information coefficient, cross-sectional, NIFTY500, 63-day
// horizon. Single-factor value against five tree ensembles.  — ml_multitree.json
const BAKEOFF = [
  ['Value, single factor', 0.0822, true],
  ['ExtraTrees', 0.0237],
  ['RandomForest', 0.0176],
  ['LightGBM (dart)', 0.0138],
  ['HistGradientBoost', 0.0127],
  ['LightGBM (gbdt)', -0.0001],
]

// Value IC by causal market regime (trailing 63-day return × trailing vol;
// no forward data in the labels).  — regime_analysis.json
const REGIME = [
  ['Bull, quiet', 0.1963, 338, 3.39],
  ['Sideways', 0.1018, 234, 2.14],
  ['Bull, volatile', 0.0806, 186, 1.28],
  ['Bear, volatile', 0.0498, 95, 0.57],
  ['Bear, quiet', -0.0538, 6, -1.43],
]

function Bars({ title, sub, rows, max, min = 0, fmt, note, labelW = 190 }) {
  const [ref, W] = useWidth(600)
  const [tip, setTip] = useState(null)
  const stacked = W < 480
  const LEFT = stacked ? 0 : labelW
  const RIGHT = 64
  const ROW = stacked ? 46 : 32
  const LABEL = stacked ? 16 : 0
  const TOP = 8
  const H = TOP + rows.length * ROW + 30
  const span = max - min
  const sx = (v) => LEFT + ((v - min) / span) * (W - LEFT - RIGHT)
  const zero = sx(0)
  return (
    <figure className="q-chart">
      <figcaption>
        <strong>{title}</strong>
        <span>{sub}</span>
      </figcaption>
      <div className="q-plot" ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          <line x1={zero} x2={zero} y1={TOP} y2={H - 26} className="q-zero" />
          {rows.map((r, i) => {
            const [label, v, hot] = r
            const y = TOP + i * ROW + 8 + LABEL
            const x0 = Math.min(zero, sx(v))
            const w = Math.max(2, Math.abs(sx(v) - zero))
            return (
              <g key={label} onPointerEnter={() => setTip({ x: sx(v), y: y + 7, text: fmt(r) })} onPointerLeave={() => setTip(null)}>
                <rect x={0} y={y - 6 - LABEL} width={W} height={ROW - 2} fill="transparent" />
                <text x={stacked ? 0 : LEFT - 12} y={stacked ? y - 5 : y + 11} className="q-label" textAnchor={stacked ? 'start' : 'end'}>
                  {label}
                </text>
                <rect x={x0} y={y} width={w} height={14} className={hot ? 'q-bar hot' : 'q-bar'} />
                <text x={sx(Math.max(v, 0)) + 8} y={y + 11} className="q-val">
                  {v >= 0 ? '+' : ''}
                  {v.toFixed(3)}
                </text>
              </g>
            )
          })}
        </svg>
        {tip && (
          <span className="q-tip" style={{ left: tip.x, top: tip.y }}>
            {tip.text}
          </span>
        )}
      </div>
      <p className="q-note">{note}</p>
    </figure>
  )
}

export function QuantCharts() {
  return (
    <div className="q-charts">
      <Bars
        title="The signal beats the models"
        sub="Out-of-sample IC, NIFTY500, 63-day horizon"
        rows={BAKEOFF}
        max={0.09}
        min={-0.005}
        fmt={([l, v]) => `${l} · IC ${v.toFixed(4)}`}
        note="Five tree ensembles on the same features and folds. The engineered value signal carries the edge; the models confirm it."
      />
      <Bars
        title="Where the signal lives"
        sub="Value IC by market regime, labelled causally"
        rows={REGIME.map(([l, v, n, t]) => [l, v, false, n, t])}
        max={0.21}
        min={-0.06}
        labelW={150}
        fmt={([l, v, , n, t]) => `${l} · IC ${v.toFixed(3)} · ${n} dates · t ${t}`}
        note="Strongest in quiet bull markets (IC 0.20, t 3.4), so the live overlay cuts momentum in risk-off regimes. The bear-quiet bar is six dates."
      />
    </div>
  )
}

export const PREREG = [
  ['Universe', 'NIFTY500 current constituents'],
  ['Signal', 'β-neutral earnings yield 0.60 + 12-month momentum 0.40, cross-sectional robust-z'],
  ['Book', 'Top 50 by blended score, equal weight'],
  ['Cadence', 'Every Friday after NSE close, by GitHub Actions'],
  ['Grade', '63-trading-day forward return vs the NIFTY 50, frozen per pick'],
  ['Success', 't ≥ 2 on mean 63-day excess, de-overlapped'],
  ['Failure', 'Mean excess ≤ 0 after two years, or t ≤ −2 at any point'],
  ['Changes', 'None, in response to results. Any change restarts the test, dated.'],
]
