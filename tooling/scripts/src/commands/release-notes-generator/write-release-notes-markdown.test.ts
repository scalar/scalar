import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ReleaseNote } from './types'
import { writeReleaseNotesMarkdown } from './write-release-notes-markdown'

const note = (version: string, date: string, title = `release ${version}`): ReleaseNote => ({
  version,
  date,
  title,
})

/** Test-only: `## semver (YYYY-MM-DD)` headings in document order. */
const versionHeadingsInOrder = (markdown: string): string[] =>
  [...markdown.matchAll(/^##\s+(\S+)\s+\(\s*\d{4}-\d{2}-\d{2}\s*\)\s*$/gm)].map((m) => m[1] ?? '')

describe('writeReleaseNotesMarkdown', () => {
  let workDir: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'release-notes-markdown-'))
  })

  afterEach(() => {
    workDir = ''
  })

  it('creates the file with the default preamble on the first ever run', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')

    const result = await writeReleaseNotesMarkdown({
      path,
      entries: [
        {
          ...note('1.0.0', '2026-01-01'),
          content: [{ type: 'paragraph', text: 'Hello world.' }],
        },
      ],
    })

    expect(result.created).toBe(true)
    const written = await readFile(path, 'utf-8')
    expect(written).toContain('# Release notes')
    expect(written).toContain('Source of truth: `RELEASE_NOTES.json`')
    expect(written).toContain('## 1.0.0 (2026-01-01)')
    expect(written).toContain('Hello world.')
  })

  it('renders entries in the exact order provided (no re-sorting)', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')

    await writeReleaseNotesMarkdown({
      path,
      entries: [note('2.0.0', '2026-03-01'), note('1.5.0', '2026-02-01'), note('1.0.0', '2026-01-01')],
    })

    const written = await readFile(path, 'utf-8')
    expect(versionHeadingsInOrder(written)).toEqual(['2.0.0', '1.5.0', '1.0.0'])
  })

  it('overwrites an existing file rather than appending to it', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')

    await writeReleaseNotesMarkdown({ path, entries: [note('1.0.0', '2026-01-01', 'First take')] })
    const second = await writeReleaseNotesMarkdown({
      path,
      entries: [note('2.0.0', '2026-02-01', 'Second take')],
    })

    expect(second.created).toBe(false)
    const written = await readFile(path, 'utf-8')
    expect(written).toContain('Second take')
    expect(written).not.toContain('First take')
  })

  it('honors a custom preamble override', async () => {
    const path = join(workDir, 'RELEASE_NOTES.md')

    await writeReleaseNotesMarkdown({
      path,
      entries: [note('1.0.0', '2026-01-01')],
      preamble: '# Custom heading\n\nIntro paragraph.',
    })

    const written = await readFile(path, 'utf-8')
    expect(written.startsWith('# Custom heading\n\nIntro paragraph.')).toBe(true)
    expect(written).toContain('## 1.0.0 (2026-01-01)')
  })
})
