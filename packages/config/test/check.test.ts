import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { check } from '../src/index'

describe.skip('check', () => {
  it('checks the valid json file', () => {
    const result = check(path.resolve('./test/valid.json'))
    expect(result.errors).toBe(null)
    expect(result.valid).toBe(true)
  })

  it('checks the invalid json file', () => {
    const result = check(path.resolve('./test/invalid.json'))

    expect(result.errors).toBeDefined()
    expect(result.valid).toBe(false)
  })
})
