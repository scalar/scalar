import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ReleaseNotesConfig } from '../config/types'
import { createReleaseNotesGeneratorCommand } from './generate'

describe('generate', () => {
  const originalEnv = { ...process.env }
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()

    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })))
    temporaryDirectories.length = 0
  })

  const createTemporaryPackage = async (): Promise<{ changelogPath: string; outputPath: string }> => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-'))
    temporaryDirectories.push(directory)

    const changelogPath = join(directory, 'CHANGELOG.md')
    await writeFile(join(directory, 'package.json'), JSON.stringify({ name: '@example/client', version: '1.0.0' }))
    await writeFile(changelogPath, ['# @example/client', '', '## 1.0.0', '', '- Added release notes (#123)'].join('\n'))

    return {
      changelogPath,
      outputPath: join(directory, 'RELEASE_NOTES.json'),
    }
  }

  // A missing provider API key must skip generation with a warning instead of throwing.
  // Otherwise `pnpm release:version --all` would fail on forks, contributor machines,
  // or CI that do not have the provider secret configured.
  it('skips generation with a warning when the built-in provider API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    // Point config discovery at a directory without a release-notes config file.
    process.env.INIT_CWD = import.meta.dirname

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const command = createReleaseNotesGeneratorCommand()

    await expect(command.parseAsync(['--all'], { from: 'user' })).resolves.toBe(command)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('skipping release-notes generation'))
  })

  it('skips generation with a warning when an explicit built-in provider API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    // Point config discovery at a directory without a release-notes config file.
    process.env.INIT_CWD = import.meta.dirname

    const { changelogPath, outputPath } = await createTemporaryPackage()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const command = createReleaseNotesGeneratorCommand()

    await expect(
      command.parseAsync(
        [
          '--provider',
          'openai',
          '--package',
          '@example/client',
          '--changelog',
          changelogPath,
          '--output',
          outputPath,
          '--dry-run',
        ],
        { from: 'user' },
      ),
    ).resolves.toBe(command)

    expect(warn).toHaveBeenCalledWith('No API key set for the openai provider; skipping release-notes generation.')
  })

  /** Write a JSON config file into a fresh directory and point config discovery at it. */
  const createJsonConfig = async (config: unknown): Promise<void> => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-config-'))
    temporaryDirectories.push(directory)

    await writeFile(join(directory, 'release-notes.config.json'), JSON.stringify(config))
    process.env.INIT_CWD = directory
  }

  it('skips generation with a warning when a config file selects a built-in provider by name', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    await createJsonConfig({ provider: 'openai', products: [] })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const command = createReleaseNotesGeneratorCommand()

    await expect(command.parseAsync(['--all'], { from: 'user' })).resolves.toBe(command)

    expect(warn).toHaveBeenCalledWith('No API key set for the openai provider; skipping release-notes generation.')
  })

  it('looks the API key up in the environment variable named by a config-level apiKeyEnv', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.CUSTOM_ANTHROPIC_KEY
    await createJsonConfig({ provider: 'anthropic', apiKeyEnv: 'CUSTOM_ANTHROPIC_KEY', products: [] })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(createReleaseNotesGeneratorCommand().parseAsync(['--all'], { from: 'user' })).resolves.toBeDefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('skipping release-notes generation'))

    // The same config now finds a key, so it gets past the guard and fails on the empty product list.
    process.env.CUSTOM_ANTHROPIC_KEY = 'sk-test'

    await expect(createReleaseNotesGeneratorCommand().parseAsync(['--all'], { from: 'user' })).rejects.toThrow(
      'No products configured.',
    )
  })

  describe('--no-pull-request-context', () => {
    /** A config whose single product references a pull request, so PR fetching has something to find. */
    const createProductConfig = async (): Promise<ReleaseNotesConfig> => {
      const { changelogPath, outputPath } = await createTemporaryPackage()

      return {
        provider: { name: 'test', generateJson: async () => ({ version: '1.0.0', title: 'Imports are easier' }) },
        github: { repo: 'example/repo' },
        products: [
          {
            slug: 'client',
            packageName: '@example/client',
            displayName: 'Example Client',
            description: 'an API client for Example',
            changelogPath,
            outputPath,
          },
        ],
      }
    }

    it('skips the GitHub API when the flag is passed', async () => {
      process.env.INIT_CWD = import.meta.dirname
      const baseConfig = await createProductConfig()
      const fetchSpy = vi.fn<typeof fetch>()
      vi.stubGlobal('fetch', fetchSpy)
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

      const command = createReleaseNotesGeneratorCommand(baseConfig)

      await expect(
        command.parseAsync(['--product', 'client', '--no-pull-request-context', '--dry-run'], { from: 'user' }),
      ).resolves.toBe(command)

      expect(fetchSpy).not.toHaveBeenCalled()
      // The run must reach the provider, otherwise it would skip the fetch for the wrong reason.
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Imports are easier'))
    })

    it('fetches pull requests when the flag is not passed', async () => {
      process.env.INIT_CWD = import.meta.dirname
      const baseConfig = await createProductConfig()
      const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ number: 123, title: 'Add an import flow', body: 'Why it matters.' }), {
          headers: { 'content-type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', fetchSpy)
      vi.spyOn(console, 'log').mockImplementation(() => undefined)

      const command = createReleaseNotesGeneratorCommand(baseConfig)

      await expect(command.parseAsync(['--product', 'client', '--dry-run'], { from: 'user' })).resolves.toBe(command)

      expect(fetchSpy).toHaveBeenCalledWith('https://api.github.com/repos/example/repo/pulls/123', expect.anything())
    })
  })
})
