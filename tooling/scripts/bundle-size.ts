import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

// Runs directly in CI with Node and its built-in TypeScript support.
type ByteSizes = { minified: number; gzip: number; brotli: number }

type ChunkSize = { file: string; key: string; initial: boolean; size: ByteSizes }
type EsmFile = Omit<ChunkSize, 'size'>

/** Standalone API Reference bundle sizes at one build commit. */
export type BundleSizes = { commit: string; umd: ByteSizes; esm: ChunkSize[] }

type ManifestChunk = { file: string; imports?: string[]; isEntry?: boolean }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCommit = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)

const isByteCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const isByteSizes = (value: unknown): value is ByteSizes =>
  isRecord(value) && isByteCount(value.minified) && isByteCount(value.gzip) && isByteCount(value.brotli)

const isChunkFile = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^(?:[\w@.-]+\/)*[\w@.-]+\.js$/.test(value) &&
  value.split('/').every((segment) => segment !== '.' && segment !== '..')

const isChunkSize = (value: unknown): value is ChunkSize =>
  isRecord(value) &&
  isChunkFile(value.file) &&
  typeof value.key === 'string' &&
  typeof value.initial === 'boolean' &&
  isByteSizes(value.size)

/** Read an artifact from another CI run, accepting only the expected report data. */
export const parseBundleSizes = (value: unknown): BundleSizes | undefined => {
  if (
    !isRecord(value) ||
    !isCommit(value.commit) ||
    !isByteSizes(value.umd) ||
    !Array.isArray(value.esm) ||
    !value.esm.every(isChunkSize) ||
    new Set(value.esm.map(({ file }) => file)).size !== value.esm.length ||
    !value.esm.some(({ file, initial }) => file === 'standalone.esm.js' && initial)
  ) {
    return undefined
  }

  return { commit: value.commit, umd: value.umd, esm: value.esm }
}

const readManifest = (directory: string): Map<string, ManifestChunk> => {
  const manifest: unknown = JSON.parse(readFileSync(join(directory, 'bundle-manifest.json'), 'utf8'))
  if (!isRecord(manifest)) {
    throw new Error('Expected a Vite build manifest')
  }

  const chunks = new Map<string, ManifestChunk>()
  for (const [key, value] of Object.entries(manifest)) {
    if (!isRecord(value) || !isChunkFile(value.file)) {
      continue
    }
    const { file, imports, isEntry } = value
    if (imports !== undefined && (!Array.isArray(imports) || !imports.every((key) => typeof key === 'string'))) {
      throw new Error(`Invalid static imports for ${file}`)
    }
    chunks.set(key, { file, imports, isEntry: isEntry === true })
  }
  return chunks
}

const measureFile = (directory: string, file: string): ByteSizes => {
  const contents = readFileSync(join(directory, file))

  return {
    minified: contents.length,
    gzip: gzipSync(contents, { level: 9 }).length,
    brotli: brotliCompressSync(contents, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: contents.length,
      },
    }).length,
  }
}

const withoutChunkHash = (file: string): string => file.replace(/-[A-Za-z0-9_-]{8}\.js$/, '.js')

const readEsmFiles = (directory: string): EsmFile[] => {
  const chunks = readManifest(directory)
  const entry = [...chunks].find(([, chunk]) => chunk.isEntry && chunk.file === 'standalone.esm.js')
  if (!entry) {
    throw new Error('Missing standalone.esm.js in the build manifest')
  }

  // Follow only static imports from the entry to measure the initial download.
  const initialKeys = new Set([entry[0]])
  for (const key of initialKeys) {
    const chunk = chunks.get(key)
    if (!chunk) {
      throw new Error(`Static import missing from the build manifest: ${key}`)
    }
    for (const dependency of chunk.imports ?? []) {
      initialKeys.add(dependency)
    }
  }

  const esm = new Map<string, EsmFile>()
  for (const [key, { file }] of chunks) {
    const existing = esm.get(file)
    if (existing) {
      existing.initial ||= initialKeys.has(key)
      continue
    }

    esm.set(file, {
      file,
      // Vite keys entry chunks by source and shared chunks by their hashed output names.
      key: key.startsWith('_') ? withoutChunkHash(file) : key,
      initial: initialKeys.has(key),
    })
  }

  return [...esm.values()]
}

