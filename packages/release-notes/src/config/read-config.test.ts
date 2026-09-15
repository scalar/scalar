import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { readReleaseNotesConfig } from './read-config'
import type { ReleaseNotesConfig } from './types'

describe('read-config', () => {
  const originalEnv = { ...process.env }
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()

    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })))
    temporaryDirectories.length = 0
  })

  /** Write a JSON config file into a fresh directory and point config discovery at it. */
  const createJsonConfig = async (config: unknown): Promise<void> => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-config-'))
    temporaryDirectories.push(directory)

    await writeFile(join(directory, 'release-notes.config.json'), JSON.stringify(config))
    process.env.INIT_CWD = directory
  }

  /**
   * Write an ES module config file. Unlike JSON, it can hold an explicit `undefined`, which is
   * what the layered fallbacks have to survive.
   */
  const createModuleConfig = async (source: string): Promise<void> => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-config-'))
    temporaryDirectories.push(directory)

    await writeFile(join(directory, 'release-notes.config.mjs'), source)
    process.env.INIT_CWD = directory
  }

  it('resolves a built-in provider name from a config file', async () => {
    await createJsonConfig({ provider: 'openai' })

    const config = await readReleaseNotesConfig()

    expect(config.builtInProviderName).toBe('openai')
    expect(config.provider.name).toBe('openai')
  })

  it('hands a config-level model to the built-in provider', async () => {
    await createJsonConfig({ provider: 'anthropic', model: 'claude-opus-4-1' })

    const config = await readReleaseNotesConfig()

    expect(config.model).toBe('claude-opus-4-1')
    expect(config.provider.defaultModel).toBe('claude-opus-4-1')
  })

  it('carries a config-level apiKeyEnv through resolution', async () => {
    await createJsonConfig({
      provider: 'anthropic',
      apiKeyEnv: 'CUSTOM_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig()

    expect(config.apiKeyEnv).toBe('CUSTOM_ANTHROPIC_KEY')
    expect(config.builtInProviderName).toBe('anthropic')
  })

  // A config written for one provider must not hand its model id, or its API key, to another.
  it('drops config-level model and apiKeyEnv when the CLI switches provider', async () => {
    await createJsonConfig({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig({ provider: 'openai' })

    expect(config.builtInProviderName).toBe('openai')
    expect(config.model).toBeUndefined()
    expect(config.apiKeyEnv).toBeUndefined()
    expect(config.provider.defaultModel).toBe('gpt-4.1-mini')
  })

  // The leak this guards against: an Anthropic key travelling to api.openai.com as a Bearer token.
  it('does not hand the config API key to a provider the CLI switched to', async () => {
    process.env.MY_ANTHROPIC_KEY = 'sk-anthropic'
    process.env.OPENAI_API_KEY = 'sk-openai'
    await createJsonConfig({
      provider: 'anthropic',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig({ provider: 'openai' })

    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), {
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    await config.provider.generateJson({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: {},
      maxOutputTokens: 16,
    })

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer sk-openai')
  })

  it('keeps config-level model and apiKeyEnv when the CLI names the same provider', async () => {
    await createJsonConfig({
      provider: 'anthropic',
      model: 'claude-opus-4-1',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig({ provider: 'anthropic' })

    expect(config.model).toBe('claude-opus-4-1')
    expect(config.apiKeyEnv).toBe('MY_ANTHROPIC_KEY')
  })

  // A config with no `provider` already resolves to anthropic, so naming it on the command
  // line changes nothing and must not discard the config's model or apiKeyEnv.
  it('keeps config-level model and apiKeyEnv when the CLI names the default provider', async () => {
    await createJsonConfig({
      model: 'claude-opus-4-1',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig({ provider: 'anthropic' })

    expect(config.model).toBe('claude-opus-4-1')
    expect(config.apiKeyEnv).toBe('MY_ANTHROPIC_KEY')
    expect(config.provider.defaultModel).toBe('claude-opus-4-1')
  })

  it('drops config-level settings when the CLI switches away from a custom provider', async () => {
    process.env.INIT_CWD = import.meta.dirname
    const provider = { name: 'internal-agent', generateJson: async () => ({}) }

    const config = await readReleaseNotesConfig({ provider: 'openai' }, {
      provider,
      model: 'internal-model',
      apiKeyEnv: 'INTERNAL_KEY',
    } satisfies ReleaseNotesConfig)

    expect(config.builtInProviderName).toBe('openai')
    expect(config.model).toBeUndefined()
    expect(config.apiKeyEnv).toBeUndefined()
  })

  it('hands a config-level model to a custom provider', async () => {
    process.env.INIT_CWD = import.meta.dirname
    const provider = { name: 'internal-agent', generateJson: async () => ({}) }

    const config = await readReleaseNotesConfig({}, {
      provider,
      model: 'internal-model',
    } satisfies ReleaseNotesConfig)

    expect(config.model).toBe('internal-model')
  })

  it('drops a config-level apiKeyEnv that a custom provider cannot use', async () => {
    process.env.INIT_CWD = import.meta.dirname
    const provider = { name: 'internal-agent', generateJson: async () => ({}) }

    const config = await readReleaseNotesConfig({}, {
      provider,
      apiKeyEnv: 'INTERNAL_KEY',
    } satisfies ReleaseNotesConfig)

    expect(config.builtInProviderName).toBeNull()
    expect(config.apiKeyEnv).toBeUndefined()
  })

  // The same leak as the CLI case, one layer down: the file config picks the provider while the
  // base config supplies settings written for a different one.
  it('does not carry base config settings onto a provider the config file switched to', async () => {
    await createJsonConfig({ provider: 'openai' })

    const config = await readReleaseNotesConfig({}, {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    } satisfies ReleaseNotesConfig)

    expect(config.builtInProviderName).toBe('openai')
    expect(config.model).toBeUndefined()
    expect(config.apiKeyEnv).toBeUndefined()
    expect(config.provider.defaultModel).toBe('gpt-4.1-mini')
  })

  it('carries base config settings onto a config file that names no provider', async () => {
    await createJsonConfig({ products: [] })

    const config = await readReleaseNotesConfig({}, {
      provider: 'anthropic',
      model: 'claude-opus-4-1',
    } satisfies ReleaseNotesConfig)

    expect(config.model).toBe('claude-opus-4-1')
  })

  // A config that names no provider is relying on the anthropic default, so its settings were
  // written for anthropic and must not follow the CLI to a different provider.
  it('does not carry settings from a provider-less config onto a provider the CLI switched to', async () => {
    process.env.MY_ANTHROPIC_KEY = 'sk-anthropic'
    process.env.OPENAI_API_KEY = 'sk-openai'
    await createJsonConfig({
      model: 'claude-sonnet-4-5',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    })

    const config = await readReleaseNotesConfig({ provider: 'openai' })

    expect(config.model).toBeUndefined()
    expect(config.apiKeyEnv).toBeUndefined()
    expect(config.provider.defaultModel).toBe('gpt-4.1-mini')
  })

  it('does not carry settings from a provider-less base config onto a switched provider', async () => {
    await createJsonConfig({ provider: 'openai' })

    const config = await readReleaseNotesConfig({}, {
      model: 'claude-sonnet-4-5',
      apiKeyEnv: 'MY_ANTHROPIC_KEY',
    } satisfies ReleaseNotesConfig)

    expect(config.model).toBeUndefined()
    expect(config.apiKeyEnv).toBeUndefined()
  })

  // `null` is what a JSON round-trip produces for an unset field, so it must not be a provider.
  it('treats a null model as unset', async () => {
    await createJsonConfig({ provider: 'anthropic', model: null })

    const config = await readReleaseNotesConfig({}, {
      model: 'claude-opus-4-1',
    } satisfies ReleaseNotesConfig)

    expect(config.model).toBe('claude-opus-4-1')
  })

  it('treats an empty apiKeyEnv as unset', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    await createJsonConfig({ provider: 'anthropic', apiKeyEnv: '', model: '' })

    const config = await readReleaseNotesConfig()

    expect(config.apiKeyEnv).toBeUndefined()
    expect(config.model).toBeUndefined()
    expect(config.provider.defaultModel).toBe('claude-sonnet-4-5')
  })

  it('treats a null provider as unset', async () => {
    await createJsonConfig({ provider: null, model: 'claude-opus-4-1' })

    const config = await readReleaseNotesConfig()

    expect(config.builtInProviderName).toBe('anthropic')
    expect(config.model).toBe('claude-opus-4-1')
  })

  it('lets the CLI model and apiKeyEnv override the config file', async () => {
    await createJsonConfig({
      provider: 'anthropic',
      model: 'claude-opus-4-1',
      apiKeyEnv: 'CONFIG_KEY',
    })

    const config = await readReleaseNotesConfig({
      model: 'claude-sonnet-4-5',
      apiKeyEnv: 'CLI_KEY',
    })

    expect(config.model).toBe('claude-sonnet-4-5')
    expect(config.apiKeyEnv).toBe('CLI_KEY')
  })

  it('keeps a custom provider object as-is', async () => {
    process.env.INIT_CWD = import.meta.dirname
    const provider = { name: 'internal-agent', generateJson: async () => ({}) }

    const config = await readReleaseNotesConfig({}, {
      provider,
    } satisfies ReleaseNotesConfig)

    expect(config.provider).toBe(provider)
    expect(config.builtInProviderName).toBeNull()
  })

  it('defaults to the anthropic provider when none is configured', async () => {
    process.env.INIT_CWD = import.meta.dirname

    const config = await readReleaseNotesConfig()

    expect(config.builtInProviderName).toBe('anthropic')
  })

  it('lets the CLI provider override a config-level provider name', async () => {
    await createJsonConfig({ provider: 'anthropic' })

    const config = await readReleaseNotesConfig({ provider: 'openai' })

    expect(config.builtInProviderName).toBe('openai')
    expect(config.provider.name).toBe('openai')
  })

  // A JSON config cannot hold a function, so a `provider` object read from JSON is always
  // unusable. Failing here beats crashing later with `provider.generateJson is not a function`.
  it('throws when the configured provider is neither a known name nor a provider object', async () => {
    await createJsonConfig({ provider: { name: 'anthropic' } })

    await expect(readReleaseNotesConfig()).rejects.toThrow('Unsupported provider')
  })

  it('enables pull request context by default', async () => {
    process.env.INIT_CWD = import.meta.dirname

    const config = await readReleaseNotesConfig()

    expect(config.github.pullRequestContext).toBe(true)
  })

  it('keeps a disabled pull request context from the config file', async () => {
    await createJsonConfig({
      github: { repo: 'example/repo', pullRequestContext: false },
    })

    const config = await readReleaseNotesConfig()

    expect(config.github.pullRequestContext).toBe(false)
  })

  it('keeps a base config prompt that the file config sets to undefined', async () => {
    await createModuleConfig('export default { prompts: { productDescriptionFallback: undefined } }\n')

    const config = await readReleaseNotesConfig({}, { prompts: { productDescriptionFallback: 'a Scalar product' } })

    expect(config.prompts.productDescriptionFallback).toBe('a Scalar product')
  })

  it('keeps base config github values that the file config sets to null', async () => {
    await createJsonConfig({
      github: { baseBranch: null, pullRequestContext: null },
    })

    const config = await readReleaseNotesConfig({}, { github: { baseBranch: 'release', pullRequestContext: false } })

    expect(config.github.baseBranch).toBe('release')
    expect(config.github.pullRequestContext).toBe(false)
  })

  // A `__proto__` key in a config file must stay inert data instead of re-pointing the prototype.
  it('does not let a config file key reach through the prototype chain', async () => {
    await createJsonConfig(JSON.parse('{"github":{"__proto__":{"repo":"evil/repo"},"baseBranch":"release"}}'))

    const config = await readReleaseNotesConfig()

    expect(config.github.repo).toBeUndefined()
    expect(config.github.baseBranch).toBe('release')
  })

  it('keeps base config github values that the file config sets to undefined', async () => {
    await createModuleConfig(
      'export default { github: { repo: undefined, baseBranch: undefined, pullRequestContext: undefined } }\n',
    )

    const config = await readReleaseNotesConfig(
      {},
      {
        github: {
          repo: 'example/repo',
          baseBranch: 'release',
          pullRequestContext: false,
        },
      },
    )

    expect(config.github.repo).toBe('example/repo')
    expect(config.github.baseBranch).toBe('release')
    expect(config.github.pullRequestContext).toBe(false)
  })

  it('lets the CLI disable pull request context enabled in the config file', async () => {
    await createJsonConfig({
      github: { repo: 'example/repo', pullRequestContext: true },
    })

    const config = await readReleaseNotesConfig({ pullRequestContext: false })

    expect(config.github.pullRequestContext).toBe(false)
  })
})
