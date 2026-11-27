import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  type BundleSizes,
  createChunkReport,
  createReport,
  measureBundles,
  parseBundleSizes,
  requiresApproval,
  requiresComment,
} from './bundle-size'

const main = 'a'.repeat(40)
const head = 'b'.repeat(40)
const compression = { zlib: process.versions.zlib, brotli: process.versions.brotli ?? '' }
const sizes = (minified: number, gzip = 10, brotli = 8): BundleSizes['umd'] => ({ minified, gzip, brotli })

const repeatedFileSizes = (byteCount: number): BundleSizes['umd'] => {
  const contents = 'a'.repeat(byteCount)
  return sizes(byteCount, gzipSync(contents, { level: 9 }).length, brotliCompressSync(contents).length)
}

const snapshot = (commit: string): BundleSizes => ({
  commit,
  compression,
  umd: sizes(1200, 500, 400),
  esm: [
    { file: 'standalone.esm.js', key: 'src/esm.ts', initial: true, size: sizes(100) },
    { file: 'chunks/vendor-AbcDEfgh.js', key: 'chunks/vendor.js', initial: true, size: sizes(200) },
    { file: 'chunks/lazy-AbcDEfgh.js', key: 'src/lazy.ts', initial: false, size: sizes(300) },
  ],
})

