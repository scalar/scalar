import type { Collection, Request } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { displaySchemeFormatter, getSecurityRequirements } from './auth'

describe('auth utilities', () => {
  describe('displaySchemeFormatter', () => {
    it('formats regular security scheme', () => {
      const scheme = {
        uid: 'auth1',
        type: 'http',
        nameKey: 'Basic Auth',
      } as const

      expect(displaySchemeFormatter(scheme)).toEqual({
        id: 'auth1',
        label: 'Basic Auth',
      })
    })

    it('adds "coming soon" to openIdConnect schemes', () => {
      const scheme = {
        uid: 'auth2',
        type: 'openIdConnect',
        nameKey: 'OAuth',
      } as const

      expect(displaySchemeFormatter(scheme)).toEqual({
        id: 'auth2',
        label: 'OAuth (coming soon)',
      })
    })
  })

  describe('getSecurityRequirements', () => {
    it('returns empty arrays when no security is defined', () => {
      const request = {} as Request
      const collection = {} as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([])
    })

    it('uses request security when available', () => {
      const request = {
        security: [{ apiKey: [] }],
        // We can force the types here cuz testing
      } as unknown as Request
      const collection = {
        security: [{ basic: [] }],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([
        { apiKey: [] },
      ])
    })

    it('falls back to collection security when request security is not defined', () => {
      const request = undefined
      const collection = {
        security: [{ basic: [] }, { apiKey: [] }],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([
        { basic: [] },
        { apiKey: [] },
      ])
    })

    it('handles optional security in request', () => {
      const request = {
        security: [{}],
      } as unknown as Request
      const collection = {
        security: [{ basic: [] }, { apiKey: [] }],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([
        { basic: [] },
        { apiKey: [] },
        {},
      ])
    })

    it('preserves existing optional security in collection', () => {
      const request = {
        security: [{}],
      } as unknown as Request
      const collection = {
        security: [{ basic: [] }, {}],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([
        { basic: [] },
        {},
      ])
    })

    it('handles complex security requirements', () => {
      const request = {
        security: [{ apiKey: [], basic: [] }],
      } as unknown as Request
      const collection = {} as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([
        { basic: [], apiKey: [] },
      ])
    })
  })
})
