import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

// Runs directly in CI with Node and its built-in TypeScript support.
type ByteSizes = { minified: number; gzip: number; brotli: number }

type ChunkSize = { file: string; key: string; initial: boolean; size: ByteSizes }

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

/** Measure the emitted UMD file and each ESM chunk once, including injected CSS. */
export const measureBundles = (directory: string, commit: string): BundleSizes => {
  if (!isCommit(commit)) {
    throw new Error(`Expected a commit SHA, got ${JSON.stringify(commit)}`)
  }

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

  const esm = new Map<string, ChunkSize>()
  for (const [key, { file }] of chunks) {
    const existing = esm.get(file)
    if (existing) {
      existing.initial ||= initialKeys.has(key)
      continue
    }

    esm.set(file, {
      file,
      // Vite keys entry chunks by source and shared chunks by their hashed output names.
      key: key.startsWith('_') ? file.replace(/-[A-Za-z0-9_-]{8}\.js$/, '.js') : key,
      initial: initialKeys.has(key),
      size: measureFile(directory, file),
    })
  }

  return { commit, umd: measureFile(directory, 'standalone.js'), esm: [...esm.values()] }
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

const formatBytes = (size: number): string => {
  if (size < 1000) {
    return `${size} B`
  }
  if (size < 1_000_000) {
    return `${(size / 1000).toFixed(2)} kB`
  }
  return `${(size / 1_000_000).toFixed(2)} MB`
}

const formatDelta = (current: number, baseline: number): string => {
  const delta = current - baseline
  if (delta === 0) {
    return '0 B'
  }

  const sign = delta > 0 ? '+' : '-'
  const percentage = baseline === 0 ? '' : ` (${sign}${((Math.abs(delta) / baseline) * 100).toFixed(2)}%)`
  return `${sign}${formatBytes(Math.abs(delta))}${percentage}`
}

const encodings = ['brotli', 'gzip', 'minified'] as const
const sizeRows = (label: string, current: ByteSizes, baseline: ByteSizes | undefined): string[] =>
  encodings.map((encoding) => {
    const size = formatBytes(current[encoding])
    if (!baseline) {
      return `| ${label} | ${encoding} | ${size} |`
    }
    return `| ${label} | ${encoding} | ${formatBytes(baseline[encoding])} | ${size} | ${formatDelta(current[encoding], baseline[encoding])} |`
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
      '| Bundle | Encoding | `main` | This build | Change |',
      '| --- | --- | ---: | ---: | ---: |',
    )
  } else {
    lines.push(
      'No `main` baseline is available for comparison.',
      '',
      '| Bundle | Encoding | This build |',
      '| --- | --- | ---: |',
    )
  }

  return [
    ...lines,
    ...sizeRows('UMD standalone', current.umd, baseline?.umd),
    ...sizeRows(
      'ESM initial load',
      sumSizes(current.esm.filter(({ initial }) => initial)),
      baseline && sumSizes(baseline.esm.filter(({ initial }) => initial)),
    ),
    ...sizeRows('ESM all chunks', sumSizes(current.esm), baseline && sumSizes(baseline.esm)),
    '',
    'ESM initial load includes the entry point and its static imports. ESM all chunks also includes lazy imports.',
    `Measured commit \`${current.commit.slice(0, 7)}\`.`,
    '',
  ].join('\n')
}

/** Include every emitted ESM chunk, matching hashes by a unique logical chunk name when possible. */
export const createChunkReport = (current: BundleSizes, baseline?: BundleSizes): string => {
  const previous = baseline?.esm ?? []
  const previousByFile = new Map(previous.map((chunk) => [chunk.file, chunk]))
  const previousByKey = Map.groupBy(previous, ({ key }) => key)
  const currentByKey = Map.groupBy(current.esm, ({ key }) => key)
  const currentFiles = new Set(current.esm.map(({ file }) => file))
  const matched = new Set<string>()
  const unmatchedChange = baseline ? 'New file' : '—'
  const lines = [
    '#### ESM chunks',
    '',
    '| File | Load | Brotli | Gzip | Minified | Minified change |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ]

  for (const { file, key, initial, size } of current.esm.toSorted((a, b) => b.size.minified - a.size.minified)) {
    const candidates = previousByKey.get(key)
    const candidate = candidates?.[0]
    const uniqueMatch =
      currentByKey.get(key)?.length === 1 && candidates?.length === 1 && candidate && !currentFiles.has(candidate.file)
        ? candidate
        : undefined
    const before = previousByFile.get(file) ?? uniqueMatch
    if (before) {
      matched.add(before.file)
    }
    const change = before ? formatDelta(size.minified, before.size.minified) : unmatchedChange
    lines.push(
      `| \`${file}\` | ${initial ? 'Initial' : 'Lazy'} | ${formatBytes(size.brotli)} | ${formatBytes(size.gzip)} | ${formatBytes(size.minified)} | ${change} |`,
    )
  }

  for (const { file, size } of previous.filter(({ file }) => !matched.has(file))) {
    lines.push(`| \`${file}\` | Removed | — | — | — | ${formatDelta(0, size.minified)} |`)
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
  if (command === 'measure' && input && output && details) {
    const sizes = measureBundles(input, output)
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
    writeFileSync(output, createReport(current, baseline, isCommit(expectedBase) ? expectedBase : undefined))
    writeFileSync(details, createChunkReport(current, baseline))
    return
  }

  throw new Error(
    'Usage: bundle-size.ts measure <browser-dir> <commit> <sizes.json> or report <sizes.json> <report.md> <chunks.md> [baseline.json] [base-sha]',
  )
}

if (import.meta.main) {
  run(process.argv.slice(2))
}
