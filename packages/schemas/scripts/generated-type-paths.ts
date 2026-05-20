import path from 'node:path'

/** Repo-root-relative paths written by `types:generate`. */
export const GENERATED_TYPE_OUTPUT_PATHS = [
  'packages/types/src/gen/api-reference.d.ts',
  'packages/types/src/asyncapi/3.1/index.generated.ts',
] as const

/**
 * Subset of {@link GENERATED_TYPE_OUTPUT_PATHS} that are tracked in git and staged on pre-commit.
 *
 * `packages/types/src/gen/` is listed in `packages/types/.gitignore` (local-only output).
 */
export const GENERATED_TYPE_STAGED_PATHS = ['packages/types/src/asyncapi/3.1/index.generated.ts'] as const

export const getRepoRoot = (): string => path.join(import.meta.dirname, '../../..')

/** Maps a readonly path tuple to a parallel absolute-path tuple (numeric indices only). */
export type MapRelativePathsToAbsolute<T extends readonly string[]> = {
  readonly [Index in keyof T as T[Index] extends string ? Index : never]: string
}

/** Absolute paths parallel to {@link GENERATED_TYPE_OUTPUT_PATHS} (same tuple length and indices). */
export type GeneratedTypeAbsolutePaths = MapRelativePathsToAbsolute<typeof GENERATED_TYPE_OUTPUT_PATHS>

const mapPathsToAbsolute = <const T extends readonly string[]>(
  repoRoot: string,
  relativePaths: T,
): MapRelativePathsToAbsolute<T> =>
  relativePaths.map((relativePath) => path.join(repoRoot, relativePath)) as MapRelativePathsToAbsolute<T>

/** Resolve {@link GENERATED_TYPE_OUTPUT_PATHS} to absolute paths (single conversion). */
export const getGeneratedTypeAbsolutePaths = (repoRoot: string): GeneratedTypeAbsolutePaths =>
  mapPathsToAbsolute(repoRoot, GENERATED_TYPE_OUTPUT_PATHS)
