import { getInfo } from '@changesets/get-github-info'
import type { ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import changelogFunctions from './index'

vi.mock('@changesets/get-github-info', () => ({
  getInfo: vi.fn(),
}))

const mockGetInfo = vi.mocked(getInfo)

describe('changelog functions', () => {
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

  it('getDependencyReleaseLine groups dependency changes', async () => {
    mockGetInfo.mockResolvedValue({
      pull: 10,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/10',
        user: null,
      },
    })

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
      },
    ] as Array<ModCompWithPackage>

    const output = await changelogFunctions.getDependencyReleaseLine(changesets, deps, { repo: 'scalar/scalar' })

    expect(output.trim()).toBe(
      [
        '#### Updated Dependencies',
        '',
        '- **@scalar/api-reference@1.0.1**',
        '  - [#10](https://github.com/scalar/scalar/pull/10): Fix api ref',
      ].join('\n'),
    )
  })
})
