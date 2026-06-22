import path from 'node:path'

/** Repo-root-relative path written by `schema:generate`. */
const GENERATED_SCHEMA_PATH = 'packages/release-notes/schemas/release-notes.schema.json' as const

/** Generated paths tracked in git and staged on pre-commit by `schema:generate:stage`. */
export const GENERATED_SCHEMA_STAGED_PATHS = [GENERATED_SCHEMA_PATH] as const

export const getRepoRoot = (): string => path.join(import.meta.dirname, '../../..')
