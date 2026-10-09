import { describe, expect, it } from 'vitest'

import { getTagKind } from './get-tag-kind'

describe('get-tag-kind', () => {
  it.each(['3.2.0', '3.2.1'])('recognizes label kinds in %s', (openapi) => {
    expect(getTagKind({ openapi }, { name: 'Beta', kind: 'badge' })).toBe('badge')
    expect(getTagKind({ openapi }, { name: 'Partners', kind: 'audience' })).toBe('audience')
  })

  it.each(['2.0', '3.0.4', '3.1.2'])('keeps legacy grouping in %s', (openapi) => {
    expect(getTagKind({ openapi }, { name: 'Beta', kind: 'badge' })).toBe('nav')
    expect(getTagKind({ openapi }, { name: 'Partners', kind: 'audience' })).toBe('nav')
  })

  it.each([undefined, '', 'nav', 'custom', 'Badge'])('preserves navigation for kind %s', (kind) => {
    expect(getTagKind({ openapi: '3.2.1' }, { name: 'Users', kind })).toBe('nav')
    expect(getTagKind({ openapi: '3.2.1' })).toBe('nav')
  })
})
