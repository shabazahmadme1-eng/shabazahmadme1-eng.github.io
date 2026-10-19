// Copy for the two flagship sections. Every number was read from the project
// repos; client names, hosts and internal limits are left out on purpose.

export const PURSER_STATIONS = [
  ['Guest sends', 'text or voice note'],
  ['Signature check', 'HMAC on raw bytes, per hotel'],
  ['Store, dedupe, enqueue', 'one Postgres transaction'],
  ['Durable worker', 'SKIP LOCKED + lease'],
  ['Route', 'LLM, strict JSON schema', 'model'],
  ['Decide & compose', 'plain code', 'code'],
  ['Allowed to send?', 'pause, caps, 24-h window'],
  ['Delivered', 'receipt lands on the trace'],
]

export const PURSER_CHECKS = [
  ['110/110', 'messages with several requests, routed right'],
  ['102/102', 'food orders, incl. changes under a waiting bill'],
  ['155/155', 'owner questions about the hotel'],
]

export const PURSER_PROBLEMS = [
  ['key', 'Signatures, per hotel', 'Meta signs raw bytes, so each hotel gets an opaque webhook path that picks its own secret before anything is parsed.'],
  ['queue', 'No message lost', 'The job is queued in the same transaction that stores the message, then claimed with SKIP LOCKED and a lease.'],
  ['voices', 'Never two voices', 'When staff take over a chat, a handling epoch fences any AI reply already waiting to send.'],
  ['wave', '“Pillow” heard as “blue”', 'Hindi voice notes came back in Urdu script. A romanising pass that must keep every number intact fixed it.'],
]

export const GAIT_RIGOR = [
  'Every view of a child stays in one fold, and scores are averaged per child.',
  'The README lists its own optimism: the non-nested fusion search and in-sample EBM fidelity.',
  'Failed attempts — a CNN that saturated on phone video, DANN, AdaBN — are kept, not hidden.',
]
