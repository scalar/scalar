import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { check } from '../src/index'

describe('check', () => {
  it('checks the valid json file', () => {
    const result = check(path.resolve('./test/valid.json'))
    expect(result.valid).toBe(true)
  })
  it('checks the invalid json file', () => {
    const result = check(path.resolve('./test/invalid.json'))
    expect(result.errors).toBeDefined()
    expect(result.valid).toBe(false)
  })
  it('checks the comprehensive invalid json file', () => {
    const result = check(path.resolve('./test/invalid-comprehensive.json'))
    expect(result.valid).toBe(false)
    console.log(result.errors)
  })
  it('checks the config file with valid reference object', () => {
    const result = check(path.resolve('./test/valid-reference.json'))
    expect(result.valid).toBe(true)
  })
  it.todo('throws an error for extra properties', () => {
    const result = check(path.resolve('./test/invalid-extra.json'))
    expect(result.valid).toBe(false)
  })
})
