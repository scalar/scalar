import { describe, expect, it } from 'vitest'

import { escapeJsonPointer } from './escape-json-pointer'

describe('escape-json-pointer', () => {
  it('escapes forward slashes', () => {
    expect(escapeJsonPointer('application/json')).toBe('application~1json')
  })

  it('escapes path-like strings', () => {
    expect(escapeJsonPointer('/api/users/{id}/reports')).toBe('~1api~1users~1{id}~1reports')
  })

  it('escapes tildes', () => {
    expect(escapeJsonPointer('foo~bar')).toBe('foo~0bar')
  })
})