// Builds created before size snapshots used this file to record which chunks load initially.
// Read only the chunk metadata and measure the emitted files, including the injected stylesheet.
const readArchivedEsmFiles = (directory: string): EsmFile[] => {
  const stats: unknown = JSON.parse(readFileSync(join(directory, 'webpack-stats.esm.json'), 'utf8'))
  if (!isRecord(stats) || !Array.isArray(stats.chunks)) {
    throw new Error('Expected a list of archived ESM chunks')
  }

  const chunks = new Map<string, EsmFile>()
  for (const chunk of stats.chunks as unknown[]) {
    if (
      !isRecord(chunk) ||
      typeof chunk.initial !== 'boolean' ||
      !Array.isArray(chunk.files) ||
      !chunk.files.every(isChunkFile)
    ) {
      throw new Error('Invalid archived ESM chunk')
    }
    for (const file of chunk.files) {
      chunks.set(file, {
        file,
        key: withoutChunkHash(file),
        initial: chunk.initial || chunks.get(file)?.initial === true,
      })
    }
  }
  if (!chunks.get('standalone.esm.js')?.initial) {
    throw new Error('Missing standalone.esm.js from the archived initial load')
  }

  return [...chunks.values()]
}

/** Measure the emitted UMD file and each ESM chunk once, including injected CSS. */
export const measureBundles = (
  directory: string,
  commit: string,
  mode: 'current' | 'archive' = 'current',
): BundleSizes => {
  if (!isCommit(commit)) {
    throw new Error(`Expected a commit SHA, got ${JSON.stringify(commit)}`)
  }

  const hasManifest = mode === 'current' || existsSync(join(directory, 'bundle-manifest.json'))
  const files = hasManifest ? readEsmFiles(directory) : readArchivedEsmFiles(directory)
  return {
    commit,
    umd: measureFile(directory, 'standalone.js'),
    esm: files.map((chunk) => ({ ...chunk, size: measureFile(directory, chunk.file) })),
  }
}

const sumSizes = (chunks: ChunkSize[]): ByteSizes =>
  chunks.reduce(
    (sum, { size }) => ({
      minified: sum.minified + size.minified,
      gzip: sum.gzip + size.gzip,
      brotli: sum.brotli + size.brotli,
    }),
    { minified: 0, gzip: 0, brotli: 0 },
  )

const bundleTotals = ({ umd, esm }: BundleSizes): { umd: ByteSizes; initial: ByteSizes; all: ByteSizes } => ({
  umd,
  initial: sumSizes(esm.filter(({ initial }) => initial)),
  all: sumSizes(esm),
})

const minimumIncreaseBytes = 10_000
const minimumIncreasePercent = 5
const isLargeIncrease = (current: number, baseline: number): boolean => {
  const delta = current - baseline
  return baseline > 0 && delta >= minimumIncreaseBytes && delta * 100 >= baseline * minimumIncreasePercent
}

/** Compare Brotli sizes against the exact main commit so unrelated main changes cannot trigger approval. */
export const requiresApproval = (current: BundleSizes, baseline?: BundleSizes, expectedBase?: string): boolean => {
  if (!baseline || baseline.commit !== expectedBase) {
    return false
  }

  const before = bundleTotals(baseline)
  const after = bundleTotals(current)
  return (['umd', 'initial', 'all'] as const).some((group) =>
    isLargeIncrease(after[group].brotli, before[group].brotli),
  )
}

