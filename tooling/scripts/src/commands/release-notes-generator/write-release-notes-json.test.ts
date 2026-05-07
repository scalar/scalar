import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ReleaseNote } from './types'
import { mergeReleaseNotes, writeReleaseNoteJson } from './write-release-notes-json'

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

  it('inserts by semver when the existing list is already ordered', () => {
    const existing = [note('2.0.0', '2026-03-01'), note('1.0.0', '2026-01-01')]
    const merged = mergeReleaseNotes(existing, note('1.5.0', '2026-02-01'))
    expect(merged.map((entry) => entry.version)).toEqual(['2.0.0', '1.5.0', '1.0.0'])
  })

  it('orders same-calendar-day releases by semver', () => {
    const merged = mergeReleaseNotes(
      [note('1.0.1', '2026-01-01'), note('1.0.0', '2026-01-01')],
      note('1.0.2', '2026-01-01'),
    )
    expect(merged.map((entry) => entry.version)).toEqual(['1.0.2', '1.0.1', '1.0.0'])
  })

  it('uses semver order, not lexicographic version string order', () => {
    const merged = mergeReleaseNotes(
      [note('1.0.10', '2026-01-01'), note('1.0.9', '2026-01-01')],
      note('1.0.11', '2026-01-01'),
    )
    expect(merged.map((entry) => entry.version)).toEqual(['1.0.11', '1.0.10', '1.0.9'])
  })

  it('uses release date when compareVersions ties the version strings', () => {
    const merged = mergeReleaseNotes(
      [
        { version: '1.0.0+aaa', date: '2026-01-02', title: 'second' },
        { version: '1.0.0+bbb', date: '2026-01-01', title: 'third' },
      ],
      { version: '1.0.0+ccc', date: '2026-01-03', title: 'first' },
    )
    expect(merged.map((entry) => entry.date)).toEqual(['2026-01-03', '2026-01-02', '2026-01-01'])
  })
})

describe('writeReleaseNoteJson', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'release-notes-json-'))
  })

  afterEach(() => {
    workDir = ''
  })

  it('creates the file as a JSON array on the first ever release', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')

    const result = await writeReleaseNoteJson({
      path,
      note: { ...note('1.0.0', '2026-01-01'), description: 'Hello world.' },
    })

    expect(result.created).toBe(true)
    expect(result.entries).toHaveLength(1)

    const written = JSON.parse(await readFile(path, 'utf-8'))
    expect(Array.isArray(written)).toBe(true)
    expect(written).toEqual([
      { version: '1.0.0', date: '2026-01-01', title: 'release 1.0.0', description: 'Hello world.' },
    ])
  })

  it('replaces an existing entry with the same version (idempotent re-runs)', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')
    await writeReleaseNoteJson({ path, note: note('1.0.0', '2026-01-01', 'first take') })
    const result = await writeReleaseNoteJson({ path, note: note('1.0.0', '2026-01-01', 'corrected take') })

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]?.title).toBe('corrected take')

    const written = JSON.parse(await readFile(path, 'utf-8')) as ReleaseNote[]
    expect(written).toHaveLength(1)
    expect(written[0]?.title).toBe('corrected take')
  })

  it('keeps entries ordered by semver (then date when versions tie)', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')
    await writeReleaseNoteJson({ path, note: note('1.0.0', '2026-01-01') })
    await writeReleaseNoteJson({ path, note: note('2.0.0', '2026-03-01') })
    const final = await writeReleaseNoteJson({ path, note: note('1.5.0', '2026-02-01') })

    expect(final.entries.map((entry) => entry.version)).toEqual(['2.0.0', '1.5.0', '1.0.0'])
  })

  it('writes with a trailing newline so editors do not append one on save', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')
    await writeReleaseNoteJson({ path, note: note('1.0.0', '2026-01-01') })
    const written = await readFile(path, 'utf-8')
    expect(written.endsWith('\n')).toBe(true)
  })

  it('treats a non-array root as an empty list rather than failing', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')
    await writeFile(path, JSON.stringify({ entries: [] }), 'utf-8')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = await writeReleaseNoteJson({ path, note: note('1.0.0', '2026-01-01') })

    expect(result.created).toBe(false)
    expect(result.entries).toEqual([note('1.0.0', '2026-01-01')])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('skips malformed entries when reading the existing file', async () => {
    const path = join(workDir, 'RELEASE_NOTES.json')
    await writeFile(
      path,
      JSON.stringify([{ version: 'not-semver', date: 'not-a-date', title: 'broken' }, note('1.0.0', '2026-01-01')]),
      'utf-8',
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = await writeReleaseNoteJson({ path, note: note('1.1.0', '2026-02-01') })

    expect(result.entries.map((entry) => entry.version)).toEqual(['1.1.0', '1.0.0'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
