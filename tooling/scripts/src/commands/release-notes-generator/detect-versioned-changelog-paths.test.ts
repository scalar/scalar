import { describe, expect, it } from 'vitest'

import {
  getVersionedPathsForChangelog,
  shouldGenerateReleaseNotesForProduct,
  wasChangelogVersioned,
} from './detect-versioned-changelog-paths'
import { RELEASE_NOTES_PRODUCTS } from './products'

describe('getVersionedPathsForChangelog', () => {
  it('includes the changelog and adjacent package.json', () => {
    expect(getVersionedPathsForChangelog('packages/mock-server/CHANGELOG.md')).toEqual([
      'packages/mock-server/CHANGELOG.md',
      'packages/mock-server/package.json',
    ])
  })
})

describe('wasChangelogVersioned', () => {
  it('returns true when the changelog path changed', () => {
    const changed = new Set(['packages/mock-server/CHANGELOG.md'])
    expect(wasChangelogVersioned('packages/mock-server/CHANGELOG.md', changed)).toBe(true)
  })

  it('returns true when only package.json changed', () => {
    const changed = new Set(['packages/mock-server/package.json'])
    expect(wasChangelogVersioned('packages/mock-server/CHANGELOG.md', changed)).toBe(true)
  })

  it('returns false when neither path changed', () => {
    const changed = new Set(['packages/api-reference/CHANGELOG.md'])
    expect(wasChangelogVersioned('packages/mock-server/CHANGELOG.md', changed)).toBe(false)
  })
})

describe('shouldGenerateReleaseNotesForProduct', () => {
  const scalarApp = RELEASE_NOTES_PRODUCTS.find((product) => product.slug === 'api-client')
  const mockServer = RELEASE_NOTES_PRODUCTS.find((product) => product.slug === 'mock-server')

  if (!scalarApp || !mockServer) {
    throw new Error('Expected registered products in RELEASE_NOTES_PRODUCTS')
  }

  it('returns true when changedPaths is null', () => {
    expect(shouldGenerateReleaseNotesForProduct(mockServer, null)).toBe(true)
  })

  it('returns false when the product and its dependencies were not versioned', () => {
    const changed = new Set(['packages/api-reference/CHANGELOG.md'])
    expect(shouldGenerateReleaseNotesForProduct(mockServer, changed)).toBe(false)
  })

  it('returns true when the product changelog was versioned', () => {
    const changed = new Set(['packages/mock-server/CHANGELOG.md'])
    expect(shouldGenerateReleaseNotesForProduct(mockServer, changed)).toBe(true)
  })

  it('returns true when only a configured dependency was versioned', () => {
    const changed = new Set(['packages/api-client/CHANGELOG.md'])
    expect(shouldGenerateReleaseNotesForProduct(scalarApp, changed)).toBe(true)
  })

  it('returns true when the parent product was versioned', () => {
    const changed = new Set(['projects/scalar-app/package.json'])
    expect(shouldGenerateReleaseNotesForProduct(scalarApp, changed)).toBe(true)
  })
})
