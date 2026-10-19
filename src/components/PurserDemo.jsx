import { useEffect, useRef, useState } from 'react'

// A scripted replay: what the guest sees on WhatsApp, next to the backend
// trace the same conversation produces. Illustrative — no real guest data.
const SCRIPT = [
  { d: 500, msg: { kind: 'sys', text: 'Guest joined from the Room 312 QR code' } },
  { d: 350, trace: ['room_qr.claimed', 'room 312 · stay matched'] },
  { d: 900, msg: { kind: 'guest', text: 'hi! can we get 2 extra towels?' } },
  { d: 240, trace: ['webhook_received', 'POST /webhooks/whatsapp/:id'] },
  { d: 200, trace: ['signature_verified', 'HMAC-SHA256 · raw bytes'] },
  { d: 220, trace: ['raw_event_persisted', 'new · job enqueued'] },
  { d: 160, trace: ['webhook_acknowledged', '200'] },
  { d: 380, trace: ['route_message', 'ask → housekeeping'] },
  { d: 260, trace: ['service_request', 'created once · idempotent'] },
  { d: 200, trace: ['staff.notified', 'Accept / Done template'] },
  { d: 150, typing: true },
  { d: 1100, msg: { kind: 'bot', text: "On it. Housekeeping has your request for Room 312 — I'll tell you when it's on the way." } },
  { d: 200, trace: ['outbound_status_updated', 'delivered'] },
  { d: 1500, msg: { kind: 'guest', text: 'also one masala chai and a veg sandwich please' } },
  { d: 380, trace: ['food.order', 'menu items 4, 11 · no prices from the model'] },
  { d: 260, trace: ['kitchen.ticket', 'sent'] },
  { d: 240, trace: ['bill.updated', 'total computed in code'] },
  { d: 150, typing: true },
  { d: 1200, msg: { kind: 'bot', text: 'Added: 1 masala chai, 1 veg sandwich, about 15 min. Your bill so far is ₹260.', pay: 'Pay ₹260' } },
  { d: 200, trace: ['outbound_status_updated', 'delivered'] },
  { d: 1700, msg: { kind: 'tap', text: 'Pay ₹260' } },
  { d: 900, trace: ['payment.webhook', 'HMAC ok · captured'] },
  { d: 260, trace: ['bill.settled', 'credited exactly once'] },
  { d: 200, msg: { kind: 'sys', text: 'Payment received · ₹260' } },
  { d: 150, typing: true },
  { d: 1000, msg: { kind: 'bot', text: 'Paid, thank you! Your towels are on the way.' } },
  { d: 300, trace: ['run saved', 'every event replayable in the Lab'], done: true },
]

function Message({ m }) {
  if (m.kind === 'sys') return <div className="msg sys">{m.text}</div>
  if (m.kind === 'tap')
    return (
      <div className="msg guest tap">
        <span aria-hidden="true">↳ </span>
        {m.text}
      </div>
    )
  return (
    <div className={`msg ${m.kind}`}>
      {m.text}
      {m.pay && <span className="pay">{m.pay}</span>}
    </div>
  )
}

export default function PurserDemo() {
  const [chat, setChat] = useState([])
  const [trace, setTrace] = useState([])
  const [typing, setTyping] = useState(false)
  const rootRef = useRef(null)
  const chatRef = useRef(null)
  const run = useRef({ i: 0, timer: 0, t0: 0, pausedAt: 0, visible: false })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChat(SCRIPT.filter((e) => e.msg).map((e, i) => ({ ...e.msg, id: i })))
      let at = 0
      setTrace(
        SCRIPT.map((e) => ((at += e.d), { ...e, at }))
          .filter((e) => e.trace)
          .slice(-13)
          .map((e, i) => ({ op: e.trace[0], res: e.trace[1], at: e.at, id: i, done: e.done })),
      )
      return
    }
    const r = run.current
    // pre-fill the first exchange so the phone and trace never sit empty
    const SEED = SCRIPT.findIndex((e) => e.msg && e.msg.kind === 'bot') + 2
    if (r.i === 0) {
      let at = 0
      const chat0 = []
      const trace0 = []
      SCRIPT.slice(0, SEED).forEach((e, i) => {
        at += e.d
        if (e.msg) chat0.push({ ...e.msg, id: i + 1 })
        if (e.trace) trace0.push({ op: e.trace[0], res: e.trace[1], at, id: i + 1 })
      })
      setChat(chat0)
      setTrace(trace0)
      r.i = SEED
      r.seedAt = at
    }
    function step() {
      if (!r.visible) return
      if (r.i >= SCRIPT.length) {
        r.timer = setTimeout(() => {
          r.i = 0
          r.t0 = performance.now()
          setChat([])
          setTrace([])
          setTyping(false)
          step()
        }, 3800)
        return
      }
      const e = SCRIPT[r.i]
      r.timer = setTimeout(() => {
        r.i += 1
        const id = r.i
        if (e.msg) {
          setTyping(false)
          setChat((c) => [...c, { ...e.msg, id }])
        }
        if (e.typing) setTyping(true)
        if (e.trace) {
          const at = performance.now() - r.t0
          setTrace((t) => [...t.slice(-12), { op: e.trace[0], res: e.trace[1], at, id, done: e.done }])
        }
        step()
      }, e.d)
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        r.visible = entry.isIntersecting
        clearTimeout(r.timer)
        if (r.visible) {
          // the trace clock stands still while the demo is offscreen
          if (!r.t0) r.t0 = performance.now() - (r.seedAt || 0)
          else if (r.pausedAt) r.t0 += performance.now() - r.pausedAt
          r.pausedAt = 0
          step()
        } else if (r.t0) {
          r.pausedAt = performance.now()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(rootRef.current)
    return () => {
      io.disconnect()
      clearTimeout(r.timer)
    }
  }, [])

  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat, typing])

  return (
    <div className="purser-demo" ref={rootRef}>
      <div className="phone" data-cursor="demo replay">
        <div className="phone-screen">
          <div className="phone-status">
            <span>9:41</span>
            <span className="phone-notch" aria-hidden="true" />
            <span>5G ▮▮▮</span>
          </div>
          <div className="phone-head">
            <span className="phone-avatar" aria-hidden="true">FD</span>
            <div>
              <strong>Front desk</strong>
              <small>online · replies via Purser</small>
            </div>
          </div>
          <div className="chat" ref={chatRef} aria-live="off">
            {chat.map((m) => (
              <Message key={m.id} m={m} />
            ))}
            {typing && (
              <div className="msg bot typing" aria-label="typing">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
          <div className="phone-input" aria-hidden="true">
            <span>Message</span>
            <i>●</i>
          </div>
        </div>
      </div>

      <div className="term">
        <div className="term-head">
          <span className="term-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>lab · live trace</span>
          <span className="term-live">
            <span className="rec" aria-hidden="true" /> live
          </span>
        </div>
        <div className="term-body">
          {trace.map((t) => (
            <div key={t.id} className={`tline${t.done ? ' done' : ''}`}>
              <span className="ts">+{(t.at / 1000).toFixed(3)}s</span>
              <span className="op">{t.op}</span>
              <span className="res">{t.res}</span>
            </div>
          ))}
          <div className="tcursor" aria-hidden="true">▍</div>
        </div>
        <div className="term-foot">demo replay · illustrative conversation, no guest data</div>
      </div>
    </div>
  )
}
