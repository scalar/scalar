import { ADD_AUTH_OPTIONS, type SecuritySchemeGroup } from '@/views/Request/consts'
import { securitySchemeSchema, type Collection, type Request } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { formatComplexScheme, formatScheme, getSchemeOptions, getSecurityRequirements } from './auth'

const securitySchemes = {
  apiKeyUid: securitySchemeSchema.parse({
    type: 'apiKey',
    nameKey: 'apiKey',
    uid: 'apiKeyUid',
  }),
  basicUid: securitySchemeSchema.parse({
    type: 'http',
    nameKey: 'basic',
    uid: 'basicUid',
  }),
  oauth2Uid: securitySchemeSchema.parse({
    type: 'oauth2',
    nameKey: 'oauth2',
    uid: 'oauth2Uid',
  }),
}

describe('auth utilities', () => {
  describe('formatScheme', () => {
    it('formats regular security scheme', () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'auth1-uid',
        type: 'http',
        nameKey: 'Basic Auth',
      })

      expect(formatScheme(scheme)).toEqual({
        id: 'auth1-uid',
        label: 'Basic Auth',
      })
    })

    it('adds "coming soon" to openIdConnect schemes', () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'auth2-uid',
        type: 'openIdConnect',
        nameKey: 'OAuth',
      })

      expect(formatScheme(scheme)).toEqual({
        id: 'auth2-uid',
        label: 'OAuth (coming soon)',
      })
    })
  })

  describe('formatComplexScheme', () => {
    it('combines multiple schemes into a single complex scheme', () => {
      expect(formatComplexScheme(['apiKeyUid', 'oauth2Uid'], securitySchemes)).toEqual({
        id: 'apiKeyUid,oauth2Uid',
        label: 'apiKey & oauth2',
      })
    })

    it('handles missing schemes gracefully', () => {
      expect(formatComplexScheme(['apiKeyUid', 'missing'], securitySchemes)).toEqual({
        id: 'apiKeyUid',
        label: 'apiKey',
      })
    })

    it('returns empty complex scheme when no valid schemes provided', () => {
      expect(formatComplexScheme(['missing1', 'missing2'], {})).toEqual({
        id: '',
        label: '',
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

      expect(getSecurityRequirements(request, collection)).toEqual([{ apiKey: [] }])
    })

    it('falls back to collection security when request security is not defined', () => {
      const request = undefined
      const collection = {
        security: [{ basic: [] }, { apiKey: [] }],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([{ basic: [] }, { apiKey: [] }])
    })

    it('handles optional security in request', () => {
      const request = {
        security: [{}],
      } as unknown as Request
      const collection = {
        security: [{ basic: [] }, { apiKey: [] }],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([{ basic: [] }, { apiKey: [] }, {}])
    })

    it('preserves existing optional security in collection', () => {
      const request = {
        security: [{}],
      } as unknown as Request
      const collection = {
        security: [{ basic: [] }, {}],
      } as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([{ basic: [] }, {}])
    })

    it('handles complex security requirements', () => {
      const request = {
        security: [{ apiKey: [], basic: [] }],
      } as unknown as Request
      const collection = {} as unknown as Collection

      expect(getSecurityRequirements(request, collection)).toEqual([{ basic: [], apiKey: [] }])
    })
  })
})

describe('getSchemeOptions', () => {
  const collectionSchemeUids = Object.values(securitySchemes).map((s) => s.uid)

  it('returns flat list when readonly and theres no required schemes', () => {
    const filteredRequirements: Record<string, string[]>[] = []
    const result = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes, true)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      id: 'apiKeyUid',
      label: 'apiKey',
    })
  })

  it('returns 2 grouped options when there are required + available and readonly', () => {
    const filteredRequirements = [{ apiKey: [] }]
    const result = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes, true)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      label: 'Required authentication',
      options: [{ id: 'apiKeyUid', label: 'apiKey' }],
    })
    expect(result[1]).toMatchObject({
      label: 'Available authentication',
      options: [
        { id: 'basicUid', label: 'basic' },
        { id: 'oauth2Uid', label: 'oauth2' },
      ],
    })
  })

  it('returns 3 grouped options when there are required + available + add new', () => {
    const filteredRequirements = [{ apiKey: [] }]
    const result = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      label: 'Required authentication',
      options: [{ id: 'apiKeyUid', label: 'apiKey' }],
    })
    expect(result[1]).toMatchObject({
      label: 'Available authentication',
      options: [
        { id: 'basicUid', label: 'basic' },
        { id: 'oauth2Uid', label: 'oauth2' },
      ],
    })
    expect(result[2]).toMatchObject({
      label: 'Add new authentication',
      options: ADD_AUTH_OPTIONS,
    })
  })

  it('includes "Add new authentication" group only when not readonly', () => {
    const filteredRequirements: Record<string, string[]>[] = []

    const readonlyResult = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes, true)
    const editableResult = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes, false)

    expect(readonlyResult).not.toContainEqual(
      expect.objectContaining({
        label: 'Add new authentication',
      }),
    )

    expect(editableResult[2]).toMatchObject({
      label: 'Add new authentication',
      options: ADD_AUTH_OPTIONS,
    })
  })

  it('handles empty filtered requirements when not readonly', () => {
    const filteredRequirements: Record<string, string[]>[] = []
    const result = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes)

    expect(result).toHaveLength(3)
    expect((result[0] as SecuritySchemeGroup).options).toHaveLength(0)
    expect(result[2]).toMatchObject({
      label: 'Add new authentication',
      options: expect.any(Array),
    })
  })

  it('handles complex security requirements', () => {
    const filteredRequirements = [{ apiKey: [], basic: [] }]
    const result = getSchemeOptions(filteredRequirements, collectionSchemeUids, securitySchemes, false)

    expect(result[0]).toMatchObject({
      label: 'Required authentication',
      options: [{ id: 'apiKeyUid,basicUid', label: 'apiKey & basic' }],
    })
    expect(result[1]).toMatchObject({
      label: 'Available authentication',
      options: [
        { id: 'apiKeyUid', label: 'apiKey' },
        { id: 'basicUid', label: 'basic' },
        { id: 'oauth2Uid', label: 'oauth2' },
      ],
    })
  })
})
