/**
 * Throughput benchmark: source string in, HTML string out.
 *
 * That is the operation an app actually performs, and it is the only honest
 * thing to measure — timing tokenization alone would hide the cost of turning
 * tokens into markup.
 *
 * This exists to catch regressions between two runs on the same machine, not
 * to produce a number worth publishing. Rates vary by hardware and JavaScript
 * engine, so compare a branch against `main` locally rather than quoting these
 * figures anywhere.
 *
 * Reported as the median of several batches, because a single timed loop on a
 * shared machine is mostly noise.
 */
import { highlight, resolveGrammar } from '../src/all'
import { samples } from '../test/samples'
import { saveResults } from './results'

const BATCHES = 9
const MIN_MS = 120

type Result = {
  name: string
  bytesPerSecond: number
  nsPerRun: number
}

const time = (label: string, run: () => void, bytes: number): Result => {
  // Warm up so we measure optimized code, not the interpreter tier.
  for (let i = 0; i < 50; i++) run()

  const rates: number[] = []
  const perRun: number[] = []
  for (let batch = 0; batch < BATCHES; batch++) {
    let iterations = 0
    const start = process.hrtime.bigint()
    let elapsed = 0n
    do {
      run()
      iterations++
      elapsed = process.hrtime.bigint() - start
    } while (elapsed < BigInt(MIN_MS) * 1_000_000n)

    const seconds = Number(elapsed) / 1e9
    rates.push((bytes * iterations) / seconds)
    perRun.push(Number(elapsed) / iterations)
  }

  rates.sort((a, b) => a - b)
  perRun.sort((a, b) => a - b)
  return {
    name: label,
    bytesPerSecond: rates[(rates.length - 1) >> 1]!,
    nsPerRun: perRun[(perRun.length - 1) >> 1]!,
  }
}

const mb = (bytesPerSecond: number) => (bytesPerSecond / 1_000_000).toFixed(1)

console.log(`\nThroughput — source in, HTML out (median of ${BATCHES} batches)\n`)
console.log(`  ${'language'.padEnd(12)} ${'size'.padStart(7)}   ${'rate'.padStart(11)}`)
console.log(`  ${'-'.repeat(45)}`)

const throughput: Record<string, number> = {}

for (const [lang, code] of Object.entries(samples)) {
  const bytes = Buffer.byteLength(code)
  const grammar = resolveGrammar(lang)

  const result = time(lang, () => highlight(code, grammar), bytes)
  throughput[lang] = result.bytesPerSecond

  console.log(`  ${lang.padEnd(12)} ${`${bytes}B`.padStart(7)}   ${`${mb(result.bytesPerSecond)} MB/s`.padStart(11)}`)
}

// A large document, to show behaviour when the input is not a snippet.
const big = samples['python']!.repeat(200)
const bigBytes = Buffer.byteLength(big)
const bigResult = time('large', () => highlight(big, 'python'), bigBytes)
console.log(`\n  ${(bigBytes / 1024).toFixed(0)} KB of Python: ${(bigResult.nsPerRun / 1e6).toFixed(1)} ms\n`)

saveResults({
  throughput,
  large: {
    bytes: bigBytes,
    scalarMs: bigResult.nsPerRun / 1e6,
  },
})
