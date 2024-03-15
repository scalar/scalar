import { describe, expect, it } from 'vitest'

import { routeFromPath } from './routeFromPath'

describe('routeFromPath', () => {
  it('returns correct route for a simple path', () => {
    expect(routeFromPath('/foobar')).toBe('/foobar')
  })

  it('returns correct route for a path with an ID', () => {
    expect(routeFromPath('/foobar/{id}')).toBe('/foobar/:id')
  })
})
