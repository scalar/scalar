import { describe, expect, it } from 'vitest'

import { check } from '../src/index'

describe('check', () => {
  it.only('checks the valid json file', () => {
    const result = check('/test/valid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
    expect(result.errors).toBe(null)
  })
  it('checks the invalid json file', () => {
    const result = check('/test/invalid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
  })
})
