import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createAnthropicProvider } from '../providers/anthropic'
import { createOpenAIProvider } from '../providers/openai'
import type {
  BuiltInProviderName,
  GithubOptions,
  ProviderOption,
  ReleaseNotesConfig,
  ReleaseNotesProvider,
  ResolvedReleaseNotesConfig,
} from './types'

const CONFIG_FILES = [
  'release-notes.config.mjs',
  'release-notes.config.js',
  'release-notes.config.json',
  'release-notes.config.ts',
] as const

export type CliConfigOverrides = {
  config?: string
  provider?: BuiltInProviderName
  model?: string
  apiKeyEnv?: string
  repo?: string
  baseBranch?: string
  /**
   * Only `false` has an effect: the CLI can turn pull request context off, but never
   * back on over a config file that disabled it.
   */
  pullRequestContext?: boolean
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const findConfigPath = async (cwd: string): Promise<string | null> => {
  for (const file of CONFIG_FILES) {
    const candidate = resolve(cwd, file)
    if (await pathExists(candidate)) {
      return candidate
    }
  }
  return null
}

const loadConfigFile = async (path: string): Promise<ReleaseNotesConfig> => {
  if (path.endsWith('.json')) {
    const raw = await readFile(path, 'utf-8')
    return JSON.parse(raw) as ReleaseNotesConfig
  }

  const module = (await import(pathToFileURL(path).href)) as { default?: unknown }
  if (!module.default || typeof module.default !== 'object') {
    throw new Error(`Expected ${path} to export a release notes config object as default.`)
  }
  return module.default as ReleaseNotesConfig
}

/** Default environment variable that holds the API key for a built-in provider. */
const getBuiltInProviderApiKeyEnv = (provider: BuiltInProviderName, apiKeyEnv?: string): string =>
  apiKeyEnv ?? (provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY')

const getApiKey = (provider: BuiltInProviderName, apiKeyEnv?: string): string | undefined =>
  process.env[getBuiltInProviderApiKeyEnv(provider, apiKeyEnv)]

/** Whether the API key for a built-in provider is available (and non-empty) in the environment. */
export const hasBuiltInProviderApiKey = (provider: BuiltInProviderName, apiKeyEnv?: string): boolean =>
  Boolean(getApiKey(provider, apiKeyEnv))

export const createBuiltInProvider = (options: {
  provider: BuiltInProviderName
  model?: string
  apiKeyEnv?: string
}): ReleaseNotesProvider => {
  const apiKey = getApiKey(options.provider, options.apiKeyEnv)
  if (options.provider === 'openai') {
    return createOpenAIProvider({ apiKey, model: options.model })
  }
  return createAnthropicProvider({ apiKey, model: options.model })
}

/** Provider used when neither the config nor the CLI names one. */
const DEFAULT_PROVIDER: BuiltInProviderName = 'anthropic'

const isBuiltInProviderName = (value: unknown): value is BuiltInProviderName =>
  value === 'anthropic' || value === 'openai'

const isReleaseNotesProvider = (value: unknown): value is ReleaseNotesProvider =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { generateJson?: unknown }).generateJson === 'function'

/** One layer of configuration that can select a provider and describe how to build it. */
type ProviderLayer = {
  provider?: ProviderOption
  model?: string
  apiKeyEnv?: string
}

/**
 * Pick the provider, and the model and API key environment variable that belong with it.
 *
 * `model` and `apiKeyEnv` describe whichever provider their own layer selects, so they are only
 * carried over from layers that select the winning provider. That keeps settings written for one
 * provider from reaching another: a config written for Anthropic never hands an Anthropic model
 * id, or an Anthropic API key, to OpenAI.
 *
 * A layer that names no provider is not provider-agnostic: it selects whatever the next layer
 * down selects. When no layer names one, they all select the default provider, which is the
 * provider each of them would have used on its own.
 *
 * Layers are ordered by precedence, highest first.
 */
const resolveProviderSelection = (
  layers: readonly ProviderLayer[],
): { selection: ProviderOption; model?: string; apiKeyEnv?: string } => {
  // Treat `null` as unset, so a JSON round-trip that nulls a field falls through to a lower layer.
  // An empty string is a typo rather than a setting: naming no environment variable at all beats
  // resolving `process.env['']` and reporting a missing API key.
  const optional = (value: string | null | undefined): string | undefined =>
    value === '' ? undefined : (value ?? undefined)
  const normalized = layers.map((layer) => ({
    provider: layer.provider ?? undefined,
    model: optional(layer.model),
    apiKeyEnv: optional(layer.apiKeyEnv),
  }))
  const effectiveProviders = normalized.map(
    (_, index) =>
      normalized
        .slice(index)
        .map((layer) => layer.provider)
        .find((provider) => provider !== undefined) ?? DEFAULT_PROVIDER,
  )
  const selection = effectiveProviders[0] ?? DEFAULT_PROVIDER
  const applicable = normalized.filter((_, index) => effectiveProviders[index] === selection)

  return {
    selection,
    model: applicable.find((layer) => layer.model !== undefined)?.model,
    apiKeyEnv: applicable.find((layer) => layer.apiKeyEnv !== undefined)?.apiKeyEnv,
  }
}

/**
 * Turn a provider name or provider object into a constructed provider.
 */
const resolveProvider = (
  selection: ProviderOption,
  model?: string,
  apiKeyEnv?: string,
): { provider: ReleaseNotesProvider; builtInProviderName: BuiltInProviderName | null } => {
  // A custom provider is used as-is. It builds itself, so apiKeyEnv is meaningless here,
  // though `model` still reaches it later through generateJson.
  if (isReleaseNotesProvider(selection)) {
    return { provider: selection, builtInProviderName: null }
  }

  if (isBuiltInProviderName(selection)) {
    return {
      provider: createBuiltInProvider({ provider: selection, model, apiKeyEnv }),
      builtInProviderName: selection,
    }
  }

  throw new Error('Unsupported provider. Use "anthropic", "openai", or a provider object with a generateJson function.')
}

/**
 * Merge option objects, highest precedence first, ignoring keys a layer left unset.
 *
 * Unlike an object spread, an explicit `undefined` or `null` in one layer never wipes a value a
 * lower layer set, and fields this file does not know about are carried through untouched. Every
 * key is optional in the result, so this suits option types whose fields are all optional.
 */
const layerOptions = <T extends object>(layers: readonly (T | undefined)[]): Partial<T> => {
  const merged = new Map<string, unknown>()

  for (const layer of [...layers].reverse()) {
    for (const [key, value] of Object.entries(layer ?? {})) {
      if (value !== undefined && value !== null) {
        merged.set(key, value)
      }
    }
  }

  // `Object.fromEntries` defines own properties, so a `__proto__` key from a config file stays
  // inert data rather than re-pointing the prototype the way an assignment would.
  return Object.fromEntries(merged) as Partial<T>
}

/** Layers are ordered by precedence, highest first, matching `layerOptions`. */
const resolveGithub = (
  githubLayers: readonly (GithubOptions | undefined)[],
  overrides: CliConfigOverrides,
): GithubOptions => {
  const github = layerOptions(githubLayers)

  return {
    ...github,
    repo: overrides.repo ?? github.repo,
    baseBranch: overrides.baseBranch ?? github.baseBranch ?? 'main',
    token: github.token ?? process.env.GITHUB_TOKEN,
    // The CLI flag can only turn pull request context off, never back on.
    pullRequestContext: overrides.pullRequestContext === false ? false : (github.pullRequestContext ?? true),
  }
}

export const readReleaseNotesConfig = async (
  overrides: CliConfigOverrides = {},
  baseConfig: ReleaseNotesConfig = {},
  cwd = process.env.INIT_CWD ?? process.cwd(),
): Promise<ResolvedReleaseNotesConfig> => {
  const configPath = overrides.config ? resolve(cwd, overrides.config) : await findConfigPath(cwd)
  const fileConfig = configPath ? await loadConfigFile(configPath) : {}

  const { selection, model, apiKeyEnv } = resolveProviderSelection([
    { provider: overrides.provider, model: overrides.model, apiKeyEnv: overrides.apiKeyEnv },
    { provider: fileConfig.provider, model: fileConfig.model, apiKeyEnv: fileConfig.apiKeyEnv },
    { provider: baseConfig.provider, model: baseConfig.model, apiKeyEnv: baseConfig.apiKeyEnv },
  ])
  const { provider, builtInProviderName } = resolveProvider(selection, model, apiKeyEnv)

  return {
    provider,
    builtInProviderName,
    model,
    // A custom provider built itself, so the environment variable never applied to it.
    apiKeyEnv: builtInProviderName ? apiKeyEnv : undefined,
    products: fileConfig.products ?? baseConfig.products ?? [],
    github: resolveGithub([fileConfig.github, baseConfig.github], overrides),
    prompts: layerOptions([fileConfig.prompts, baseConfig.prompts]),
  }
}
