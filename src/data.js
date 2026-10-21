export const LINKS = {
  email: 'shabazahmad.me1@gmail.com',
  github: 'https://github.com/shabazahmadme1-eng',
  linkedin: 'https://linkedin.com/in/shabaz-ahmad-8a4941366',
  resume: '/Shabaz_Ahmad_Hasib_Resume.pdf',
  purser: 'https://purserflow.com',
  gaitRepo: 'https://github.com/shabazahmadme1-eng/explainable-asd-gait',
  gaitApp: 'https://github.com/shabazahmadme1-eng/asd-gait-screening',
  mipoRepo: 'https://github.com/shabazahmadme1-eng/ndd_training_corpus_v3_package',
  resqboxRepo: 'https://github.com/shabazahmadme1-eng/resqbox-submission',
  wobbleRepo: 'https://github.com/shabazahmadme1-eng/wobblewalk',
  dealRepo: 'https://github.com/shabazahmadme1-eng/deal-intelligence-agent',
  neuroSite: 'https://neuroparadigm.in',
}

export const PURSER_STACK =
  'TypeScript, Fastify, Supabase Postgres, Drizzle, Zod, Groq, Whisper, WhatsApp Cloud API, Cloud Run, Cloudflare Workers, Playwright'

export const RECORD = [
  {
    id: '202641080489 A',
    kind: 'Indian patent application, co-inventor',
    title: 'Browser-Based Real-Time Multimodal Skeletal Data Acquisition with Adaptive Quality Gating',
    status: 'Filed',
  },
  {
    id: '202641079295 A',
    kind: 'Indian patent application, co-inventor',
    title: 'Privacy-Preserving Child-Adaptive Webcam Eye-Tracking and Structured Gaze Data Export',
    status: 'Filed',
  },
  {
    id: 'Paper',
    kind: 'Neuroscience Informatics, co-author',
    title:
      'Interpretable fusion of learned and biomechanical skeletal gait representations for autism-related motor atypicality',
    status: 'Submitted',
  },
  {
    id: 'Paper',
    kind: 'Journal submission, co-author',
    title: 'Calibration-Invariant Webcam Eye-Tracking for Autism Screening',
    status: 'Under review',
  },
]

export const BUILDS = [
  {
    name: 'ResQbox',
    text: 'A marketplace backend where fifteen buyers racing for three units produce exactly three wins and twelve 409s. 73 tests.',
    tags: 'TypeScript · Fastify · SQLite',
    link: LINKS.resqboxRepo,
  },
  {
    name: 'NeuroParadigm',
    text: 'A 100-test Playwright suite and a 169-region MRI brain hero for the lab’s live website.',
    tags: 'React Three Fiber · Playwright',
    link: LINKS.neuroSite,
    linkText: 'site',
  },
  {
    name: 'WobbleWalk',
    text: 'Spin, walk a straight line, get a pose-tracked wobble score and one of twenty roasts.',
    tags: 'FastAPI · MediaPipe · React',
    link: LINKS.wobbleRepo,
  },
  {
    name: 'Deal Intelligence',
    text: 'A hackathon sales agent with memory, with a no-memory answer beside every one for comparison.',
    tags: 'FastAPI · Hindsight · Groq',
    link: LINKS.dealRepo,
  },
]

export const STACK = [
  ['Languages', 'Python, TypeScript, JavaScript, C++, SQL'],
  ['ML', 'PyTorch, MS-G3D / ST-GCN, XGBoost, LightGBM, CatBoost, EBM, TabICL, ESM2'],
  ['Backend', 'Node.js, Fastify, PostgreSQL, Supabase, Drizzle, Zod, Groq'],
  ['Vision & edge', 'YOLOv8, OpenCV, MediaPipe, ONNX, TensorRT, Jetson'],
  ['Infra', 'Docker, Cloud Run, Cloudflare Workers, GitHub Actions, Playwright'],
]
