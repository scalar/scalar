import { type CommitInfo, getCommitInfo } from '@changesets/get-github-info'
import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import changelogFunctions from './index'

vi.mock('@changesets/get-github-info', () => ({
  getCommitInfo: vi.fn(),
}))

const mockGetCommitInfo = vi.mocked(getCommitInfo)

describe('index', () => {
  beforeEach(() => {
    mockGetCommitInfo.mockReset()
  })

  it('uses the fetched pull request before the summary reference', async () => {
    mockGetCommitInfo.mockResolvedValue({
      commit: {
        sha: 'abcdef',
        url: 'https://github.com/scalar/scalar/commit/abcdef',
        markdownLink: '[`abcdef`](https://github.com/scalar/scalar/commit/abcdef)',
      },
      pull: {
        number: 42,
        url: 'https://github.com/scalar/scalar/pull/42',
        markdownLink: '[#42](https://github.com/scalar/scalar/pull/42)',
      },
    })

    const changeset: NewChangesetWithCommit = {
      id: '123',
      summary: 'Add feature X (#123)',
      releases: [],
      commit: 'abcdef',
    }

    const line = await changelogFunctions.getReleaseLine(changeset, 'patch', { repo: 'scalar/scalar' })

    expect(line).toBe('- [#42](https://github.com/scalar/scalar/pull/42): Add feature X (#123)')
  })

  it.each([
    {
      metadata: undefined,
      summary: 'Fix issue #123',
      expected: '- [#123](https://github.com/scalar/scalar/pull/123): Fix issue #123',
    },
    { metadata: undefined, summary: 'Fix issue', expected: '- Fix issue' },
    {
      metadata: {
        commit: {
          sha: 'abcdef',
          url: 'https://github.com/scalar/scalar/commit/abcdef',
          markdownLink: '[`abcdef`](https://github.com/scalar/scalar/commit/abcdef)',
        },
      } satisfies CommitInfo,
      summary: 'Fix issue #123',
      expected: '- [#123](https://github.com/scalar/scalar/pull/123): Fix issue #123',
    },
    {
      metadata: {
        commit: {
          sha: 'abcdef',
          url: 'https://github.com/scalar/scalar/commit/abcdef',
          markdownLink: '[`abcdef`](https://github.com/scalar/scalar/commit/abcdef)',
        },
      } satisfies CommitInfo,
      summary: 'Fix issue',
      expected: '- Fix issue',
    },
  ])('formats "$summary" when the lookup has no pull request', async ({ metadata, summary, expected }) => {
    mockGetCommitInfo.mockResolvedValue(metadata)

    const changeset: NewChangesetWithCommit = { id: '123', summary, releases: [], commit: 'abcdef' }
    const line = await changelogFunctions.getReleaseLine(changeset, 'patch', { repo: 'scalar/scalar' })

    expect(line).toBe(expected)
    expect(mockGetCommitInfo).toHaveBeenCalledExactlyOnceWith({ repo: 'scalar/scalar', commit: 'abcdef' })
  })

  it('uses the summary pull request without fetching when there is no commit', async () => {
    const changeset: NewChangesetWithCommit = { id: '123', summary: 'Fix issue #123', releases: [] }

    const line = await changelogFunctions.getReleaseLine(changeset, 'patch', { repo: 'scalar/scalar' })

    expect(line).toBe('- [#123](https://github.com/scalar/scalar/pull/123): Fix issue #123')
    expect(mockGetCommitInfo).not.toHaveBeenCalled()
  })

  it('preserves GitHub lookup errors', async () => {
    const error = new Error('GitHub authentication failed')
    mockGetCommitInfo.mockRejectedValue(error)
    const changeset: NewChangesetWithCommit = { id: '123', summary: 'Fix issue #123', releases: [], commit: 'abcdef' }

    await expect(changelogFunctions.getReleaseLine(changeset, 'patch', { repo: 'scalar/scalar' })).rejects.toBe(error)
  })

  it('suppresses dependency updates in the shared hook', async () => {
    const changesets: Array<NewChangesetWithCommit> = [
      {
        id: '123',
        summary: 'Fix api ref',
        releases: [{ name: '@scalar/api-reference', type: 'patch' }],
        commit: 'abc123',
      },
    ]

    const deps = [
      {
        name: '@scalar/api-reference',
        newVersion: '1.0.1',
        oldVersion: '1.0.0',
        type: 'patch',
        changesets: ['123'],
        packageJson: { name: '@scalar/api-reference', version: '1.0.0' },
        dir: '/packages/api-reference',
      },
      {
        name: '@scalar/dotnet-shared',
        newVersion: '1.0.2',
        oldVersion: '1.0.1',
        type: 'patch',
        changesets: [],
        packageJson: { name: '@scalar/dotnet-shared', version: '1.0.1' },
        dir: '/integrations/dotnet/shared',
      },
    ] satisfies Array<ModCompWithPackage>

    const output = await changelogFunctions.getDependencyReleaseLine(changesets, deps, { repo: 'scalar/scalar' })

    expect(output).toBe('')
    expect(mockGetCommitInfo).not.toHaveBeenCalled()
  })

  it('suppresses transitive dependency updates without changesets', async () => {
    const output = await changelogFunctions.getDependencyReleaseLine(
      [],
      [
        {
          name: '@scalar/workspace-store',
          oldVersion: '0.55.5',
          newVersion: '0.55.6',
          type: 'patch',
          changesets: [],
          packageJson: { name: '@scalar/workspace-store', version: '0.55.5' },
          dir: '/packages/workspace-store',
        },
      ],
      null,
    )

    expect(output).toBe('')
  })

  it('omits the dependency heading when no dependencies changed', async () => {
    expect(await changelogFunctions.getDependencyReleaseLine([], [], null)).toBe('')
  })
})
