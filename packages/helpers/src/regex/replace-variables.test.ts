import { describe, expect, it } from 'vitest'

import { replaceVariables } from './replace-variables'

describe('replaceVariables', () => {
  it('replaces variables with a single bracket', () => {
    expect(
      replaceVariables('foo{bar}foo', {
        bar: 'foo',
      }),
    ).toBe('foofoofoo')
  })

  it('replaces variables with a double bracket', () => {
    expect(
      replaceVariables('foo{{bar}}foo', {
        bar: 'foo',
      }),
    ).toBe('foofoofoo')
  })

  it('replaces variables with a custom callback', () => {
    expect(replaceVariables('foo{{bar}}foo', (match) => (match === 'bar' ? '<span>foo</span>' : ''))).toBe(
      'foo<span>foo</span>foo',
    )
  })

  it('returns variable in curly braces when value is empty', () => {
    const template = 'http://{host}:{port}/api'
    const variables = { host: 'localhost', port: '' }

    const result = replaceVariables(template, variables)

    expect(result).toBe('http://localhost:{port}/api')
  })
})
