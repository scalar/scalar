import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import {
  type Crumb,
  buildHeaderTagChains,
  collapseTrail,
  getInitialContextChain,
  hasRenderableTagHierarchy,
  isEllipsis,
} from './helpers'

describe('helpers', () => {
  const chainOf = (...titles: string[]): Crumb[] => titles.map((title) => ({ id: title.toLowerCase(), title }))

  const tag = (title: string, children: TraversedTag[] = [], isTagGroup = false): TraversedTag => ({
    id: title.toLowerCase(),
    title,
    type: 'tag',
    name: title,
    isGroup: children.length > 0,
    isTagGroup,
    children,
  })

  it('leaves a short trail untouched', () => {
    const chain = chainOf('Galaxy', 'Planets', 'Moons')

    expect(collapseTrail(chain)).toEqual(chain)
  })

  it('folds the middle of a long trail into an ellipsis', () => {
    const result = collapseTrail(chainOf('Galaxy', 'Planets', 'Moons', 'Craters', 'Regolith'))

    expect(result.map((crumb) => (isEllipsis(crumb) ? '…' : crumb.title))).toEqual([
      'Galaxy',
      '…',
      'Craters',
      'Regolith',
    ])
  })

  it('records the hidden titles on the ellipsis for its tooltip', () => {
    const result = collapseTrail(chainOf('Galaxy', 'Planets', 'Moons', 'Craters', 'Regolith'))
    const ellipsis = result.find(isEllipsis)

    expect(ellipsis?.hiddenTitles).toEqual(['Planets', 'Moons'])
  })

  it('finds a native nested tag hierarchy', () => {
    const entries = [tag('Galaxy', [tag('Planets')])]

    expect(hasRenderableTagHierarchy(entries, 'modern')).toBe(true)
    expect(getInitialContextChain(entries, 'modern')).toStrictEqual([
      { id: 'galaxy', title: 'Galaxy' },
      { id: 'planets', title: 'Planets' },
    ])
  })

  it('ignores unrelated top-level tags', () => {
    const entries = [tag('Planets'), tag('Moons')]

    expect(hasRenderableTagHierarchy(entries, 'modern')).toBe(false)
    expect(getInitialContextChain(entries, 'modern')).toStrictEqual([])
  })

  it('only counts legacy tag groups when their headings render', () => {
    const entries = [tag('Space', [tag('Planets')], true)]

    expect(hasRenderableTagHierarchy(entries, 'modern')).toBe(false)
    expect(hasRenderableTagHierarchy(entries, 'classic')).toBe(true)
    expect(getInitialContextChain(entries, 'classic')).toStrictEqual([
      { id: 'space', title: 'Space' },
      { id: 'planets', title: 'Planets' },
    ])
  })

  describe('buildHeaderTagChains', () => {
    it('lists every header tag in document order with its full trail', () => {
      const entries = [tag('Galaxy', [tag('Planets', [tag('Moons')])]), tag('Deep space', [tag('Stars')])]

      expect(buildHeaderTagChains(entries, 'modern')).toStrictEqual([
        { id: 'galaxy', chain: chainOf('Galaxy') },
        { id: 'planets', chain: chainOf('Galaxy', 'Planets') },
        { id: 'moons', chain: chainOf('Galaxy', 'Planets', 'Moons') },
        { id: 'deep space', chain: chainOf('Deep space') },
        { id: 'stars', chain: chainOf('Deep space', 'Stars') },
      ])
    })

    it('drops legacy tag groups from the trail in the modern layout', () => {
      const entries = [tag('Space', [tag('Planets')], true)]

      // The wrapper renders no heading of its own, so its child starts a fresh trail.
      expect(buildHeaderTagChains(entries, 'modern')).toStrictEqual([{ id: 'planets', chain: chainOf('Planets') }])
    })

    it('keeps legacy tag groups in the trail in the classic layout', () => {
      const entries = [tag('Space', [tag('Planets')], true)]

      expect(buildHeaderTagChains(entries, 'classic')).toStrictEqual([
        { id: 'space', chain: chainOf('Space') },
        { id: 'planets', chain: chainOf('Space', 'Planets') },
      ])
    })

    it('returns nothing when there are no tags', () => {
      expect(buildHeaderTagChains([], 'modern')).toStrictEqual([])
    })
  })
})
