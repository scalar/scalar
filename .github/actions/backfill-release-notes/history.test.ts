import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { findMissingReleases, readHistoricalChangelog } from './history'

const execFileAsync = promisify(execFile)

describe('history', () => {
  let root: string

  const git = async (args: string[], date = '2026-06-01T12:00:00Z'): Promise<string> => {
    const { stdout } = await execFileAsync('git', args, {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    })
    return stdout.trim()
  }

  const writePackage = async (path: string, version: string, change: string): Promise<void> => {
    await mkdir(join(root, path), { recursive: true })
    await writeFile(join(root, path, 'package.json'), JSON.stringify({ name: path, version }))
    await writeFile(join(root, path, 'CHANGELOG.md'), `# ${path}\n\n## ${version}\n\n${change}\n`)
  }

  const commit = async (date: string): Promise<string> => {
    await git(['add', '.'])
    await git(['commit', '-m', 'Release'], date)
    return git(['rev-parse', 'HEAD'])
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'scalar-backfill-'))
    await git(['init', '-b', 'main'])
    await git(['config', 'user.email', 'test@example.com'])
    await git(['config', 'user.name', 'Test'])
    await git(['config', 'core.hooksPath', '/dev/null'])
    await git(['config', 'commit.gpgsign', 'false'])
    await writePackage('app', '1.0.0', '- Initial app')
    await writePackage('client', '2.0.0', '- Initial client')
    await commit('2026-06-01T12:00:00Z')
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('skips existing notes and manifest edits without a version bump', async () => {
    await writePackage('app', '1.0.1', '- First fix')
    await commit('2026-06-02T12:00:00Z')
    await writeFile(
      join(root, 'app/package.json'),
      JSON.stringify({ name: 'app', version: '1.0.1', description: 'Edit' }),
    )
    await commit('2026-06-03T12:00:00Z')
    await writePackage('app', '1.0.2', '- Second fix')
    const sha = await commit('2026-06-04T12:00:00Z')
    expect(
      await findMissingReleases(root, 'app/CHANGELOG.md', new Set(['1.0.0', '1.0.1']), '2026-06-01'),
    ).toStrictEqual([{ commit: sha, date: '2026-06-04', version: '1.0.2' }])
    expect(
      await findMissingReleases(root, 'app/CHANGELOG.md', new Set(['1.0.0', '1.0.1', '1.0.2']), '2026-06-01'),
    ).toStrictEqual([])
  })

  it('uses the date a release reaches main instead of its branch commit date', async () => {
    await git(['checkout', '-b', 'release'])
    await writePackage('app', '1.1.0', '- New feature')
    await commit('2026-06-02T12:00:00Z')
    await git(['checkout', 'main'])
    await git(['merge', '--no-ff', 'release', '-m', 'Merge release'], '2026-06-05T23:30:00-02:00')
    const sha = await git(['rev-parse', 'HEAD'])
    expect(await findMissingReleases(root, 'app/CHANGELOG.md', new Set(['1.0.0']), '2026-06-06')).toStrictEqual([
      { commit: sha, date: '2026-06-06', version: '1.1.0' },
    ])
  })

  it('reads the dependency section shipped at the historical release', async () => {
    await writePackage('app', '1.0.1', '- App fix')
    await writePackage('client', '2.0.1', '- Historical client fix')
    const sha = await commit('2026-06-02T12:00:00Z')
    await writePackage('client', '2.1.0', '- Future client feature')
    const newer = await commit('2026-06-03T12:00:00Z')
    expect(await readHistoricalChangelog(root, sha, 'client/CHANGELOG.md')).toStrictEqual({
      version: '2.0.1',
      changelogSection: '- Historical client fix',
    })
    expect(await readHistoricalChangelog(root, newer, 'app/CHANGELOG.md')).toBeNull()
  })

  it('fails when a bumped version has no historical changelog section', async () => {
    await writePackage('app', '1.0.1', '- Fix')
    await writeFile(join(root, 'app/CHANGELOG.md'), '# app\n')
    const sha = await commit('2026-06-02T12:00:00Z')
    await expect(readHistoricalChangelog(root, sha, 'app/CHANGELOG.md')).rejects.toThrow(
      `Missing changelog section for 1.0.1 in ${sha}:app/CHANGELOG.md`,
    )
  })

  it('accepts an empty app section for a dependency-only release', async () => {
    await writePackage('app', '1.0.1', '')
    const sha = await commit('2026-06-02T12:00:00Z')
    expect(await readHistoricalChangelog(root, sha, 'app/CHANGELOG.md')).toStrictEqual({
      version: '1.0.1',
      changelogSection: '',
    })
  })
})
