import { describe, expect, it } from 'vitest'

import { isPlaceholderPath } from './is-placeholder-path'

describe('isPlaceholderPath', () => {
  it('returns true for the drafts document on the root path', () => {
    expect(isPlaceholderPath('/', 'drafts')).toBe(true)
  })

  it('matches the drafts slug case-insensitively', () => {
    expect(isPlaceholderPath('/', 'Drafts')).toBe(true)
    expect(isPlaceholderPath('/', 'DRAFTS')).toBe(true)
  })

  it('returns false for drafts on any non-root path', () => {
    expect(isPlaceholderPath('/users', 'drafts')).toBe(false)
    expect(isPlaceholderPath('/users/{id}', 'drafts')).toBe(false)
  })

  it('returns false for the root path on non-drafts documents', () => {
    expect(isPlaceholderPath('/', 'my-api')).toBe(false)
  })

  it('returns true for auto-generated temp paths with hex suffixes', () => {
    expect(isPlaceholderPath('/_scalar_temp1a2b3c4d', 'my-api')).toBe(true)
    expect(isPlaceholderPath('/_scalar_tempABCDEF', 'my-api')).toBe(true)
    expect(isPlaceholderPath('/_scalar_temp0', 'my-api')).toBe(true)
  })

  it('returns true for the bare fallback temp path', () => {
    // `createTempOperation` falls back to `/_scalar_temp` after too many collisions
    expect(isPlaceholderPath('/_scalar_temp', 'my-api')).toBe(true)
  })

  it('returns false for temp paths with non-hex characters after the prefix', () => {
    expect(isPlaceholderPath('/_scalar_temp-path', 'my-api')).toBe(false)
    expect(isPlaceholderPath('/_scalar_temp_extra', 'my-api')).toBe(false)
    expect(isPlaceholderPath('/_scalar_temp/extra', 'my-api')).toBe(false)
  })

  it('returns false for paths that start with a similar but different prefix', () => {
    expect(isPlaceholderPath('/temp1a2b3c4d', 'my-api')).toBe(false)
    expect(isPlaceholderPath('/_scalar/temp1a2b', 'my-api')).toBe(false)
    expect(isPlaceholderPath('/template', 'my-api')).toBe(false)
  })
})
