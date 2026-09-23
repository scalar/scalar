import { describe, expect, it } from 'vitest'

import { normalize } from '@/helpers/normalize'
import { normalizeAsync } from '@/helpers/normalize-async'

describe('normalize-async', () => {
  it('parses JSON without loading the YAML parser', async () => {
    expect(await normalizeAsync('{"foo": "bar"}')).toEqual({ foo: 'bar' })
  })

  it('parses YAML by loading the parser on demand', async () => {
    expect(await normalizeAsync('foo: bar\nbar: foo')).toEqual({ foo: 'bar', bar: 'foo' })
  })

  it('returns an object unchanged', async () => {
    const obj = { foo: 'bar' }
    expect(await normalizeAsync(obj)).toBe(obj)
  })

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['whitespace', '   \n'],
    ['JSON with a leading BOM', `﻿${JSON.stringify({ foo: 'bar' })}`],
    ['broken JSON', '{"foo": '],
    ['text that is neither JSON nor YAML', 'just some words'],
    ['YAML aliases', 'aliases: &ref\n  - item1\n  - item2\nitems: *ref'],
    ['a merge key', 'base: &base\n  a: 1\nderived:\n  <<: *base\n  b: 2'],
    ['a JSON number', '42'],
  ])('matches the sync normalize for %s', async (_label, input) => {
    expect(await normalizeAsync(input)).toEqual(normalize(input))
  })
})
