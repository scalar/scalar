import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { check } from './check'

describe('check', () => {
  it('checks the valid json file', () => {
    const result = check('/src/valid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
  it('checks the invalid json file', () => {
    const result = check('/src/invalid.json')
    console.log(JSON.stringify(result, null, 3))
    expect(result.valid).toBe(true)
  })
})
