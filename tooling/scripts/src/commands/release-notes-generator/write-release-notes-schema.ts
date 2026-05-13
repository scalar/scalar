import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { z } from 'zod'

import { releaseNotesFileSchema } from './types'

/**
 * URI used as the JSON Schema `$id`. Stored alongside `RELEASE_NOTES.json`
 * so the generated file is self-describing - editors that download
 * referenced schemas (or follow `$id`) end up with the canonical name
 * even when the local copy is moved.
 */
const SCHEMA_ID = 'https://scalar.com/schemas/release-notes.schema.json'

/**
 * Title shown to the user in editor tooltips. Stays purposefully short
 * so completion popups fit on one line.
 */
const SCHEMA_TITLE = 'Scalar release notes'

/**
 * Build the JSON Schema for `RELEASE_NOTES.json` from the shared Zod
 * schema. Keeping the conversion in one place makes it easy to tweak
 * the output (target draft, comment markers, ...) for every consumer
 * at once.
 *
 * The schema describes the file root - an array of release-note entries
 * - so editors with schema mapping enabled validate the whole file in
 * one go, not per-entry.
 */
export const buildReleaseNotesJsonSchema = (): Record<string, unknown> => {
  // `target: 'draft-2020-12'` matches what VS Code's JSON language
  // service prefers; `unrepresentable: 'any'` makes the conversion
  // tolerant when a future Zod feature does not have a clean JSON
  // Schema equivalent so the build keeps working instead of crashing.
  const schema = z.toJSONSchema(releaseNotesFileSchema, {
    target: 'draft-2020-12',
    unrepresentable: 'any',
  }) as Record<string, unknown>

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: SCHEMA_ID,
    title: SCHEMA_TITLE,
    ...schema,
  }
}

type WriteSchemaOptions = {
  /** Absolute or workspace-relative path to the `RELEASE_NOTES.schema.json` file. */
  path: string
}

type WriteSchemaResult = {
  /** Path that was written to (echoes `options.path`). */
  path: string
  /** True when the on-disk schema differed from the freshly generated one. */
  changed: boolean
}

/**
 * Write the generated JSON Schema to disk. Idempotent: when the file
 * already matches the freshly generated schema we skip the write to
 * keep file mtimes stable for build caches and pre-commit hooks.
 */
export const writeReleaseNotesJsonSchema = async (options: WriteSchemaOptions): Promise<WriteSchemaResult> => {
  const next = `${JSON.stringify(buildReleaseNotesJsonSchema(), null, 2)}\n`

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
