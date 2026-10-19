// Bold pictograms for the "things that broke" tiles. 96-unit grid, thick
// strokes in the text colour, one orange accent each.
const ICONS = {
  key: (
    <>
      <circle cx="30" cy="48" r="17" className="pi-s" />
      <circle cx="30" cy="48" r="6" className="pi-a" />
      <path d="M47 48 H86 M72 48 V60 M82 48 V64" className="pi-s" />
    </>
  ),
  queue: (
    <>
      <rect x="18" y="16" width="60" height="22" rx="3" className="pi-af" />
      <path d="M18 18 L48 30 L78 18" className="pi-s ink" />
      <rect x="18" y="44" width="60" height="22" rx="3" className="pi-s" />
      <path d="M18 46 L48 58 L78 46" className="pi-s" />
      <path d="M48 72 V88 M40 80 L48 88 L56 80" className="pi-s" />
    </>
  ),
  voices: (
    <>
      <path d="M10 22 H50 V50 H28 L18 60 V50 H10 Z" className="pi-s" />
      <path d="M46 40 H86 V68 H78 V78 L68 68 H46 Z" className="pi-s dashed" />
      <path d="M44 82 L90 30" className="pi-a-line" />
    </>
  ),
  wave: (
    <>
      {[14, 22, 30, 38, 46].map((x, i) => (
        <line key={x} x1={x} x2={x} y1={48 - [8, 18, 26, 14, 6][i]} y2={48 + [8, 18, 26, 14, 6][i]} className={i === 2 ? 'pi-a-line' : 'pi-s'} />
      ))}
      <path d="M56 48 H70 M64 41 L71 48 L64 55" className="pi-s" />
      <path d="M76 36 H90 M76 48 H90 M76 60 H86" className="pi-s" />
    </>
  ),
}

export default function Picto({ name }) {
  return (
    <svg viewBox="0 0 96 96" className="picto" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}
