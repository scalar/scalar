// Checkout /tooling/scripts/README.md for more information on how to use this command.

import fs from 'node:fs/promises'
import path from 'node:path'

import as from 'ansis'
import { Command } from 'commander'

import { getWorkspaceRoot } from '@/helpers'

const OUTPUT_PATH = 'documentation/assets/changelog-data.js'

/**
 * Products shown in the changelog explorer.
 *
 * `slug` and `notes` mirror `release-notes.config.ts`, which stays the source of
 * truth for which products publish release notes. The presentation fields live
 * here because the release notes pipeline has no opinion about how the docs site
 * labels a product. Accent colours are not listed: the page stylesheet keys them
 * off the slug so they can differ between light and dark mode.
 */
const PRODUCTS = [
  {
    slug: 'api-client',
    name: 'API Client',
    tagline: 'Desktop and web API testing client',
    notes: 'projects/scalar-app/RELEASE_NOTES.json',
    href: '/resources/changelog/api-client',
  },
  {
    slug: 'api-reference',
    name: 'API Reference',
    tagline: 'OpenAPI documentation for Vue and framework integrations',
    notes: 'packages/api-reference/RELEASE_NOTES.json',
    href: '/resources/changelog/api-reference',
  },
  {
    slug: 'agent',
    name: 'Agent',
    tagline: 'OpenAPI-backed agent chat UI and SDK',
    notes: 'packages/agent-chat/RELEASE_NOTES.json',
    href: '/resources/changelog/agent',
  },
  {
    slug: 'mock-server',
    name: 'Mock Server',
    tagline: 'Realistic API responses from OpenAPI documents',
    notes: 'packages/mock-server/RELEASE_NOTES.json',
    href: '/resources/changelog/mock-server',
  },
] as const

/** The subset of `RELEASE_NOTES.json` the explorer renders. */
type ContentBlock = {
  type: string
  text?: string
  items?: string[]
  href?: string
}

type ReleaseNoteEntry = {
  version: string
  date: string
  title: string
  content?: ContentBlock[]
}

/** A release flattened into the shape the explorer consumes. */
type ExplorerRelease = {
  product: string
  version: string
  date: string
  title: string
  summary: string
  highlights: string[]
  href: string
  /** Which semver component moved compared to the previous release of this product. */
  kind: 'major' | 'minor' | 'patch'
}

export const generateChangelogData = new Command('generate-changelog-data')
  .description('Flatten every RELEASE_NOTES.json into the data file behind the interactive changelog')
  .action(async () => {
    await generateChangelogDataFile()
  })

async function generateChangelogDataFile(): Promise<void> {
  const root = getWorkspaceRoot()

  console.log(as.cyan('Reading release notes...\n'))

  const releases: ExplorerRelease[] = []

  for (const product of PRODUCTS) {
    const notesPath = path.join(root, product.notes)

    let entries: ReleaseNoteEntry[]
    try {
      entries = parseEntries(await fs.readFile(notesPath, 'utf-8'))
    } catch (error) {
      console.error(
        as.red(`Failed to read ${product.notes}: ${error instanceof Error ? error.message : String(error)}`),
      )
      process.exit(1)
    }

    // Oldest first, so each release can be compared against the one before it.
    const ordered = [...entries].sort((a, b) => compareVersions(a.version, b.version))

    ordered.forEach((entry, index) => {
      releases.push({
        product: product.slug,
        version: entry.version,
        date: entry.date,
        title: entry.title,
        summary: findSummary(entry),
        highlights: findHighlights(entry),
        href: findHref(entry),
        kind: classifyRelease(entry.version, ordered[index - 1]?.version),
      })
    })

    console.log(`${as.green('✓')} ${product.name}: ${as.bold(String(ordered.length))} releases`)
  }

  releases.sort(compareByDateDescending)

  const outputPath = path.join(root, OUTPUT_PATH)
  await fs.writeFile(outputPath, renderDataFile(releases), 'utf-8')

  console.log(`\n${as.green('✓')} Wrote ${as.bold(OUTPUT_PATH)} (${releases.length} releases)`)
}

