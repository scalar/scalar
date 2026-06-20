import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createAnthropicProvider } from '../providers/anthropic'
import { createOpenAIProvider } from '../providers/openai'
import { DEFAULT_RELEASE_NOTES_SCHEMA_PATH } from '../writers/write-release-notes-schema'
import type {
  BuiltInProviderName,
  GithubOptions,
  ReleaseNotesConfig,
  ReleaseNotesProvider,
  ResolvedReleaseNotesConfig,
  SchemaOptions,
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
  schema?: string | null
  noSchema?: boolean
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

const getApiKey = (provider: BuiltInProviderName, apiKeyEnv?: string): string | undefined => {
  if (apiKeyEnv) {
    return process.env[apiKeyEnv]
  }
  return provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY
}

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

const resolveSchema = (configSchema: SchemaOptions | undefined, overrides: CliConfigOverrides): SchemaOptions => {
  if (overrides.noSchema || overrides.schema === null) {
    return { ...configSchema, path: null }
  }
  if (overrides.schema !== undefined) {
    return { ...configSchema, path: overrides.schema }
  }
  return {
    path: configSchema?.path ?? DEFAULT_RELEASE_NOTES_SCHEMA_PATH,
    id: configSchema?.id,
    title: configSchema?.title,
  }
}

const resolveGithub = (configGithub: GithubOptions | undefined, overrides: CliConfigOverrides): GithubOptions => {
  return {
    repo: overrides.repo ?? configGithub?.repo,
    baseBranch: overrides.baseBranch ?? configGithub?.baseBranch ?? 'main',
    token: configGithub?.token ?? process.env.GITHUB_TOKEN,
  }
}

export const readReleaseNotesConfig = async (
  overrides: CliConfigOverrides = {},
  baseConfig: ReleaseNotesConfig = {},
  cwd = process.env.INIT_CWD ?? process.cwd(),
): Promise<ResolvedReleaseNotesConfig> => {
  const configPath = overrides.config ? resolve(cwd, overrides.config) : await findConfigPath(cwd)
  const fileConfig = configPath ? await loadConfigFile(configPath) : {}
  const config: ReleaseNotesConfig = {
    ...baseConfig,
    ...fileConfig,
    github: {
      ...baseConfig.github,
      ...fileConfig.github,
    },
    schema: {
      ...baseConfig.schema,
      ...fileConfig.schema,
    },
    prompts: {
      ...baseConfig.prompts,
      ...fileConfig.prompts,
    },
    products: fileConfig.products ?? baseConfig.products,
    provider: fileConfig.provider ?? baseConfig.provider,
  }
  const provider = overrides.provider
    ? createBuiltInProvider({ provider: overrides.provider, model: overrides.model, apiKeyEnv: overrides.apiKeyEnv })
    : config.provider

  return {
    provider,
    products: config.products ?? [],
    github: resolveGithub(config.github, overrides),
    schema: resolveSchema(config.schema, overrides),
    prompts: config.prompts ?? {},
  }
}
