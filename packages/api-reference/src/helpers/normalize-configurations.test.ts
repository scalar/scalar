import { describe, expect, it } from 'vitest'

import { normalizeConfigurations } from './normalize-configurations'

describe('normalize-configurations', () => {
  it('merges document authentication without changing global defaults or sibling documents', () => {
    const authentication = {
      preferredSecurityScheme: ['OAuth'],
      allowedSecuritySchemes: ['OAuth', 'Basic'],
      securitySchemes: {
        OAuth: { flows: { authorizationCode: { 'x-scalar-client-id': 'shared', scopes: { read: 'Read' } } } },
        Basic: { username: 'shared-user' },
      },
    }
    const before = structuredClone(authentication)
    const configs = normalizeConfigurations({
      authentication,
      sources: [
        {
          url: '/public.json',
          slug: 'public',
          authentication: {
            preferredSecurityScheme: ['Basic'],
            allowedSecuritySchemes: ['Basic'],
            securitySchemes: { OAuth: { flows: { authorizationCode: { 'x-scalar-client-id': 'document' } } } },
          },
        },
        { url: '/internal.json', slug: 'internal', authentication: undefined },
        { url: '/empty.json', slug: 'empty', authentication: { allowedSecuritySchemes: [] } },
      ],
    })
    expect(configs.public?.config.authentication).toStrictEqual({
      preferredSecurityScheme: ['Basic'],
      allowedSecuritySchemes: ['Basic'],
      securitySchemes: {
        OAuth: { flows: { authorizationCode: { 'x-scalar-client-id': 'document', scopes: { read: 'Read' } } } },
        Basic: { username: 'shared-user' },
      },
    })
    expect(configs.internal?.config.authentication).toStrictEqual(before)
    expect(configs.empty?.config.authentication).toStrictEqual({ ...before, allowedSecuritySchemes: [] })
    expect(authentication).toStrictEqual(before)
  })

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
