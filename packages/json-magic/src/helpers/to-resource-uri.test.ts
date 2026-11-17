import { describe, expect, it } from 'vitest'

import { toResourceUri } from './to-resource-uri'

describe('to-resource-uri', () => {
  it.each([
    ['/tmp/source dir/schema#1%.json', 'file:///tmp/source%20dir/schema%231%25.json'],
    ['C:\\schemas\\pet.json', 'file:///C:/schemas/pet.json'],
    ['file:///tmp/schema.json', 'file:///tmp/schema.json'],
    ['https://example.test/schema.json', 'https://example.test/schema.json'],
    ['urn:example:schema', 'urn:example:schema'],
    ['relative/schema.json', 'relative/schema.json'],
  ])('converts %s to %s', (source, expected) => {
    expect(toResourceUri(source)).toBe(expected)
  })
})
