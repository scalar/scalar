import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import {
  type ReleaseNoteEntry,
  buildReleaseNotesPreamble,
  serializeReleaseNotes,
} from '@scalar/helpers/markdown/release-notes'

import type { ReleaseNote } from '../types'

type WriteMarkdownOptions = {
  path: string
  entries: readonly ReleaseNote[]
  preamble?: string
}

type WriteMarkdownResult = {
  path: string
  created: boolean
}

export const writeReleaseNotesMarkdown = async (options: WriteMarkdownOptions): Promise<WriteMarkdownResult> => {
  const created = !(await pathExists(options.path))
  const preamble = options.preamble ?? buildReleaseNotesPreamble()
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
