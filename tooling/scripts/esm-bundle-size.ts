import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

/*
 * Measures the ESM CDN bundle of `@scalar/api-reference` and writes a pull request comment that
 * shows how a change moves its size compared with `main`.
 *
 * CI runs this file directly with Node, without installing dependencies, so it may only import
 * Node built-ins and must stick to TypeScript syntax that Node can strip.
 *
 *   node tooling/scripts/esm-bundle-size.ts measure <webpack-stats.esm.json> <commit> <output.json>
 *   node tooling/scripts/esm-bundle-size.ts report <current.json> <output.md> [baseline.json]
 */

/** Byte sizes of a group of JavaScript chunks. */
export type ChunkGroupSize = {
  minified: number
  gzip: number
  brotli: number
}

/** Size of the ESM bundle at one commit. */
export type EsmBundleSize = {
  commit: string
  /** The entry plus every chunk it imports statically, which a page downloads before it renders. */
  initial: ChunkGroupSize
  /** Every chunk, including lazy ones such as the API client modal and the icons. */
  total: ChunkGroupSize
}

type WebpackStatsChunk = {
  initial: boolean
  files: string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isByteCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const isChunkGroupSize = (value: unknown): value is ChunkGroupSize =>
  isRecord(value) && isByteCount(value.minified) && isByteCount(value.gzip) && isByteCount(value.brotli)

/** The commit ends up in the comment, so only accept a plain hash. */
const isCommit = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{7,40}$/.test(value)

/**
 * Reads a size written by `measure`. The baseline comes from another workflow run, so anything
 * that does not have the expected shape is treated as missing instead of trusted. That includes
 * sizes recorded before a field was added, which then report without a comparison once.
 */
export const parseEsmBundleSize = (value: unknown): EsmBundleSize | undefined => {
  if (isRecord(value) && isCommit(value.commit) && isChunkGroupSize(value.initial) && isChunkGroupSize(value.total)) {
    const pick = ({ minified, gzip, brotli }: ChunkGroupSize): ChunkGroupSize => ({ minified, gzip, brotli })

    return { commit: value.commit, initial: pick(value.initial), total: pick(value.total) }
  }

  return undefined
}

const readChunks = (statsFile: string): WebpackStatsChunk[] => {
  const stats: unknown = JSON.parse(readFileSync(statsFile, 'utf8'))
  const chunks = isRecord(stats) ? stats.chunks : undefined

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error(`Expected a non-empty chunks list in ${statsFile}`)
  }

  return chunks.map((chunk: unknown) => {
    if (
      !isRecord(chunk) ||
      typeof chunk.initial !== 'boolean' ||
      !Array.isArray(chunk.files) ||
      !chunk.files.every((file) => typeof file === 'string')
    ) {
      throw new Error(`Unexpected chunk in ${statsFile}`)
    }

    return { initial: chunk.initial, files: chunk.files }
  })
}

const measureFiles = (directory: string, files: Set<string>): ChunkGroupSize => {
  const size: ChunkGroupSize = { minified: 0, gzip: 0, brotli: 0 }

  for (const file of files) {
    const contents = readFileSync(join(directory, file))
    size.minified += contents.length
    size.gzip += gzipSync(contents, { level: 9 }).length
    // Maximum quality, which is what CDNs such as jsDelivr use for static files.
    size.brotli += brotliCompressSync(contents, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: contents.length,
      },
    }).length
  }

  return size
}

/**
 * Measures the bundle described by a `rollup-plugin-webpack-stats` file. The stats already know
 * which chunks load up front, so we only read the emitted files next to it to get real sizes,
 * including the license banner, gzip and brotli.
 */
export const measureEsmBundle = (statsFile: string, commit: string): EsmBundleSize => {
  if (!isCommit(commit)) {
    throw new Error(`Expected a commit hash, got "${commit}"`)
  }

  const chunks = readChunks(statsFile)
  const directory = dirname(statsFile)
  const initialFiles = new Set(chunks.filter((chunk) => chunk.initial).flatMap((chunk) => chunk.files))
  const allFiles = new Set(chunks.flatMap((chunk) => chunk.files))

  return {
    commit,
    initial: measureFiles(directory, initialFiles),
    total: measureFiles(directory, allFiles),
  }
}

