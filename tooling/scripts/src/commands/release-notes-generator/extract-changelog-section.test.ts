import { describe, expect, it } from 'vitest'

import { extractChangelogSection } from './extract-changelog-section'

const SAMPLE_CHANGELOG = `# @scalar/api-client

## 3.5.2

### Patch Changes

- 1234abc: fix(api-client): stop the address bar from eating arrow keys
- 5678def: feat(api-client): show response timing in the response tab

## 3.5.1

### Patch Changes

- abcdef0: chore: noisy commit nobody cares about

## 3.5.0

### Minor Changes

- old entry that should never appear when extracting 3.5.2
`

describe('extractChangelogSection', () => {
  it('returns the body for the requested version only', () => {
    const section = extractChangelogSection(SAMPLE_CHANGELOG, '3.5.2')
    expect(section).toContain('stop the address bar from eating arrow keys')
    expect(section).toContain('show response timing in the response tab')
    expect(section).not.toContain('3.5.1')
    expect(section).not.toContain('noisy commit')
    expect(section).not.toContain('3.5.0')
  })

  it('returns null when the version is not in the changelog', () => {
    expect(extractChangelogSection(SAMPLE_CHANGELOG, '9.9.9')).toBeNull()
  })

  it('returns null when the section is empty', () => {
    const empty = '# @scalar/api-client\n\n## 1.0.0\n\n## 0.9.0\n\n- something'
    expect(extractChangelogSection(empty, '1.0.0')).toBeNull()
  })

  it('reads the very last section in a file', () => {
    const section = extractChangelogSection(SAMPLE_CHANGELOG, '3.5.0')
    expect(section).toContain('old entry that should never appear when extracting 3.5.2')
  })

  it('treats semver build metadata literally when the version contains +', () => {
    const changelog = `## 2.0.0+electron.1

### Build

- desktop build metadata must not be parsed as a regex quantifier
`
    const section = extractChangelogSection(changelog, '2.0.0+electron.1')
    expect(section).toContain('desktop build metadata')
  })
})
