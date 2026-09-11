import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ReleaseNotesProduct } from '../config/types'
import { buildChangelogUrl, runReleaseNotesGeneratorForProduct } from './run-release-notes-generator'

describe('run-release-notes-generator', () => {
  it('builds changelog links from configured GitHub options', () => {
    const url = buildChangelogUrl({
      repo: 'example/repo',
      baseBranch: 'release',
      changelogPath: './packages/client/CHANGELOG.md',
      version: '1.2.3-beta.1',
    })

    expect(url).toBe('https://github.com/example/repo/blob/release/packages/client/CHANGELOG.md#123beta1')
  })

  describe('pull request context', () => {
    const temporaryDirectories: string[] = []

    afterEach(async () => {
      vi.restoreAllMocks()

      await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })))
      temporaryDirectories.length = 0
    })

    /** A package whose changelog references a pull request, so PR fetching has something to find. */
    const createProduct = async (): Promise<ReleaseNotesProduct> => {
      const directory = await mkdtemp(join(tmpdir(), 'scalar-release-notes-generator-'))
      temporaryDirectories.push(directory)

      const changelogPath = join(directory, 'CHANGELOG.md')
      await writeFile(join(directory, 'package.json'), JSON.stringify({ name: '@example/client', version: '1.0.0' }))
      await writeFile(
        changelogPath,
        ['# @example/client', '', '## 1.0.0', '', '- Added an import flow (#123)'].join('\n'),
      )

      return {
        slug: 'client',
        packageName: '@example/client',
        displayName: 'Example Client',
        description: 'an API client for Example',
        changelogPath,
        outputPath: join(directory, 'RELEASE_NOTES.json'),
      }
    }

    const provider = {
      name: 'test',
      generateJson: async () => ({ version: '1.0.0', title: 'Imports are easier' }),
    }

    it('skips the GitHub API entirely when pull request context is disabled', async () => {
      const product = await createProduct()
      const fetchImpl = vi.fn<typeof fetch>()
      vi.spyOn(console, 'log').mockImplementation(() => undefined)

      const result = await runReleaseNotesGeneratorForProduct({
        product,
        provider,
        github: { repo: 'example/repo', pullRequestContext: false },
        writeMarkdown: false,
        fetchImpl,
      })

      expect(fetchImpl).not.toHaveBeenCalled()
      expect(result.generated).toBe(true)

      const written = JSON.parse(await readFile(result.outputPath, 'utf-8')) as Array<{ version: string }>
      expect(written).toEqual([expect.objectContaining({ version: '1.0.0' })])
    })

    it('fetches referenced pull requests by default', async () => {
      const product = await createProduct()
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ number: 123, title: 'Add an import flow', body: 'Why it matters.' }), {
          headers: { 'content-type': 'application/json' },
        }),
      )
      vi.spyOn(console, 'log').mockImplementation(() => undefined)

      await runReleaseNotesGeneratorForProduct({
        product,
        provider,
        github: { repo: 'example/repo' },
        writeMarkdown: false,
        fetchImpl,
      })

      expect(fetchImpl).toHaveBeenCalledWith('https://api.github.com/repos/example/repo/pulls/123', expect.anything())
    })
  })
})
