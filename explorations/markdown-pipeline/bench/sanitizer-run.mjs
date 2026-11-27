/**
 * Runs every vector from `bench/sanitizer-suites.mjs` through what
 * `@scalar/markdown` ships, in each Markdown context a description can put it
 * in, and checks the output two independent ways:
 *
 * 1. The policy check from `bench/security.mjs`: parse5 builds the tree (with
 *    scripting on and off) and every element, attribute and URL is checked
 *    against an independent copy of the allowlist.
 * 2. Real Chromium. Each output loads in its own `srcdoc` iframe with `alert`,
 *    `confirm`, `prompt` and `print` trapped and the network blocked, so error
 *    handlers fire at once. Any trapped call or browser dialog is a hit. Once
 *    loaded, the DOM the browser built is audited for event handlers,
 *    script-capable elements and script URLs.
 *
 *   node bench/sanitizer-run.mjs [--baseline] [--policy-only]
 *
 * `--baseline` also runs the unified renderer, so a hit can be compared with
 * what shipped before. Hits go to `.out/sanitizer-hits.json`.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

import { BASELINE_HIGHLIGHTED, OUT, ROOT, SHIPPED } from './paths.mjs'
import { problems } from './security.mjs'

const withBaseline = process.argv.includes('--baseline')
const vectors = JSON.parse(readFileSync(`${OUT}sanitizer-vectors.json`, 'utf8'))
const renderers = { shipped: await import(SHIPPED) }
if (withBaseline) renderers.baseline = await import(BASELINE_HIGHLIGHTED)

/** Where a description can put an attacker's string. */
const CONTEXTS = {
  raw: (v) => v,
  inline: (v) => `x ${v} y`,
  'list item': (v) => `- ${v}`,
  'table cell': (v) => `| a |\n| - |\n| ${v.replace(/\n/g, ' ')} |`,
  alert: (v) => `> [!NOTE]\n> ${v.replace(/\n/g, '\n> ')}`,
  'link destination': (v) => `[x](${v})`,
  'link destination <>': (v) => `[x](<${v}>)`,
  'image destination': (v) => `![x](${v})`,
  autolink: (v) => `<${v}>`,
  reference: (v) => `[x]\n\n[x]: ${v}`,
  footnote: (v) => `x[^1]\n\n[^1]: ${v}`,
  'inside raw <p>': (v) => `<p>*a* ${v}</p>`,
  'inside <details>': (v) => `<details><summary>x</summary>\n\n${v}\n\n</details>`,
  'after an open <div>': (v) => `<div>\n\n${v}`,
  'fence info string': (v) => `\`\`\`${v.replace(/\n/g, ' ')}\nx\n\`\`\``,
  'raw code block': (v) => `<pre><code class="language-html">${v}</code></pre>`,
}
const OPTION_SETS = { default: { removeTags: ['img', 'picture'] }, withImages: { removeTags: [] } }

// Render everything first, deduplicating outputs, which repeat a lot across contexts.
const outputs = new Map()
let rendered = 0
const policyHits = []
const t0 = Date.now()
for (const [vector, source] of vectors) {
  for (const [context, wrap] of Object.entries(CONTEXTS)) {
    const markdown = wrap(vector)
    for (const [optionName, options] of Object.entries(OPTION_SETS)) {
      for (const [renderer, { htmlFromMarkdown }] of Object.entries(renderers)) {
        rendered++
        let html
        try {
          html = htmlFromMarkdown(markdown, options)
        } catch (error) {
          if (renderer === 'shipped') policyHits.push({ renderer, source, context, markdown, error: String(error) })
          continue
        }
        const key = `${renderer}\0${optionName}\0${html}`
        if (outputs.has(key)) continue
        outputs.set(key, { renderer, source, context, optionName, markdown, html })
      }
    }
  }
}
console.log(
  `${vectors.length} vectors × ${Object.keys(CONTEXTS).length} contexts × 2 option sets: ${rendered} renders, ${outputs.size} distinct outputs (${((Date.now() - t0) / 1000).toFixed(0)}s)`,
)

