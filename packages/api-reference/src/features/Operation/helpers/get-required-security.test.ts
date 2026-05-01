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
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toEqual(['oauth2'])
    })

    it('falls through to document.security when operation has no security field', () => {
      const result = getRequiredSecurity({}, { security: [{ apiKey: [] }], components: { securitySchemes: {} } })
      expect(result.state).toBe('required')
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toEqual(['apiKey'])
    })

    it('respects operation security: [] as an explicit opt-out (does NOT fall back to document)', () => {
      const result = getRequiredSecurity(
        { security: [] },
        { security: [{ apiKey: [] }], components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('none')
      expect(result.requirements).toEqual([])
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
      expect(result.requirements[0]?.schemes[0]?.scheme?.type).toBe('http')
    })

    it('leaves scheme undefined when the scheme name is not defined on the document', () => {
      const result = getRequiredSecurity({ security: [{ unknownScheme: [] }] }, { components: { securitySchemes: {} } })
      expect(result.requirements).toHaveLength(1)
      expect(result.requirements[0]?.schemes[0]?.scheme).toBeUndefined()
    })

    it('filters empty scope strings', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['', 'read'] }] },
        { components: { securitySchemes: {} } },
      )
      expect(result.requirements[0]?.schemes[0]?.scopes).toEqual(['read'])
    })
  })

  describe('OR / AND structure', () => {
    it('produces one group per requirement entry (OR alternatives)', () => {
      const result = getRequiredSecurity(
        { security: [{ bearerAuth: ['a'] }, { bearerAuth: ['b'], basicAuth: [] }] },
        { components: { securitySchemes: {} } },
      )
      // Two OR alternatives — must NOT be merged into one
      expect(result.requirements).toHaveLength(2)

      // First alternative: just bearerAuth with scope "a"
      expect(result.requirements[0]?.schemes).toHaveLength(1)
      expect(result.requirements[0]?.schemes[0]?.name).toBe('bearerAuth')
      expect(result.requirements[0]?.schemes[0]?.scopes).toEqual(['a'])

      // Second alternative: bearerAuth with scope "b" AND basicAuth (no scopes)
      expect(result.requirements[1]?.schemes).toHaveLength(2)
      expect(result.requirements[1]?.schemes[0]?.name).toBe('bearerAuth')
      expect(result.requirements[1]?.schemes[0]?.scopes).toEqual(['b'])
      expect(result.requirements[1]?.schemes[1]?.name).toBe('basicAuth')
      expect(result.requirements[1]?.schemes[1]?.scopes).toEqual([])
    })

    it('keeps same scheme in separate groups when it appears in multiple OR alternatives', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read:items'] }, { oauth2: ['write:items', 'read:items'] }] },
        { components: { securitySchemes: {} } },
      )
      // Two distinct OR alternatives — scopes must NOT be unioned
      expect(result.requirements).toHaveLength(2)
      expect(result.requirements[0]?.schemes[0]?.scopes).toEqual(['read:items'])
      expect(result.requirements[1]?.schemes[0]?.scopes.sort()).toEqual(['read:items', 'write:items'])
    })

    it('AND-combines multiple schemes within a single requirement', () => {
      const result = getRequiredSecurity(
        { security: [{ bearerAuth: [], apiKey: [] }] },
        { components: { securitySchemes: {} } },
      )
      // One group containing both schemes — all must be satisfied together
      expect(result.requirements).toHaveLength(1)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toEqual(['bearerAuth', 'apiKey'])
    })

    it('skips empty {} requirements but still sets state to optional', () => {
      const result = getRequiredSecurity(
        { security: [{ bearerAuth: [] }, {}] },
        { components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('optional')
      // Only the real requirement produces a group
      expect(result.requirements).toHaveLength(1)
      expect(result.requirements[0]?.schemes[0]?.name).toBe('bearerAuth')
    })
  })

  describe('complex auth', () => {
    it('handles three OR alternatives each with a single scheme', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read'] }, { apiKey: [] }, { bearerAuth: [] }] },
        { components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('required')
      expect(result.requirements).toHaveLength(3)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toStrictEqual(['oauth2'])
      expect(result.requirements[1]?.schemes.map((s) => s.name)).toStrictEqual(['apiKey'])
      expect(result.requirements[2]?.schemes.map((s) => s.name)).toStrictEqual(['bearerAuth'])
    })

    it('handles AND-combination alternative alongside single-scheme alternative (AND/OR mix)', () => {
      // oauth2+apiKey together OR just bearerAuth
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read', 'write'], apiKey: [] }, { bearerAuth: [] }] },
        { components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('required')
      expect(result.requirements).toHaveLength(2)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toStrictEqual(['oauth2', 'apiKey'])
      expect(result.requirements[0]?.schemes[0]?.scopes).toStrictEqual(['read', 'write'])
      expect(result.requirements[1]?.schemes.map((s) => s.name)).toStrictEqual(['bearerAuth'])
    })

    it('resolves all scheme definitions in an AND group from components', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read'], apiKey: [] }] },
        {
          components: {
            securitySchemes: {
              oauth2: { type: 'oauth2', flows: {} },
              apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
            },
          },
        },
      )
      expect(result.state).toBe('required')
      expect(result.requirements).toEqual([
        {
          schemes: [
            { name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read'] },
            { name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] },
          ],
        },
      ])
    })

    it('marks state optional when AND group is accompanied by an empty {} requirement', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['read'], apiKey: [] }, {}] },
        { components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('optional')
      // The AND group still produces exactly one requirement
      expect(result.requirements).toHaveLength(1)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toStrictEqual(['oauth2', 'apiKey'])
    })

    it('marks state optional with two non-empty OR alternatives alongside an empty {} entry', () => {
      const result = getRequiredSecurity(
        { security: [{ apiKey: [] }, { bearerAuth: [] }, {}] },
        { components: { securitySchemes: {} } },
      )
      expect(result.state).toBe('optional')
      expect(result.requirements).toHaveLength(2)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toStrictEqual(['apiKey'])
      expect(result.requirements[1]?.schemes.map((s) => s.name)).toStrictEqual(['bearerAuth'])
    })

    it('treats multiple {} entries as a single optional signal', () => {
      const result = getRequiredSecurity({ security: [{}, {}] }, { components: { securitySchemes: {} } })
      expect(result.state).toBe('optional')
      expect(result.requirements).toStrictEqual([])
    })

    it('operation-level complex security fully overrides a complex document-level security array', () => {
      const result = getRequiredSecurity(
        { security: [{ oauth2: ['admin'], apiKey: [] }] },
        {
          // document has a completely different, more permissive security declaration
          security: [{ basicAuth: [] }, {}],
          components: { securitySchemes: {} },
        },
      )
      // Operation wins; the document's {} (optional) is irrelevant
      expect(result.state).toBe('required')
      expect(result.requirements).toHaveLength(1)
      expect(result.requirements[0]?.schemes.map((s) => s.name)).toStrictEqual(['oauth2', 'apiKey'])
    })
  })
})
