import { describe, expect, it } from 'vitest'

import { getRequiredSecurity } from './get-required-security'

describe('getRequiredSecurity', () => {
  describe('fallback (operation.security ?? document.security)', () => {
    it('uses operation.security when defined', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read:items'] }] },
        { security: [{ apiKey: [] }], components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('required')
      expect(result.schemes.map((s) => s.name)).toEqual(['oauth2'])
    })

    it('falls through to document.security when operation has no security field', () => {
      const result = getRequiredSecurity({}, { security: [{ apiKey: [] }], components: { securitySchemes: {} } })
      expect(result.state).toBe('required')
      expect(result.schemes.map((s) => s.name)).toEqual(['apiKey'])
    })

    it('respects operation security: [] as an explicit opt-out (does NOT fall back to document)', () => {
      const result = getRequiredSecurity(
        { security: [] },
        { security: [{ apiKey: [] }], components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('none')
      expect(result.schemes).toEqual([])
    })

    it('treats missing document.security as none when operation has no security', () => {
      const result = getRequiredSecurity({}, { components: { securitySchemes: {} } })
      expect(result.state).toBe('none')
    })

    it('handles null/undefined operation gracefully', () => {
      expect(getRequiredSecurity(null, {}).state).toBe('none')
      expect(getRequiredSecurity(undefined, {}).state).toBe('none')
    })
  })

  describe('state resolution', () => {
    it('returns required when all requirements list at least one scheme', () => {
      expect(
        getRequiredSecurity(
          { security: [{ apiKey: [] }, { oauth2: ['read'] }] },
          { components: { securitySchemes: {} } },
        ).state,
      ).toBe('required')
    })

    it('returns optional when an empty requirement {} accompanies a real requirement', () => {
      expect(
        getRequiredSecurity({ security: [{ apiKey: [] }, {}] }, { components: { securitySchemes: {} } }).state,
      ).toBe('optional')
    })

    it('returns optional when the only requirement is {} (auth is optional)', () => {
      expect(getRequiredSecurity({ security: [{}] }, { components: { securitySchemes: {} } }).state).toBe('optional')
    })
  })

  describe('scheme resolution', () => {
    it('resolves scheme definitions from document.components.securitySchemes', () => {
      const result = getRequiredSecurity(
        { security: [{ bearerAuth: [] }] },
        {
          components: {
            securitySchemes: {
              bearerAuth: { type: 'http', scheme: 'bearer' },
            },
          },
        },
      )
      expect(result.schemes[0]?.scheme?.type).toBe('http')
    })

    it('leaves scheme undefined when the scheme name is not defined on the document', () => {
      const result = getRequiredSecurity({ security: [{ unknownScheme: [] }] }, { components: { securitySchemes: {} } })
      expect(result.schemes).toHaveLength(1)
      expect(result.schemes[0]?.scheme).toBeUndefined()
    })

    it('unions scopes when the same scheme appears in multiple requirements', () => {
      const result = getRequiredSecurity(
        {
          security: [{ oauth2: ['read:items'] }, { oauth2: ['write:items', 'read:items'] }],
        },
        { components: { securitySchemes: {} } },
      )
      expect(result.schemes[0]?.scopes.sort()).toEqual(['read:items', 'write:items'])
    })

    it('filters empty scope strings', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['', 'read'] }] },
        { components: { securitySchemes: {} } },
      )
      expect(result.schemes[0]?.scopes).toEqual(['read'])
    })
  })
})
