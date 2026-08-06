import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { type Crumb, collapseTrail, getInitialContextChain, hasRenderableTagHierarchy, isEllipsis } from './helpers'

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
})
