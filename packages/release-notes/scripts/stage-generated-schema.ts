/**
 * Regenerate the release notes JSON Schema and stage it for commit.
 *
 * Used by the lefthook `release-notes-schema-generate` pre-commit hook.
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'

import { GENERATED_SCHEMA_STAGED_PATHS, getRepoRoot } from './generated-schema-paths'

const packageRoot = path.join(import.meta.dirname, '..')
const repoRoot = getRepoRoot()

const generateResult = spawnSync('pnpm', ['run', 'schema:generate'], {
  cwd: packageRoot,
  stdio: 'inherit',
  shell: true,
})

if (generateResult.status !== 0) {
  process.exit(generateResult.status ?? 1)
}

const gitAddResult = spawnSync('git', ['add', ...GENERATED_SCHEMA_STAGED_PATHS], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (gitAddResult.status !== 0) {
  process.exit(gitAddResult.status ?? 1)
}
