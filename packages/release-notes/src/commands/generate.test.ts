import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createReleaseNotesGeneratorCommand } from './generate'

describe('generate', () => {
  const originalEnv = { ...process.env }
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()

    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })))
    temporaryDirectories.length = 0
  })

  const createTemporaryPackage = async (): Promise<{ changelogPath: string; outputPath: string }> => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-'))
    temporaryDirectories.push(directory)

    const changelogPath = join(directory, 'CHANGELOG.md')
    await writeFile(join(directory, 'package.json'), JSON.stringify({ name: '@example/client', version: '1.0.0' }))
    await writeFile(changelogPath, ['# @example/client', '', '## 1.0.0', '', '- Added release notes.'].join('\n'))

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
})
