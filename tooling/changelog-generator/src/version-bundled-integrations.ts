import { globSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** Workspace metadata used to identify integrations that embed the standalone bundle. */
type IntegrationPackage = {
  version: string
  dependencies?: Record<string, string>
  scripts?: Record<string, string>
}

const readPackage = async (path: string): Promise<IntegrationPackage> => JSON.parse(await readFile(path, 'utf8'))

/**
 * Runs versioning and records the bundled API Reference version only for released
 * integrations that copy the standalone JS. Other dependency changes stay silent.
 */
export const versionBundledIntegrations = async (root: string, versionPackages: () => Promise<void>): Promise<void> => {
  const integrations = await Promise.all(
    globSync(['integrations/*/package.json', 'integrations/dotnet/*/package.json'], { cwd: root }).map(
      async (path) => ({ path: join(root, path), package: await readPackage(join(root, path)) }),
    ),
  )
  const bundledIntegrations = integrations.filter(
    ({ package: pkg }) =>
      pkg.dependencies?.['@scalar/api-reference'] &&
      pkg.scripts?.['copy:standalone']?.includes('packages/api-reference/dist/browser/standalone.js'),
  )

  await versionPackages()

  const apiReference = await readPackage(join(root, 'packages/api-reference/package.json'))
  for (const integration of bundledIntegrations) {
    const updated = await readPackage(integration.path)
    if (updated.version === integration.package.version) {
      continue
    }

    const changelogPath = join(dirname(integration.path), 'CHANGELOG.md')
    const changelog = await readFile(changelogPath, 'utf8')
    const heading = `## ${updated.version}\n`
    if (!changelog.includes(heading)) {
      throw new Error(`Missing release heading ${updated.version} in ${changelogPath}`)
    }

    await writeFile(
      changelogPath,
      changelog.replace(
        heading,
        `${heading}\n### Bundled API Reference\n\n- @scalar/api-reference@${apiReference.version}\n`,
      ),
    )
  }
}
