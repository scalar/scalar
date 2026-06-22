import { describe, expect, it } from 'vitest'

import { extractPullRequestNumbers } from './fetch-pull-requests'

describe('fetch-pull-requests', () => {
  it('extracts unique pull request numbers for a configured repo', () => {
    const numbers = extractPullRequestNumbers(
      [
        '- [#12](https://github.com/example/repo/pull/12): Add imports',
        '- [#9](https://github.com/example/repo/issues/9): Fix exports',
        '- #12 duplicate',
      ].join('\n'),
      'example/repo',
    )

    expect(numbers).toStrictEqual([9, 12])
  })
})
