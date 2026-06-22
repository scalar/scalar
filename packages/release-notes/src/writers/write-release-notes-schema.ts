import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { z } from 'zod'

import { releaseNotesFileSchema } from '../types'

export const DEFAULT_RELEASE_NOTES_SCHEMA_PATH = 'schemas/release-notes.schema.json'
export const DEFAULT_RELEASE_NOTES_SCHEMA_ID = 'https://scalar.com/schemas/release-notes.schema.json'
export const DEFAULT_RELEASE_NOTES_SCHEMA_TITLE = 'Release notes'

export type ReleaseNotesJsonSchemaMetadata = {
  /** JSON Schema `$id`. */
  id?: string
  /** JSON Schema title. */
  title?: string
}

export const buildReleaseNotesJsonSchema = (options: ReleaseNotesJsonSchemaMetadata = {}): Record<string, unknown> => {
  const schema = z.toJSONSchema(releaseNotesFileSchema, {
    target: 'draft-2020-12',
    unrepresentable: 'any',
  }) as Record<string, unknown>

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: options.id ?? DEFAULT_RELEASE_NOTES_SCHEMA_ID,
    title: options.title ?? DEFAULT_RELEASE_NOTES_SCHEMA_TITLE,
    ...schema,
  }
}

type WriteSchemaOptions = ReleaseNotesJsonSchemaMetadata & {
  path: string
}

type WriteSchemaResult = {
  path: string
  changed: boolean
}

export const writeReleaseNotesJsonSchema = async (options: WriteSchemaOptions): Promise<WriteSchemaResult> => {
  const next = `${JSON.stringify(buildReleaseNotesJsonSchema(options), null, 2)}\n`

  let previous: string | null = null
  try {
    previous = await readFile(options.path, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  if (previous === next) {
    return { path: options.path, changed: false }
  }

  await mkdir(dirname(options.path), { recursive: true })
  await writeFile(options.path, next, 'utf-8')
  return { path: options.path, changed: true }
}
