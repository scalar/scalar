import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

/**
 * Onboard a brand-new public package to npm so the OIDC release can take over.
 *
 * # Why this exists
 *
 * The release workflow publishes every public package with `pnpm -r publish`
 * using npm trusted publishing (OIDC) — there is no `NPM_TOKEN`. Trusted
 * publishing has a chicken-and-egg problem: a brand-new package name cannot use
 * OIDC on its very first publish, because you cannot configure a trusted
 * publisher until the package already exists on npm. When a new package slips
 * into a release un-bootstrapped, `pnpm -r publish` hits it, aborts with
 * `ENEEDAUTH`, and takes the whole release down with it.
 *
 * This command performs the one-time manual steps for each new package:
 *   1. Publish it once (provenance disabled, since OIDC is not available yet).
 *   2. Configure its GitHub trusted publisher so the OIDC release can publish
 *      every subsequent version.
 *
 * It is idempotent: packages already on npm are skipped, so it is safe to
 * re-run and safe to point at the whole workspace.
 */
export const bootstrapPackage = new Command('bootstrap-package')
  .description('Onboard a brand-new public package to npm so the OIDC release can publish it')
  .argument(
    '[packages...]',
    'Package names to bootstrap. When omitted, auto-detects public workspace packages not yet on npm.',
  )
  .option('--dry-run', 'Print what would happen without publishing or configuring anything')
  .action(async (names: string[], options: { dryRun?: boolean }) => {
    const dryRun = Boolean(options.dryRun)

    printIntro(dryRun)

    // Resolve the set of candidate packages: either the names passed on the
    // command line, or every public workspace package we can discover.
    const candidates = names.length > 0 ? await resolveNamed(names) : await discoverPublicPackages()

    if (candidates.length === 0) {
      console.log(as.yellow('No candidate packages found. Nothing to do.'))
      return
    }

    console.log(as.dim(`Considering ${candidates.length} package(s):`))
    for (const candidate of candidates) {
      console.log(as.dim(`  • ${candidate.name}`))
    }
    console.log('')

    let bootstrapped = 0
    let skipped = 0

    for (const candidate of candidates) {
      if (isOnNpm(candidate.name)) {
        console.log(as.dim(`↷ ${candidate.name} is already on npm — skipping`))
        skipped += 1
        continue
      }

      console.log(as.cyan(`→ Bootstrapping ${as.bold(candidate.name)}`))

      if (dryRun) {
        console.log(as.dim(`    would run: ${publishCommandPreview(candidate.dir)}`))
        console.log(as.dim(`    would run: ${trustCommandPreview(candidate.name)}`))
        bootstrapped += 1
        continue
      }

      publishOnce(candidate.dir)
      configureTrustedPublisher(candidate.name)

      console.log(as.green(`✔ ${candidate.name} is bootstrapped — the OIDC release can publish it from now on`))
      bootstrapped += 1
    }

    console.log('')
    console.log(
      as.green(`Done. ${bootstrapped} package(s) ${dryRun ? 'would be ' : ''}bootstrapped, ${skipped} already on npm.`),
    )
  })

// ---------------------------------------------------------------------------
// Candidate resolution

type Candidate = { name: string; dir: string }

/** Directories that can hold publishable public packages. */
const PACKAGE_FOLDERS = ['packages', 'integrations'] as const

/**
 * Resolve explicitly requested package names to their workspace directories.
 * A name that cannot be found in the workspace is reported and skipped.
 */
async function resolveNamed(names: string[]): Promise<Candidate[]> {
  const all = await discoverAllPackages()
  const byName = new Map(all.map((entry) => [entry.name, entry]))

  const resolved: Candidate[] = []
  for (const name of names) {
    const entry = byName.get(name)
    if (!entry) {
      console.log(as.yellow(`⚠ ${name} was not found in the workspace — skipping`))
      continue
    }
    resolved.push(entry)
  }

  return resolved
}

/** Discover every public (non-private) workspace package. */
async function discoverPublicPackages(): Promise<Candidate[]> {
  const all = await discoverAllPackages()
  return all.filter((entry) => entry.isPublic)
}