// ---------------------------------------------------------------------------
// Reading release notes
// ---------------------------------------------------------------------------

function parseEntries(raw: string): ReleaseNoteEntry[] {
  const parsed: unknown = JSON.parse(raw)

  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of release notes')
  }

  return parsed.filter((entry): entry is ReleaseNoteEntry => {
    if (typeof entry !== 'object' || entry === null) {
      return false
    }
    const candidate = entry as Partial<ReleaseNoteEntry>
    return (
      typeof candidate.version === 'string' && typeof candidate.date === 'string' && typeof candidate.title === 'string'
    )
  })
}

/** The first paragraph, which the generator writes as the release summary. */
function findSummary(entry: ReleaseNoteEntry): string {
  return entry.content?.find((block) => block.type === 'paragraph')?.text?.trim() ?? ''
}

/** Every bullet across the entry's lists, in order. */
function findHighlights(entry: ReleaseNoteEntry): string[] {
  return (entry.content ?? [])
    .filter((block) => block.type === 'list')
    .flatMap((block) => block.items ?? [])
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/** The maintainer changelog this release links out to. */
function findHref(entry: ReleaseNoteEntry): string {
  return entry.content?.find((block) => block.type === 'href')?.href ?? ''
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

/** Numeric semver parts, ignoring any prerelease or build metadata. */
function versionParts(version: string): [number, number, number] {
  const [core = ''] = version.split(/[-+]/)
  const [major, minor, patch] = core.split('.').map((part) => Number.parseInt(part, 10) || 0)
  return [major ?? 0, minor ?? 0, patch ?? 0]
}

function compareVersions(a: string, b: string): number {
  const left = versionParts(a)
  const right = versionParts(b)

  for (let index = 0; index < 3; index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

/**
 * Classify a release by which semver component moved.
 *
 * Without a previous release to compare against - the oldest entry we kept for a
 * product - fall back to reading the version itself, which lands on the same
 * answer for anything that was cut from a clean `x.y.0`.
 */
function classifyRelease(version: string, previous: string | undefined): ExplorerRelease['kind'] {
  const [major, minor, patch] = versionParts(version)

  if (previous === undefined) {
    if (minor === 0 && patch === 0) {
      return 'major'
    }
    return patch === 0 ? 'minor' : 'patch'
  }

  const [previousMajor, previousMinor] = versionParts(previous)

  if (major !== previousMajor) {
    return 'major'
  }
  return minor !== previousMinor ? 'minor' : 'patch'
}

function compareByDateDescending(a: ExplorerRelease, b: ExplorerRelease): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1
  }
  if (a.product !== b.product) {
    return a.product < b.product ? -1 : 1
  }
  return compareVersions(b.version, a.version)
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/**
 * Render the data file.
 *
 * The docs site loads this with a plain script tag, so it assigns to a global
 * rather than exporting. Output is deterministic - no timestamp - so a rerun
 * with unchanged release notes produces no diff.
 */
function renderDataFile(releases: ExplorerRelease[]): string {
  const products = PRODUCTS.map((product) => ({
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    href: product.href,
  }))

  return [
    '/*',
    ' * Release data behind the interactive changelog on documentation/changelog/index.md.',
    ' *',
    ' * Generated by `pnpm script generate-changelog-data` from every RELEASE_NOTES.json',
    ' * in the workspace. Edits made here are overwritten on the next release - change',
    ' * the release notes instead.',
    ' */',
    '',
    'window.scalarChangelog = {',
    `  products: ${JSON.stringify(products, null, 2).split('\n').join('\n  ')},`,
    `  releases: ${JSON.stringify(releases, null, 2).split('\n').join('\n  ')},`,
    '}',
    '',
    '/* The explorer may be parsed before this file, so tell it the data landed. */',
    "document.dispatchEvent(new Event('scalar-changelog-data'))",
    '',
  ].join('\n')
}
