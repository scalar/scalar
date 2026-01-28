import type { ComponentsObject, OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'

import {
  type SecuritySchemeGroup,
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
        id: 'a4da7d48d8af6c6b',
        label: 'apiKey',
        isDeletable: true,
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
        id: '8da8c10db72dcac3',
        label: 'openIdConnect (coming soon)',
        isDeletable: true,
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
        id: 'ec7e72bfb3525348',
        label: 'complexAuth',
        isDeletable: true,
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
        id: '0ebf7bc7501f14c3',
        label: 'httpBasic',
        isDeletable: true,
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
        id: '48cc5a8ff1d2df93',
        label: 'oauth2',
        isDeletable: true,
        value: { oauth2: [] },
      })
    })
  })

  describe('formatComplexScheme', () => {
    it('should format a single security scheme', () => {
      const scheme = { apiKey: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: 'a4da7d48d8af6c6b',
        label: 'apiKey',
        isDeletable: true,
        value: { apiKey: [] },
      })
    })

    it('should format multiple security schemes with ampersand separator', () => {
      const scheme = { apiKey: [], httpBasic: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: '2d07634ebbbf7f6d',
        label: 'apiKey & httpBasic',
        isDeletable: true,
        value: { apiKey: [], httpBasic: [] },
      })
    })

    it('should format three security schemes with ampersand separators', () => {
      const scheme = { apiKey: [], httpBasic: [], oauth2: [] }
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: '01fb1802b124c9d5',
        label: 'apiKey & httpBasic & oauth2',
        isDeletable: true,
        value: { apiKey: [], httpBasic: [], oauth2: [] },
      })
    })

    it('should handle empty security scheme object', () => {
      const scheme = {}
      const result = formatComplexScheme(scheme)

      expect(result).toEqual({
        id: '8fb36f5cafed1c20',
        label: '',
        isDeletable: true,
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
            refreshUrl: 'https://example.com/token',
          },
        },
      },
      openIdConnect: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid_configuration',
      },
    } satisfies ComponentsObject['securitySchemes']

    it('should return grouped options', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }, { httpBasic: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, [])

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

      expect(groups[0].options[0]!.id).toBe('a4da7d48d8af6c6b')
      expect(groups[0].options[1]!.id).toBe('0ebf7bc7501f14c3')

      // Check available authentication options
      expect(groups[1].options).toHaveLength(2)
      expect(groups[1].options.some((opt) => opt.id === '48cc5a8ff1d2df93')).toBe(true)
      expect(groups[1].options.some((opt) => opt.id === '8da8c10db72dcac3')).toBe(true)

      // Check add new authentication options
      expect(groups[2].options.length).toBeGreaterThan(0)
      expect(groups[2].options.every((opt) => opt.isDeletable === false)).toBe(true)
    })

    it('should return all options when it has required schemes and no selected schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      expect(Array.isArray(result)).toBe(true)
      expect(result).toStrictEqual([
        {
          label: 'Required authentication',
          options: [
            {
              id: 'a4da7d48d8af6c6b',
              label: 'apiKey',
              isDeletable: true,
              value: { apiKey: [] },
            },
          ],
        },
        {
          label: 'Available authentication',
          options: [
            {
              id: '0ebf7bc7501f14c3',
              label: 'httpBasic',
              isDeletable: true,
              value: { httpBasic: [] },
            },
            {
              id: '48cc5a8ff1d2df93',
              label: 'oauth2',
              isDeletable: true,
              value: { oauth2: [] },
            },
            {
              id: '8da8c10db72dcac3',
              label: 'openIdConnect (coming soon)',
              isDeletable: true,
              value: { openIdConnect: [] },
            },
          ],
        },
        {
          label: 'Add new authentication',
          options: [
            {
              id: 'apiKeyCookie',
              label: 'API Key in Cookies',
              value: { apiKeyCookie: [] },
              payload: {
                type: 'apiKey',
                in: 'cookie',
                name: 'apiKeyCookie',
              },
              isDeletable: false,
            },
            {
              id: 'apiKeyHeader',
              label: 'API Key in Headers',
              value: { apiKeyHeader: [] },
              payload: {
                type: 'apiKey',
                in: 'header',
                name: 'apiKeyHeader',
              },
              isDeletable: false,
            },
            {
              id: 'apiKeyQuery',
              label: 'API Key in Query Params',
              value: { apiKeyQuery: [] },
              payload: {
                type: 'apiKey',
                in: 'query',
                name: 'apiKeyQuery',
              },
              isDeletable: false,
            },
            {
              id: 'httpBasic',
              label: 'HTTP Basic',
              value: { httpBasic: [] },
              payload: {
                type: 'http',
                scheme: 'basic',
              },
              isDeletable: false,
            },
            {
              id: 'httpBearer',
              label: 'HTTP Bearer',
              value: { httpBearer: [] },
              payload: {
                type: 'http',
                scheme: 'bearer',
              },
              isDeletable: false,
            },
            {
              id: 'oauth2Implicit',
              label: 'Oauth2 Implicit Flow',
              value: { oauth2Implicit: [] },
              payload: {
                type: 'oauth2',
                flows: {
                  implicit: {
                    authorizationUrl: '',
                    refreshUrl: '',
                    scopes: {},
                  },
                },
              },
              isDeletable: false,
            },
            {
              id: 'oauth2Password',
              label: 'Oauth2 Password Flow',
              value: { oauth2Password: [] },
              payload: {
                type: 'oauth2',
                flows: {
                  password: {
                    tokenUrl: '',
                    refreshUrl: '',
                    scopes: {},
                  },
                },
              },
              isDeletable: false,
            },
            {
              id: 'oauth2ClientCredentials',
              label: 'Oauth2 Client Credentials',
              value: { oauth2ClientCredentials: [] },
              payload: {
                type: 'oauth2',
                flows: {
                  clientCredentials: {
                    tokenUrl: '',
                    refreshUrl: '',
                    scopes: {},
                  },
                },
              },
              isDeletable: false,
            },
            {
              id: 'oauth2AuthorizationFlow',
              label: 'Oauth2 Authorization Code',
              value: { oauth2AuthorizationFlow: [] },
              payload: {
                type: 'oauth2',
                flows: {
                  authorizationCode: {
                    authorizationUrl: '',
                    tokenUrl: '',
                    refreshUrl: '',
                    'x-usePkce': 'no',
                    scopes: {},
                  },
                },
              },
              isDeletable: false,
            },
          ],
        },
      ])
    })

    it('should handle complex security schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [], httpBasic: [] }]
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      const requiredOptions = groups[0]!.options
      expect(requiredOptions).toHaveLength(1)
      expect(requiredOptions[0]!.id).toBe('2d07634ebbbf7f6d')
      expect(requiredOptions[0]!.label).toBe('apiKey & httpBasic')
    })

    it('should handle missing security schemes gracefully', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ nonExistent: [] }]
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // Should filter out undefined schemes
    })

    it('should handle empty security array', () => {
      const security: NonNullable<OpenApiDocument['security']> = []
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // No required schemes
      expect(groups[1]!.options.length).toBeGreaterThan(0) // All schemes available
    })

    it('should handle empty security schemes object', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]
      const result = getSecuritySchemeOptions(security, {}, [])

      const groups = result as SecuritySchemeGroup[]
      expect(groups[0]!.options).toHaveLength(0) // No schemes found
      expect(groups[1]!.options).toHaveLength(0) // No available schemes
    })

    it('should include all auth options in add new section', () => {
      const security: NonNullable<OpenApiDocument['security']> = []
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

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
      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options
      const requiredOptions = groups[0]!.options

      // Available options should not include apiKey since it's required
      expect(availableOptions).toStrictEqual([
        {
          id: '0ebf7bc7501f14c3',
          label: 'httpBasic',
          isDeletable: true,
          value: { httpBasic: [] },
        },
        { id: '48cc5a8ff1d2df93', label: 'oauth2', isDeletable: true, value: { oauth2: [] } },
        {
          id: '8da8c10db72dcac3',
          label: 'openIdConnect (coming soon)',
          isDeletable: true,
          value: { openIdConnect: [] },
        },
      ])

      // Required options should include apiKey
      expect(requiredOptions).toStrictEqual([
        {
          id: 'a4da7d48d8af6c6b',
          label: 'apiKey',
          isDeletable: true,
          value: { apiKey: [] },
        },
      ])
    })

    it('should handle schemes with undefined resolved references', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }]

      // Mock getResolvedRef to return undefined for some schemes
      const securitySchemesWithUndefined = {
        ...securitySchemes,
        undefinedScheme: undefined,
      } as unknown as NonNullable<ComponentsObject['securitySchemes']>

      const result = getSecuritySchemeOptions(security, securitySchemesWithUndefined, [])

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options

      // Should not include undefined schemes
      expect(availableOptions.some((opt) => opt.id === 'undefinedScheme')).toBe(false)
    })

    it('should create proper value objects for available schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      const availableOptions = groups[1]!.options

      expect(availableOptions).toStrictEqual([
        {
          id: 'a4da7d48d8af6c6b',
          label: 'apiKey',
          isDeletable: true,
          value: { apiKey: [] },
        },
        {
          id: '0ebf7bc7501f14c3',
          label: 'httpBasic',
          isDeletable: true,
          value: { httpBasic: [] },
        },
        {
          id: '48cc5a8ff1d2df93',
          label: 'oauth2',
          isDeletable: true,
          value: { oauth2: [] },
        },
        {
          id: '8da8c10db72dcac3',
          label: 'openIdConnect (coming soon)',
          isDeletable: true,
          value: { openIdConnect: [] },
        },
      ])
    })

    it('should create proper value objects for required schemes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [{ apiKey: [] }, { httpBasic: [] }]

      const result = getSecuritySchemeOptions(security, securitySchemes, [])

      const groups = result as SecuritySchemeGroup[]
      const requiredOptions = groups[0]!.options

      expect(requiredOptions[0]!.value).toEqual({ apiKey: [] })
      expect(requiredOptions[1]!.value).toEqual({ httpBasic: [] })
    })

    it('should handle same scheme with different scopes', () => {
      const security: NonNullable<OpenApiDocument['security']> = [
        {
          UserAccessToken: ['read'],
        },
        {
          UserAccessToken: ['write'],
        },
      ]

      const securitySchemes: NonNullable<ComponentsObject['securitySchemes']> = {
        AppAccessToken: {
          type: 'oauth2',
          flows: {
            clientCredentials: {
              tokenUrl: 'https://scalar.com/oauth/token',
              refreshUrl: '',
              scopes: {},
            },
          },
        },
        UserAccessToken: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://scalar.com/oauth/authorize',
              tokenUrl: 'https://scalar.com/oauth/token',
              scopes: {
                read: 'Read',
                write: 'Write',
                delete: 'Delete',
                update: 'Update',
                create: 'Create',
              },
              refreshUrl: '',
              'x-usePkce': 'no',
            },
          },
        },
      }

      const result = getSecuritySchemeOptions(security, securitySchemes, [])
      expect(result[0]).toStrictEqual({
        label: 'Required authentication',
        options: [
          {
            id: '8c854cac163762c9',
            label: 'UserAccessToken',
            isDeletable: true,
            value: { UserAccessToken: ['read'] },
          },
          {
            id: 'f7e1089e69466df6',
            label: 'UserAccessToken',
            isDeletable: true,
            value: { UserAccessToken: ['write'] },
          },
        ],
      })
    })

    it('should handle when selected schemes do not exist in the available options', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const securitySchemes: NonNullable<ComponentsObject['securitySchemes']> = {
        UserAccessToken: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://scalar.com/oauth/authorize',
              tokenUrl: 'https://scalar.com/oauth/token',
              scopes: {
                read: 'Read',
                write: 'Write',
                delete: 'Delete',
                update: 'Update',
                create: 'Create',
              },
              refreshUrl: '',
              'x-usePkce': 'no',
            },
          },
        },
      }

      const selectedSchemes = [
        {
          UserAccessToken: ['read'],
        },
      ]

      const result = getSecuritySchemeOptions(security, securitySchemes, selectedSchemes)
      expect((result[1] as SecuritySchemeGroup).options).toStrictEqual([
        {
          id: '05f6eac51b164030',
          label: 'UserAccessToken',
          isDeletable: true,
          value: { UserAccessToken: [] },
        },
        {
          id: '8c854cac163762c9',
          label: 'UserAccessToken',
          isDeletable: true,
          value: { UserAccessToken: ['read'] },
        },
      ])
    })

    it('should handle when selected schemes do not exist in the available options but not duplicate them', () => {
      const security: NonNullable<OpenApiDocument['security']> = []

      const securitySchemes: NonNullable<ComponentsObject['securitySchemes']> = {
        UserAccessToken: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://scalar.com/oauth/authorize',
              tokenUrl: 'https://scalar.com/oauth/token',
              scopes: {
                read: 'Read',
                write: 'Write',
                delete: 'Delete',
                update: 'Update',
                create: 'Create',
              },
              refreshUrl: '',
              'x-usePkce': 'no',
            },
          },
        },
      }

      const selectedSchemes = [
        {
          UserAccessToken: [],
        },
      ]

      const result = getSecuritySchemeOptions(security, securitySchemes, selectedSchemes)
      expect((result[1] as SecuritySchemeGroup).options).toStrictEqual([
        {
          id: '05f6eac51b164030',
          label: 'UserAccessToken',
          isDeletable: true,
          value: { UserAccessToken: [] },
        },
      ])
    })
  })
})
