import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  RELEASE_NOTES_PRODUCTS,
  SHARED_RELEASE_NOTES_SCHEMA_PATH,
  deriveMarkdownPath,
  findReleaseNotesProductByJsonPath,
} from './products'
import { resolveUserPath } from './resolve-user-path'

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

describe('findReleaseNotesProductByJsonPath', () => {
  it('matches registered products by resolved JSON path', () => {
    const jsonPath = resolveUserPath('packages/mock-server/RELEASE_NOTES.json')
    const product = findReleaseNotesProductByJsonPath(jsonPath)
    expect(product?.slug).toBe('mock-server')
    expect(product?.displayName).toBe('Scalar Mock Server')
  })

  it('returns undefined for JSON files outside the product registry', () => {
    const jsonPath = resolve(resolveUserPath('.'), 'unknown/RELEASE_NOTES.json')
    expect(findReleaseNotesProductByJsonPath(jsonPath)).toBeUndefined()
  })
})
