import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import yaml from 'yaml'
import { z } from 'zod'
import as from 'ansis'
import pm from 'picomatch'
import { format } from 'prettier'
import { Command } from 'commander'
import { getWorkspaceRoot } from '@/helpers'
import semver, { type ReleaseType } from 'semver'
import { latestVersion } from '@/helpers/npm-version'

export const outdated = new Command('outdated')
  .description('Check for outdated packages')
  .argument('[packages...]', 'The packages to check')
  .action(checkVersions)

export const update = new Command('update')
  .argument('<packages...>', 'The packages to update')
  .description('Update packages in the workspace catalog')
  .action(async (input: string[]) => {
    const workspace = loadWorkspace()

    /** List of all packages names across all catalogs */
    const packageNames = Object.values(workspace.catalogs).flatMap((c) => Object.keys(c))

    /** List of all packages that match the input globs */
    const names = input.flatMap((p) => packageNames.filter((pkg) => pm(p)(pkg)))

    /** Set all matches to latest version */
    await Promise.all(
      names.map(async (n) => {
        const catalog = Object.keys(workspace.catalogs).find((c) => Object.keys(workspace.catalogs[c]).includes(n))

        if (catalog) {
          const latest = await latestVersion(n, workspace.catalogs[catalog][n])
          // Set the latest version into the catalog
          workspace.catalogs[catalog][n] = latest.version

          console.log(`Updated ${as.bold.blue(n)} to ${as.bold.green(latest.version)}`)
        }
      }),
    )

    const workspaceRoot = getWorkspaceRoot()

    // Save the updated workspace file
    await writeFile(
      `${workspaceRoot}/pnpm-workspace.yaml`,
      await format(yaml.stringify(workspace), {
        parser: 'yaml',
        'singleQuote': true,
      }),
    )
    console.log(as.green('Packages updated successfully. Please run `pnpm install`.'))
  })

// ---------------------------------------------------------------------------

export const pnpmWorkspaceSchema = z.object({
  packages: z.string().array(),
  catalog: z.record(z.string()).optional(),
  catalogs: z.record(z.string(), z.record(z.string(), z.string())).default({}),
})

type PackageUpdates = Record<string, { current: string; latest: string; error: string }>

/** Load the pnpm workspace file */
function loadWorkspace() {
  const workspaceRoot = getWorkspaceRoot()

  const filepath = `${workspaceRoot}/pnpm-workspace.yaml`
  console.log(as.green(`Loading ${filepath}...`))
  const packages = readFileSync(filepath, 'utf8')

  return pnpmWorkspaceSchema.parse(yaml.parse(packages))
}

/** Check each catalog version to see if there is a newer version available */
async function checkVersions(packages: string[]) {
  const catalogs = loadWorkspace().catalogs

  /** List of all packages names across all catalogs */
  const packageNames = Object.values(catalogs).flatMap((c) => Object.keys(c))

  // Get a list of all the current packages across all catalogs
  const mergedCatalog: Record<string, string> = {}
  Object.keys(catalogs).forEach((catalog) => {
    Object.assign(mergedCatalog, catalogs[catalog])
  })

  /** List of all packages that match the input globs */
  const filteredPackageNames = packages.length
    ? packageNames.filter((pkg) => packages.some((p) => pm(p)(pkg)))
    : packageNames

  const updates: PackageUpdates = {}

  console.log(as.green('Checking for updates...'))

  await Promise.all(
    filteredPackageNames.map(async (p) => {
      const current = mergedCatalog[p]
      const latest = await latestVersion(p, current)
      if (latest.version !== current) {
        updates[p] = { current, latest: latest.version, error: latest.error }
      }
    }),
  )

  // Handle terminal padding
  const longest = Math.max(...Object.keys(updates).map((p) => p.length))
  const longestVersion = Math.max(...Object.values(updates).map((u) => u.current.length)) + 2

  console.log(
    as.blueBright.bold.underline(`\n${'Package'.padEnd(longest)} ${'Current'.padEnd(longestVersion)} ${'Latest'}`),
  )

  Object.entries(updates).forEach(([name, update]) => {
    if (typeof update.latest !== 'string' || typeof update.current !== 'string') {
      console.log(as.redBright(`${name} has an invalid version: ${update.latest}`))
      return
    }

    const strip = (v: string) => /.*([0-9]+\.[0-9]+\.[0-9]+)$/.exec(v)?.[1] ?? v
    const change = semver.diff(strip(update.current), strip(update.latest))

    const colors: { [x in ReleaseType]: typeof as.red } = {
      major: as.red,
      minor: as.yellow,
      patch: as.green,
      preminor: as.gray,
      prepatch: as.gray,
      premajor: as.gray,
      prerelease: as.gray,
    }
    console.log(
      `${name.padEnd(longest)} ${update.current.padEnd(longestVersion)} ${colors[change ?? 'prerelease'](update.latest)}`,
    )
  })
}
