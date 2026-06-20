/**
 * A release notes target wired to a changelog input and JSON/Markdown outputs.
 */
export type ReleaseNotesProduct = {
  /** Short slug used by the CLI for `--product` filtering. */
  slug: string
  /** NPM package name shown in prompts and logs. */
  packageName: string
  /** User-facing product name used in AI prompts and markdown preambles. */
  displayName: string
  /** One-line product description for the AI system prompt. */
  description: string
  /** Path to the product's Changesets-style `CHANGELOG.md`. */
  changelogPath: string
  /** Path to the curated `RELEASE_NOTES.json` source of truth. */
  outputPath: string
  /** Optional derived `RELEASE_NOTES.md` path. Defaults to a sibling of the JSON file. */
  markdownPath?: string
  /** Dependency CHANGELOGs folded into the parent release note. */
  dependencyChangelogPaths?: readonly string[]
}

export type ProductPromptContext = {
  /** User-facing product name. */
  displayName: string
  /** One-line description of what the product is. */
  description: string
}

export type PromptContext = {
  product: ProductPromptContext
}

export type PromptOptions = {
  /** Fallback description used when the CLI creates an ad-hoc product. */
  productDescriptionFallback?: string
  /** Optional full system prompt override. */
  systemPrompt?: (context: PromptContext) => string
}

export type GithubOptions = {
  /** GitHub repository slug in `owner/repo` form. */
  repo?: string
  /** Branch used when building changelog links and git diff filters. */
  baseBranch?: string
  /** GitHub token for PR context fetching. */
  token?: string
}

/**
 * Pluggable AI provider contract used by the generic release notes generator.
 */
export type ReleaseNotesProvider = {
  name: string
  defaultModel?: string
  generateJson(options: {
    model?: string
    systemPrompt: string
    userPrompt: string
    schema: unknown
    maxOutputTokens: number
    signal?: AbortSignal
  }): Promise<unknown>
}

export type BuiltInProviderName = 'anthropic' | 'openai'

export type ReleaseNotesConfig = {
  provider?: ReleaseNotesProvider
  products?: readonly ReleaseNotesProduct[]
  github?: GithubOptions
  prompts?: PromptOptions
}

export type ResolvedReleaseNotesConfig = Required<Pick<ReleaseNotesConfig, 'github' | 'prompts'>> &
  Omit<ReleaseNotesConfig, 'github' | 'prompts'> & {
    products: readonly ReleaseNotesProduct[]
  }
