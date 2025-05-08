import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import nonBearerHttpSec from './nonBearerHttpSec.yaml?raw'

describe('nonBearerHttpSec', () => {
  it('passes', async () => {
    const result = await validate(nonBearerHttpSec)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
