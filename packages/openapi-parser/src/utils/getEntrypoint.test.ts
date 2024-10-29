import { describe, expect, it } from 'vitest'

import { getEntrypoint } from './getEntrypoint.js'
import { makeFilesystem } from './makeFilesystem.js'

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
