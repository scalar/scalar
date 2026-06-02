import { describe, expect, it } from 'vitest'

import { getNameFromRef } from '@/helpers/get-name-from-ref'

describe('getNameFromRef', () => {
  it('extracts the trailing identifier from a single-segment parent path', () => {
    expect(getNameFromRef('#/channels/echo', ['channels'])).toBe('echo')
    expect(getNameFromRef('#/servers/production', ['servers'])).toBe('production')
  })

  it('extracts the trailing identifier from a multi-segment parent path', () => {
    expect(getNameFromRef('#/components/securitySchemes/apiKey', ['components', 'securitySchemes'])).toBe('apiKey')
  })

  it('decodes ~1 (slash) and ~0 (tilde) JSON Pointer escapes in the trailing name', () => {
    expect(getNameFromRef('#/channels/rooms~1general~0v2', ['channels'])).toBe('rooms/general~v2')
    expect(getNameFromRef('#/components/securitySchemes/tenant~1admin~0v2', ['components', 'securitySchemes'])).toBe(
      'tenant/admin~v2',
    )
  })

  it('returns undefined when the parent path does not match', () => {
    expect(getNameFromRef('#/channels/foo', ['servers'])).toBeUndefined()
    expect(getNameFromRef('#/components/schemas/foo', ['components', 'securitySchemes'])).toBeUndefined()
  })

  it('returns undefined when the ref has extra segments beyond the name', () => {
    expect(getNameFromRef('#/channels/echo/messages/foo', ['channels'])).toBeUndefined()
    expect(
      getNameFromRef('#/components/securitySchemes/apiKey/scheme', ['components', 'securitySchemes']),
    ).toBeUndefined()
  })

  it('returns undefined when the trailing name is missing', () => {
    expect(getNameFromRef('#/channels/', ['channels'])).toBeUndefined()
    expect(getNameFromRef('#/channels', ['channels'])).toBeUndefined()
  })

  it('returns undefined for refs that do not start with `#/`', () => {
    expect(getNameFromRef('channels/foo', ['channels'])).toBeUndefined()
    expect(getNameFromRef('http://example.com/foo.json#/channels/foo', ['channels'])).toBeUndefined()
  })
})
