import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { buildModelsIndex } from './build-models-index'

/** Builds a model navigation entry with sensible defaults. */
const model = (name: string, id = `model-${name}`): TraversedEntry => ({
  type: 'model',
  id,
  title: name,
  name,
  ref: `#/components/schemas/${name}`,
})

/** Builds a tag navigation entry wrapping the given children. */
const tag = (name: string, children: TraversedEntry[]): TraversedEntry => ({
  type: 'tag',
  id: `tag-${name}`,
  title: name,
  name,
  isGroup: false,
  children,
})

describe('buildModelsIndex', () => {
  it('collects models from the top-level models group', () => {
    const items: TraversedEntry[] = [
      {
        type: 'models',
        id: 'models',
        title: 'Models',
        name: 'Models',
        children: [model('Planet'), model('Satellite')],
      },
    ]

    expect(buildModelsIndex(items)).toEqual({
      Planet: 'model-Planet',
      Satellite: 'model-Satellite',
    })
  })

  it('collects models grouped under a tag via x-tags', () => {
    const items: TraversedEntry[] = [
      tag('Celestial', [model('Satellite')]),
      {
        type: 'models',
        id: 'models',
        title: 'Models',
        name: 'Models',
        children: [model('Planet')],
      },
    ]

    // The x-tagged `Satellite` model lives under the tag group but must still be reachable by name.
    expect(buildModelsIndex(items)).toEqual({
      Satellite: 'model-Satellite',
      Planet: 'model-Planet',
    })
  })

  it('collects models nested inside tag groups', () => {
    const items: TraversedEntry[] = [
      {
        type: 'tag',
        id: 'group',
        title: 'Group',
        name: 'Group',
        isGroup: true,
        children: [tag('Celestial', [model('Satellite')])],
      },
    ]

    expect(buildModelsIndex(items)).toEqual({ Satellite: 'model-Satellite' })
  })

  it('keeps the first entry when a model appears under multiple tags', () => {
    const items: TraversedEntry[] = [
      tag('First', [model('Satellite', 'model-Satellite-first')]),
      tag('Second', [model('Satellite', 'model-Satellite-second')]),
    ]

    expect(buildModelsIndex(items)).toEqual({ Satellite: 'model-Satellite-first' })
  })

  it('returns an empty map when there are no models', () => {
    const items: TraversedEntry[] = [tag('Empty', [])]

    expect(buildModelsIndex(items)).toEqual({})
  })
})
