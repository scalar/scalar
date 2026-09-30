import { describe, expect, it } from 'vitest'

import type { FuseData } from '../types'
import { createFuseInstance } from './create-fuse-instance'

const entries: FuseData[] = [
  {
    id: 'planets',
    title: 'List planets',
    description: 'Browse celestial worlds',
    operationId: 'listPlanets',
    path: '/planets',
    method: 'get',
    documentName: 'Galaxy',
    type: 'operation',
    entry: {
      id: 'planets',
      title: 'List planets',
      type: 'operation',
      ref: '#/paths/~1planets/get',
      method: 'get',
      path: '/planets',
    },
  },
  {
    id: 'create',
    title: 'Create planet',
    description: 'Add a celestial world',
    operationId: 'createPlanet',
    path: '/planets',
    method: 'post',
    documentName: 'Galaxy',
    type: 'operation',
    entry: {
      id: 'create',
      title: 'Create planet',
      type: 'operation',
      ref: '#/paths/~1planets/post',
      method: 'post',
      path: '/planets',
    },
  },
  {
    id: 'satellites',
    title: 'List satellites',
    description: 'Browse moons',
    documentName: 'Astronomy',
    operationId: 'listSatellites',
    path: '/satellites',
    method: 'get',
    type: 'operation',
    entry: {
      id: 'satellites',
      title: 'List satellites',
      type: 'operation',
      ref: '#/paths/~1satellites/get',
      method: 'get',
      path: '/satellites',
    },
  },
]

describe('create-fuse-instance', () => {
  it.each([
    ['planet', ['planets', 'create']],
    ['planat', ['planets', 'create']],
    ['listPlanets', ['planets']],
    ['celestial', ['planets', 'create']],
    ['Galaxy', ['planets', 'create']],
    ['Astronomy', ['satellites']],
    ["'satellites", ['satellites']],
    ['^List', ['planets', 'satellites']],
    ['!planet', []],
    ['get$', ['planets', 'satellites']],
    ["'celestial | 'moons", ['satellites', 'planets', 'create']],
    ['=post', ['create']],
    ['missingzzzz', []],
  ])('preserves ordered results for %s', (query, expected) => {
    const fuse = createFuseInstance()
    fuse.setCollection(entries)

    const results = fuse.search(query)
    expect(results.map(({ item }) => item.id)).toStrictEqual(expected)
    for (const result of results) {
      expect(result.matches).toBeUndefined()
    }
  })

  it('limits results without changing ranking and replaces the searchable collection', () => {
    const fuse = createFuseInstance()
    fuse.setCollection(entries)

    expect(fuse.search('planet', { limit: 1 }).map(({ item }) => item.id)).toStrictEqual(['planets'])

    fuse.setCollection(entries.filter(({ id }) => id === 'satellites'))

    expect(fuse.search('planet')).toStrictEqual([])
    expect(fuse.search('satellite').map(({ item }) => item.id)).toStrictEqual(['satellites'])
  })
})
