import { describe, expect, it } from 'vitest'

import { variableRegex } from './regexHelpers'

describe('variableRegex', () => {
  it('matches variables with double curly braces', () => {
    const text = '{{example.com}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('example.com')
  })

  it('matches variables with nested curly braces', () => {
    const text = '{{example.com:{port}}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('example.com:{port}')
  })

  it('matches multiple variables', () => {
    const text = '{{{host}.example.com:{port}}}'
    const matches = [...text.matchAll(variableRegex)]
    expect(matches.length).toBe(1)
    expect(matches[0][1]).toBe('{host}.example.com:{port}')
  })
})
