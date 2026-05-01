import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, describe, expect, it } from 'vitest'

import { collectReleaseContext, writeChangelogEntry } from './generate-release-changelog'

const execFileAsync = promisify(execFile)

const tempRepos: string[] = []

const run = async (cwd: string, command: string, args: string[]): Promise<void> => {
  await execFileAsync(command, args, { cwd })
}

const commit = async (repoRoot: string, message: string): Promise<void> => {
  await run(repoRoot, 'git', ['add', '.'])
  await run(repoRoot, 'git', ['commit', '-m', message])
}

const writePackage = async (repoRoot: string, version: string): Promise<void> => {
  await mkdir(join(repoRoot, 'projects/scalar-app'), { recursive: true })
  await writeFile(
    join(repoRoot, 'projects/scalar-app/package.json'),
    `${JSON.stringify({ name: 'scalar-app', version }, null, 2)}\n`,
  )
}

const createRepo = async (): Promise<string> => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'release-changelog-'))
  tempRepos.push(repoRoot)

  await run(repoRoot, 'git', ['init'])
  await run(repoRoot, 'git', ['config', 'user.email', 'test@example.com'])
  await run(repoRoot, 'git', ['config', 'user.name', 'Test User'])

  return repoRoot
}

afterEach(async () => {
  await Promise.all(tempRepos.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe('generate-release-changelog', () => {
  it('collects context since the package was last released', async () => {
    const repoRoot = await createRepo()

    await writePackage(repoRoot, '1.0.0')
    await commit(repoRoot, 'release scalar app 1.0.0')

    await mkdir(join(repoRoot, 'packages/api-client'), { recursive: true })
    await writeFile(
      join(repoRoot, 'packages/api-client/CHANGELOG.md'),
      '# api-client\n\n## 2.0.0\n\n- Add workspaces\n',
    )
    await commit(repoRoot, 'release api client')

    await writePackage(repoRoot, '1.1.0')
    await writeFile(
      join(repoRoot, 'projects/scalar-app/CHANGELOG.md'),
      '# scalar-app\n\n## 1.1.0\n\n- Ship workspaces\n',
    )

    const context = await collectReleaseContext(repoRoot, {
      packageDir: 'projects/scalar-app',
      title: 'Scalar API Client',
    })

    expect(context?.packageName).toBe('scalar-app')
    expect(context?.packageDir).toBe('projects/scalar-app')
    expect(context?.title).toBe('Scalar API Client')
    expect(context?.version).toBe('1.1.0')
    expect(context?.previousVersion).toBe('1.0.0')
    expect(typeof context?.sinceCommit).toBe('string')
    expect(context?.currentReleaseDiff.includes('+  "version": "1.1.0"')).toBe(true)
    expect(context?.committedReleaseLog.includes('release api client')).toBe(true)
    expect(context?.committedChangelogDiff.includes('+## 2.0.0')).toBe(true)
  })

  it('skips when the package version did not change', async () => {
    const repoRoot = await createRepo()

    await writePackage(repoRoot, '1.0.0')
    await commit(repoRoot, 'release scalar app 1.0.0')

    const context = await collectReleaseContext(repoRoot, {
      packageDir: 'projects/scalar-app',
    })

    expect(context).toBeNull()
  })

  it('writes release entries to CHANGELOG.md newest first', async () => {
    const repoRoot = await createRepo()

    const firstPath = await writeChangelogEntry(repoRoot, 'projects/scalar-app/CHANGELOG.md', {
      version: '1.0.0',
      date: '2026-04-21',
      title: 'Initial app release',
      summary: 'Scalar API Client now has a richer app experience.',
      highlights: ['Create documents', 'Switch versions'],
      source: {
        packageName: 'scalar-app',
        packageDir: 'projects/scalar-app',
        previousVersion: null,
        sinceCommit: null,
      },
    })

    const secondPath = await writeChangelogEntry(repoRoot, 'projects/scalar-app/CHANGELOG.md', {
      version: '1.1.0',
      date: '2026-04-24',
      title: 'Smoother request runs',
      summary: 'Requests now run with the latest editor changes.',
      highlights: ['Flush pending edits', 'Cleaner slugs'],
      source: {
        packageName: 'scalar-app',
        packageDir: 'projects/scalar-app',
        previousVersion: '1.0.0',
        sinceCommit: 'abc123',
      },
    })

    const changelog = await readFile(join(repoRoot, 'projects/scalar-app/CHANGELOG.md'), 'utf8')

    expect(firstPath).toBe('projects/scalar-app/CHANGELOG.md')
    expect(secondPath).toBe('projects/scalar-app/CHANGELOG.md')
    expect(changelog).toBe(`# scalar-app

## 1.1.0

### Smoother request runs

2026-04-24

Requests now run with the latest editor changes.

- Flush pending edits
- Cleaner slugs

## 1.0.0

### Initial app release

2026-04-21

Scalar API Client now has a richer app experience.

- Create documents
- Switch versions
`)
  })
})
