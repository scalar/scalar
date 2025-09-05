/**
 * Formats and prints a Markdown table comparing benchmark results
 * between the current branch and main. This benchmark is only run on the CI
 * as some files don't exist locally.
 *
 * Why: reviewers and maintainers can quickly gauge performance impact
 * without digging through raw JSON output.
 *
 * Assumptions:
 * - Both JSON files match the test result shape used in this workspace.
 * - We use the first file → first group → first benchmark as the representative sample.
 *
 * Output: three rows (this PR, main, delta) for Total Time and hz.
 */
import main from '../results/main.json' with { type: 'json' }
// @ts-expect-error - this file only exists on the CI
import branch from '../results/branch.json' with { type: 'json' }

type Benchmark = {
  readonly id: string
  readonly name: string
  readonly totalTime: number
  readonly hz: number
}

const formatMs = (ms: number): string => `${ms.toFixed(2)} ms`
const formatHz = (hz: number): string => `${hz.toFixed(4)}`

/**
 * Formats a delta value with an explicit sign and percent relative to a base.
 *
 * Why: showing both absolute and relative change makes regressions obvious
 * at a glance. We deliberately show a leading '+' only for improvements,
 * and rely on the percent sign to communicate regressions to reduce noise.
 */
const formatDelta = (valueDelta: number, base: number, unitFormatter: (n: number) => string): string => {
  const sign = valueDelta > 0 ? '+' : valueDelta < 0 ? '' : ''
  const percent = base === 0 ? 0 : (valueDelta / base) * 100
  return `${sign}${unitFormatter(valueDelta)} (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)`
}

// We intentionally select the first benchmark to keep output stable across runs.
// If the result structure changes, update these indexes accordingly.
const mainBench = main.files[0].groups[0].benchmarks[0] as Benchmark
const branchBench = branch.files[0].groups[0].benchmarks[0] as Benchmark

const timeDelta = branchBench.totalTime - mainBench.totalTime
const hzDelta = branchBench.hz - mainBench.hz

const thisPrTime = formatMs(branchBench.totalTime)
const thisPrHz = formatHz(branchBench.hz)
const mainTime = formatMs(mainBench.totalTime)
const mainHz = formatHz(mainBench.hz)
// Note: a positive time delta means slower, while a positive hz delta means faster.
const deltaTime = formatDelta(timeDelta, mainBench.totalTime, (n) => `${Math.abs(n).toFixed(2)} ms`)
const deltaHz = formatDelta(hzDelta, mainBench.hz, (n) => `${Math.abs(n).toFixed(4)}`)

// Render a compact Markdown table for use in logs or PR comments.
console.log(`
| Branch | Total Time | hz (cycles/s) |
|--------|------------|---------------|
| PR | ${thisPrTime} | ${thisPrHz} |
| main | ${mainTime} | ${mainHz} |
| delta | ${deltaTime} | ${deltaHz} |`)
