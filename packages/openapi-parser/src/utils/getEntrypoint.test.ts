import { describe, expect, it } from 'vitest'

import { getEntrypoint } from './getEntrypoint'
import { makeFilesystem } from './makeFilesystem'

describe('isFilesystem', () => {
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
})
