/**
 * Swap report against the deleted `@scalar/code-highlight`.
 *
 * Answers the two questions a reviewer has about what the swap changed:
 *
 * 1. Which languages stopped being highlighted?
 * 2. What changed visually on the languages that kept working?
 *
 * The tests in `src/compat/compat.test.ts` assert the parts that must not
 * change. This prints the parts that do. The "before" side is the lowlight
 * output frozen in `test/reference.json`, since the package itself is gone.
 */
import '../src/all'

import { syntaxHighlight } from '../src/compat/index'
import { standardLanguages, unsupportedLanguages } from '../src/compat/languages'
import { colorAgreement, colorPerCharacter } from '../test/colors'
import { referenceSample } from '../test/reference'
import { samples } from '../test/samples'

/** Distinct token classes and how many spans carry each. */
const classHistogram = (html: string): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const match of html.matchAll(/<span class="(hljs-[^"]*)">/g)) {
    const cls = match[1]!
    counts.set(cls, (counts.get(cls) ?? 0) + 1)
  }
  return counts
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
  const beforeHtml = referenceSample(lang, code).html
  const afterHtml = syntaxHighlight(code, { lang })

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
    const a = colorPerCharacter(referenceSample(lang, code).html)
    const b = colorPerCharacter(syntaxHighlight(code, { lang }))

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
      if (entry.examples.size < 6) {
        entry.examples.add(`${lang}:${run.trim()}`)
      }
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