const formatBytes = (size: number): string => {
  if (size < 1000) {
    return `${size} B`
  }
  if (size < 1_000_000) {
    return `${(size / 1000).toFixed(2)} kB`
  }
  return `${(size / 1_000_000).toFixed(2)} MB`
}

const formatDelta = (current: number, baseline: number): [string, string] => {
  const delta = current - baseline
  if (delta === 0) {
    return ['0 B', '0%']
  }

  const sign = delta > 0 ? '+' : '-'
  const percent = baseline > 0 ? (delta / baseline) * 100 : undefined
  const increaseMarker = isLargeIncrease(current, baseline) ? '🔴' : '🟠'
  const marker = delta < 0 ? '🟢' : increaseMarker
  return [
    `${marker} ${sign}${formatBytes(Math.abs(delta))}`,
    percent === undefined ? '—' : `${sign}${Math.abs(percent).toFixed(2)}%`,
  ]
}

const markdownRow = (cells: string[]): string => `| ${cells.join(' | ')} |`

const tableHeader = (labels: string[], compared: boolean): string[] => {
  const columns = compared ? ['`main`', 'This build', 'Δ bytes', 'Δ %'] : ['This build']
  return [
    markdownRow([...labels, 'Encoding', ...columns]),
    markdownRow([...labels, 'Encoding'].map(() => '---').concat(columns.map(() => '---:'))),
  ]
}

const encodings = ['brotli', 'gzip', 'minified'] as const
const sizeRows = (labels: string[], current: ByteSizes, baseline: ByteSizes | undefined): string[] =>
  encodings.map((encoding) => {
    const size = formatBytes(current[encoding])
    const values = baseline
      ? [formatBytes(baseline[encoding]), size, ...formatDelta(current[encoding], baseline[encoding])]
      : [size]
    return markdownRow([...labels, encoding, ...values])
  })

/** Summarize UMD and ESM independently and identify the baseline used for comparison. */
export const createReport = (current: BundleSizes, baseline?: BundleSizes, expectedBase?: string): string => {
  const lines = ['### API Reference bundle sizes', '']
  if (baseline) {
    const sha = baseline.commit.slice(0, 7)
    const exact = !expectedBase || baseline.commit === expectedBase
    lines.push(
      exact
        ? `Compared with \`main\` at \`${sha}\`.`
        : `Compared with the latest available \`main\` build at \`${sha}\`. The baseline for \`${expectedBase.slice(0, 7)}\` is unavailable.`,
      '',
    )
  } else {
    lines.push('No `main` baseline is available for comparison.', '')
  }

  if (requiresApproval(current, baseline, expectedBase)) {
    lines.push('**Bundle size approval required.** A Brotli total met the review threshold.', '')
  }

  const before = baseline && bundleTotals(baseline)
  const after = bundleTotals(current)

  return [
    ...lines,
    '#### UMD',
    '',
    ...tableHeader([], Boolean(baseline)),
    ...sizeRows([], after.umd, before?.umd),
    '',
    '#### ESM',
    '',
    ...tableHeader(['Load'], Boolean(baseline)),
    ...sizeRows(['Initial load'], after.initial, before?.initial),
    ...sizeRows(['All chunks'], after.all, before?.all),
    '',
    ...(baseline
      ? [
          `🟢 decrease · 🟠 smaller increase · 🔴 increase of at least ${minimumIncreasePercent}% and ${formatBytes(minimumIncreaseBytes)}.`,
          '',
        ]
      : []),
    'ESM initial load includes the entry point and its static imports. ESM all chunks also includes lazy imports.',
    `Measured commit \`${current.commit.slice(0, 7)}\`.`,
    '',
  ].join('\n')
}

