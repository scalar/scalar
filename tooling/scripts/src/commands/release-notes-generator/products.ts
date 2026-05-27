/**
 * Curated release-notes products wired into `release-notes-generator --all`.
 *
 * Each entry maps a user-facing product to its Changesets CHANGELOG input,
 * on-disk `RELEASE_NOTES.json` output, and optional dependency CHANGELOGs
 * whose changes ship inside the parent release.
 */
export type ReleaseNotesProduct = {
  /** Short slug used in docs routes (for example `api-reference`). */
  slug: string
  /** NPM package name passed to the generator CLI (for example `scalar-app`). */
  packageName: string
  /** User-facing product name used in AI prompts and markdown preambles. */
  displayName: string
  /** One-line product description for the AI system prompt. */
  description: string
  /** Path to the product's Changesets-style `CHANGELOG.md`. */
  changelogPath: string
  /** Path to the curated `RELEASE_NOTES.json` source of truth. */
  outputPath: string
  /** Optional derived `RELEASE_NOTES.md` path (defaults to sibling of JSON). */
  markdownPath?: string
  /** Internal dependency CHANGELOGs folded into the parent release note. */
  dependencyChangelogPaths?: readonly string[]
}

/** Derive the sibling markdown path from a JSON output path. */
export const deriveMarkdownPath = (jsonPath: string): string => {
  return jsonPath.endsWith('.json') ? `${jsonPath.slice(0, -'.json'.length)}.md` : `${jsonPath}.md`
}

/** Canonical shared JSON Schema path for every `RELEASE_NOTES.json` file. */
export const SHARED_RELEASE_NOTES_SCHEMA_PATH = 'tooling/scripts/schemas/RELEASE_NOTES.schema.json'

/** Products that receive AI-generated release notes on every release. */
export const RELEASE_NOTES_PRODUCTS: readonly ReleaseNotesProduct[] = [
  {
    slug: 'api-client',
    packageName: 'scalar-app',
    displayName: 'Scalar API Client',
    description: 'a Vue-based open-source API testing client with desktop and web apps',
    changelogPath: 'projects/scalar-app/CHANGELOG.md',
    outputPath: 'projects/scalar-app/RELEASE_NOTES.json',
    dependencyChangelogPaths: ['packages/api-client/CHANGELOG.md'],
  },
  {
    slug: 'api-reference',
    packageName: '@scalar/api-reference',
    displayName: 'Scalar API Reference',
    description: 'a Vue component that renders beautiful API documentation from OpenAPI documents',
    changelogPath: 'packages/api-reference/CHANGELOG.md',
    outputPath: 'packages/api-reference/RELEASE_NOTES.json',
  },
  {
    slug: 'agent',
    packageName: '@scalar/agent-chat',
    displayName: 'Scalar Agent',
    description: 'an OpenAPI-backed agent chat UI and SDK for connecting APIs to LLMs',
    changelogPath: 'packages/agent-chat/CHANGELOG.md',
    outputPath: 'packages/agent-chat/RELEASE_NOTES.json',
  },
  {
    slug: 'mock-server',
    packageName: '@scalar/mock-server',
    displayName: 'Scalar Mock Server',
    description: 'a Node.js mock server that generates realistic API responses from OpenAPI documents',
    changelogPath: 'packages/mock-server/CHANGELOG.md',
    outputPath: 'packages/mock-server/RELEASE_NOTES.json',
  },
] as const
