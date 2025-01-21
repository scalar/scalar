import { describe, expect, it } from 'vitest'

import { makeFilesystem } from './makeFilesystem.js'
import { transformErrors } from './transformErrors.js'

describe('transformErrors', () => {
  it('transforms a string to a proper error object', () => {
    const result = transformErrors(
      makeFilesystem('').find((entrypoint) => entrypoint.isEntrypoint),
      'example error message',
    )

    expect(result).toEqual([
      {
        message: 'example error message',
      },
    ])
  })
})
