import { describe, expect, it } from 'vitest'

import { RELEASE_NOTES_PRODUCTS, SHARED_RELEASE_NOTES_SCHEMA_PATH, deriveMarkdownPath } from './products'

describe('RELEASE_NOTES_PRODUCTS', () => {
  it('registers the four curated release-note products', () => {
    expect(RELEASE_NOTES_PRODUCTS.map((product) => product.slug)).toEqual([
      'api-client',
      'api-reference',
      'agent',
      'mock-server',
    ])
  })

  it('derives markdown paths next to each JSON output', () => {
    for (const product of RELEASE_NOTES_PRODUCTS) {
      expect(deriveMarkdownPath(product.outputPath)).toBe(product.outputPath.replace(/\.json$/, '.md'))
    }
  })

  it('uses a single shared JSON Schema path', () => {
    expect(SHARED_RELEASE_NOTES_SCHEMA_PATH).toBe('tooling/scripts/schemas/RELEASE_NOTES.schema.json')
  })
})
