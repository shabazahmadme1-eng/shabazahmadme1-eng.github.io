// Usage: node scripts/shot.mjs <outDir> [url]
// Needs `npm run build && npm run preview` running. Screenshots key views with Edge.
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] || '.'
const URL = process.argv[3] || 'http://localhost:4173/'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const slug = (s) => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' })
const errors = []

async function open(viewport) {
  const page = await browser.newPage()
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))
  await page.setViewport(viewport)
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  return page
}

async function at(page, sel, ms = 1300, block = 'start') {
  await page.evaluate(
    (s, b) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: b }),
    sel,
    block,
  )
  await wait(ms)
}

// desktop
{
  const page = await open({ width: 1440, height: 900, deviceScaleFactor: 1 })
  for (const [x, y] of [[260, 420], [262, 424], [520, 430], [522, 432], [700, 600], [380, 560]]) {
    await page.mouse.move(x, y, { steps: 6 })
    await wait(380)
  }
  await page.screenshot({ path: `${OUT}/d-00-hero.png` })
  const views = [
    ['#purser', 1300],
    ['.numerals', 1300],
    ['.purser-demo', 9000, 'center'],
    ['.metro', 2000, 'center'],
    ['.pull', 1300],
    ['.tiles', 1300, 'center'],
    ['#gait', 1300],
    ['.gait-stage', 1600, 'center'],
    ['.streams', 1300, 'center'],
    ['.gait-app', 1300, 'center'],
    ['#lab', 1600],
    ['.spec:nth-of-type(2)', 1500, 'center'],
    ['#record', 1300],
    ['.shot', 1300, 'center'],
    ['#builds', 1300],
    ['#contact', 1300],
  ]
  let i = 1
  for (const [sel, ms, block] of views) {
    await at(page, sel, ms, block)
    await page.screenshot({ path: `${OUT}/d-${String(i++).padStart(2, '0')}-${slug(sel)}.png` })
  }
  const ox = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log('desktop overflowX:', ox)

  // cursor: target lock on the hero CTA, with the hero's measuring hairlines
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await wait(800)
  const box = await (await page.$('.hero-jump a')).boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
  await wait(500)
  await page.screenshot({ path: `${OUT}/c-hot.png` })
  await page.close()
}

// mobile
{
  const page = await open({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await wait(2500)
  await page.screenshot({ path: `${OUT}/m-00-hero.png` })
  const views = ['.numerals', '.strip', '.purser-demo', '.metro', '#gait', '.streams', '.gait-app', '.shot', '.spec:nth-of-type(3)', '#builds', '#contact']
  let i = 1
  for (const sel of views) {
    await at(page, sel, sel === '.purser-demo' ? 6000 : 1300)
    await page.screenshot({ path: `${OUT}/m-${String(i++).padStart(2, '0')}-${slug(sel)}.png` })
  }
  const ox = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log('mobile overflowX:', ox)
  await page.close()
}

console.log(errors.length ? errors.join('\n') : 'no page errors')
await browser.close()