/** Formats a byte count with decimal units, so the numbers match what CDNs and DevTools show. */
export const formatBytes = (bytes: number): string => {
  const absolute = Math.abs(bytes)

  if (absolute < 1000) {
    return `${bytes} B`
  }

  if (absolute < 1_000_000) {
    return `${(bytes / 1000).toFixed(2)} kB`
  }

  return `${(bytes / 1_000_000).toFixed(2)} MB`
}

/** Shows the change in bytes and percent, for example `+1.20 kB (+0.35%)`. */
export const formatDifference = (current: number, baseline: number): string => {
  const difference = current - baseline

  if (difference === 0) {
    return 'No change'
  }

  const sign = difference > 0 ? '+' : '-'
  const bytes = formatBytes(Math.abs(difference))

  if (baseline === 0) {
    return `${sign}${bytes}`
  }

  const percent = Math.abs((difference / baseline) * 100).toFixed(2)

  return `${sign}${bytes} (${sign}${percent}%)`
}

/**
 * Brotli and gzip are what users download. Minified is what the browser parses and compiles, and
 * it shows growth that compresses well.
 */
const rows = [
  { label: 'Initial load (brotli)', pick: (size: EsmBundleSize): number => size.initial.brotli },
  { label: 'Initial load (gzip)', pick: (size: EsmBundleSize): number => size.initial.gzip },
  { label: 'Initial load (minified)', pick: (size: EsmBundleSize): number => size.initial.minified },
  { label: 'All chunks (brotli)', pick: (size: EsmBundleSize): number => size.total.brotli },
  { label: 'All chunks (gzip)', pick: (size: EsmBundleSize): number => size.total.gzip },
  { label: 'All chunks (minified)', pick: (size: EsmBundleSize): number => size.total.minified },
]

const shortCommit = (commit: string): string => commit.slice(0, 7)

/** Builds the Markdown comment for a pull request. */
export const createReport = (current: EsmBundleSize, baseline: EsmBundleSize | undefined): string => {
  const lines = ['### ESM bundle size', '']

  if (!baseline) {
    lines.push(
      'There is no size from `main` to compare with yet. Every push to `main` records one, so the next update of this comment should include it.',
      '',
      '| | This PR |',
      '| --- | ---: |',
      ...rows.map((row) => `| ${row.label} | ${formatBytes(row.pick(current))} |`),
    )
  } else {
    lines.push(
      `\`@scalar/api-reference\` ESM build (\`standalone.esm.js\`), compared with \`main\` at ${baseline.commit}.`,
      '',
      '| | `main` | This PR | Difference |',
      '| --- | ---: | ---: | ---: |',
      ...rows.map((row) => {
        const before = row.pick(baseline)
        const after = row.pick(current)

        return `| ${row.label} | ${formatBytes(before)} | ${formatBytes(after)} | ${formatDifference(after, before)} |`
      }),
    )
  }

  lines.push(
    '',
    `<sub>Initial load is the entry and the chunks it imports statically. All chunks adds lazy chunks such as the API client modal and the icons. Measured at ${shortCommit(current.commit)}.</sub>`,
    '',
  )

  return lines.join('\n')
}

const readSizeFile = (file: string | undefined): EsmBundleSize | undefined => {
  if (!file || !existsSync(file)) {
    return undefined
  }

  try {
    return parseEsmBundleSize(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    return undefined
  }
}

const run = (args: string[]): void => {
  const [command, ...rest] = args

  if (command === 'measure' && rest.length === 3) {
    const [statsFile = '', commit = '', outputFile = ''] = rest
    const size = measureEsmBundle(statsFile, commit)
    writeFileSync(outputFile, `${JSON.stringify(size)}\n`)
    console.log(createReport(size, undefined))
    return
  }

  if (command === 'report' && (rest.length === 2 || rest.length === 3)) {
    const [currentFile = '', outputFile = '', baselineFile] = rest
    const current = readSizeFile(currentFile)

    if (!current) {
      throw new Error(`Could not read the current size from ${currentFile}`)
    }

    const report = createReport(current, readSizeFile(baselineFile))
    writeFileSync(outputFile, report)
    console.log(report)
    return
  }

  throw new Error(
    [
      'Usage:',
      '  node tooling/scripts/esm-bundle-size.ts measure <webpack-stats.esm.json> <commit> <output.json>',
      '  node tooling/scripts/esm-bundle-size.ts report <current.json> <output.md> [baseline.json]',
    ].join('\n'),
  )
}

if (import.meta.main) {
  run(process.argv.slice(2))
}
