import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { check } from '../src/index'

describe('check', () => {
  it('checks the valid json file', () => {
    const result = check(path.resolve('./test/valid.json'))
    expect(result.valid).toBe(true)
    console.warn(result.errors)
  })

  it('checks the invalid json file', () => {
    const result = check(path.resolve('./test/invalid.json'))
    expect(result.errors).toBeDefined()
    console.warn(result.errors)
    expect(result.valid).toBe(false)
  })
})
