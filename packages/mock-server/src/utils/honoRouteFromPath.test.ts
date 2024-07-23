import { describe, expect, it } from 'vitest'

import { honoRouteFromPath } from './honoRouteFromPath'

describe('honoRouteFromPath', () => {
  it('returns correct route for a simple path', () => {
    expect(honoRouteFromPath('/foobar')).toBe('/foobar')
  })

  it('returns correct route for a path with an ID', () => {
    expect(honoRouteFromPath('/foobar/{id}')).toBe('/foobar/:id')
  })
})
