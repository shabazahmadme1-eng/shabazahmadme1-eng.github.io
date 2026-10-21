import { useEffect, useRef, useState } from 'react'
import Cursor from './components/Cursor.jsx'
import Kinetic from './components/Kinetic.jsx'
import GazeField from './components/GazeField.jsx'
import PurserDemo from './components/PurserDemo.jsx'
import PurserMetro from './components/PurserMetro.jsx'
import PrStrip from './components/PrStrip.jsx'
import Walker from './components/Walker.jsx'
import GaitStreams from './components/GaitStreams.jsx'
import GaitFrames from './components/GaitFrames.jsx'
import Picto from './components/Picto.jsx'
import EbmBars from './components/EbmBars.jsx'
import Scanpath from './components/Scanpath.jsx'
import Runway from './components/Runway.jsx'
import Helix from './components/Helix.jsx'
import { Intro, Board, useScrollLean } from './components/Wild.jsx'
import { LINKS, PURSER_STACK, RECORD, BUILDS, STACK } from './data.js'
import { PURSER_CHECKS, PURSER_PROBLEMS, GAIT_RIGOR } from './content.js'

const NAV = [
  ['Purser', '#purser'],
  ['Gait', '#gait'],
  ['Research', '#lab'],
  ['Record', '#record'],
  ['Builds', '#builds'],
  ['Contact', '#contact'],
]

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// Sizes lines of display type to fill a fraction of the viewport width,
// capped by a fraction of its height. Measured, so the name always reads.
function useFit(ref, lines) {
  useEffect(() => {
    const el = ref.current
    let raf = 0
    function fit() {
      raf = 0
      for (const [sel, frac, maxVh] of lines) {
        const t = el.querySelector(sel)
        if (!t) continue
        // measure at the widest the letters can swell to, so the line never clips
        const chars = [...t.querySelectorAll('.k-ch')]
        const saved = chars.map((c) => c.style.fontVariationSettings)
        // the letters animate their axes, so the measurement must bypass the transition
        chars.forEach((c) => {
          c.style.transition = 'none'
          c.style.fontVariationSettings = '"wdth" 125, "wght" 900'
        })
        t.style.fontSize = '100px'
        void t.offsetWidth
        const w = t.getBoundingClientRect().width || 1
        chars.forEach((c, i) => {
          c.style.fontVariationSettings = saved[i]
          void c.offsetWidth
          c.style.transition = ''
        })
        t.style.fontSize = `${Math.min((100 * window.innerWidth * frac) / w, (window.innerHeight * maxVh) / 100)}px`
      }
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(fit)
    }
    fit()
    // the display face may still be loading; re-fit whenever fonts settle
    const fonts = document.fonts
    fonts?.load('900 100px Archivo').then(fit, () => {})
    fonts?.ready.then(fit)
    fonts?.addEventListener('loadingdone', on)
    const late = setTimeout(fit, 1500)
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(late)
      fonts?.removeEventListener('loadingdone', on)
      window.removeEventListener('resize', on)
    }
  }, [])
}

function Progress() {
  const ref = useRef(null)
  const [ticks, setTicks] = useState([])
  useEffect(() => {
    let raf = 0
    function update() {
      raf = 0
      const d = document.documentElement
      ref.current.style.transform = `scaleX(${d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)})`
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    // one tick per section on the bar
    function measure() {
      const d = document.documentElement
      const range = Math.max(1, d.scrollHeight - d.clientHeight)
      setTicks(NAV.map(([, href]) => Math.min(1, document.querySelector(href).offsetTop / range)))
      update()
    }
    measure()
    const t = setTimeout(measure, 1500)
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return (
    <div className="progress" aria-hidden="true">
      <span ref={ref} />
      {ticks.map((p, i) => (
        <i key={i} style={{ left: `${p * 100}%` }} />
      ))}
    </div>
  )
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [now, setNow] = useState(-1)
  useEffect(() => {
    const sections = NAV.map(([, href]) => document.querySelector(href))
    let raf = 0
    function update() {
      raf = 0
      setScrolled(window.scrollY > 40)
      // the current section: the last one whose top has passed the nav
      let idx = -1
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= 120) idx = i
      })
      setNow(idx)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
    }
  }, [])
  return (
    <nav className={`nav${scrolled ? ' is-scrolled' : ''}`} aria-label="Primary">
      <a className="logo" href="#top" aria-label="Shabaz Ahmad Hasib, home">
        Shabaz Ahmad Hasib
      </a>
      <p className={`nav-now${now >= 0 ? ' is-on' : ''}`}>
        <b>{String(now + 1).padStart(2, '0')}</b> {now >= 0 ? NAV[now][0] : ''}
      </p>
      <ul className="nav-links">
        {NAV.map(([label, href], i) => (
          <li key={href}>
            <a href={href} className={i === now ? 'is-now' : ''}>
              {label}
            </a>
          </li>
        ))}
      </ul>
      <a className="nav-cta" href={LINKS.resume} target="_blank" rel="noreferrer" data-cursor="pdf">
        Resume
      </a>
    </nav>
  )
}

