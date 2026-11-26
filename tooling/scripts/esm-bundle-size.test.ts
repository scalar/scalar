import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

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
  initial: { minified: initialGzip * 4, gzip: initialGzip },
  total: { minified: totalGzip * 4, gzip: totalGzip },
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

      expect(measureEsmBundle(join(directory, 'webpack-stats.esm.json'), mainCommit)).toEqual({
        commit: mainCommit,
        initial: {
          minified: bytes('standalone.esm.js') + bytes('chunks/vendor-1.js'),
          gzip: gzip('standalone.esm.js') + gzip('chunks/vendor-1.js'),
        },
        total: {
          minified: bytes('standalone.esm.js') + bytes('chunks/vendor-1.js') + bytes('chunks/modal-2.js'),
          gzip: gzip('standalone.esm.js') + gzip('chunks/vendor-1.js') + gzip('chunks/modal-2.js'),
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
      expect(parseEsmBundleSize({ ...size(mainCommit, 100, 200), extra: true })).toEqual(size(mainCommit, 100, 200))
    })

    it.each([
      ['a missing value', undefined],
      ['an array', []],
      ['a commit with Markdown in it', { ...size(mainCommit, 100, 200), commit: '[link](https://example.com)' }],
      ['a negative byte count', size(mainCommit, -1, 200)],
      ['a fractional byte count', size(mainCommit, 1.5, 200)],
      ['a missing group', { commit: mainCommit, initial: { minified: 1, gzip: 1 } }],
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
      expect(report).toContain('| Initial load (gzip) | 100.00 kB | 99.00 kB | -1.00 kB (-1.00%) |')
      expect(report).toContain('| Initial load (minified) | 400.00 kB | 396.00 kB | -4.00 kB (-1.00%) |')
      expect(report).toContain('| All chunks (gzip) | 200.00 kB | 205.00 kB | +5.00 kB (+2.50%) |')
      expect(report).toContain('| All chunks (minified) | 800.00 kB | 820.00 kB | +20.00 kB (+2.50%) |')
      expect(report).toContain('Measured at bbbbbbb.')
    })

    it('shows only the current sizes when main has no size yet', () => {
      const report = createReport(size(prCommit, 99_000, 205_000), undefined)

      expect(report).toContain('There is no size from `main` to compare with yet.')
      expect(report).toContain('| Initial load (gzip) | 99.00 kB |')
      expect(report).not.toContain('Difference')
    })
  })
})
