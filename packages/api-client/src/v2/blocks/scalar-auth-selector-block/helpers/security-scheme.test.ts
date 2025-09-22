import assert from 'node:assert'

import type { ComponentsObject, OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import {
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
  formatComplexScheme,
  formatScheme,
  getSecuritySchemeOptions,
} from './security-scheme'

describe('security-scheme', () => {
  describe('formatScheme', () => {
    it('should format a basic API key scheme', () => {
      const result = formatScheme({
        name: 'apiKey',
        type: 'apiKey',
        value: { apiKey: [] },
      })

      expect(result).toEqual({
        id: 'apiKey',
        label: 'apiKey',
        value: { apiKey: [] },
      })
    })

    it('should format an OpenID Connect scheme with "coming soon" label', () => {
      const result = formatScheme({
        name: 'openIdConnect',
        type: 'openIdConnect',
        value: { openIdConnect: [] },
      })

      expect(result).toEqual({
        id: 'openIdConnect',
        label: 'openIdConnect (coming soon)',
        value: { openIdConnect: [] },
      })
    })

    it('should format a complex scheme type', () => {
      const result = formatScheme({
        name: 'complexAuth',
        type: 'complex',
        value: { complexAuth: [] },
      })

      expect(result).toEqual({
        id: 'complexAuth',
        label: 'complexAuth',
        value: { complexAuth: [] },
      })
    })

    it('should format HTTP basic scheme', () => {
      const result = formatScheme({
        name: 'httpBasic',
        type: 'http',
        value: { httpBasic: [] },
      })

      expect(result).toEqual({
        id: 'httpBasic',
        label: 'httpBasic',
        value: { httpBasic: [] },
      })
    })

    it('should format OAuth2 scheme', () => {
      const result = formatScheme({
        name: 'oauth2',
        type: 'oauth2',
        value: { oauth2: [] },
      })

      expect(result).toEqual({
        id: 'oauth2',
        label: 'oauth2',
        value: { oauth2: [] },
      })
    })
  })

  describe('formatComplexScheme', () => {
    it('should format a single security scheme', () => {
      const scheme = { apiKey: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: 'apiKey',
        label: 'apiKey',
        value: { apiKey: [] },
      })
    })

    it('should format multiple security schemes with ampersand separator', () => {
      const scheme = { apiKey: [], httpBasic: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: 'apiKey & httpBasic',
        label: 'apiKey & httpBasic',
        value: { apiKey: [], httpBasic: [] },
      })
    })

    it('should format three security schemes with ampersand separators', () => {
      const scheme = { apiKey: [], httpBasic: [], oauth2: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: 'apiKey & httpBasic & oauth2',
        label: 'apiKey & httpBasic & oauth2',
        value: { apiKey: [], httpBasic: [], oauth2: [] },
      })
    })

    it('should handle empty security scheme object', () => {
      const scheme = {}
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: '',
        label: '',
        value: {},
      })
    })
  })

  describe('getSecuritySchemeOptions', () => {
    const securitySchemes = {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      httpBasic: {
        type: 'http',
        scheme: 'basic',
      },
      oauth2: {
        type: 'oauth2',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://example.com/token',
            scopes: {},
            'x-scalar-client-id': '',
            'x-scalar-client-secret': '',
          },
        },
      },
      openIdConnect: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid_configuration',
      },
    } satisfies ComponentsObject['securitySchemes']

    it('should return grouped options when not readonly', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }, { httpBasic: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3) // Required, Available, Add new

      const groups = result as SecuritySchemeGroup[]

      assert(groups[0] !== undefined)
      assert(groups[1] !== undefined)
      assert(groups[2] !== undefined)

      expect(groups[0].label).toBe('Required authentication')
      expect(groups[1].label).toBe('Available authentication')
      expect(groups[2].label).toBe('Add new authentication')

      // Check required authentication options
      expect(groups[0].options).toHaveLength(2)

      expect(groups[0].options[0]!.id).toBe('apiKey')
      expect(groups[0].options[1]!.id).toBe('httpBasic')

      // Check available authentication options
      expect(groups[1].options).toHaveLength(2)
      expect(groups[1].options.some((opt) => opt.id === 'oauth2')).toBe(true)
      expect(groups[1].options.some((opt) => opt.id === 'openIdConnect')).toBe(true)

      // Check add new authentication options
      expect(groups[2].options.length).toBeGreaterThan(0)
      expect(groups[2].options.every((opt) => opt.isDeletable === false)).toBe(true)
    })

    it('should return flat list when readonly and has required schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, true)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]!.label).toBe('Required authentication')

      expect((result[0] as SecuritySchemeGroup).options).toHaveLength(1)
      expect((result[0] as SecuritySchemeGroup).options[0]!.id).toBe('apiKey')
      expect((result[0] as SecuritySchemeGroup).options[0]!.label).toBe('apiKey')
    })

    it('should return flat list when readonly and no required schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const result = getSecuritySchemeOptions(security, securitySchemes, true)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2) // Available schemes only
      expect((result as SecuritySchemeOption[]).every((opt) => typeof opt.id === 'string')).toBe(true)
    })

    it('should handle complex security schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [], httpBasic: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      const requiredOptions = groups[0]!.options
      expect(requiredOptions).toHaveLength(1)
      expect(requiredOptions[0]!.id).toBe('apiKey & httpBasic')
      expect(requiredOptions[0]!.label).toBe('apiKey & httpBasic')
    })

    it('should handle missing security schemes gracefully', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ nonExistent: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // Should filter out undefined schemes
    })

    it('should handle empty security array', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // No required schemes
      expect(groups[1]!.options.length).toBeGreaterThan(0) // All schemes available
    })

    it('should handle empty security schemes object', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]

      const result = getSecuritySchemeOptions(security, {}, false)

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // No schemes found
      expect(groups[1]!.options).toHaveLength(0) // No available schemes
    })

    it('should include all auth options in add new section', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      const addNewOptions = groups[2]!.options

      // Should include predefined auth options
      expect(addNewOptions.some((opt) => opt.id === 'apiKeyCookie')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'apiKeyHeader')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'apiKeyQuery')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'httpBasic')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'httpBearer')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'oauth2Implicit')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'oauth2Password')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'oauth2ClientCredentials')).toBe(true)
      expect(addNewOptions.some((opt) => opt.id === 'oauth2AuthorizationFlow')).toBe(true)

      // All should be non-deletable
      expect(addNewOptions.every((opt) => opt.isDeletable === false)).toBe(true)
    })

    it('should filter out required schemes from available options', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options
      const requiredOptions = groups[0]!.options

      // Available options should not include apiKey since it's required
      expect(availableOptions.some((opt) => opt.id === 'apiKey')).toBe(false)
      expect(availableOptions.some((opt) => opt.id === 'httpBasic')).toBe(true)
      expect(availableOptions.some((opt) => opt.id === 'oauth2')).toBe(true)
      expect(availableOptions.some((opt) => opt.id === 'openIdConnect')).toBe(true)

      // Required options should include apiKey
      expect(requiredOptions.some((opt) => opt.id === 'apiKey')).toBe(true)
    })

    it('should handle schemes with undefined resolved references', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]

      // Mock getResolvedRef to return undefined for some schemes
      const securitySchemesWithUndefined = {
        ...securitySchemes,
        undefinedScheme: undefined,
      } as unknown as NonNullable<ComponentsObject['securitySchemes']>

      const result = getSecuritySchemeOptions(security, securitySchemesWithUndefined, false)

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options

      // Should not include undefined schemes
      expect(availableOptions.some((opt) => opt.id === 'undefinedScheme')).toBe(false)
    })

    it('should create proper value objects for available schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options

      availableOptions.forEach((option) => {
        expect(option.value).toEqual({ [option.id]: [] })
      })
    })

    it('should create proper value objects for required schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }, { httpBasic: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, false)

      const groups = result as SecuritySchemeGroup[]
      const requiredOptions = groups[0]!.options

      expect(requiredOptions[0]!.value).toEqual({ apiKey: [] })
      expect(requiredOptions[1]!.value).toEqual({ httpBasic: [] })
    })
  })
})
