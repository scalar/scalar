import json from '@scalar/galaxy/3.1.json'
import microdiff, { type Difference } from 'microdiff'
import { beforeEach, describe, expect, it } from 'vitest'

import { combineRenameDiffs } from './live-sync'

describe('combineRenameDiffs', () => {
  const original = json
  let mutated: any

  // Clone fresh schemas
  beforeEach(() => {
    mutated = JSON.parse(JSON.stringify(original))
  })

  it('creates a change migration for renaming a path with no other changes', () => {
    // Rename a path
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    delete mutated.paths['/planets']

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
    ])
  })

  it('creates two change migrations for renaming a path with child diffs', () => {
    // Rename a path and modify a child property
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    mutated.paths['/planoots'].get.summary = 'Get all planoots'
    delete mutated.paths['/planets']

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planoots', 'get', 'summary'],
        oldValue: 'Get all planets',
        value: 'Get all planoots',
      } as Difference,
    ])
  })

  it('creates two change migrations for renaming a path and a method', () => {
    // Rename a path and a method
    mutated.paths['/planoots'] = { ...mutated.paths['/planets'] }
    delete mutated.paths['/planets']

    mutated.paths['/planoots'].put = { ...mutated.paths['/planoots'].get }
    delete mutated.paths['/planoots'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', 'path'],
        oldValue: '/planets',
        value: '/planoots',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planoots', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
    ])
  })

  it('creates a change migration for changing a method with no other changes', () => {
    // Rename a method
    mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
    delete mutated.paths['/planets'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
    ])
  })

  it('creates a change migration for renaming a method with child diffs', () => {
    // Rename a method and modify a child property
    mutated.paths['/planets'].put = { ...mutated.paths['/planets'].get }
    mutated.paths['/planets'].put.summary = 'Update a planet'
    delete mutated.paths['/planets'].get

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'method'],
        oldValue: 'get',
        value: 'put',
      } as Difference,
      {
        type: 'CHANGE',
        path: ['paths', '/planets', 'put', 'summary'],
        oldValue: 'Get all planets',
        value: 'Update a planet',
      } as Difference,
    ])
  })

  it('handles deep changes in the schema', () => {
    // Modify a deep property in the schema
    mutated.paths['/planets'].get.responses['200'].content[
      'application/json'
    ].schema.allOf[0].properties.data = { type: 'number', examples: [1] }

    const diff = microdiff(original, mutated)
    const combinedDiff = combineRenameDiffs(diff)

    expect(combinedDiff).toEqual([
      {
        type: 'CHANGE',
        path: [
          'paths',
          '/planets',
          'get',
          'responses',
          '200',
          'content',
          'application/json',
          'schema',
          'allOf',
          0,
          'properties',
          'data',
          'type',
        ],
        oldValue: 'array',
        value: 'number',
      } as Difference,
    ])
  })
})
