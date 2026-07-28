import { describe, expect, it } from 'vitest'

import { type Crumb, collapseTrail, isEllipsis } from './helpers'

describe('collapseTrail', () => {
  const chainOf = (...titles: string[]): Crumb[] => titles.map((title) => ({ id: title.toLowerCase(), title }))

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
})
