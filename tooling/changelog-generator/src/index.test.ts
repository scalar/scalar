import { getInfo } from '@changesets/get-github-info'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { formatDependencyChange, formatDependencyHeader, formatReleaseLine } from './formatter'
import changelogFunctions from './index'

vi.mock('@changesets/get-github-info', () => ({
  getInfo: vi.fn(),
}))

const mockGetInfo = vi.mocked(getInfo)

describe('formatter helpers', () => {
  it('formats release line with PR link', () => {
    const changeset = {
      summary: 'Do something great',
    } as any
    const githubInfo = {
      pull: 123,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/123',
        user: null,
      },
    }

    const result = formatReleaseLine(changeset, githubInfo)

    expect(result).toBe('- [#123](https://github.com/scalar/scalar/pull/123): Do something great')
  })

  it('formats release line without PR link', () => {
    const changeset = {
      summary: 'Do something else',
    } as any

    const result = formatReleaseLine(changeset, null)

    expect(result).toBe('- Do something else')
  })

  it('account for multiple lines', () => {
    const changeset = {
      summary: [
        'fix: remove internal unused export',
        '',
        '- `CARD_Heading_SYMBOL`',
        '- `FORM_GROUP_SYMBOL`',
        '- `formatHotKey#isDefault`',
        '- `LoadingCompletionOptions`',
        '- `MaybeElement`',
        '- `ScalarComboBox#isGroup`',
      ].join('\n'),
    } as any
    const githubInfo = {
      pull: 123,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/123',
        user: null,
      },
    }

    const result = formatReleaseLine(changeset, githubInfo)

    expect(result).toBe(
      [
        '- [#123](https://github.com/scalar/scalar/pull/123): fix: remove internal unused export',
        '',
        '  - `CARD_Heading_SYMBOL`',
        '  - `FORM_GROUP_SYMBOL`',
        '  - `formatHotKey#isDefault`',
        '  - `LoadingCompletionOptions`',
        '  - `MaybeElement`',
        '  - `ScalarComboBox#isGroup`',
      ].join('\n'),
    )
  })

  it('formats dependency header and change', () => {
    expect(formatDependencyHeader('@scalar/api-reference', '1.2.3')).toBe('- **@scalar/api-reference@1.2.3**')

    const githubInfo = {
      pull: 10,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/10',
        user: null,
      },
    }

    expect(formatDependencyChange(githubInfo, 'Fixed things')).toBe(
      '  - [#10](https://github.com/scalar/scalar/pull/10): Fixed things',
    )
    expect(formatDependencyChange(null, 'No PR')).toBe('  - No PR')
  })
})

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

    const changeset = {
      summary: 'Add feature X',
      releases: [],
      commit: 'abcdef',
    } as any

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

    const changesets = [
      {
        summary: 'Fix api ref',
        releases: [{ name: '@scalar/api-reference', type: 'patch' }],
        commit: 'abc123',
      },
    ] as any

    const deps = [{ name: '@scalar/api-reference', newVersion: '1.0.1' }] as any

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
