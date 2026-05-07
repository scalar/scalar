import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import {
  DEFAULT_RELEASE_NOTES_PREAMBLE,
  type ReleaseNoteEntry,
  serializeReleaseNotes,
} from '@scalar/helpers/markdown/release-notes'

import type { ReleaseNote } from './types'

type WriteMarkdownOptions = {
  /** Absolute or workspace-relative path to the `RELEASE_NOTES.md` file. */
  path: string
  /**
   * Entries to render. The caller is responsible for ordering them
   * (typically newest-first) - this writer does not re-sort, so the
   * markdown file matches the source-of-truth JSON exactly.
   */
  entries: readonly ReleaseNote[]
  /**
   * Optional preamble override. Defaults to a fixed preamble that
   * documents the JSON file as the source of truth, since the markdown
   * is now a fully derived artifact.
   */
  preamble?: string
}

type WriteMarkdownResult = {
  /** Path that was written to (echoes `options.path`). */
  path: string
  /** True when the file did not exist before this call. */
  created: boolean
}

/**
 * Render `RELEASE_NOTES.md` from the source-of-truth JSON entries.
 *
 * The markdown file is a derived artifact: it exists as a human-friendly
 * view of `RELEASE_NOTES.json` and is regenerated on every release.
 * Hand-written edits to the markdown will be overwritten the next time
 * the generator runs - consumers that need to programmatically read the
 * data should import the JSON instead.
 */
export const writeReleaseNotesMarkdown = async (options: WriteMarkdownOptions): Promise<WriteMarkdownResult> => {
  const created = !(await pathExists(options.path))

  const preamble = options.preamble ?? DEFAULT_RELEASE_NOTES_PREAMBLE
  // The on-disk JSON shape is intentionally a superset of `ReleaseNoteEntry`
  // (same fields), so a direct cast is safe and avoids an unnecessary
  // copy of every entry.
  const next = serializeReleaseNotes(options.entries as readonly ReleaseNoteEntry[], { preamble })

  await mkdir(dirname(options.path), { recursive: true })
  await writeFile(options.path, next, 'utf-8')

  return { path: options.path, created }
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}
