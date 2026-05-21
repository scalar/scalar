/**
 * Regenerate schema-derived types in `@scalar/types` and stage them for commit.
 *
 * Used by the lefthook `schemas-types-generate` pre-commit hook.
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'

import { GENERATED_TYPE_STAGED_PATHS, getRepoRoot } from './generated-type-paths'

const packageRoot = path.join(import.meta.dirname, '..')
const repoRoot = getRepoRoot()

const generateResult = spawnSync('pnpm', ['run', 'types:generate'], {
  cwd: packageRoot,
  stdio: 'inherit',
})

if (generateResult.status !== 0) {
  process.exit(generateResult.status ?? 1)
}

const gitAddResult = spawnSync('git', ['add', ...GENERATED_TYPE_STAGED_PATHS], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (gitAddResult.status !== 0) {
  process.exit(gitAddResult.status ?? 1)
}
