import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ReleaseNotesProvider, ResolvedReleaseNotesConfig } from '../../../packages/release-notes/src/config/types'
import type { ReleaseNote } from '../../../packages/release-notes/src/types'
import { backfillReleaseNotes } from './backfill'

const execFileAsync = promisify(execFile)

describe('backfill', () => {
  let root: string
  const git = async (args: string[]): Promise<string> => {
    const { stdout } = await execFileAsync('git', args, {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: '2026-06-10T12:00:00Z', GIT_COMMITTER_DATE: '2026-06-10T12:00:00Z' },
    })
    return stdout.trim()
  }
  const note = (version: string, title: string): ReleaseNote => ({ version, title, date: '2026-06-10', content: [] })
  const readNotes = async (product: string): Promise<ReleaseNote[]> =>
    JSON.parse(await readFile(join(root, product, 'RELEASE_NOTES.json'), 'utf8'))
  const commit = async (): Promise<string> => {
    await git(['add', '.'])
    await git(['commit', '-m', 'Release'])
    return git(['rev-parse', 'HEAD'])
  }
  const writeVersion = async (product: string, version: string): Promise<void> => {
    await mkdir(join(root, product), { recursive: true })
    await writeFile(join(root, product, 'package.json'), JSON.stringify({ name: product, version }))
    await writeFile(join(root, product, 'CHANGELOG.md'), `# ${product}\n\n## ${version}\n\n- Fix ${version}\n`)
  }
  const config = (provider: ReleaseNotesProvider): ResolvedReleaseNotesConfig => ({
    provider,
    builtInProviderName: null,
    github: { pullRequestContext: false },
    prompts: {},
    products: ['app', 'agent'].map((slug) => ({
      slug,
      packageName: slug,
      displayName: slug,
      description: slug,
      changelogPath: `${slug}/CHANGELOG.md`,
      outputPath: `${slug}/RELEASE_NOTES.json`,
    })),
  })
  const options = (provider: ReleaseNotesProvider): Parameters<typeof backfillReleaseNotes>[0] => ({
    root,
    config: config(provider),
    since: '2026-06-01',
    dryRun: false,
  })

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'scalar-backfill-run-'))
    await git(['init', '-b', 'main'])
    await git(['config', 'user.email', 'test@example.com'])
    await git(['config', 'user.name', 'Test'])
    await git(['config', 'core.hooksPath', '/dev/null'])
    await git(['config', 'commit.gpgsign', 'false'])
    for (const product of ['app', 'agent']) {
      await writeVersion(product, '1.0.0')
      await writeFile(join(root, product, 'RELEASE_NOTES.json'), JSON.stringify([note('1.0.0', 'Main note')]))
      await writeFile(join(root, product, 'RELEASE_NOTES.md'), 'Original Markdown')
    }
    await commit()
    await writeVersion('app', '1.0.1')
    await writeVersion('agent', '1.0.1')
    await commit()
    await writeVersion('app', '1.0.2')
    await commit()
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('leaves files untouched and never calls the provider during a dry run', async () => {
    const provider = {
      name: 'unavailable',
      generateJson: (): Promise<unknown> => Promise.reject(new Error('Called provider')),
    }
    await backfillReleaseNotes({ ...options(provider), dryRun: true })
    for (const product of ['app', 'agent']) {
      expect(await readNotes(product)).toStrictEqual([note('1.0.0', 'Main note')])
      expect(await readFile(join(root, product, 'RELEASE_NOTES.md'), 'utf8')).toBe('Original Markdown')
    }
    expect(await git(['status', '--porcelain'])).toBe('')
  })

  it('persists completed JSON and Markdown when a later provider call fails', async () => {
    const provider: ReleaseNotesProvider = {
      name: 'partial',
      generateJson: ({ userPrompt }): Promise<unknown> =>
        userPrompt.includes('Version: 1.0.1\n')
          ? Promise.resolve({ version: '1.0.1', title: 'Generated first release' })
          : Promise.reject(new Error('Provider unavailable')),
    }
    await expect(backfillReleaseNotes(options(provider))).rejects.toThrow('Provider unavailable')
    const entries = await readNotes('app')
    expect(entries.map((entry) => entry.version)).toStrictEqual(['1.0.1', '1.0.0'])
    expect(entries[1]).toStrictEqual(note('1.0.0', 'Main note'))
    expect(await readFile(join(root, 'app/RELEASE_NOTES.md'), 'utf8')).toContain('Generated first release')
  })

  it('restores every saved product before failure and keeps main notes authoritative', async () => {
    await git(['checkout', '-b', 'checkpoint'])
    for (const product of ['app', 'agent']) {
      await writeFile(
        join(root, product, 'RELEASE_NOTES.json'),
        JSON.stringify([note('1.0.1', 'Saved release'), note('1.0.0', 'Stale checkpoint note')]),
      )
    }
    const resumeRef = await commit()
    await git(['checkout', 'main'])
    const failing = {
      name: 'unavailable',
      generateJson: (): Promise<unknown> => Promise.reject(new Error('Provider unavailable')),
    }
    await expect(backfillReleaseNotes({ ...options(failing), resumeRef })).rejects.toThrow('Provider unavailable')
    for (const product of ['app', 'agent']) {
      expect(await readNotes(product)).toStrictEqual([note('1.0.1', 'Saved release'), note('1.0.0', 'Main note')])
      expect(await readFile(join(root, product, 'RELEASE_NOTES.md'), 'utf8')).toContain('Saved release')
    }
    const prompts: string[] = []
    const succeeding: ReleaseNotesProvider = {
      name: 'available',
      generateJson: ({ userPrompt }): Promise<unknown> => {
        prompts.push(userPrompt)
        return Promise.resolve({ version: '1.0.2', title: 'Last missing release' })
      },
    }
    await backfillReleaseNotes({ ...options(succeeding), resumeRef })
    expect(prompts.length).toBe(1)
    expect(prompts[0]).toContain('Version: 1.0.2\n')
    expect((await readNotes('app')).map((entry) => entry.version)).toStrictEqual(['1.0.2', '1.0.1', '1.0.0'])
    expect(await readNotes('agent')).toStrictEqual([note('1.0.1', 'Saved release'), note('1.0.0', 'Main note')])
  })

  it('does not mark an incomplete restore ready to replace the checkpoint', async () => {
    const provider = {
      name: 'unavailable',
      generateJson: (): Promise<unknown> => Promise.reject(new Error('Called provider')),
    }
    let prepared = false
    await expect(
      backfillReleaseNotes({
        ...options(provider),
        resumeRef: 'missing-branch',
        onPrepared: (): Promise<void> => {
          prepared = true
          return Promise.resolve()
        },
      }),
    ).rejects.toThrow('git show missing-branch:app/RELEASE_NOTES.json')
    expect(prepared).toBe(false)
  })
})