const matchChunks = (current: ChunkSize[], previous: ChunkSize[]): Map<string, ChunkSize> => {
  const previousByFile = new Map(previous.map((chunk) => [chunk.file, chunk]))
  const matches = new Map<string, ChunkSize>()
  const used = new Set<string>()
  for (const { file } of current) {
    const exact = previousByFile.get(file)
    if (exact) {
      matches.set(file, exact)
      used.add(exact.file)
    }
  }

  // Archived builds lack the source keys Vite records. Match their unique un-hashed filenames next.
  const selectors = [
    (chunk: ChunkSize): string => chunk.key,
    (chunk: ChunkSize): string => withoutChunkHash(chunk.file),
  ]
  for (const keyOf of selectors) {
    const currentGroups = Map.groupBy(current, keyOf)
    const previousGroups = Map.groupBy(previous, keyOf)
    for (const [key, group] of currentGroups) {
      const candidates = previousGroups.get(key)
      const file = group[0]?.file
      const candidate = candidates?.[0]
      if (
        group.length === 1 &&
        candidates?.length === 1 &&
        file &&
        candidate &&
        !matches.has(file) &&
        !used.has(candidate.file)
      ) {
        matches.set(file, candidate)
        used.add(candidate.file)
      }
    }
  }
  return matches
}

/** Include every emitted ESM chunk, matching hashes by a unique logical chunk name when possible. */
export const createChunkReport = (current: BundleSizes, baseline?: BundleSizes): string => {
  const previous = baseline?.esm ?? []
  const matches = matchChunks(current.esm, previous)
  const matched = new Set([...matches.values()].map(({ file }) => file))
  const unmatchedChange = baseline ? 'New file' : '—'
  const lines = [
    '#### ESM chunks',
    '',
    '| File | Load | Brotli | Gzip | Minified | Minified Δ bytes | Minified Δ % |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const { file, initial, size } of current.esm.toSorted((a, b) => b.size.minified - a.size.minified)) {
    const before = matches.get(file)
    const change = before ? formatDelta(size.minified, before.size.minified) : [unmatchedChange, '—']
    lines.push(
      markdownRow([
        `\`${file}\``,
        initial ? 'Initial' : 'Lazy',
        formatBytes(size.brotli),
        formatBytes(size.gzip),
        formatBytes(size.minified),
        ...change,
      ]),
    )
  }

  for (const { file, size } of previous.filter(({ file }) => !matched.has(file))) {
    lines.push(markdownRow([`\`${file}\``, 'Removed', '—', '—', '—', ...formatDelta(0, size.minified)]))
  }

  return [...lines, ''].join('\n')
}

const readSizes = (file: string | undefined): BundleSizes | undefined => {
  if (file) {
    try {
      return parseBundleSizes(JSON.parse(readFileSync(file, 'utf8')))
    } catch {
      return undefined
    }
  }
  return undefined
}

const run = ([command, input, output, details, baselineFile, expectedBase]: string[]): void => {
  if ((command === 'measure' || command === 'measure-archive') && input && output && details) {
    const sizes = measureBundles(input, output, command === 'measure-archive' ? 'archive' : 'current')
    writeFileSync(details, `${JSON.stringify(sizes)}\n`)
    console.log(createReport(sizes))
    return
  }
  if (command === 'report' && input && output && details) {
    const current = readSizes(input)
    if (!current) {
      throw new Error(`Could not read bundle sizes from ${input}`)
    }
    const baseline = readSizes(baselineFile)
    const base = isCommit(expectedBase) ? expectedBase : undefined
    if (process.env.EXPECT_EXACT_BUNDLE_BASELINE === 'true' && (!base || baseline?.commit !== base)) {
      throw new Error('The exact main baseline was found but could not be read')
    }
    writeFileSync(output, createReport(current, baseline, base))
    writeFileSync(details, createChunkReport(current, baseline))
    console.log(`approval_required=${requiresApproval(current, baseline, base)}`)
    return
  }

  throw new Error(
    'Usage: bundle-size.ts measure|measure-archive <browser-dir> <commit> <sizes.json> or report <sizes.json> <report.md> <chunks.md> [baseline.json] [base-sha]',
  )
}

if (import.meta.main) {
  run(process.argv.slice(2))
}
