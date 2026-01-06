import type { NewChangesetWithCommit } from '@changesets/types'
import { describe, expect, it } from 'vitest'

import type { GitHubInfo } from '@/types'

import { formatDependencyChange, formatDependencyHeader, formatReleaseLine } from './formatter'

describe('formatter helpers', () => {
  it('formats release line with PR link', () => {
    const changeset: Partial<NewChangesetWithCommit> = {
      summary: 'Do something great',
    }
    const githubInfo: GitHubInfo = {
      pull: 123,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/123',
        user: null,
      },
    }

    const result = formatReleaseLine(changeset as NewChangesetWithCommit, githubInfo)

    expect(result).toBe('- [#123](https://github.com/scalar/scalar/pull/123): Do something great')
  })

  it('formats release line without PR link', () => {
    const changeset: Partial<NewChangesetWithCommit> = {
      summary: 'Do something else',
    }

    const result = formatReleaseLine(changeset as NewChangesetWithCommit, null)

    expect(result).toBe('- Do something else')
  })

  it('account for multiple lines', () => {
    const changeset: Partial<NewChangesetWithCommit> = {
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
    }
    const githubInfo: GitHubInfo = {
      pull: 123,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/123',
        user: null,
      },
    }

    const result = formatReleaseLine(changeset as NewChangesetWithCommit, githubInfo)

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

    const githubInfo: GitHubInfo = {
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

  it('formats changelog entries with higher indent levels', () => {
    const githubInfo: GitHubInfo = {
      pull: 42,
      user: null,
      links: {
        commit: '',
        pull: 'https://github.com/scalar/scalar/pull/42',
        user: null,
      },
    }

    const description = [
      'Update dependency internals',
      '',
      '- feat: improve caching',
      '- fix: reduce bundle size',
    ].join('\n')

    const result = formatDependencyChange(githubInfo, description)

    expect(result).toBe(
      [
        '  - [#42](https://github.com/scalar/scalar/pull/42): Update dependency internals',
        '',
        '    - feat: improve caching',
        '    - fix: reduce bundle size',
      ].join('\n'),
    )
  })
})
