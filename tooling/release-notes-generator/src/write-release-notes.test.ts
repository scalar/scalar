import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { parseReleaseNotes } from '@scalar/helpers/markdown/release-notes'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ReleaseNote } from './types'
import { mergeReleaseNotes, writeReleaseNote } from './write-release-notes'

const note = (version: string, date: string, title = `release ${version}`): ReleaseNote => ({
  version,
  date,
  title,
})

describe('mergeReleaseNotes', () => {
  it('inserts a new note at the top when no entries exist yet', () => {
    expect(mergeReleaseNotes([], note('1.0.0', '2026-01-01'))).toEqual([note('1.0.0', '2026-01-01')])
  })

  it('replaces an existing entry with the same version', () => {
    const existing = [note('1.0.0', '2026-01-01', 'old title')]
    const merged = mergeReleaseNotes(existing, note('1.0.0', '2026-01-01', 'new title'))
    expect(merged).toHaveLength(1)
    expect(merged[0]?.title).toBe('new title')
  })

  it('orders entries newest-first by date', () => {
    const existing = [note('1.0.0', '2026-01-01'), note('2.0.0', '2026-03-01')]
    const merged = mergeReleaseNotes(existing, note('1.5.0', '2026-02-01'))
    expect(merged.map((entry) => entry.version)).toEqual(['2.0.0', '1.5.0', '1.0.0'])
  })

  it('breaks date ties using the version string', () => {
    const merged = mergeReleaseNotes(
      [note('1.0.1', '2026-01-01'), note('1.0.0', '2026-01-01')],
      note('1.0.2', '2026-01-01'),
    )
    expect(merged.map((entry) => entry.version)).toEqual(['1.0.2', '1.0.1', '1.0.0'])
  })

  it('breaks date ties using semver order, not lexicographic string order', () => {
    const merged = mergeReleaseNotes(
      [note('1.0.9', '2026-01-01'), note('1.0.10', '2026-01-01')],
      note('1.0.11', '2026-01-01'),
    )
    expect(merged.map((entry) => entry.version)).toEqual(['1.0.11', '1.0.10', '1.0.9'])
  })
})

describe('writeReleaseNote', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'release-notes-writer-'))
  })

  afterEach(() => {
    workDir = ''
  })

  it('creates the file with the default preamble on the first ever release', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')

    const result = await writeReleaseNote({
      path,
      note: { ...note('1.0.0', '2026-01-01'), description: 'Hello world.' },
    })

    expect(result.created).toBe(true)
    const written = await readFile(path, 'utf-8')
    expect(written).toContain('# Release notes')
    expect(written).toContain('## 1.0.0 (2026-01-01)')
  })

  it('preserves an existing custom preamble across appends', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')
    const customPreamble = '# Custom heading\n\nIntroductory paragraph.\n'
    await writeFile(path, `${customPreamble}\n## 1.0.0 (2026-01-01)\n\n### First\n`, 'utf-8')

    await writeReleaseNote({ path, note: note('1.1.0', '2026-02-01', 'Second') })

    const written = await readFile(path, 'utf-8')
    expect(written.startsWith('# Custom heading\n\nIntroductory paragraph.')).toBe(true)
    expect(written).toContain('## 1.1.0 (2026-02-01)')
    expect(written).toContain('## 1.0.0 (2026-01-01)')
  })

  it('replaces an existing entry with the same version (idempotent re-runs)', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')
    await writeReleaseNote({ path, note: note('1.0.0', '2026-01-01', 'first take') })
    await writeReleaseNote({ path, note: note('1.0.0', '2026-01-01', 'corrected take') })

    const entries = parseReleaseNotes(await readFile(path, 'utf-8'))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.title).toBe('corrected take')
  })

  it('keeps entries sorted newest-first by date', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')
    await writeReleaseNote({ path, note: note('1.0.0', '2026-01-01') })
    await writeReleaseNote({ path, note: note('2.0.0', '2026-03-01') })
    await writeReleaseNote({ path, note: note('1.5.0', '2026-02-01') })

    const entries = parseReleaseNotes(await readFile(path, 'utf-8'))
    expect(entries.map((entry) => entry.version)).toEqual(['2.0.0', '1.5.0', '1.0.0'])
  })
})