function Clock() {
  const fmt = () =>
    new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return <>{time} IST</>
}

function SecHead({ n, name }) {
  return (
    <>
      <span className="ghost" aria-hidden="true">
        {n}
      </span>
      <span className="run" aria-hidden="true">
        {n} — {name}
      </span>
      <div className="sec-head" data-reveal>
        <span className="sec-n">{n}</span>
        <span className="sec-name">{name}</span>
        <i className="sec-rule" aria-hidden="true" />
      </div>
    </>
  )
}

function Hero() {
  const nameRef = useRef(null)
  useFit(nameRef, [
    ['.name-1', 0.96, 42],
    ['.name-2', 0.79, 20],
  ])
  return (
    <section className="hero s-ink" id="top" data-coords>
      <GazeField nameRef={nameRef} />
      <div className="wrap hero-mast">
        <div className="hero-mast-inner">
          <p>
            <span>now</span>Purser · Neuroparadigm · Sequetrics
          </p>
          <p>
            <span>based</span>Hyderabad, <Clock />
          </p>
          <p>
            <span>open to</span>ML and backend roles
          </p>
        </div>
      </div>
      <div className="wrap hero-wrap">
        <h1 className="hero-name" ref={nameRef}>
          <Kinetic text="SHABAZ" className="name-1" wdth={[118, 125]} wght={[780, 900]} radius={220} />
          <Kinetic text="AHMAD HASIB" className="name-2" wdth={[100, 125]} wght={[700, 900]} radius={180} gaze />
        </h1>
        <div className="hero-foot">
          <p className="hero-line">
            I build ML that reads how people move, and production systems that real hotels run on.
          </p>
          <div className="hero-jump">
            <a href="#purser" data-cursor="scroll">
              <b>01</b> Purser
            </a>
            <a href="#gait" data-cursor="scroll">
              <b>02</b> Gait
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Purser() {
  return (
    <section id="purser" className="sec s-paper">
      <div className="wrap">
        <SecHead n="01" name="Purser" />
        <div className="intro" data-reveal>
          <h2>A hotel that runs on WhatsApp.</h2>
          <div>
            <p className="lede">
              Guests message the hotel’s own number. Questions get answers cited from the hotel’s documents, requests
              become staff jobs exactly once, and the front desk takes over when a person should.
            </p>
            <p className="byline">Software Engineering Intern, Aug 2026 – now. One of two engineers.</p>
          </div>
        </div>

        <div className="numerals" data-reveal>
          <p>
            <span className="numeral">224</span>
            <span className="cap">pull requests merged</span>
          </p>
          <p>
            <span className="numeral">66%</span>
            <span className="cap">of everything that shipped</span>
          </p>
          <p>
            <span className="numeral">10</span>
            <span className="cap">weeks to a live hotel pilot</span>
          </p>
        </div>

        <div data-reveal>
          <PrStrip />
        </div>

        <div className="demo-wrap" data-reveal>
          <PurserDemo />
        </div>

        <div className="block" data-reveal>
          <h3>The path of one message</h3>
          <PurserMetro />
        </div>

        <blockquote className="pull" data-reveal>
          <span>The model reads.</span>
          <em>Code decides,</em>
          <span className="pull-last">and writes the facts.</span>
        </blockquote>

        <div className="fractions" data-reveal>
          {PURSER_CHECKS.map(([v, l]) => (
            <p key={v}>
              <span className="fraction">{v}</span>
              <span className="cap">{l}</span>
            </p>
          ))}
          <p className="fine">Checks against the production model. Smoke tests, not a benchmark.</p>
        </div>

        <div className="block" data-reveal>
          <h3>Things that broke</h3>
          <ol className="tiles">
            {PURSER_PROBLEMS.map(([icon, t, d], i) => (
              <li key={t}>
                <span className="tile-n">{String(i + 1).padStart(2, '0')}</span>
                <Picto name={icon} />
                <strong>{t}</strong>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="stackline" data-reveal>
          {PURSER_STACK}.{' '}
          <a href={LINKS.purser} target="_blank" rel="noreferrer">
            purserflow.com
          </a>
        </p>
      </div>
    </section>
  )
}

function Gait() {
  const [pick, setPick] = useState(null) // the frame the reader chose
  const [bucket, setBucket] = useState(0) // which filmstrip frame is nearest
  const counter = useRef(null)
  const ruler = useRef(null)
  const dragging = useRef(false)
  // ~130 frame changes a second: update the DOM directly, re-render React only
  // when the highlighted filmstrip frame changes
  const onFrame = (f, h) => {
    if (counter.current) counter.current.textContent = `f${String(f).padStart(3, '0')} / 150${h ? ' · held' : ''}`
    if (ruler.current && !dragging.current) ruler.current.value = f
    const b = Math.round(f / (150 / 8)) % 8
    setBucket((prev) => (prev === b ? prev : b))
  }
  return (
    <section id="gait" className="sec s-cobalt">
      <div className="wrap">
        <SecHead n="02" name="Gait screening" />
        <div className="intro" data-reveal>
          <h2>Autism screening from the way a child walks.</h2>
          <div>
            <p className="lede">
              A graph network and 534 hand-built biomechanical features read the same walk. An explainable model turns
              the fused score back into joint angles a clinician can check.
            </p>
            <p className="byline">
              Neuroparadigm. Co-author, submitted to Neuroscience Informatics. A screening aid, not a diagnosis.
            </p>
          </div>
        </div>

        <div className="gait-stage" data-reveal>
          <div className="gait-canvas">
            <Walker frame={pick} onFrame={onFrame} />
            <span className="gait-frame-no" ref={counter}>
              f000 / 150
            </span>
            <label className="scrub">
              <span className="sr-only">Scrub the walk cycle by frame</span>
              <input
                ref={ruler}
                type="range"
                min="0"
                max="149"
                defaultValue="0"
                onPointerDown={() => (dragging.current = true)}
                onPointerUp={() => (dragging.current = false)}
                onChange={(e) => setPick(Number(e.target.value))}
                data-cursor="scrub"
              />
              <span className="scrub-ticks" aria-hidden="true">
                {[0, 30, 60, 90, 120, 149].map((f) => (
                  <i key={f} style={{ left: `${(f / 149) * 100}%` }}>
                    f{String(f).padStart(3, '0')}
                  </i>
                ))}
              </span>
            </label>
          </div>
          <div className="gait-nums">
            <p>
              <span className="numeral">93.3%</span>
              <span className="cap">accuracy, ±1.2 over three seeds</span>
            </p>
            <p>
              <span className="numeral">0.979</span>
              <span className="cap">AUC, 100 children, child-level CV</span>
            </p>
          </div>
        </div>

        <div className="block" data-reveal>
          <h3>What the model sees</h3>
          <GaitFrames current={bucket} onPick={setPick} />
        </div>

        <div className="block" data-reveal>
          <h3>Two streams, one explainable score</h3>
          <GaitStreams />
        </div>

        <div className="gait-app" data-reveal>
          <EbmBars />
          <div>
            <h3>Honest by construction</h3>
            <ul className="rigor">
              {GAIT_RIGOR.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="body gait-phone">
              A prototype app carries the model from Kinect to phone video using bone directions and calibrated,
              windowed features. It has no independent smartphone validation yet.
            </p>
            <p className="links">
              <a href={LINKS.gaitRepo} target="_blank" rel="noreferrer" data-cursor="github">
                Paper code
              </a>
              <a href={LINKS.gaitApp} target="_blank" rel="noreferrer" data-cursor="github">
                App code
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Specimen({ visual, note, kicker, title, children, nums, link, tone }) {
  return (
    <article className={`spec ${tone || ''}`} data-reveal>
      <div className="spec-visual">
        {visual}
        <span className="spec-note">{note}</span>
      </div>
      <div className="spec-body">
        <p className="spec-kicker">{kicker}</p>
        <h3>{title}</h3>
        <p className="body">{children}</p>
        <div className="spec-nums">
          {nums.map(([v, l]) => (
            <p key={l}>
              <strong>{v}</strong>
              <span>{l}</span>
            </p>
          ))}
        </div>
        {link && (
          <a className="spec-link" href={link} target="_blank" rel="noreferrer" data-cursor="github">
            Code
          </a>
        )}
      </div>
    </article>
  )
}

function Lab() {
  return (
    <section id="lab" className="sec s-paper">
      <div className="wrap">
        <SecHead n="03" name="More research" />
        <Specimen
          visual={<Scanpath />}
          note="simulated scanpath, not study data"
          kicker="Neuroparadigm · paper under review"
          title="Eye-tracking that survives the jump to webcams"
          nums={[
            ['0.919', 'AUC, lab recordings'],
            ['0.799', 'AUC, real webcams'],
            ['33 + 18', 'features + biomarkers'],
          ]}
        >
          Webcam calibration in our cohort was off by 275–870 px, so we built gaze features that don’t depend on it:
          timing, within-trial ratios, fixation stability, scan entropy. TabICL against TabPFN and XGBoost, on
          leave-one-participant-out folds.
        </Specimen>
        <Specimen
          visual={<Runway />}
          note="a render of the pipeline, not model output"
          kicker="Sequetrics · Aug 2025 – now"
          title="Runway damage detection on a Jetson"
          tone="flip"
          nums={[
            ['0.693', 'mAP50'],
            ['12', 'damage classes'],
            ['TensorRT', 'on Jetson'],
          ]}
        >
          YOLOv8 for cracks, spalling and debris, trained on RDD2022 plus pseudo-labelled drone frames. The report
          pipeline around it withholds crack width when it can’t measure it reliably.
        </Specimen>
        <Specimen
          visual={<Helix />}
          note="illustrative, not model output"
          kicker="MIPO-NDD · in progress"
          title="Mutation effects on genes the model has never seen"
          link={LINKS.mipoRepo}
          nums={[
            ['1.17M', 'measurements'],
            ['501', 'genes'],
            ['~1.05M', 'parameters'],
          ]}
        >
          A mutation-response model over frozen ESM2 features, trained gene-held-out on a corpus I built and audited.
          It beats a zero-shot baseline on a held-out stability benchmark, but a 42-parameter ridge matches it, so
          there is no claim yet.
        </Specimen>
      </div>
    </section>
  )
}

function Record() {
  return (
    <section id="record" className="sec s-ink">
      <div className="wrap">
        <SecHead n="04" name="Patents and papers" />
        <ol className="record" data-reveal>
          {RECORD.map((r) => (
            <li key={r.title}>
              <span className="rec-id">{r.id}</span>
              <div>
                <p className="rec-title">{r.title}</p>
                <p className="rec-kind">{r.kind}</p>
              </div>
              <span className="rec-status">{r.status}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Builds() {
  return (
    <section id="builds" className="sec s-paper">
      <div className="wrap">
        <SecHead n="05" name="Builds" />
        <figure className="shot" data-reveal>
          <div className="shot-frame">
            <div className="shot-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>resqbox · localhost</span>
            </div>
            <img
              src="/shots/resqbox-orders.png"
              alt="ResQbox marketplace showing live pickup listings and an order waiting for the restaurant to accept"
              width="1440"
              height="960"
              loading="lazy"
            />
          </div>
          <figcaption>
            <strong>ResQbox, running for real.</strong> Live listings from its own API, and an order sitting in the
            pipeline waiting for the restaurant. A real screenshot from the repo, not a mock-up.
          </figcaption>
        </figure>
        <ol className="builds" data-reveal>
          {BUILDS.map((b) => {
            const inner = (
              <>
                <span className="b-name">{b.name}</span>
                <span className="b-text">{b.text}</span>
                <span className="b-tags">{b.tags}</span>
                <span className="b-link">{b.link ? `${b.linkText || 'repo'} ↗` : 'private'}</span>
              </>
            )
            return (
              <li key={b.name}>
                {b.link ? (
                  <a href={b.link} target="_blank" rel="noreferrer" data-cursor={b.linkText === 'site' ? 'visit' : 'github'}>
                    {inner}
                  </a>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            )
          })}
        </ol>
        <dl className="tools" data-reveal>
          {STACK.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const bigRef = useRef(null)
  useFit(bigRef, [
    ['.talk-1', 0.74, 40],
    ['.talk-2', 0.75, 40],
  ])
  async function copy() {
    try {
      await navigator.clipboard.writeText(LINKS.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${LINKS.email}`
    }
  }
  return (
    <section id="contact" className="sec s-signal contact">
      <div className="wrap">
        <SecHead n="06" name="Contact" />
        <a className="contact-big" href={`mailto:${LINKS.email}`} data-cursor="email" ref={bigRef}>
          <Kinetic text="LET'S" className="talk-1" wdth={[118, 125]} wght={[800, 900]} radius={220} />
          <Kinetic text="TALK" className="talk-2" wdth={[118, 125]} wght={[800, 900]} radius={220} />
        </a>
        <div className="contact-row">
          <button type="button" className="copy-btn" onClick={copy} data-cursor="copy">
            {copied ? 'Copied' : LINKS.email}
          </button>
          <a href={LINKS.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={LINKS.resume} target="_blank" rel="noreferrer" data-cursor="pdf">
            Resume
          </a>
        </div>
        <p className="contact-meta">Hyderabad, India. B.Tech CSE, Keshav Memorial Engineering College, 2028.</p>
      </div>
    </section>
  )
}

export default function App() {
  useReveal()
  useScrollLean()
  return (
    <>
      <Intro />
      <Cursor />
      <Progress />
      <Nav />
      <main>
        <Hero />
        <Purser />
        <Board />
        <Gait />
        <Lab />
        <Record />
        <Builds />
        <Contact />
      </main>
      <footer className="footer s-ink">
        <div className="wrap">
          <span>© 2026 Shabaz Ahmad Hasib</span>
          <span>Built by hand in React and canvas.</span>
        </div>
      </footer>
    </>
  )
}
