import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { check } from '../src/index'

describe('check', () => {
  it('checks the valid json file', () => {
    const file = fileURLToPath(new URL('valid.json', import.meta.url))
    const result = check(file)
    expect(result.valid).toBe(true)
  })
  it('checks the invalid json file', () => {
    const file = fileURLToPath(new URL('invalid.json', import.meta.url))
    const result = check(file)
    expect(result.errors).toBeDefined()
    expect(result.valid).toBe(false)
    console.log(result.errors)
  })
  it('checks the comprehensive invalid json file', () => {
    const file = fileURLToPath(new URL('./invalid-comprehensive.json', import.meta.url))
    const result = check(file)
    expect(result.valid).toBe(false)
    console.log(result.errors)
  })
  it('checks the config file with valid reference object', () => {
    const file = fileURLToPath(new URL('valid-reference.json', import.meta.url))
    const result = check(file)
    expect(result.valid).toBe(true)
  })
  it.todo('throws an error for extra properties', () => {
    const file = fileURLToPath(new URL('./invalid-extra.json', import.meta.url))
    const result = check(file)
    expect(result.valid).toBe(false)
  })
})
