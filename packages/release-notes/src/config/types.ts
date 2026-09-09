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
  /**
   * Whether a "Pull request context" block will be present in the user prompt. Mirrors what the
   * default system prompt reacts to, so a custom prompt can describe the same inputs.
   */
  includePullRequestContext: boolean
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
  /**
   * Whether to fetch referenced pull requests and feed their titles and descriptions
   * to the AI provider. Defaults to `true`. Set to `false` to skip the GitHub API
   * calls entirely and generate from the CHANGELOG alone.
   */
  pullRequestContext?: boolean
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

/** A built-in provider selected by name, or a custom pluggable provider. */
export type ProviderOption = BuiltInProviderName | ReleaseNotesProvider

/**
 * User-facing release notes configuration, as written in a `release-notes.config.*` file.
 */
export type ReleaseNotesConfig = {
  /**
   * Either a built-in provider name (`'anthropic'` or `'openai'`) that is created with
   * its defaults, or a custom provider object. Defaults to `'anthropic'`.
   */
  provider?: ProviderOption
  /** Model id handed to the provider. Falls back to the provider's own default model. */
  model?: string
  /**
   * Environment variable that holds the built-in provider API key. Defaults to
   * `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Ignored by custom providers.
   */
  apiKeyEnv?: string
  /** Release note targets. */
  products?: readonly ReleaseNotesProduct[]
  /** GitHub settings for PR context and changelog links. */
  github?: GithubOptions
  /** Prompt customisation hooks. */
  prompts?: PromptOptions
}

/**
 * Release notes configuration after file discovery, CLI overrides, and provider construction.
 */
export type ResolvedReleaseNotesConfig = {
  /** The provider to call, already constructed. */
  provider: ReleaseNotesProvider
  /**
   * Set when the provider came from a built-in name, so callers can check for its API key
   * before running. `null` for custom providers.
   */
  builtInProviderName: BuiltInProviderName | null
  /** Model id handed to the provider. Falls back to the provider's own default model. */
  model?: string
  /** Environment variable that holds the built-in provider API key. */
  apiKeyEnv?: string
  /** Release note targets. */
  products: readonly ReleaseNotesProduct[]
  /** GitHub settings for PR context and changelog links. */
  github: GithubOptions
  /** Prompt customisation hooks. */
  prompts: PromptOptions
}
