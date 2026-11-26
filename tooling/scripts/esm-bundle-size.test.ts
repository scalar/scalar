import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  type EsmBundleSize,
  createReport,
  formatBytes,
  formatDifference,
  measureEsmBundle,
  parseEsmBundleSize,
} from './esm-bundle-size'

const mainCommit = 'a'.repeat(40)
const prCommit = 'b'.repeat(40)

const size = (commit: string, initialGzip: number, totalGzip: number): EsmBundleSize => ({
  commit,
  initial: { minified: initialGzip * 4, gzip: initialGzip, brotli: initialGzip * 0.8 },
  total: { minified: totalGzip * 4, gzip: totalGzip, brotli: totalGzip * 0.8 },
})

describe('esm-bundle-size', () => {
  describe('measureEsmBundle', () => {
    let directory: string

    beforeEach(() => {
      directory = mkdtempSync(join(tmpdir(), 'esm-bundle-size-'))
    })

    afterEach(() => {
      rmSync(directory, { recursive: true, force: true })
    })

    it('splits chunks that load up front from lazy ones', () => {
      const files = {
        'standalone.esm.js': 'import "./chunks/vendor-1.js";'.repeat(20),
        'chunks/vendor-1.js': 'export const vendor = 1;'.repeat(50),
        'chunks/modal-2.js': 'export const modal = 2;'.repeat(30),
      }

      mkdirSync(join(directory, 'chunks'))
      for (const [file, contents] of Object.entries(files)) {
        writeFileSync(join(directory, file), contents)
      }
      writeFileSync(
        join(directory, 'webpack-stats.esm.json'),
        JSON.stringify({
          chunks: [
            { initial: true, files: ['standalone.esm.js'] },
            { initial: true, files: ['chunks/vendor-1.js'] },
            { initial: false, files: ['chunks/modal-2.js'] },
          ],
        }),
      )

      const bytes = (file: keyof typeof files): number => Buffer.byteLength(files[file])
      const gzip = (file: keyof typeof files): number => gzipSync(files[file], { level: 9 }).length
      const brotli = (file: keyof typeof files): number =>
        brotliCompressSync(files[file], {
          params: {
            [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
            [constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(files[file]),
          },
        }).length

      expect(measureEsmBundle(join(directory, 'webpack-stats.esm.json'), mainCommit)).toEqual({
        commit: mainCommit,
        initial: {
          minified: bytes('standalone.esm.js') + bytes('chunks/vendor-1.js'),
          gzip: gzip('standalone.esm.js') + gzip('chunks/vendor-1.js'),
          brotli: brotli('standalone.esm.js') + brotli('chunks/vendor-1.js'),
        },
        total: {
          minified: bytes('standalone.esm.js') + bytes('chunks/vendor-1.js') + bytes('chunks/modal-2.js'),
          gzip: gzip('standalone.esm.js') + gzip('chunks/vendor-1.js') + gzip('chunks/modal-2.js'),
          brotli: brotli('standalone.esm.js') + brotli('chunks/vendor-1.js') + brotli('chunks/modal-2.js'),
        },
      })
    })

    it('rejects a stats file without chunks', () => {
      writeFileSync(join(directory, 'webpack-stats.esm.json'), JSON.stringify({ chunks: [] }))

      expect(() => measureEsmBundle(join(directory, 'webpack-stats.esm.json'), mainCommit)).toThrow(
        'Expected a non-empty chunks list',
      )
    })

    it('rejects a commit that is not a hash', () => {
      expect(() => measureEsmBundle(join(directory, 'webpack-stats.esm.json'), 'main')).toThrow(
        'Expected a commit hash, got "main"',
      )
    })
  })

  describe('parseEsmBundleSize', () => {
    it('accepts a size written by measure', () => {
      const value = size(mainCommit, 100, 200)

      expect(parseEsmBundleSize(JSON.parse(JSON.stringify(value)))).toEqual(value)
    })

    it('drops fields it does not know about', () => {
      const value = size(mainCommit, 100, 200)

      expect(parseEsmBundleSize({ ...value, extra: true, initial: { ...value.initial, extra: true } })).toStrictEqual(
        value,
      )
    })

    it.each([
      ['a missing value', undefined],
      ['an array', []],
      ['a commit with Markdown in it', { ...size(mainCommit, 100, 200), commit: '[link](https://example.com)' }],
      ['a negative byte count', size(mainCommit, -1, 200)],
      ['a fractional byte count', size(mainCommit, 1.5, 200)],
      ['a missing group', { commit: mainCommit, initial: { minified: 1, gzip: 1, brotli: 1 } }],
      [
        'a size recorded before brotli was measured',
        { commit: mainCommit, initial: { minified: 4, gzip: 1 }, total: { minified: 8, gzip: 2 } },
      ],
    ])('rejects %s', (_, value) => {
      expect(parseEsmBundleSize(value)).toBeUndefined()
    })
  })

  describe('formatBytes', () => {
    it.each([
      [0, '0 B'],
      [999, '999 B'],
      [1000, '1.00 kB'],
      [123_456, '123.46 kB'],
      [1_234_567, '1.23 MB'],
      [-2500, '-2.50 kB'],
    ])('formats %i as %s', (bytes, expected) => {
      expect(formatBytes(bytes)).toBe(expected)
    })
  })

  describe('formatDifference', () => {
    it('shows growth in bytes and percent', () => {
      expect(formatDifference(101_200, 100_000)).toBe('+1.20 kB (+1.20%)')
    })

    it('shows savings in bytes and percent', () => {
      expect(formatDifference(99_950, 100_000)).toBe('-50 B (-0.05%)')
    })

    it('says when nothing changed', () => {
      expect(formatDifference(100_000, 100_000)).toBe('No change')
    })

    it('leaves out the percent when main had nothing to compare with', () => {
      expect(formatDifference(500, 0)).toBe('+500 B')
    })
  })

  describe('createReport', () => {
    it('compares every row with main', () => {
      const report = createReport(size(prCommit, 99_000, 205_000), size(mainCommit, 100_000, 200_000))

      expect(report).toContain(`compared with \`main\` at ${mainCommit}.`)
      expect(report).toContain('| Initial load (brotli) | 80.00 kB | 79.20 kB | -800 B (-1.00%) |')
      expect(report).toContain('| Initial load (gzip) | 100.00 kB | 99.00 kB | -1.00 kB (-1.00%) |')
      expect(report).toContain('| Initial load (minified) | 400.00 kB | 396.00 kB | -4.00 kB (-1.00%) |')
      expect(report).toContain('| All chunks (brotli) | 160.00 kB | 164.00 kB | +4.00 kB (+2.50%) |')
      expect(report).toContain('| All chunks (gzip) | 200.00 kB | 205.00 kB | +5.00 kB (+2.50%) |')
      expect(report).toContain('| All chunks (minified) | 800.00 kB | 820.00 kB | +20.00 kB (+2.50%) |')
      expect(report).toContain('Measured at bbbbbbb.')
    })

    it('shows only the current sizes when main has no size yet', () => {
      const report = createReport(size(prCommit, 99_000, 205_000), undefined)

      expect(report).toContain('There is no size from `main` to compare with yet.')
      expect(report).toContain('| Initial load (brotli) | 79.20 kB |')
      expect(report).not.toContain('Difference')
    })
  })
})
