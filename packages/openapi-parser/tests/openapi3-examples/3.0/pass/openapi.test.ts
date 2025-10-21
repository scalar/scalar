import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import openapi from './openapi.yaml?raw'

describe('openapi', () => {
  it('passes', () => {
    const result = validate(openapi)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
