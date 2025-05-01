import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import hello from './hello.yaml?raw'

describe('hello', () => {
  it('passes', async () => {
    const result = await validate(hello)

    expect(result.errors?.length).toBe(0)
    expect(result.version).toBe('3.0')
  })
})
