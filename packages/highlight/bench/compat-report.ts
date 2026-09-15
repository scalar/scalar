/**
 * Swap report for `@scalar/code-highlight`.
 *
 * Answers the three questions a reviewer actually has before flipping
 * `ScalarCodeBlock` over to this package:
 *
 * 1. Which languages stop being highlighted?
 * 2. What changes visually on the languages that keep working?
 * 3. What does it cost, or save?
 *
 * The tests in `test/compat.test.ts` assert the parts that must not change.
 * This prints the parts that do.
 */
import '../src/all'

import { syntaxHighlight as referenceHighlight } from '@scalar/code-highlight/code'

import { syntaxHighlight } from '../src/compat/index'
import { standardLanguages, unsupportedLanguages } from '../src/compat/languages'
import { colorAgreement, colorPerCharacter } from '../test/colors'
import { referenceLanguages } from '../test/languages'
import { samples } from '../test/samples'

const BATCHES = 7
const MIN_MS = 100

/** Distinct token classes and how many spans carry each. */
const classHistogram = (html: string): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const match of html.matchAll(/<span class="(hljs-[^"]*)">/g)) {
    const cls = match[1]!
    counts.set(cls, (counts.get(cls) ?? 0) + 1)
  }
  return counts
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[sorted.length >> 1]!
}

/** Median bytes/second over several batches, warmed up first. */
const throughput = (run: () => void, bytes: number): number => {
  for (let i = 0; i < 20; i++) run()

  const rates: number[] = []
  for (let batch = 0; batch < BATCHES; batch++) {
    let iterations = 0
    const start = process.hrtime.bigint()
    let elapsed = 0n
    do {
      run()
      iterations++
      elapsed = process.hrtime.bigint() - start
    } while (elapsed < BigInt(MIN_MS) * 1_000_000n)
    rates.push((bytes * iterations) / (Number(elapsed) / 1e9))
  }
  return median(rates)
}

const mb = (bytesPerSecond: number): string => {
  return `${(bytesPerSecond / 1e6).toFixed(1)} MB/s`
}

// --- 1. language coverage --------------------------------------------------

const covered = Object.entries(standardLanguages)
  .filter(([, grammar]) => grammar !== null)
  .map(([name]) => name)

console.log('## Language coverage\n')
console.log(`standardLanguages entries: ${Object.keys(standardLanguages).length}`)
console.log(`covered by a bundled grammar: ${covered.length}`)
console.log(`  ${covered.join(', ')}\n`)
console.log(`not covered: ${unsupportedLanguages.length}`)
console.log(`  ${unsupportedLanguages.join(', ')}\n`)

// --- 2. what changes on the languages we do cover --------------------------

console.log('## What changes on screen\n')
console.log('Share of non-whitespace characters `code.css` paints the same colour')
console.log('before and after the swap.\n')
console.log('| language | colour agreement | spans before | spans after | classes only before | classes only after |')
console.log('| --- | ---: | ---: | ---: | --- | --- |')

let totalCompared = 0
let totalDiffering = 0

for (const [lang, code] of Object.entries(samples)) {
  const options = { lang, languages: referenceLanguages }
  const beforeHtml = referenceHighlight(code, options)
  const afterHtml = syntaxHighlight(code, options)

  const before = classHistogram(beforeHtml)
  const after = classHistogram(afterHtml)
  const { agreement, compared, differing } = colorAgreement(beforeHtml, afterHtml)

  totalCompared += compared
  totalDiffering += differing

  const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0)
  const onlyBefore = [...before.keys()].filter((c) => !after.has(c))
  const onlyAfter = [...after.keys()].filter((c) => !before.has(c))

  console.log(
    `| ${lang} | ${(agreement * 100).toFixed(1)}% | ${sum(before)} | ${sum(after)} | ` +
      `${onlyBefore.join(' ') || '—'} | ${onlyAfter.join(' ') || '—'} |`,
  )
}

const overall = (totalCompared - totalDiffering) / totalCompared
console.log(
  `\noverall: ${(overall * 100).toFixed(1)}% ` +
    `(${totalDiffering} of ${totalCompared} visible characters change colour)`,
)

// --- 2b. where the colour changes come from, with `--detail` ---------------

if (process.argv.includes('--detail')) {
  /** Colour transitions, grouped, so the cheap mapping fixes stand out. */
  const drift = new Map<string, { chars: number; examples: Set<string> }>()

  for (const [lang, code] of Object.entries(samples)) {
    const options = { lang, languages: referenceLanguages }
    const a = colorPerCharacter(referenceHighlight(code, options))
    const b = colorPerCharacter(syntaxHighlight(code, options))

    // Walk runs of consecutive differing characters so the examples are words,
    // not letters.
    let run = ''
    let key = ''

    const close = () => {
      if (!run.trim()) {
        run = ''
        return
      }
      const entry = drift.get(key) ?? { chars: 0, examples: new Set<string>() }
      entry.chars += run.length
      if (entry.examples.size < 6) entry.examples.add(`${lang}:${run.trim()}`)
      drift.set(key, entry)
      run = ''
    }

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const from = a[i]!.color
      const to = b[i]!.color
      const next = `${from} -> ${to}`

      if (from === to) {
        close()
        continue
      }
      if (next !== key) {
        close()
        key = next
      }
      run += a[i]!.char
    }
    close()
  }

  console.log('\n## Colour drift by transition\n')
  console.log('| was | now | characters | examples |')
  console.log('| --- | --- | ---: | --- |')

  for (const [key, { chars, examples }] of [...drift].sort((x, y) => y[1].chars - x[1].chars)) {
    const [from, to] = key.split(' -> ')
    console.log(`| ${from} | ${to} | ${chars} | ${[...examples].join(', ')} |`)
  }
}

// --- 3. cost --------------------------------------------------------------

const bytes = Object.values(samples).reduce((total, code) => total + code.length, 0)
const entries = Object.entries(samples).map(([lang, code]) => ({
  lang,
  code,
  options: { lang, languages: referenceLanguages },
}))

const beforeRate = throughput(() => {
  for (const { code, options } of entries) referenceHighlight(code, options)
}, bytes)

const afterRate = throughput(() => {
  for (const { code, options } of entries) syntaxHighlight(code, options)
}, bytes)

console.log('\n## Throughput, whole corpus, source in and HTML out\n')
console.log('| pipeline | rate |')
console.log('| --- | ---: |')
console.log(`| @scalar/code-highlight (lowlight + rehype) | ${mb(beforeRate)} |`)
console.log(`| @scalar/highlight/compat | ${mb(afterRate)} |`)
console.log(`\nspeedup: ${(afterRate / beforeRate).toFixed(1)}×`)
