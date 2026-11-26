/**
 * Renders a corpus through both pipelines and compares the normalized DOM.
 *
 *   node bench/differential.mjs <corpus.json> <label>
 *
 * The corpus is a JSON array of strings or `[markdown, source]` pairs. Each
 * item is rendered with ScalarMarkdown's default options and with images kept.
 * Work runs on a pool of worker threads; an item that takes longer than
 * TIMEOUT_MS in either pipeline (the current one can take minutes on hostile
 * input) has its worker killed and is reported as a timeout, not a difference.
 * Differences go to `.out/<label>-diffs.json`.
 *
 * With `SHIPPED=1`, both sides highlight code blocks: `@scalar/markdown`'s
 * `htmlFromMarkdown` against the unified renderer with `rehypeHighlight`. A
 * difference that the unhighlighted pair does not show is marked
 * `highlightOnly`, because highlighting is what causes it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

import { BASELINE, BASELINE_HIGHLIGHTED, OUT, PROTOTYPE, SHIPPED } from './paths.mjs'

const WITH_HIGHLIGHTING = process.env.SHIPPED === '1'

const TIMEOUT_MS = 30_000
const OPTIONS = { default: { removeTags: ['img', 'picture'] }, withImages: { removeTags: [] } }

if (!isMainThread) {
  const { normalize } = await import('./normalize.mjs')
  const current = await import(WITH_HIGHLIGHTING ? BASELINE_HIGHLIGHTED : BASELINE)
  const prototype = await import(WITH_HIGHLIGHTING ? SHIPPED : PROTOTYPE)
  const plain = WITH_HIGHLIGHTING ? [await import(BASELINE), await import(PROTOTYPE)] : null
  const same = ([a, b], markdown, options) => {
    try {
      return normalize(a.htmlFromMarkdown(markdown, options)) === normalize(b.htmlFromMarkdown(markdown, options))
    } catch {
      return false
    }
  }
  parentPort.on('message', ({ i, markdown }) => {
    const result = { i, diffs: [], ms: [0, 0] }
    for (const [name, options] of Object.entries(OPTIONS)) {
      let t = performance.now()
      let a
      try {
        a = normalize(current.htmlFromMarkdown(markdown, options))
      } catch (e) {
        a = `THREW ${e?.constructor?.name}`
      }
      result.ms[0] += performance.now() - t
      t = performance.now()
      let b
      try {
        b = normalize(prototype.htmlFromMarkdown(markdown, options))
      } catch (e) {
        b = `THREW ${e?.constructor?.name}: ${e?.message}`
      }
      result.ms[1] += performance.now() - t
      if (a !== b) {
        const highlightOnly = plain ? same(plain, markdown, options) : undefined
        result.diffs.push({ options: name, current: a, prototype: b, highlightOnly })
      }
    }
    parentPort.postMessage(result)
  })
} else {
  const [file, label = 'corpus'] = process.argv.slice(2)
  const items = JSON.parse(readFileSync(file, 'utf8')).map((x) => (Array.isArray(x) ? x : [x, '']))
  const out = { label, total: items.length, identical: 0, different: [], timeouts: [], threw: [], ms: [0, 0] }
  if (WITH_HIGHLIGHTING) console.log(`${label}: comparing what ships, with highlighting`)
  let next = 0
  let finished = 0
  const t0 = Date.now()
  const start = () =>
    new Promise((resolve) => {
      let current = -1
      let timer
      let w
      const spawn = () => {
        w = new Worker(new URL(import.meta.url))
        w.on('message', (r) => {
          clearTimeout(timer)
          const [markdown, source] = items[r.i]
          out.ms[0] += r.ms[0]
          out.ms[1] += r.ms[1]
          if (r.diffs.length === 0) out.identical++
          else if (r.diffs.some((d) => d.prototype.startsWith('THREW')))
            out.threw.push({ source, markdown, ...r.diffs[0] })
          else out.different.push({ source, markdown, diffs: r.diffs })
          if (++finished % 2000 === 0)
            console.log(`  ${finished}/${items.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
          feed()
        })
        w.on('error', (e) => console.error('worker error', e))
      }
      const feed = () => {
        if (next >= items.length) {
          w.terminate()
          return resolve()
        }
        current = next++
        timer = setTimeout(async () => {
          out.timeouts.push({ source: items[current][1], markdown: items[current][0] })
          finished++
          await w.terminate()
          spawn()
          feed()
        }, TIMEOUT_MS)
        w.postMessage({ i: current, markdown: items[current][0] })
      }
      spawn()
      feed()
    })
  await Promise.all(Array.from({ length: Math.max(1, availableParallelism()) }, start))
  writeFileSync(`${OUT}${label}-diffs.json`, JSON.stringify(out, null, 1))
  const pct = ((100 * out.identical) / out.total).toFixed(3)
  if (WITH_HIGHLIGHTING) {
    const highlightOnly = out.different.filter((d) => d.diffs.some((x) => x.highlightOnly)).length
    console.log(`${label}: ${highlightOnly} differences come from highlighting alone`)
  }
  console.log(
    `${label}: ${out.identical}/${out.total} identical (${pct}%), ${out.different.length} different, ${out.threw.length} prototype threw, ${out.timeouts.length} timed out; render time current ${(out.ms[0] / 1000).toFixed(1)}s, prototype ${(out.ms[1] / 1000).toFixed(1)}s (${((Date.now() - t0) / 1000).toFixed(0)}s wall)`,
  )
}
