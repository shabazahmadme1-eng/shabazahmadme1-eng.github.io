import { useState } from 'react'
import { useWidth } from '../lib/useWidth'

// Top terms of the distilled EBM, ranked by mean |contribution| to the fused
// probability. Source: explainable-asd-gait colab/nsi_model_facts.json (top_terms).
// "tN" features are fixed sampled frames, and *_hip_angle is the knee angle.
const TERMS = [
  ['Base of support (ankle gap ÷ torso)', 'bio_ankle_dist_norm_t1', 0.041],
  ['Right shoulder angle · frame 3', 'bio_R_shoulder_angle_t3', 0.029],
  ['Right shoulder angle · frame 5', 'bio_R_shoulder_angle_t5', 0.028],
  ['Right elbow flexion · frame 2', 'bio_R_elbow_angle_t2', 0.026],
  ['Left knee flexion · frame 6', 'bio_L_hip_angle_t6', 0.026],
  ['Left–right asymmetry fluctuation', 'frame_asym_angle_std', 0.026],
  ['Right elbow flexion · frame 3', 'bio_R_elbow_angle_t3', 0.024],
  ['Elbow synchrony (Kendall τ, L↔R)', 'tau_sym_elbow', 0.024],
]
const MAX = 0.045

export default function EbmBars() {
  const [tip, setTip] = useState(null)
  const [ref, W] = useWidth()
  // Narrow screens stack each label above its bar.
  const stacked = W < 520
  const LEFT = stacked ? 0 : 250
  const RIGHT = 48
  const ROW = stacked ? 44 : 30
  const LABEL = stacked ? 16 : 0
  const TOP = 6
  const H = TOP + TERMS.length * ROW + 30
  const sx = (v) => LEFT + (v / MAX) * (W - LEFT - RIGHT)

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <strong>What the explainer leans on</strong>
        <span>Top 8 of 49 EBM terms · mean |contribution| to the fused probability</span>
      </figcaption>
      <div className="chart-plot" ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart of the top EBM terms; base of support leads at 0.041">
          {[0, 0.01, 0.02, 0.03, 0.04].map((v) => (
            <g key={v}>
              <line x1={sx(v)} x2={sx(v)} y1={TOP} y2={H - 26} className="grid" />
              <text x={sx(v)} y={H - 8} className="tick" textAnchor="middle">
                {v === 0 ? '0' : v.toFixed(2)}
              </text>
            </g>
          ))}
          {TERMS.map(([label, raw, v], i) => {
            const y = TOP + i * ROW + 8 + LABEL
            const w = sx(v) - sx(0)
            return (
              <g
                key={raw}
                onPointerEnter={() => setTip({ x: sx(v), y: y + 7, text: `${raw} · ${v.toFixed(3)}` })}
                onPointerLeave={() => setTip(null)}
              >
                <rect x={0} y={y - 6 - LABEL} width={W} height={ROW - 2} fill="transparent" />
                <text
                  x={stacked ? 0 : LEFT - 12}
                  y={stacked ? y - 5 : y + 11}
                  className="row-label"
                  textAnchor={stacked ? 'start' : 'end'}
                >
                  {label}
                </text>
                <path
                  d={`M${sx(0)},${y} h${w - 4} a4,4 0 0 1 4,4 v6 a4,4 0 0 1 -4,4 h-${w - 4} z`}
                  className={i === 0 ? 'mark accent' : 'mark accent dim'}
                />
                <text x={sx(v) + 8} y={y + 11} className="val">
                  {v.toFixed(3)}
                </text>
              </g>
            )
          })}
        </svg>
        {tip && (
          <span className="chart-tip" style={{ left: tip.x, top: tip.y }}>
            {tip.text}
          </span>
        )}
      </div>
      <p className="chart-note">
        Right-arm carriage, base of support and left–right synchrony dominate. Fidelity to the fused model: r = 0.96,
        measured in-sample.
      </p>
    </figure>
  )
}
