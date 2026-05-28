import { execFile } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import type { ReleaseNotesProduct } from './products'

const execFileAsync = promisify(execFile)

const getRepoRoot = (): string => process.env.INIT_CWD ?? process.cwd()

/**
 * Normalize a path to a repo-relative forward-slash form for set lookups.
 */
const normalizeRepoRelativePath = (inputPath: string): string => {
  const repoRoot = getRepoRoot()
  const absolute = resolve(repoRoot, inputPath)
  return relative(repoRoot, absolute).replace(/\\/g, '/')
}

/**
 * Paths that Changesets touches when a package is versioned.
 */
export const getVersionedPathsForChangelog = (changelogPath: string): string[] => {
  const normalizedChangelog = normalizeRepoRelativePath(changelogPath)
  const packageJsonPath = join(dirname(normalizedChangelog), 'package.json').replace(/\\/g, '/')
  return [normalizedChangelog, packageJsonPath]
}

/**
 * True when the changelog or its adjacent package.json appears in the diff set.
 */
export const wasChangelogVersioned = (changelogPath: string, changedPaths: ReadonlySet<string>): boolean => {
  return getVersionedPathsForChangelog(changelogPath).some((path) => changedPaths.has(path))
}

/**
 * Whether to run the AI generator for this product in the current release.
 * When `changedPaths` is null (git unavailable or `--force`), every product runs.
 */
export const shouldGenerateReleaseNotesForProduct = (
  product: ReleaseNotesProduct,
  changedPaths: ReadonlySet<string> | null,
): boolean => {
  if (changedPaths === null) {
    return true
  }

  if (wasChangelogVersioned(product.changelogPath, changedPaths)) {
    return true
  }

  for (const dependencyPath of product.dependencyChangelogPaths ?? []) {
    if (wasChangelogVersioned(dependencyPath, changedPaths)) {
      return true
    }
  }

  return false
}

/**
 * Paths changed in the working tree since `HEAD`. Used right after
 * `changeset version` inside `pnpm release:version` to detect which
 * packages were actually bumped in this release.
 *
 * Returns `null` when git is unavailable so callers fall back to
 * generating for every product rather than failing the release pipeline.
 */
const getPathsChangedSinceHead = async (): Promise<Set<string> | null> => {
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', 'HEAD'], {
      cwd: getRepoRoot(),
    })
    const paths = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/\\/g, '/'))
    return new Set(paths)
  } catch (error) {
    console.warn(
      `Could not read git diff for release-notes filtering: ${(error as Error).message}. Generating for all registered products.`,
    )
    return null
  }
}

/**
 * Resolve product and dependency changelog paths to repo-relative form
 * before comparing against git output.
 */
const normalizeChangedPathsForComparison = (changedPaths: ReadonlySet<string>): Set<string> => {
  return new Set([...changedPaths].map((path) => path.replace(/\\/g, '/')))
}

/**
 * Load changed paths from git and normalize user-facing changelog paths
 * for consistent set membership checks.
 */
export const getChangedPathsForReleaseFiltering = async (): Promise<Set<string> | null> => {
  const changed = await getPathsChangedSinceHead()
  if (changed === null) {
    return null
  }
  return normalizeChangedPathsForComparison(changed)
}
