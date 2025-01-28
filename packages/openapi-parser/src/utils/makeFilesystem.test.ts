import { describe, expect, it } from 'vitest'

import { isFilesystem } from './isFilesystem.ts'
import { makeFilesystem } from './makeFilesystem.ts'

describe('isFilesystem', () => {
  it('transforms an object to a filesystem', () => {
    const result = makeFilesystem({
      foo: 'bar',
    })

    expect(result).not.toBe({
      foo: 'bar',
    })

    expect(isFilesystem(result)).toBe(true)
  })
})
