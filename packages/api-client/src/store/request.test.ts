import type { Collection, Request, Tag } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { findRequestParentsFactory } from './requests'

describe('Tests finding all parents of a request', () => {
  const request = {
    uid: 'r-0',
  } as unknown as Request

  const collections = {
    'c-0': { uid: 'c-0', children: ['t-0', 't-1'], requests: ['r-0'] },
  } as unknown as Record<string, Collection>

  it('Recursively finds all parent folders of a request', () => {
    const tags = {
      't-0': { uid: 't-1', children: [] },
      't-1': { uid: 't-1', children: ['t-2'] },
      't-2': { uid: 't-2', children: ['t-3'] },
      't-3': { uid: 't-3', children: ['t-4'] },
      't-4': { uid: 't-4', children: ['t-5'] },
      't-5': { uid: 't-5', children: ['t-6'] },
      't-6': { uid: 't-6', children: ['t-7'] },
      't-7': { uid: 't-7', children: ['r-0'] },
    } as unknown as Record<string, Tag>

    const findRequestParentss = findRequestParentsFactory({ tags, collections })

    expect(findRequestParentss(request)).toEqual(['c-0', 't-1', 't-2', 't-3', 't-4', 't-5', 't-6', 't-7'])
  })

  it('Handles mixed folders', () => {
    const tags = {
      't-0': { uid: 't-1', children: [] },
      't-1': { uid: 't-1', children: ['t-2'] },
      't-2': { uid: 't-2', children: ['r-0'] },
      't-3': { uid: 't-3', children: ['t-4', 't-5'] },
      't-4': { uid: 't-4', children: [] },
      't-5': { uid: 't-5', children: ['t-6'] },
      't-6': { uid: 't-6', children: ['t-7'] },
      't-7': { uid: 't-7', children: ['r-0'] },
    } as unknown as Record<string, Tag>

    const findRequestParentss = findRequestParentsFactory({ tags, collections })

    expect(findRequestParentss(request)).toEqual(['c-0', 't-1', 't-2'])
  })

  it('Handles request at top level', () => {
    const _collections = {
      'c-0': { uid: 'c-0', children: ['t-0', 't-1', 'r-0'], requests: ['r-0'] },
    } as unknown as Record<string, Collection>

    const tags = {
      't-0': { uid: 't-1', children: [] },
      't-1': { uid: 't-1', children: ['t-2'] },
      't-2': { uid: 't-2', children: [] },
      't-3': { uid: 't-3', children: ['t-4', 't-5'] },
      't-4': { uid: 't-4', children: [] },
      't-5': { uid: 't-5', children: ['t-6'] },
      't-6': { uid: 't-6', children: ['t-7'] },
      't-7': { uid: 't-7', children: ['r-0'] },
    } as unknown as Record<string, Tag>

    const findRequestParentss = findRequestParentsFactory({
      tags,
      collections: _collections,
    })

    expect(findRequestParentss(request)).toEqual(['c-0'])
  })
})
