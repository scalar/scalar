import { describe, expect, it } from 'vitest'

import { buildChangelogUrl } from './run-release-notes-generator'

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
})
