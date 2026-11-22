import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Returns the monorepo root directory path */
export function getWorkspaceRoot() {
  const __filename = fileURLToPath(import.meta.url)
  let currentDir = path.dirname(__filename)

  // Walk up the directory tree until we find pnpm-workspace.yaml
  while (currentDir !== path.dirname(currentDir)) {
    const workspaceFile = path.join(currentDir, 'pnpm-workspace.yaml')
    if (fs.existsSync(workspaceFile)) {
      return currentDir
    }
    currentDir = path.dirname(currentDir)
  }

  // Fallback: use relative path (should not happen in normal operation)
  const __dirname = path.dirname(__filename)
  return path.resolve(`${__dirname}/../../../../`)
}
