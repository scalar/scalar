import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const FILE = fileURLToPath(new URL('./results.json', import.meta.url))

export type BenchResults = {
  measuredAt?: string
  node?: string
  sizes?: Record<string, number>
  languageSizes?: Record<string, number>
  comparisonSizes?: Record<string, number>
  /** Bytes per second, keyed by language. */
  throughput?: Record<string, number>
  large?: { bytes: number; scalarMs: number }
}

export const readResults = (): BenchResults => {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as BenchResults
  } catch {
    return {}
  }
}

/**
 * Merges into `results.json` rather than overwriting, so the size script and
 * the throughput script can each own their part without clobbering the other.
 */
export const saveResults = (patch: BenchResults): void => {
  const merged: BenchResults = {
    ...readResults(),
    ...patch,
    measuredAt: new Date().toISOString(),
    node: process.version,
  }
  writeFileSync(FILE, `${JSON.stringify(merged, null, 2)}\n`)
}