describe('bundle-size', () => {
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'bundle-size-'))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('measures UMD and uses transitive static imports to classify each ESM file exactly once', () => {
    mkdirSync(join(directory, 'chunks'))
    for (const [file, byteCount] of Object.entries({
      'standalone.js': 100,
      'standalone.esm.js': 120,
      'chunks/vendor-AbcDEfgh.js': 140,
      'chunks/helper-AbcDEfgh.js': 160,
      'chunks/lazy-AbcDEfgh.js': 180,
      'chunks/stale-AbcDEfgh.js': 200,
    })) {
      writeFileSync(join(directory, file), 'a'.repeat(byteCount))
    }
    writeFileSync(
      join(directory, 'bundle-manifest.json'),
      JSON.stringify({
        'src/esm.ts': {
          file: 'standalone.esm.js',
          isEntry: true,
          imports: ['_vendor-AbcDEfgh.js'],
          dynamicImports: ['src/lazy.ts'],
        },
        '_vendor-AbcDEfgh.js': { file: 'chunks/vendor-AbcDEfgh.js', imports: ['_helper-AbcDEfgh.js'] },
        '_helper-AbcDEfgh.js': { file: 'chunks/helper-AbcDEfgh.js', imports: ['_vendor-AbcDEfgh.js'] },
        'src/lazy.ts': { file: 'chunks/lazy-AbcDEfgh.js', imports: ['_helper-AbcDEfgh.js'] },
        'asset.css': { file: 'asset.css' },
        'alias.ts': { file: 'chunks/helper-AbcDEfgh.js' },
      }),
    )

    const measured = measureBundles(directory, head)

    expect(measured.commit).toBe(head)
    expect(measured.compression).toStrictEqual(compression)
    expect(measured.umd).toStrictEqual(repeatedFileSizes(100))
    expect(measured.esm).toStrictEqual([
      { file: 'standalone.esm.js', key: 'src/esm.ts', initial: true, size: repeatedFileSizes(120) },
      { file: 'chunks/vendor-AbcDEfgh.js', key: 'chunks/vendor.js', initial: true, size: repeatedFileSizes(140) },
      { file: 'chunks/helper-AbcDEfgh.js', key: 'chunks/helper.js', initial: true, size: repeatedFileSizes(160) },
      { file: 'chunks/lazy-AbcDEfgh.js', key: 'src/lazy.ts', initial: false, size: repeatedFileSizes(180) },
    ])
  })

  it('rejects a manifest with an unresolved static import', () => {
    writeFileSync(
      join(directory, 'bundle-manifest.json'),
      JSON.stringify({ 'src/esm.ts': { file: 'standalone.esm.js', isEntry: true, imports: ['missing'] } }),
    )

    expect(() => measureBundles(directory, head)).toThrow('Static import missing from the build manifest: missing')
  })

  it('measures real files from an archived build that predates the Vite manifest', () => {
    mkdirSync(join(directory, 'chunks'))
    writeFileSync(join(directory, 'standalone.js'), 'a'.repeat(100))
    writeFileSync(join(directory, 'standalone.esm.js'), 'a'.repeat(120))
    writeFileSync(join(directory, 'chunks/lazy-AbcDEfgh.js'), 'a'.repeat(140))
    writeFileSync(
      join(directory, 'webpack-stats.esm.json'),
      JSON.stringify({
        chunks: [
          { files: ['standalone.esm.js'], initial: true },
          { files: ['chunks/lazy-AbcDEfgh.js'], initial: false },
        ],
      }),
    )

    expect(measureBundles(directory, main, 'archive')).toStrictEqual({
      commit: main,
      compression,
      umd: repeatedFileSizes(100),
      esm: [
        { file: 'standalone.esm.js', key: 'standalone.esm.js', initial: true, size: repeatedFileSizes(120) },
        { file: 'chunks/lazy-AbcDEfgh.js', key: 'chunks/lazy.js', initial: false, size: repeatedFileSizes(140) },
      ],
    })
  })

  it('accepts a recorded baseline and skips reports with missing or malformed details', () => {
    const valid = snapshot(main)

    expect(parseBundleSizes(valid)).toStrictEqual(valid)
    expect(parseBundleSizes({ ...valid, commit: '[bad](https://example.com)' })).toBeUndefined()
    expect(parseBundleSizes({ ...valid, compression: { zlib: compression.zlib } })).toBeUndefined()
    expect(parseBundleSizes({ ...valid, umd: { ...valid.umd, gzip: -1 } })).toBeUndefined()
    expect(parseBundleSizes({ ...valid, esm: [{ ...valid.esm[0], initial: false }] })).toBeUndefined()
    expect(
      parseBundleSizes({ ...valid, esm: [...valid.esm, { ...valid.esm[0], file: '../invalid.js' }] }),
    ).toBeUndefined()
  })

  it('shows separate totals and makes the fallback baseline explicit', () => {
    const baseline = snapshot(main)
    const current = { ...snapshot(head), umd: sizes(1300, 500, 400) }

    const report = createReport(current, baseline, 'c'.repeat(40))

    expect(report).toContain(
      'Compared with the latest available `main` build at `aaaaaaa`. The baseline for `ccccccc` is unavailable.',
    )
    expect(report).toContain('**Bundle size approval could not be evaluated.**')
    expect(report).toContain('#### UMD\n\n| Encoding | `main` | This build | Δ bytes | Δ % |')
    expect(report).toContain('#### ESM\n\n| Load | Encoding | `main` | This build | Δ bytes | Δ % |')
    expect(report).toContain('| minified | 1.20 kB | 1.30 kB | 🟠 +100 B | +8.33% |')
    expect(report).toContain('| Initial load | minified | 300 B | 300 B | 0 B | 0% |')
    expect(report).toContain('| All chunks | minified | 600 B | 600 B | 0 B | 0% |')
    expect(report).toContain('Measured commit `bbbbbbb`.')
    expect(createReport(current, baseline, main)).toContain('Compared with `main` at `aaaaaaa`.')
    expect(createReport(current)).toContain('| minified | 1.30 kB |')
    expect(createReport(current)).toContain('No `main` baseline is available for comparison.')
  })

  it.each(['zlib', 'brotli'] as const)(
    'skips comparison when the exact baseline uses a different %s version',
    (library) => {
      const sizesFile = join(directory, 'sizes.json')
      const reportFile = join(directory, 'report.md')
      const chunksFile = join(directory, 'chunks.md')
      const baselineFile = join(directory, 'baseline.json')
      const current = { ...snapshot(head), umd: sizes(300_000, 240_000, 210_000) }
      const baseline = {
        ...snapshot(main),
        compression: { ...compression, [library]: '0.0.0' },
        umd: sizes(300_000, 240_000, 200_000),
      }
      writeFileSync(sizesFile, JSON.stringify(current))
      writeFileSync(baselineFile, JSON.stringify(baseline))

      const script = fileURLToPath(new URL('./bundle-size.ts', import.meta.url))
      const result = spawnSync(
        process.execPath,
        [script, 'report', sizesFile, reportFile, chunksFile, baselineFile, main],
        {
          encoding: 'utf8',
          env: { EXPECT_EXACT_BUNDLE_BASELINE: 'true' },
        },
      )

      expect(result.status).toBe(0)
      expect(result.stderr).toContain(
        '::warning::The available main bundle size snapshot was measured with different compression libraries.',
      )
      expect(result.stderr).toContain('::warning::Bundle size approval could not be evaluated')
      expect(result.stdout).toBe('approval_required=false\ncomment_required=true\n')
      expect(readFileSync(reportFile, 'utf8')).toBe(createReport(current, undefined, main))
      expect(readFileSync(chunksFile, 'utf8')).toBe(createChunkReport(current))
    },
  )

  it('marks decreases green and increases at the percentage and byte thresholds red', () => {
    const baseline = { ...snapshot(main), umd: sizes(200_000, 20_000, 20_000) }
    const current = { ...snapshot(head), umd: sizes(210_000, 20_100, 18_000) }

    const report = createReport(current, baseline)

    expect(report).toContain('| brotli | 20.00 kB | 18.00 kB | 🟢 -2.00 kB | -10.00% |')
    expect(report).toContain('| gzip | 20.00 kB | 20.10 kB | 🟠 +100 B | +0.50% |')
    expect(report).toContain('| minified | 200.00 kB | 210.00 kB | 🔴 +10.00 kB | +5.00% |')
  })

  it('links the displayed baseline to its full commit SHA for exact and fallback reports', () => {
    const baseline = snapshot(main)
    const current = snapshot(head)
    const repositoryUrl = 'https://github.com/scalar/scalar'
    const commitLink = `[\`aaaaaaa\`](${repositoryUrl}/commit/${main})`

    expect(createReport(current, baseline, main, repositoryUrl)).toContain(`Compared with \`main\` at ${commitLink}.`)
    expect(createReport(current, baseline, head, repositoryUrl)).toContain(
      `Compared with the latest available \`main\` build at ${commitLink}.`,
    )
  })

  it('requires approval at both Brotli limits only against the exact baseline', () => {
    const baseline = { ...snapshot(main), umd: sizes(300_000, 240_000, 200_000) }
    const current = { ...snapshot(head), umd: sizes(300_000, 240_000, 210_000) }

    expect(requiresApproval(current, baseline, main)).toBe(true)
    expect(requiresApproval(current, baseline, 'c'.repeat(40))).toBe(false)
    expect(requiresApproval(current, undefined, main)).toBe(false)
    expect(requiresApproval({ ...current, umd: sizes(350_000, 250_000, 209_999) }, baseline, main)).toBe(false)
    expect(
      requiresApproval(
        { ...current, umd: sizes(350_000, 250_000, 310_000) },
        { ...baseline, umd: sizes(350_000, 250_000, 300_000) },
        main,
      ),
    ).toBe(false)
    expect(createReport(current, baseline, main)).toContain('**Bundle size approval required.**')
  })

  it('checks ESM initial and total Brotli sizes independently', () => {
    const baseline = snapshot(main)
    baseline.esm = baseline.esm.map((chunk) => ({ ...chunk, size: sizes(200_000, 150_000, 100_000) }))
    const earlyGrowth = snapshot(head)
    earlyGrowth.esm = baseline.esm.map((chunk) =>
      chunk.file === 'standalone.esm.js' ? { ...chunk, size: sizes(210_000, 160_000, 110_000) } : chunk,
    )
    const lazyGrowth = snapshot(head)
    lazyGrowth.esm = baseline.esm.map((chunk) =>
      chunk.initial ? chunk : { ...chunk, size: sizes(215_000, 165_000, 115_000) },
    )

    expect(requiresApproval(earlyGrowth, baseline, main)).toBe(true)
    expect(requiresApproval(lazyGrowth, baseline, main)).toBe(true)
  })

  it('skips the comment when the exact baseline has identical sizes even if a chunk hash changed', () => {
    const baseline = snapshot(main)
    const current = snapshot(head)
    current.esm = current.esm.map((chunk) => ({ ...chunk, file: chunk.file.replace('AbcDEfgh', '12345678') }))

    expect(requiresComment(current, baseline, main)).toBe(false)
    expect(requiresComment(current, baseline, 'c'.repeat(40))).toBe(true)
    expect(requiresComment(current, undefined, main)).toBe(true)
  })

  it('keeps the comment when file sizes or the set of ESM chunks changes', () => {
    const baseline = snapshot(main)
    const current = snapshot(head)
    current.esm = current.esm.map((chunk) => {
      const delta = chunk.key === 'src/esm.ts' ? 10 : -5
      return { ...chunk, size: { ...chunk.size, minified: chunk.size.minified + delta } }
    })

    expect(requiresComment(current, baseline, main)).toBe(true)
    expect(requiresComment({ ...snapshot(head), umd: sizes(1200, 501, 400) }, baseline, main)).toBe(true)
    expect(requiresComment({ ...current, esm: current.esm.slice(0, 2) }, baseline, main)).toBe(true)
  })

  it('matches a renamed chunk by key, and shows new and removed chunks', () => {
    const baseline = snapshot(main)
    const current = {
      ...snapshot(head),
      esm: [
        { file: 'standalone.esm.js', key: 'src/esm.ts', initial: true, size: sizes(100) },
        { file: 'chunks/vendor-12345678.js', key: 'chunks/vendor.js', initial: true, size: sizes(250) },
        { file: 'chunks/new-AbcDEfgh.js', key: 'src/new.ts', initial: false, size: sizes(80) },
      ],
    }

    const report = createChunkReport(current, baseline)

    expect(report).toContain('| `chunks/vendor-12345678.js` | Initial | 8 B | 10 B | 250 B | 🟠 +50 B | +25.00% |')
    expect(report).toContain('| `chunks/new-AbcDEfgh.js` | Lazy | 8 B | 10 B | 80 B | New file | — |')
    expect(report).toContain('| `chunks/lazy-AbcDEfgh.js` | Removed | — | — | — | 🟢 -300 B | -100.00% |')
    expect(report).not.toContain('vendor-AbcDEfgh.js')
  })

  it('keeps chunks with ambiguous logical names distinct', () => {
    const baseline = snapshot(main)
    baseline.esm.push({ file: 'chunks/vendor-BcDEfghi.js', key: 'chunks/vendor.js', initial: false, size: sizes(320) })
    const current = snapshot(head)
    current.esm.push({ file: 'chunks/vendor-12345678.js', key: 'chunks/vendor.js', initial: false, size: sizes(420) })

    const report = createChunkReport(current, baseline)

    expect(report).toContain('| `chunks/vendor-AbcDEfgh.js` | Initial | 8 B | 10 B | 200 B | 0 B | 0% |')
    expect(report).toContain('| `chunks/vendor-12345678.js` | Lazy | 8 B | 10 B | 420 B | New file | — |')
    expect(report).toContain('| `chunks/vendor-BcDEfghi.js` | Removed | — | — | — | 🟢 -320 B | -100.00% |')
  })

  it('matches a changed chunk from an archived baseline by its unique filename', () => {
    const baseline = snapshot(main)
    baseline.esm[2] = { file: 'chunks/modal-AbcDEfgh.js', key: 'chunks/modal.js', initial: false, size: sizes(300) }
    const current = snapshot(head)
    current.esm[2] = {
      file: 'chunks/modal-12345678.js',
      key: 'src/features/modal.ts',
      initial: false,
      size: sizes(330),
    }

    const report = createChunkReport(current, baseline)

    expect(report).toContain('| `chunks/modal-12345678.js` | Lazy | 8 B | 10 B | 330 B | 🟠 +30 B | +10.00% |')
    expect(report).not.toContain('modal-AbcDEfgh.js')
  })
})