// 1. The policy check. Restructuring by the browser (tables, misnesting) and parse5's dropped
//    newline after `<pre>` are fidelity, not safety, and are counted separately.
const FIDELITY = /^(restructured|reparse not stable|unbalanced|unclosed)/
const fidelity = { shipped: 0, baseline: 0 }
for (const o of outputs.values()) {
  const removed = OPTION_SETS[o.optionName].removeTags
  const errs = [...new Set(problems(o.html, removed))]
  const unsafe = errs.filter((e) => !FIDELITY.test(e))
  if (errs.length > unsafe.length) fidelity[o.renderer]++
  if (unsafe.length) policyHits.push({ ...o, errs: unsafe })
}
const count = (list, renderer) => list.filter((h) => h.renderer === renderer).length
console.log(
  `policy check: shipped ${count(policyHits, 'shipped')} violations (${fidelity.shipped} fidelity-only)` +
    (withBaseline ? `, baseline ${count(policyHits, 'baseline')} violations (${fidelity.baseline} fidelity-only)` : ''),
)

if (process.argv.includes('--policy-only')) {
  writeFileSync(`${OUT}sanitizer-hits.json`, JSON.stringify({ policyHits }, null, 1))
  console.log(
    'policy hits, shipped, by kind:',
    [...new Set(policyHits.filter((h) => h.renderer === 'shipped').flatMap((h) => h.errs ?? [h.error]))].slice(0, 20),
  )
  process.exit(0)
}

// 2. Real Chromium.
const playwright = readdirSync(`${ROOT}node_modules/.pnpm`).find((d) => /^playwright@\d/.test(d))
const { chromium } = await import(`${ROOT}node_modules/.pnpm/${playwright}/node_modules/playwright/index.mjs`)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
const dialogs = []
page.on('dialog', async (d) => {
  dialogs.push(d.message())
  await d.dismiss().catch(() => {})
})
await page.route('**/*', (route) => (route.request().url().startsWith('data:') ? route.continue() : route.abort()))
await page.setContent('<!doctype html><title>sanitizer</title><body></body>')

/**
 * Positive controls: unsanitized HTML the browser check must flag, each in its own way.
 * If any comes back clean, the check is broken and its zero would mean nothing.
 */
