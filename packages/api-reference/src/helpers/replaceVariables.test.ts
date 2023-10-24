import { describe, expect, it } from 'vitest'

import { replaceVariables } from './replaceVariables'

describe('replaceVariables', () => {
  it('replaces variables with a single bracket', () => {
    expect(
      replaceVariables('foo{bar}foo', [
        {
          name: 'bar',
          value: 'foo',
        },
      ]),
    ).toMatchObject('foofoofoo')
  })

  it('replaces variables with a double bracket', () => {
    expect(
      replaceVariables('foo{{bar}}foo', [
        {
          name: 'bar',
          value: 'foo',
        },
      ]),
    ).toMatchObject('foofoofoo')
  })

  it('replaces variables with a custom callback', () => {
    expect(
      replaceVariables('foo{{bar}}foo', (match) =>
        match === 'bar' ? `<span>foo</span>` : '',
      ),
    ).toMatchObject('foo<span>foo</span>foo')
  })
})
