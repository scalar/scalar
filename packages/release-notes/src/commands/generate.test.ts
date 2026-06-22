import { afterEach, describe, expect, it, vi } from 'vitest'

import { createReleaseNotesGeneratorCommand } from './generate'

describe('generate', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  // A missing provider API key must skip generation with a warning instead of throwing.
  // Otherwise `pnpm release:version --all` would fail on forks, contributor machines,
  // or CI that do not have the provider secret configured.
  it('skips generation with a warning when the built-in provider API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    // Point config discovery at a directory without a release-notes config file.
    process.env.INIT_CWD = import.meta.dirname

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(createReleaseNotesGeneratorCommand().parseAsync(['--all'], { from: 'user' })).resolves.toBeDefined()

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('skipping release-notes generation'))
  })
})
