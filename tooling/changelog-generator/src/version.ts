import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { versionBundledIntegrations } from './version-bundled-integrations'

const root = fileURLToPath(new URL('../../../', import.meta.url))

await versionBundledIntegrations(root, async () => {
  const { stdout, stderr } = await promisify(execFile)('pnpm', ['exec', 'changeset', 'version'], { cwd: root })
  process.stdout.write(stdout)
  process.stderr.write(stderr)
})
