import { execFile } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import type { ReleaseNotesProduct } from '../config/types'

const execFileAsync = promisify(execFile)

const getWorkspaceRoot = (): string => process.env.INIT_CWD ?? process.cwd()

const normalizeRepoRelativePath = (inputPath: string): string => {
  const repoRoot = getWorkspaceRoot()
  const absolute = resolve(repoRoot, inputPath)
  return relative(repoRoot, absolute).replace(/\\/g, '/')
}

export const getVersionedPathsForChangelog = (changelogPath: string): string[] => {
  const normalizedChangelog = normalizeRepoRelativePath(changelogPath)
  const packageJsonPath = join(dirname(normalizedChangelog), 'package.json').replace(/\\/g, '/')
  return [normalizedChangelog, packageJsonPath]
}

export const wasChangelogVersioned = (changelogPath: string, changedPaths: ReadonlySet<string>): boolean => {
  return getVersionedPathsForChangelog(changelogPath).some((path) => changedPaths.has(path))
}

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

const getPathsChangedSinceBase = async (baseBranch: string): Promise<Set<string> | null> => {
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', baseBranch], {
      cwd: getWorkspaceRoot(),
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

export const getChangedPathsForReleaseFiltering = async (baseBranch = 'main'): Promise<Set<string> | null> => {
  const changed = await getPathsChangedSinceBase(baseBranch)
  if (changed === null) {
    return null
  }
  return new Set([...changed].map((path) => path.replace(/\\/g, '/')))
}