const CONTROLS = [
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  '<svg onload=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<iframe srcdoc="x"></iframe>',
  '<p style="color:red">x</p>',
  '<details open ontoggle=confirm(1)>',
  '<math><mi>x</mi></math>',
  '<form><button formaction=javascript:alert(1)>x</button></form>',
  // Writes one end tag the browser has already applied, so the second closes the container.
  '<table><div><table></table></div></table>',
]
const controls = CONTROLS.map((html) => ({ renderer: 'control', html }))
const list = [...controls, ...outputs.values()]
const browserHits = []
const BATCH = 100
for (let i = 0; i < list.length; i += BATCH) {
  const batch = list.slice(i, i + BATCH)
  const before = dialogs.length
  const found = await page.evaluate(
    async (items) => {
      const hits = []
      window.__hit = (id, how) => hits.push([id, `called ${how}`])
      const hook = (id) =>
        `<script data-hook>for (const f of ['alert', 'confirm', 'prompt', 'print']) window[f] = () => parent.__hit(${id}, f)</script>`
      const frames = items.map(({ id, html }) => {
        const f = document.createElement('iframe')
        // Scripts run, so any that the output smuggles in executes; the sandbox only stops it navigating this page.
        f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals')
        // Inside a host, as a server-rendered page concatenates it: the output must not close the
        // container, which the marker after it and the sibling after the container show.
        f.srcdoc = `<!doctype html><meta charset="utf-8">${hook(id)}<body><div id="__h"><div id="__m">${html}<i id="__z"></i></div><p id="__s"></p></div></body>`
        document.body.append(f)
        return new Promise((resolve) => {
          const done = () => resolve([id, f])
          f.addEventListener('load', done, { once: true })
          setTimeout(done, 3000)
        })
      })
      const loaded = await Promise.all(frames)
      // Let error and load handlers, which fire after the frame's own load, run.
      await new Promise((r) => setTimeout(r, 50))
      const URL_ATTRS = [
        'href',
        'src',
        'action',
        'formaction',
        'xlink:href',
        'background',
        'poster',
        'data',
        'srcset',
        'cite',
        'longdesc',
      ]
      const DANGEROUS = new Set([
        'script',
        'iframe',
        'frame',
        'object',
        'embed',
        'applet',
        'base',
        'meta',
        'link',
        'style',
        'form',
        'button',
        'textarea',
        'select',
        'svg',
        'math',
        'template',
        'noscript',
        'portal',
        'frameset',
      ])
      for (const [id, f] of loaded) {
        const doc = f.contentDocument
        if (!doc) continue
        const host = doc.getElementById('__h')
        const container = doc.getElementById('__m')
        const marker = doc.getElementById('__z')
        if (!container || !marker || !container.contains(marker))
          hits.push([id, 'escapes container: content after the output left it'])
        if (!host || doc.getElementById('__s')?.parentNode !== host)
          hits.push([id, 'escapes container: the next sibling moved'])
        for (const el of doc.body?.querySelectorAll('*') ?? []) {
          if (el.hasAttribute('data-hook') || ['__h', '__m', '__z', '__s'].includes(el.id)) continue
          const tag = el.localName
          if (DANGEROUS.has(tag)) hits.push([id, `element <${tag}>`])
          if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') hits.push([id, `foreign element <${tag}>`])
          for (const a of el.attributes) {
            const name = a.name.toLowerCase()
            if (name.startsWith('on')) hits.push([id, `handler ${name} on <${tag}>`])
            if (name === 'style' || name === 'srcdoc' || name === 'formaction' || name === 'is')
              hits.push([id, `attribute ${name} on <${tag}>`])
            if (
              URL_ATTRS.includes(name) &&
              /^\s*(javascript|vbscript|data|livescript|mocha):/i.test(a.value.replace(/[\u0000- ]/g, ''))
            )
              hits.push([id, `${name}=${a.value.slice(0, 60)}`])
          }
        }
        f.remove()
      }
      return hits
    },
    batch.map((o, k) => ({ id: i + k, html: o.html })),
  )
  for (const [id, how] of found) browserHits.push({ ...list[id], how })
  if (dialogs.length > before) browserHits.push({ batch: i, how: `${dialogs.length - before} real dialogs` })
  if ((i / BATCH) % 100 === 0) process.stdout.write(`  ${i}/${list.length}\n`)
}
await browser.close()

const byKind = (hits) => {
  const t = {}
  for (const h of hits) {
    const k = (h.how ?? h.errs?.join('; ') ?? h.error).replace(/=.*$/, '=…').replace(/<[^>]*>$/, '<…>')
    t[k] = (t[k] ?? 0) + 1
  }
  return t
}
const missed = controls.filter((_, k) => !browserHits.some((h) => h.renderer === 'control' && h.html === CONTROLS[k]))
console.log(
  `positive controls: ${controls.length - missed.length}/${controls.length} flagged`,
  missed.map((c) => c.html),
)
if (missed.length) process.exitCode = 1
for (const renderer of Object.keys(renderers)) {
  const hits = browserHits.filter((h) => h.renderer === renderer || h.batch !== undefined)
  console.log(`chromium, ${renderer}: ${hits.length} hits`, byKind(hits))
}
writeFileSync(`${OUT}sanitizer-hits.json`, JSON.stringify({ policyHits, browserHits }, null, 1))
console.log('policy hits, shipped, by kind:', byKind(policyHits.filter((h) => h.renderer === 'shipped')))
