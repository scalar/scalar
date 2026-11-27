import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type BundleSizes, createChunkReport, createReport, measureBundles, parseBundleSizes } from './bundle-size'

const main = 'a'.repeat(40)
const head = 'b'.repeat(40)
const sizes = (minified: number, gzip = 10, brotli = 8): BundleSizes['umd'] => ({ minified, gzip, brotli })

const repeatedFileSizes = (byteCount: number): BundleSizes['umd'] => {
  const contents = 'a'.repeat(byteCount)
  return sizes(byteCount, gzipSync(contents, { level: 9 }).length, brotliCompressSync(contents).length)
}

const snapshot = (commit: string): BundleSizes => ({
  commit,
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

  it('accepts a recorded baseline and skips reports with missing or malformed details', () => {
    const valid = snapshot(main)

    expect(parseBundleSizes(valid)).toStrictEqual(valid)
    expect(parseBundleSizes({ ...valid, commit: '[bad](https://example.com)' })).toBeUndefined()
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
    expect(report).toContain('| UMD standalone | minified | 1.20 kB | 1.30 kB | +100 B (+8.33%) |')
    expect(report).toContain('| ESM initial load | minified | 300 B | 300 B | 0 B |')
    expect(report).toContain('| ESM all chunks | minified | 600 B | 600 B | 0 B |')
    expect(createReport(current, baseline, main)).toContain('Compared with `main` at `aaaaaaa`.')
    expect(createReport(current)).toContain('| UMD standalone | minified | 1.30 kB |')
    expect(createReport(current)).toContain('No `main` baseline is available for comparison.')
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

    expect(report).toContain('| `chunks/vendor-12345678.js` | Initial | 8 B | 10 B | 250 B | +50 B (+25.00%) |')
    expect(report).toContain('| `chunks/new-AbcDEfgh.js` | Lazy | 8 B | 10 B | 80 B | New file |')
    expect(report).toContain('| `chunks/lazy-AbcDEfgh.js` | Removed | — | — | — | -300 B (-100.00%) |')
    expect(report).not.toContain('vendor-AbcDEfgh.js')
  })

  it('keeps chunks with ambiguous logical names distinct', () => {
    const baseline = snapshot(main)
    baseline.esm.push({ file: 'chunks/vendor-BcDEfghi.js', key: 'chunks/vendor.js', initial: false, size: sizes(320) })
    const current = snapshot(head)
    current.esm.push({ file: 'chunks/vendor-12345678.js', key: 'chunks/vendor.js', initial: false, size: sizes(420) })

    const report = createChunkReport(current, baseline)

    expect(report).toContain('| `chunks/vendor-AbcDEfgh.js` | Initial | 8 B | 10 B | 200 B | 0 B |')
    expect(report).toContain('| `chunks/vendor-12345678.js` | Lazy | 8 B | 10 B | 420 B | New file |')
    expect(report).toContain('| `chunks/vendor-BcDEfghi.js` | Removed | — | — | — | -320 B (-100.00%) |')
  })
})
