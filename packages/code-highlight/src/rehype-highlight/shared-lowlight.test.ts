import { describe, expect, it } from 'vitest'

import { getSharedLowlight } from './shared-lowlight'

describe('getSharedLowlight', () => {
  it('returns one instance per language registry', () => {
    const languages = {}

    expect(getSharedLowlight(languages)).toBe(getSharedLowlight(languages))
    expect(getSharedLowlight({})).not.toBe(getSharedLowlight(languages))
  })

  it('rejects registering languages and aliases on the shared instance', () => {
    const lowlight = getSharedLowlight({})

    expect(() => lowlight.register({})).toThrow('read-only')
    expect(() => lowlight.registerAlias({})).toThrow('read-only')
  })
})
