import { describe, expect, it } from 'vitest'

import { getVariableNames } from './getVariableNames'

describe('getVariableNames', () => {
  it('replaces variables with a single bracket', () => {
    expect(getVariableNames('foo{bar}foo')).toMatchObject(['bar'])
  })

  it('replaces variables with a double bracket', () => {
    expect(getVariableNames('foo{{bar}}foo')).toMatchObject(['bar'])
  })

  it('replaces variables with a double bracket', () => {
    expect(getVariableNames('foo{{bar}}foo{foo}')).toMatchObject(['bar', 'foo'])
  })
})
