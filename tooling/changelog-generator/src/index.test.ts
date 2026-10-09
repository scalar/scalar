import { getInfo } from '@changesets/get-github-info'
import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import changelogFunctions from './index'

vi.mock('@changesets/get-github-info', () => ({
  getInfo: vi.fn(),
}))

const mockGetInfo = vi.mocked(getInfo)

describe('index', () => {
  beforeEach(() => {
    mockGetInfo.mockReset()
  })

  it('getReleaseLine uses GitHub PR link', async () => {
    mockGetInfo.mockResolvedValue({
      pull: 42,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/42',
        user: null,
      },
    })

    const changeset: NewChangesetWithCommit = {
      id: '123',
      summary: 'Add feature X',
      releases: [],
      commit: 'abcdef',
    }

    const line = await changelogFunctions.getReleaseLine(changeset, 'patch', { repo: 'scalar/scalar' })

    expect(line).toBe('- [#42](https://github.com/scalar/scalar/pull/42): Add feature X')
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
    expect(mockGetInfo).not.toHaveBeenCalled()
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
