import { describe, expect, it } from 'vitest'

import { getEntrypoint } from './get-entrypoint'
import { makeFilesystem } from './make-filesystem'

describe('getEntrypoint', () => {
  it('keeps the object reference', () => {
    const result = makeFilesystem({
      foo: 'bar',
    })

    const entrypoint = getEntrypoint(result)

    // Modify the entrypoint
    entrypoint.specification.foo = 'baz'

    // Check whether the original was modified
    expect(result[0].specification.foo).toBe('baz')
  })

  it('returns undefined for an empty filesystem', () => {
    const entrypoint = getEntrypoint([])

    // Check whether the original was modified
    expect(entrypoint).toBe(undefined)
  })
})
