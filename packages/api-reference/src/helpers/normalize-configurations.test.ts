import { describe, expect, it } from 'vitest'

import { normalizeConfigurations } from './normalize-configurations'

describe('normalize-configurations', () => {
  it.each([false, true])('preserves hideModelNames=%s through configuration normalization', (hideModelNames) => {
    const configurations = normalizeConfigurations({ url: '/openapi.json', hideModelNames })
    expect(Object.values(configurations)[0]?.config.hideModelNames).toBe(hideModelNames)
  })

  describe('isSlugGenerated', () => {
    it('is false when the slug is derived from a configured title', () => {
      const configurations = normalizeConfigurations({ url: '/openapi.json', title: 'Galaxy API' })

      expect(configurations['galaxy-api']).toMatchObject({ slug: 'galaxy-api', isSlugGenerated: false })
    })

    it('is false when a slug is configured', () => {
      const configurations = normalizeConfigurations({ url: '/openapi.json', slug: 'galaxy' })

      expect(configurations['galaxy']).toMatchObject({ slug: 'galaxy', isSlugGenerated: false })
    })

    it('is true when neither a slug nor a title is configured', () => {
      const configurations = normalizeConfigurations({ url: '/openapi.json' })

      expect(configurations['api-1']).toMatchObject({ slug: 'api-1', isSlugGenerated: true })
    })

    it('does not leak into the raw configuration', () => {
      const configurations = normalizeConfigurations({ url: '/openapi.json' })

      expect(configurations['api-1']?.config).not.toHaveProperty('isSlugGenerated')
    })
  })
})