/** Read every package.json under the publishable folders. */
async function discoverAllPackages(): Promise<(Candidate & { isPublic: boolean })[]> {
  const root = getWorkspaceRoot()
  const entries: (Candidate & { isPublic: boolean })[] = []

  for (const folder of PACKAGE_FOLDERS) {
    const folderPath = path.resolve(root, folder)
    const dirs = await fs.readdir(folderPath).catch(() => [] as string[])

    for (const dir of dirs) {
      const packageDir = path.resolve(folderPath, dir)
      const manifestPath = path.resolve(packageDir, 'package.json')
      const file = await fs.readFile(manifestPath, 'utf-8').catch(() => null)
      if (!file) {
        continue
      }

      try {
        const manifest = JSON.parse(file) as { name?: string; private?: boolean }
        if (!manifest.name) {
          continue
        }
        entries.push({ name: manifest.name, dir: packageDir, isPublic: manifest.private !== true })
      } catch {
        // Ignore unparsable manifests; the format command already lints those.
      }
    }
  }

  return entries
}

// ---------------------------------------------------------------------------
// npm interactions

/**
 * Check whether a package name already exists on npm.
 *
 * `npm view <name> version` exits non-zero (E404) when the package has never
 * been published, which is exactly the signal we want.
 */
function isOnNpm(name: string): boolean {
  const result = spawnSync('npm', ['view', name, 'version'], { encoding: 'utf-8' })
  return result.status === 0 && Boolean(result.stdout.trim())
}

/**
 * Publish the package once with provenance disabled.
 *
 * The repo `.npmrc` sets `provenance=true`, which fails locally because
 * provenance requires OIDC — the very thing a first publish cannot use.
 * `npm_config_provenance=false` overrides it for this single publish.
 *
 * We use `pnpm publish` (not plain `npm publish`) because pnpm rewrites the
 * `workspace:*` and `catalog:*` dependency ranges in the tarball; `npm publish`
 * would ship those unresolved specifiers and break every install.
 */
function publishOnce(dir: string): void {
  runInteractive('pnpm', ['publish', '--access', 'public', '--no-git-checks'], {
    cwd: dir,
    env: { ...process.env, npm_config_provenance: 'false' },
  })
}

/**
 * Configure the GitHub trusted publisher for the package.
 *
 * The OIDC subject is the caller workflow `main.yml` running in the
 * `production-npm` environment — see `.github/workflows/release.yml`. These
 * parameters mirror the release setup introduced in PR #9941.
 */
function configureTrustedPublisher(name: string): void {
  runInteractive(
    'npm',
    [
      'trust',
      'github',
      name,
      '--repo',
      'scalar/scalar',
      '--file',
      'main.yml',
      '--env',
      'production-npm',
      '--allow-publish',
      '--yes',
    ],
    { env: process.env },
  )
}

/**
 * Run a command interactively so npm's 2FA / OTP prompts reach the maintainer.
 * A non-zero exit throws, aborting the loop rather than silently continuing.
 */
function runInteractive(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv }): void {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.status !== 0) {
    throw new Error(`\`${command} ${args.join(' ')}\` exited with code ${result.status ?? 'unknown'}`)
  }
}

// ---------------------------------------------------------------------------
// Output helpers

function printIntro(dryRun: boolean): void {
  console.log(as.bold('Bootstrap a brand-new public package on npm'))
  console.log('')
  console.log(
    as.dim(
      'npm trusted publishing (OIDC) cannot publish a package name for the first time, because a trusted\n' +
        'publisher cannot be configured until the package already exists. This script performs that one-time\n' +
        'first publish and wires up the trusted publisher, so the OIDC release can take over afterwards.',
    ),
  )
  console.log('')

  if (dryRun) {
    console.log(as.yellow('Dry run: nothing will be published and no trusted publisher will be configured.'))
    console.log('')
    return
  }

  console.log(as.yellow('Before you run this:'))
  console.log(as.yellow('  • You must be logged in: run `npm whoami` to confirm (otherwise `npm login`).'))
  console.log(as.yellow('  • Publishing and `npm trust` both require 2FA, and the loop can prompt repeatedly.'))
  console.log(
    as.yellow(
      '    On npmjs.com, enable the "Skip 2FA for 5 minutes" toggle first so you are not asked again and again.',
    ),
  )
  console.log('')
}

/** Human-readable preview of the publish command for dry runs. */
function publishCommandPreview(dir: string): string {
  const root = getWorkspaceRoot()
  const relative = path.relative(root, dir) || '.'
  return `npm_config_provenance=false pnpm publish --access public --no-git-checks (in ${relative})`
}

/** Human-readable preview of the trust command for dry runs. */
function trustCommandPreview(name: string): string {
  return `npm trust github "${name}" --repo scalar/scalar --file main.yml --env production-npm --allow-publish --yes`
}
