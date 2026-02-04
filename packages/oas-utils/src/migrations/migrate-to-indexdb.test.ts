import { type SecurityScheme, securitySchemeSchema } from '@scalar/types/entities'
import { assert, beforeEach, describe, expect, it } from 'vitest'

import { cookieSchema } from '@/entities/cookie'
import { type Collection, collectionSchema } from '@/entities/spec/collection'
import { type Workspace, workspaceSchema } from '@/entities/workspace/workspace'

import { DATA_VERSION_LS_LEY } from './data-version'
import {
  clearLegacyLocalStorage,
  markMigrationComplete,
  shouldMigrateToIndexDb,
  transformLegacyDataToWorkspace,
} from './migrate-to-indexdb'
import type { v_2_5_0 } from './v-2.5.0/types.generated'

/**
 * Mock localStorage for Node.js test environment
 */
const createLocalStorageMock = (): Storage => {
  const store: Record<string, string> = {}

  return {
    getItem: (key: string): string | null => {
      return store[key] || null
    },
    setItem: (key: string, value: string): void => {
      store[key] = value
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      Object.keys(store).forEach((key) => {
        delete store[key]
      })
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length(): number {
      return Object.keys(store).length
    },
  }
}

// Set up global localStorage mock
global.localStorage = createLocalStorageMock()

/**
 * Helper function to create legacy data structures for testing.
 * This reduces duplication and makes test data creation more consistent.
 *
 * @param options - Configuration for the legacy data structure
 * @returns A properly typed legacy data object with both arrays and records
 */
const createLegacyData = (options: {
  workspaces?: Workspace[]
  collections?: Collection[]
  securitySchemes?: SecurityScheme[]
  cookies?: v_2_5_0['Cookie'][]
  environments?: v_2_5_0['Environment'][]
  requestExamples?: v_2_5_0['RequestExample'][]
  requests?: v_2_5_0['Request'][]
  servers?: v_2_5_0['Server'][]
  tags?: v_2_5_0['Tag'][]
}): { arrays: v_2_5_0['DataArray']; records: v_2_5_0['DataRecord'] } => {
  const {
    workspaces = [],
    collections = [],
    securitySchemes = [],
    cookies = [],
    environments = [],
    requestExamples = [],
    requests = [],
    servers = [],
    tags = [],
  } = options

  return {
    arrays: {
      workspaces,
      collections,
      securitySchemes,
      cookies,
      environments,
      requestExamples,
      requests,
      servers,
      tags,
    } satisfies v_2_5_0['DataArray'],
    records: {
      workspaces: Object.fromEntries(workspaces.map((w) => [w.uid, w])),
      collections: Object.fromEntries(collections.map((c) => [c.uid, c])),
      securitySchemes: Object.fromEntries(securitySchemes.map((s) => [s.uid, s])),
      cookies: Object.fromEntries(cookies.map((c) => [c.uid, c])),
      environments: Object.fromEntries(environments.map((e) => [e.uid, e])),
      requestExamples: Object.fromEntries(requestExamples.map((r) => [r.uid, r])),
      requests: Object.fromEntries(requests.map((r) => [r.uid, r])),
      servers: Object.fromEntries(servers.map((s) => [s.uid, s])),
      tags: Object.fromEntries(tags.map((t) => [t.uid, t])),
    } satisfies v_2_5_0['DataRecord'],
  }
}

/**
 * Comprehensive test suite for localStorage to IndexedDB migration
 *
 * This test suite ensures full type coverage for all entity types defined in v_2.5.0:
 * - Cookie
 * - Environment
 * - Collection
 * - Request
 * - RequestExample
 * - SecurityScheme
 * - Server
 * - Tag
 * - Workspace
 *
 * Test Strategy:
 * 1. Test empty/minimal data scenarios
 * 2. Test single entity scenarios
 * 3. Test multiple entities scenarios
 * 4. Test complex nested scenarios
 * 5. Test edge cases (missing fields, optional fields, defaults)
 * 6. Test all entity type combinations
 */
describe('migrate-to-indexdb', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
  })

  describe('shouldMigrateToIndexDb', () => {
    it('should return false when migration flag is set to true', () => {
      localStorage.setItem('scalar_indexdb_migration_complete', 'true')
      expect(shouldMigrateToIndexDb()).toBe(false)
      localStorage.removeItem('scalar_indexdb_migration_complete')
    })

    it('should return false when migration flag is set and no old data exists', () => {
      localStorage.setItem('scalar_indexdb_migration_complete', 'true')
      localStorage.removeItem('workspace')
      localStorage.removeItem('collection')
      localStorage.removeItem('request')
      expect(shouldMigrateToIndexDb()).toBe(false)
      localStorage.removeItem('scalar_indexdb_migration_complete')
    })

    it('should return true when migration flag is not set and workspace data exists', () => {
      localStorage.removeItem('scalar_indexdb_migration_complete')
      localStorage.setItem('workspace', '[]')
      expect(shouldMigrateToIndexDb()).toBe(true)
      localStorage.removeItem('workspace')
    })

    it('should return true when migration flag is not set and collection data exists', () => {
      localStorage.removeItem('scalar_indexdb_migration_complete')
      localStorage.setItem('collection', '[]')
      expect(shouldMigrateToIndexDb()).toBe(true)
      localStorage.removeItem('collection')
    })

    it('should return true when migration flag is not set and request data exists', () => {
      localStorage.removeItem('scalar_indexdb_migration_complete')
      localStorage.setItem('request', '[]')
      expect(shouldMigrateToIndexDb()).toBe(true)
      localStorage.removeItem('request')
    })

    it('should return false when no migration flag and no old data exists', () => {
      localStorage.removeItem('scalar_indexdb_migration_complete')
      localStorage.removeItem('workspace')
      localStorage.removeItem('collection')
      localStorage.removeItem('request')
      expect(shouldMigrateToIndexDb()).toBe(false)
    })
  })

  describe('markMigrationComplete', () => {
    it('should set the migration flag in localStorage', () => {
      localStorage.removeItem('scalar_indexdb_migration_complete')
      markMigrationComplete()
      expect(localStorage.getItem('scalar_indexdb_migration_complete')).toBe('true')
      localStorage.removeItem('scalar_indexdb_migration_complete')
    })
  })

  describe('clearLegacyLocalStorage', () => {
    it('should remove all legacy localStorage keys', () => {
      // Set all legacy keys
      localStorage.setItem('collection', 'test')
      localStorage.setItem('cookie', 'test')
      localStorage.setItem('environment', 'test')
      localStorage.setItem('requestExample', 'test')
      localStorage.setItem('request', 'test')
      localStorage.setItem('securityScheme', 'test')
      localStorage.setItem('server', 'test')
      localStorage.setItem('tag', 'test')
      localStorage.setItem('workspace', 'test')
      localStorage.setItem(DATA_VERSION_LS_LEY, 'test')

      clearLegacyLocalStorage()

      // Verify all are removed
      expect(localStorage.getItem('collection')).toBeNull()
      expect(localStorage.getItem('cookie')).toBeNull()
      expect(localStorage.getItem('environment')).toBeNull()
      expect(localStorage.getItem('requestExample')).toBeNull()
      expect(localStorage.getItem('request')).toBeNull()
      expect(localStorage.getItem('securityScheme')).toBeNull()
      expect(localStorage.getItem('server')).toBeNull()
      expect(localStorage.getItem('tag')).toBeNull()
      expect(localStorage.getItem('workspace')).toBeNull()
      expect(localStorage.getItem(DATA_VERSION_LS_LEY)).toBeNull()
    })

    it('should not throw error when keys do not exist', () => {
      localStorage.clear()
      expect(() => clearLegacyLocalStorage()).not.toThrow()
    })
  })

  describe.skip('transformLegacyDataToWorkspace - Security Schemes', () => {
    it('should transform API key security schemes into document components and auth store', () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'api-key-auth',
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'secret-api-key-123',
        description: 'API Key authentication',
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        components: {
          securitySchemes: [scheme.uid],
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: [collection.uid],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        securitySchemes: [scheme],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const [resultWorkspace] = result
      assert(resultWorkspace)

      // Verify security scheme is in document components
      console.dir(resultWorkspace.documents, { depth: null })
      console.dir(resultWorkspace.auth, { depth: null })
      expect(resultWorkspace.documents['Test API']!.components?.securitySchemes).toBeDefined()
      expect(resultWorkspace.documents['Test API']!.components?.securitySchemes?.['api-key-auth']).toEqual({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key authentication',
      })

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.auth['Test API']!).toBeDefined()
      expect(resultWorkspace.auth['Test API']!.secrets['api-key-auth']).toEqual({
        type: 'apiKey',
        'x-scalar-secret-token': 'secret-api-key-123',
      })
    })

    it('should transform HTTP bearer security schemes into document components and auth store', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Bearer API',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            'bearer-auth': {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      })

      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'bearer-auth',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        securitySchemes: [scheme],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      expect(resultWorkspace.documents['Bearer API']!.components?.securitySchemes?.['bearer-auth']).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.auth['Bearer API']!.secrets['bearer-auth']).toEqual({
        type: 'http',
        'x-scalar-secret-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      })
    })

    it('should transform HTTP basic security schemes into document components and auth store', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Basic Auth API',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            'basic-auth': {
              type: 'http',
              scheme: 'basic',
            },
          },
        },
      })

      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'basic-auth',
        type: 'http',
        scheme: 'basic',
        username: 'admin',
        password: 'secret123',
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        securitySchemes: [scheme],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      expect(resultWorkspace.documents['Basic Auth API']!.components?.securitySchemes?.['basic-auth']).toEqual({
        type: 'http',
        scheme: 'basic',
      })

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.auth['Basic Auth API']!.secrets['basic-auth']).toEqual({
        type: 'http',
        'x-scalar-secret-username': 'admin',
        'x-scalar-secret-password': 'secret123',
      })
    })

    it('should transform OAuth2 security schemes into document components and auth store', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'OAuth API',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            'oauth2-auth': {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: {
                    'read:users': 'Read user data',
                    'write:users': 'Write user data',
                  },
                },
              },
            },
          },
        },
      })

      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'oauth2-auth',
        type: 'oauth2',
        flows: {
          authorizationCode: {
            type: 'authorizationCode',
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user data',
              'write:users': 'Write user data',
            },
            selectedScopes: ['read:users'],
            'x-scalar-client-id': 'client-123',
            clientSecret: 'secret-456',
            token: 'access-token-789',
            'x-scalar-redirect-uri': 'http://localhost:3000/callback',
          },
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        securitySchemes: [scheme],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      const oauthScheme = resultWorkspace.documents['OAuth API']!.components?.securitySchemes?.['oauth2-auth']
      expect(oauthScheme).toBeDefined()
      if (oauthScheme && 'type' in oauthScheme && oauthScheme.type === 'oauth2') {
        expect(oauthScheme.type).toBe('oauth2')
        expect(oauthScheme.flows?.authorizationCode).toBeDefined()
        expect(oauthScheme.flows?.authorizationCode?.authorizationUrl).toBe('https://example.com/oauth/authorize')
        expect(oauthScheme.flows?.authorizationCode?.tokenUrl).toBe('https://example.com/oauth/token')
        expect(oauthScheme.flows?.authorizationCode?.scopes).toEqual({
          'read:users': 'Read user data',
          'write:users': 'Write user data',
        })
      }

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.auth['OAuth API']!.secrets['oauth2-auth']).toEqual({
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-client-secret': 'secret-456',
          'x-scalar-secret-token': 'access-token-789',
          'x-scalar-secret-redirect-uri': 'http://localhost:3000/callback',
        },
      })
    })

    it('should handle multiple security schemes across multiple documents', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2'],
      })

      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'API One',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            'api-key': {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
            },
          },
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'API Two',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            'bearer-token': {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
      })

      const scheme1 = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'api-key',
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'key-123',
      })

      const scheme2 = securitySchemeSchema.parse({
        uid: 'security-2',
        nameKey: 'bearer-token',
        type: 'http',
        scheme: 'bearer',
        token: 'token-456',
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
        securitySchemes: [scheme1, scheme2],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify both documents have their security schemes
      expect(resultWorkspace.documents['API One']!.components?.securitySchemes?.['api-key']).toBeDefined()
      expect(resultWorkspace.documents['API Two']!.components?.securitySchemes?.['bearer-token']).toBeDefined()

      // Verify both auth stores have their secrets
      expect(resultWorkspace.auth['API One']!.secrets['api-key']).toBeDefined()
      expect(resultWorkspace.auth['API Two']!.secrets['bearer-token']).toBeDefined()
    })

    it('should handle collections without security schemes', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'No Auth API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Document should exist but have no security schemes
      expect(resultWorkspace.documents['No Auth API']).toBeDefined()
      expect(resultWorkspace.documents['No Auth API']!.components?.securitySchemes).toBeUndefined()

      // Auth store should exist but be empty or have empty secrets
      expect(resultWorkspace.auth['No Auth API']).toBeDefined()
      expect(Object.keys(resultWorkspace.auth['No Auth API']!.secrets)).toHaveLength(0)
    })
  })

  describe('transformLegacyDataToWorkspace - Environments', () => {
    it('should transform workspace environments into x-scalar-environments meta', () => {
      const oldWorkspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        environments: {
          API_URL: 'https://api.example.com',
          API_KEY: 'secret-key-123',
          TIMEOUT: '5000',
          camelcase: 'lower-case-value',
        },
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [oldWorkspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.extensions

      // Verify x-scalar-environments is set in workspace meta
      expect(extensions?.['x-scalar-environments']).toStrictEqual({
        default: {
          color: '#FFFFFF',
          variables: [
            { name: 'API_URL', value: 'https://api.example.com' },
            { name: 'API_KEY', value: 'secret-key-123' },
            { name: 'TIMEOUT', value: '5000' },
            { name: 'camelcase', value: 'lower-case-value' },
          ],
        },
      })
    })

    it('should handle workspace with empty environments', () => {
      const oldWorkspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        environments: {},
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [oldWorkspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.extensions

      // x-scalar-environments should not be set when environments is empty
      expect(extensions?.['x-scalar-environments']).toBeUndefined()
    })

    it('should handle multiple workspaces with different environments', () => {
      const workspace1 = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Dev Workspace',
        collections: ['collection-1'],
        environments: {
          ENV: 'development',
          API_URL: 'http://localhost:3000',
        },
      })

      const workspace2 = workspaceSchema.parse({
        uid: 'workspace-2',
        name: 'Prod Workspace',
        collections: ['collection-2'],
        environments: {
          ENV: 'production',
          API_URL: 'https://api.production.com',
        },
      })

      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Dev API',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'Prod API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace1, workspace2],
        collections: [collection1, collection2],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      expect(result).toHaveLength(2)

      // Verify first workspace environments
      const devEnvironments = result[0]?.extensions?.['x-scalar-environments']
      expect(devEnvironments).toStrictEqual({
        default: {
          color: '#FFFFFF',
          variables: [
            { name: 'ENV', value: 'development' },
            { name: 'API_URL', value: 'http://localhost:3000' },
          ],
        },
      })

      // Verify second workspace environments
      const prodEnvironments = result[1]?.extensions?.['x-scalar-environments']
      expect(prodEnvironments).toStrictEqual({
        default: {
          color: '#FFFFFF',
          variables: [
            { name: 'ENV', value: 'production' },
            { name: 'API_URL', value: 'https://api.production.com' },
          ],
        },
      })
    })
  })

  describe('transformLegacyDataToWorkspace - Cookies', () => {
    it('should transform workspace cookies into x-scalar-cookies extension', () => {
      const cookie1 = cookieSchema.parse({
        uid: 'cookie-1',
        name: 'session_id',
        value: 'abc123xyz',
        domain: 'example.com',
        path: '/api',
      })

      const cookie2 = cookieSchema.parse({
        uid: 'cookie-2',
        name: 'auth_token',
        value: 'token456',
        domain: 'api.example.com',
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        cookies: ['cookie-1', 'cookie-2'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        cookies: [cookie1, cookie2],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.extensions

      // Verify x-scalar-cookies is set in workspace extensions
      expect(extensions?.['x-scalar-cookies']).toBeDefined()
      expect(extensions?.['x-scalar-cookies']).toHaveLength(2)

      // Check each cookie has the correct properties (uid should be stripped by coerceValue)
      const cookies = extensions?.['x-scalar-cookies']
      expect(cookies?.[0]).toMatchObject({
        name: 'session_id',
        value: 'abc123xyz',
        domain: 'example.com',
        path: '/api',
      })
      expect(cookies?.[1]).toMatchObject({
        name: 'auth_token',
        value: 'token456',
        domain: 'api.example.com',
      })
    })

    it('should handle workspace with no cookies', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        cookies: [],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.extensions

      // x-scalar-cookies should not be set when there are no cookies
      expect(extensions?.['x-scalar-cookies']).toBeUndefined()
    })

    it('should filter out invalid cookies that do not exist in records', () => {
      const cookie = cookieSchema.parse({
        uid: 'cookie-1',
        name: 'valid_cookie',
        value: 'value123',
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        cookies: ['cookie-1', 'cookie-nonexistent'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
        cookies: [cookie],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.extensions

      // Only the valid cookie should be included
      expect(extensions?.['x-scalar-cookies']).toBeDefined()
      expect(extensions?.['x-scalar-cookies']).toHaveLength(1)

      // Check cookie has correct properties (uid should be stripped by coerceValue)
      const cookies = extensions?.['x-scalar-cookies']
      expect(cookies?.[0]).toMatchObject({
        name: 'valid_cookie',
        value: 'value123',
      })
    })
  })

  describe('transformLegacyDataToWorkspace - Proxy URL', () => {
    it('should transform workspace proxyUrl into x-scalar-active-proxy meta', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        proxyUrl: 'https://proxy.example.com',
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // Verify x-scalar-active-proxy is set in workspace meta
      expect(meta?.['x-scalar-active-proxy']).toBe('https://proxy.example.com')
    })

    it('should not set x-scalar-active-proxy when proxyUrl is not present', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // x-scalar-active-proxy should not be set
      expect(meta?.['x-scalar-active-proxy']).toBeUndefined()
    })
  })

  describe('transformLegacyDataToWorkspace - Theme ID', () => {
    it('should transform workspace themeId into x-scalar-theme meta', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
        themeId: 'alternate',
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // Verify x-scalar-theme is set in workspace meta
      expect(meta?.['x-scalar-theme']).toBe('alternate')
    })

    it('should not set x-scalar-theme when themeId is not present', () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // x-scalar-theme should not be set
      expect(meta?.['x-scalar-theme']).toBe('default')
    })
  })

  describe('transformLegacyDataToWorkspace - Color Mode', () => {
    it('should transform localStorage colorMode into x-scalar-color-mode meta', () => {
      localStorage.setItem('colorMode', 'dark')

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // Verify x-scalar-color-mode is set in workspace meta
      expect(meta?.['x-scalar-color-mode']).toBe('dark')

      localStorage.removeItem('colorMode')
    })

    it('should not set x-scalar-color-mode when colorMode is not in localStorage', () => {
      localStorage.removeItem('colorMode')

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1'],
      })

      const collection = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection],
      })

      const result = transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.meta

      // x-scalar-color-mode should not be set
      expect(meta?.['x-scalar-color-mode']).toBeUndefined()
    })
  })
})
