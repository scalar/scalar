import { describe, expect, it } from 'vitest'

import { escapeJsonPointer } from './escape-json-pointer'

describe('escapeJsonPointer', async () => {
  it('should escape a slash', () => {
    expect(escapeJsonPointer('application/json')).toBe('application~1json')
  })

  it('should escape multiple slashes', () => {
    expect(escapeJsonPointer('/api/users/{id}/reports')).toBe('~1api~1users~1{id}~1reports')
  })
})
