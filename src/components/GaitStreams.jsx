import { useWidth } from '../lib/useWidth'

const LEARNED = [
  ['MS-G3D', 'joints + bones'],
  ['768-D → PCA 150', 'embedding'],
  ['Boosted trees', '92.7% alone'],
]
const HAND = [
  ['534 features', 'angles, distances, asymmetry'],
  ['Filter → 42', 'fitted inside each fold'],
  ['Boosted trees', '84.7% alone'],
]

// The paper pipeline as two metro lines that split from the skeleton and
// merge at the fusion step. Source: explainable-asd-gait backend + README.
export default function GaitStreams() {
  const [ref, W] = useWidth(1000)
  const wide = W >= 820

  if (wide) {
    const H = 330
    const MID = 150
    const UPY = 70
    const DNY = 230
    const xs = [0.2, 0.36, 0.52].map((f) => f * W)
    const xIn = 30
    const xSplit = 0.1 * W
    const xFuse = 0.7 * W
    const xEbm = 0.9 * W
    const curve = (y) => `M${xIn},${MID} H${xSplit} C${xSplit + 50},${MID} ${xs[0] - 60},${y} ${xs[0]},${y} H${xs[2]} C${xs[2] + 80},${y} ${xFuse - 80},${MID} ${xFuse},${MID}`
    return (
      <div className="streams" ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Two-stream gait pipeline merging at a fusion step">
          <rect x={xs[0] - 50} y={22} width={xs[2] - xs[0] + 110} height={H - 44} rx={18} className="streams-cv" />
          <text x={xs[0] - 34} y={H - 34} className="streams-note">
            inside child-grouped 5-fold CV × 3 seeds
          </text>
          <path d={curve(UPY)} className="streams-line" />
          <path d={curve(DNY)} className="streams-line" />
          <path d={`M${xFuse},${MID} H${xEbm}`} className="streams-line" />
          <path d={`M${xFuse},${MID} C${xFuse + 30},${MID + 70} ${xEbm - 60},${MID + 100} ${xEbm},${MID + 100}`} className="streams-branch" />

          <circle cx={xIn} cy={MID} r={10} className="streams-st" />
          <text x={xIn - 8} y={MID - 24} className="streams-name">
            Skeleton
          </text>
          <text x={xIn - 8} y={MID + 34} className="streams-sub">
            150 frames × 25 joints
          </text>

          {[
            [LEARNED, UPY, -1],
            [HAND, DNY, 1],
          ].map(([list, y, dir]) =>
            list.map(([name, sub], i) => (
              <g key={name + y}>
                <circle cx={xs[i]} cy={y} r={9} className="streams-st" />
                <text x={xs[i]} y={dir > 0 ? y + 30 : y - 38} className="streams-name" textAnchor="middle">
                  {name}
                </text>
                <text x={xs[i]} y={dir > 0 ? y + 47 : y - 21} className="streams-sub" textAnchor="middle">
                  {sub}
                </text>
              </g>
            )),
          )}

          <circle cx={xFuse} cy={MID} r={15} className="streams-st fuse" />
          <text x={xFuse} y={MID - 46} className="streams-name" textAnchor="middle">
            Fuse 0.47 / 0.53
          </text>
          <circle cx={xEbm} cy={MID} r={11} className="streams-st end" />
          <text x={xEbm} y={MID - 26} className="streams-name" textAnchor="middle">
            Screening score
          </text>
          <circle cx={xEbm} cy={MID + 100} r={8} className="streams-st" />
          <text x={xEbm} y={MID + 132} className="streams-name" textAnchor="middle">
            EBM explains it
          </text>
          <text x={xEbm} y={MID + 150} className="streams-sub" textAnchor="middle">
            39 + 10 terms, r = 0.96 in-sample
          </text>
        </svg>
      </div>
    )
  }

  // narrow: a vertical trunk that splits into two columns and merges again
  const cl = W * 0.27
  const cr = W * 0.73
  const cx = W / 2
  const rows = [150, 240, 330]
  const H = 560
  return (
    <div className="streams" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Two-stream gait pipeline merging at a fusion step">
        <path d={`M${cx},30 V70 C${cx},100 ${cl},100 ${cl},${rows[0]} V${rows[2]} C${cl},420 ${cx},400 ${cx},440 V520`} className="streams-line" />
        <path d={`M${cx},70 C${cx},100 ${cr},100 ${cr},${rows[0]} V${rows[2]} C${cr},420 ${cx},400 ${cx},440`} className="streams-line" />
        <circle cx={cx} cy={30} r={9} className="streams-st" />
        <text x={cx + 18} y={35} className="streams-name">
          Skeleton, 150 × 25
        </text>
        {[
          [LEARNED, cl],
          [HAND, cr],
        ].map(([list, x]) =>
          list.map(([name, sub], i) => (
            <g key={name + x}>
              <circle cx={x} cy={rows[i]} r={8} className="streams-st" />
              <text x={x} y={rows[i] + 26} className="streams-name small" textAnchor="middle">
                {name}
              </text>
              <text x={x} y={rows[i] + 42} className="streams-sub" textAnchor="middle">
                {sub}
              </text>
            </g>
          )),
        )}
        <circle cx={cx} cy={440} r={13} className="streams-st fuse" />
        <text x={cx + 22} y={445} className="streams-name">
          Fuse → 93.3%
        </text>
        <circle cx={cx} cy={520} r={8} className="streams-st" />
        <text x={cx + 18} y={520} className="streams-name small">
          EBM explains it
        </text>
        <text x={cx + 18} y={537} className="streams-sub">
          r = 0.96 in-sample
        </text>
      </svg>
    </div>
  )
}
