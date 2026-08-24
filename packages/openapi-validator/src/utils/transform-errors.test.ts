import { describe, expect, it } from 'vitest'

import { transformErrors } from './transform-errors'

describe('transformErrors', () => {
  it('transforms a string to a proper error object', () => {
    const result = transformErrors({}, 'example error message')

    expect(result).toEqual([
      {
        message: 'example error message',
      },
    ])
  })
})
