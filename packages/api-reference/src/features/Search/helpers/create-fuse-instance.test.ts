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
    parameters: ['limit'],
    parameterDescriptions: ['Maximum page size'],
    body: ['diameter'],
    bodyDescriptions: ['Width in kilometers'],
    responseExamples: ['{"name":"Jupiter"}'],
    type: 'heading',
    entry: { id: 'planets', title: 'List planets', type: 'text' },
  },
  {
    id: 'create',
    title: 'Create planet',
    description: 'Add a celestial world',
    operationId: 'createPlanet',
    path: '/planets',
    method: 'post',
    body: ['name'],
    responseExamples: ['{"name":"Venus"}'],
    type: 'heading',
    entry: { id: 'create', title: 'Create planet', type: 'text' },
  },
  {
    id: 'satellites',
    title: 'List satellites',
    description: 'Browse moons',
    operationId: 'listSatellites',
    path: '/satellites',
    method: 'get',
    type: 'heading',
    entry: { id: 'satellites', title: 'List satellites', type: 'text' },
  },
]

describe('create-fuse-instance', () => {
  it.each([
    ['planet', ['planets', 'create']],
    ['planat', ['planets', 'create']],
    ['listPlanets', ['planets']],
    ['celestial', ['planets', 'create']],
    ['diameter', ['planets']],
    ['kilometers', ['planets']],
    ['Maximum', ['planets']],
    ['Jupiter', ['planets']],
    ["'satellites", ['satellites']],
    ['^List', ['planets', 'satellites']],
    ['!planet', []],
    ['get$', ['planets', 'satellites']],
    ["'Jupiter | 'Venus", ['planets', 'create']],
    ['=post', ['create']],
    ['missingzzzz', []],
  ])('preserves ordered results for %s', (query, expected) => {
    const fuse = createFuseInstance()
    fuse.setCollection(entries)

    expect(fuse.search(query).map(({ item }) => item.id)).toStrictEqual(expected)
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
