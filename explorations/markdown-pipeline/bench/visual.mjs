/**
 * Renders both pipelines' HTML in Chromium with Scalar's real styles (themes,
 * components, code highlighting) and compares screenshots byte for byte.
 *
 *   node bench/visual.mjs same <label> [count]   documents whose normalized DOM matched
 *   node bench/visual.mjs diff <label> [count]   documents whose normalized DOM differed
 *
 * `same` checks the normalizer: if two outputs it calls equal render
 * differently, it hides a visible change. `diff` shows which DOM differences
 * are visible at all, per bucket. The raw output is rendered, not the
 * normalized one, the way `ScalarMarkdown` renders it (images removed).
 * Screenshots of differing pairs go to `.out/visual/<label>/`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { bucketOf } from './classify.mjs'
import { BASELINE, OUT, PROTOTYPE, ROOT } from './paths.mjs'

const [mode, label, count = '2000'] = process.argv.slice(2)
const { chromium } = await import(`${ROOT}node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs`)
const current = await import(BASELINE)
const prototype = await import(PROTOTYPE)
const OPTIONS = { removeTags: ['img', 'picture'] }
const PLAIN = /^[^\n`*_[\]<>&#~|\\]*$/

const corpus = JSON.parse(readFileSync(`${OUT}${label}.json`, 'utf8')).map((x) => (Array.isArray(x) ? x[0] : x))
const run = JSON.parse(readFileSync(`${OUT}${label}-diffs.json`, 'utf8'))
const differing = new Set(run.different.map((d) => d.markdown))

// A fixed, spread-out sample (every k-th item), so reruns compare the same documents.
const pick = (list, n) => {
  const step = Math.max(1, Math.floor(list.length / n))
  return list.filter((_, i) => i % step === 0).slice(0, n)
}
const items =
  mode === 'same'
    ? pick(
        [...new Set(corpus)].filter((md) => !differing.has(md) && !PLAIN.test(md)),
        Number(count),
      ).map((markdown) => ({
        markdown,
        bucket: 'same DOM',
      }))
    : pick(run.different, Number(count)).map((d) => ({ markdown: d.markdown, bucket: bucketOf(d) }))

const css = [
  'packages/themes/dist/style.css',
  'packages/components/dist/style.css',
  'packages/code-highlight/dist/css/code.css',
]
  .map((f) => readFileSync(ROOT + f, 'utf8'))
  .join('\n')
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 })
// Nothing loads from the network, so both sides render the same placeholders.
await page.route('**/*', (route) => (route.request().url().startsWith('data:') ? route.continue() : route.abort()))
await page.setContent(
  `<!doctype html><html class="light-mode"><head><style>${css}</style></head><body class="light-mode" style="margin:0;background:#fff"><div class="scalar-app" style="width:720px;padding:16px"><div id="m" class="markdown"></div></div></body></html>`,
)
const shot = async (html) => {
  await page.evaluate((h) => {
    document.getElementById('m').innerHTML = h
  }, html)
  // The padded container, never empty: an element without a box cannot be captured.
  return page.locator('.scalar-app').screenshot({ animations: 'disabled' })
}

const dir = `${OUT}visual/${label}-${mode}/`
mkdirSync(dir, { recursive: true })
const tally = {}
const visible = []
for (const [i, { markdown, bucket }] of items.entries()) {
  let a
  try {
    a = current.htmlFromMarkdown(markdown, OPTIONS)
  } catch {
    continue
  }
  const b = prototype.htmlFromMarkdown(markdown, OPTIONS)
  const t = (tally[bucket] ??= { rendered: 0, visible: 0 })
  t.rendered++
  const [sa, sb] = [await shot(a), await shot(b)]
  if (!sa.equals(sb)) {
    t.visible++
    const n = String(visible.length).padStart(4, '0')
    writeFileSync(`${dir}${n}-current.png`, sa)
    writeFileSync(`${dir}${n}-prototype.png`, sb)
    visible.push({ n, bucket, markdown: markdown.slice(0, 2000) })
  }
  if ((i + 1) % 250 === 0) process.stdout.write(`  ${i + 1}/${items.length}\n`)
}
await browser.close()
writeFileSync(`${dir}index.json`, JSON.stringify(visible, null, 2))
console.log(`${label} ${mode}: ${items.length} documents`)
for (const [bucket, t] of Object.entries(tally))
  console.log(`  ${bucket.padEnd(40)} ${t.rendered} rendered, ${t.visible} look different`)
