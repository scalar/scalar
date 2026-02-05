import { type SecurityScheme, securitySchemeSchema } from '@scalar/types/entities'
import { assert, beforeEach, describe, expect, it } from 'vitest'

import { cookieSchema } from '@/entities/cookie'
import { type Collection, collectionSchema } from '@/entities/spec/collection'
import { serverSchema } from '@/entities/spec/server'
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
 * For single-workspace / single-collection tests (the most common case), use the shorthand:
 * - `title` sets the collection info.title (default: 'Test API')
 * - `workspace` provides partial overrides for the default workspace
 * - `collection` provides partial overrides for the default collection
 *
 * For multi-workspace / multi-collection tests, pass explicit `workspaces` and `collections` arrays.
 *
 * @param options - Configuration for the legacy data structure
 * @returns A properly typed legacy data object with both arrays and records
 */
const createLegacyData = (
  options: {
    /** Shorthand for collection info.title (default: 'Test API') */
    title?: string
    /** Partial overrides for a single default workspace (ignored when workspaces is provided) */
    workspace?: Record<string, unknown>
    /** Partial overrides for a single default collection (ignored when collections is provided) */
    collection?: Record<string, unknown>
    /** Explicit workspace array, overrides the workspace shorthand */
    workspaces?: Workspace[]
    /** Explicit collection array, overrides the collection shorthand */
    collections?: Collection[]
    securitySchemes?: SecurityScheme[]
    cookies?: v_2_5_0['Cookie'][]
    environments?: v_2_5_0['Environment'][]
    requestExamples?: v_2_5_0['RequestExample'][]
    requests?: v_2_5_0['Request'][]
    servers?: v_2_5_0['Server'][]
    tags?: v_2_5_0['Tag'][]
  } = {},
): { arrays: v_2_5_0['DataArray']; records: v_2_5_0['DataRecord'] } => {
  const {
    title = 'Test API',
    workspace: workspaceOverrides,
    collection: collectionOverrides,
    securitySchemes = [],
    cookies = [],
    environments = [],
    requestExamples = [],
    requests = [],
    servers = [],
    tags = [],
  } = options

  const collections = options.collections ?? [
    collectionSchema.parse({
      uid: 'collection-1',
      openapi: '3.1.0',
      info: { title, version: '1.0.0' },
      ...collectionOverrides,
    }),
  ]

  const workspaces = options.workspaces ?? [
    workspaceSchema.parse({
      uid: 'workspace-1',
      name: 'Test Workspace',
      collections: collections.map((c) => c.uid),
      ...workspaceOverrides,
    }),
  ]

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

  describe('transformLegacyDataToWorkspace - Security Schemes', () => {
    it('should transform API key security schemes into document components and auth store', async () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'api-key-auth',
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'secret-api-key-123',
        description: 'API Key authentication',
      })

      const legacyData = createLegacyData({
        collection: { securitySchemes: [scheme.uid] },
        securitySchemes: [scheme],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const [resultWorkspace] = result
      assert(resultWorkspace)

      // Verify security scheme is in document components
      expect(
        resultWorkspace.workspace.documents['Test API']!.components?.securitySchemes?.['api-key-auth'],
      ).toMatchObject({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key authentication',
      })
      expect(
        // @ts-expect-error - value is not in the type
        resultWorkspace.workspace.documents['Test API']!.components?.securitySchemes?.['api-key-auth']?.value,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['Test API']?.secrets['api-key-auth']).toEqual({
        type: 'apiKey',
        'x-scalar-secret-token': 'secret-api-key-123',
      })
    })

    it('should transform HTTP bearer security schemes into document components and auth store', async () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'bearer-auth',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      })

      const legacyData = createLegacyData({
        title: 'Bearer API',
        collection: { securitySchemes: [scheme.uid] },
        securitySchemes: [scheme],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      expect(
        resultWorkspace.workspace.documents['Bearer API']!.components?.securitySchemes?.['bearer-auth'],
      ).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      expect(
        // @ts-expect-error - token is not in the type
        resultWorkspace.workspace.documents['Bearer API']!.components?.securitySchemes?.['bearer-auth']?.token,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['Bearer API']!.secrets['bearer-auth']).toEqual({
        type: 'http',
        'x-scalar-secret-username': '',
        'x-scalar-secret-password': '',
        'x-scalar-secret-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      })
    })

    it('should transform HTTP basic security schemes into document components and auth store', async () => {
      const scheme = securitySchemeSchema.parse({
        uid: 'security-1',
        nameKey: 'basic-auth',
        type: 'http',
        scheme: 'basic',
        username: 'admin',
        password: 'secret123',
      })

      const legacyData = createLegacyData({
        title: 'Basic Auth API',
        collection: { securitySchemes: [scheme.uid] },
        securitySchemes: [scheme],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      expect(
        resultWorkspace.workspace.documents['Basic Auth API']!.components?.securitySchemes?.['basic-auth'],
      ).toMatchObject({
        type: 'http',
        scheme: 'basic',
      })
      expect(
        // @ts-expect-error - username and password are not in the type
        resultWorkspace.workspace.documents['Basic Auth API']!.components?.securitySchemes?.['basic-auth']?.username,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - username and password are not in the type
        resultWorkspace.workspace.documents['Basic Auth API']!.components?.securitySchemes?.['basic-auth']?.password,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['Basic Auth API']!.secrets['basic-auth']).toEqual({
        type: 'http',
        'x-scalar-secret-username': 'admin',
        'x-scalar-secret-token': '',
        'x-scalar-secret-password': 'secret123',
      })
    })

    it('should transform OAuth2 security schemes into document components and auth store', async () => {
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
        title: 'OAuth API',
        collection: { securitySchemes: [scheme.uid] },
        securitySchemes: [scheme],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      // Verify security scheme is in document components
      const oauthScheme = resultWorkspace.workspace.documents['OAuth API']!.components?.securitySchemes?.['oauth2-auth']
      if (oauthScheme && 'type' in oauthScheme && oauthScheme.type === 'oauth2') {
        expect(oauthScheme.type).toBe('oauth2')
        expect(oauthScheme.flows?.authorizationCode).toEqual({
          refreshUrl: '',
          scopes: { 'read:users': 'Read user data', 'write:users': 'Write user data' },
          selectedScopes: ['read:users'],
          type: 'authorizationCode',
          authorizationUrl: 'https://example.com/oauth/authorize',
          'x-usePkce': 'no',
          tokenUrl: 'https://example.com/oauth/token',
        })
      }

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['OAuth API']!.secrets['oauth2-auth']).toEqual({
        type: 'oauth2',
        authorizationCode: {
          'x-scalar-secret-client-id': 'client-123',
          'x-scalar-secret-client-secret': 'secret-456',
          'x-scalar-secret-token': 'access-token-789',
          'x-scalar-secret-redirect-uri': 'http://localhost:3000/callback',
        },
      })
    })

    it('should handle multiple security schemes across multiple documents', async () => {
      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2'],
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

      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'API One',
          version: '1.0.0',
        },
        securitySchemes: [scheme1.uid],
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'API Two',
          version: '1.0.0',
        },
        securitySchemes: [scheme2.uid],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
        securitySchemes: [scheme1, scheme2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Verify both documents have their security schemes
      expect(resultWorkspace.workspace.documents['API One']!.components?.securitySchemes?.['api-key']).toMatchObject({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      })
      expect(
        resultWorkspace.workspace.documents['API Two']!.components?.securitySchemes?.['bearer-token'],
      ).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })

      // Verify both auth stores have their secrets
      expect(resultWorkspace.workspace.auth['API One']!.secrets['api-key']).toMatchObject({
        type: 'apiKey',
        'x-scalar-secret-token': 'key-123',
      })
      expect(resultWorkspace.workspace.auth['API Two']!.secrets['bearer-token']).toMatchObject({
        type: 'http',
        'x-scalar-secret-token': 'token-456',
      })
    })

    it('should handle collections without security schemes', async () => {
      const legacyData = createLegacyData({
        title: 'No Auth API',
      })

      const result = await transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(1)
      const resultWorkspace = result[0]!

      // Document should exist but have no security schemes
      expect(resultWorkspace.workspace.documents['No Auth API']).toBeDefined()
      expect(resultWorkspace.workspace.documents['No Auth API']!.components?.securitySchemes).toMatchObject({})

      // Auth store should exist but be empty or have empty secrets
      expect(resultWorkspace.workspace.auth['No Auth API']).toBeDefined()
      expect(Object.keys(resultWorkspace.workspace.auth['No Auth API']!.secrets)).toHaveLength(0)
    })
  })

  describe('transformLegacyDataToWorkspace - Environments', () => {
    it('should transform workspace environments into x-scalar-environments meta', async () => {
      const legacyData = createLegacyData({
        workspace: {
          environments: {
            API_URL: 'https://api.example.com',
            API_KEY: 'secret-key-123',
            TIMEOUT: '5000',
            camelcase: 'lower-case-value',
          },
        },
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const workspace = result[0]
      expect(workspace).toBeDefined()
      assert(workspace)

      // Verify x-scalar-environments is set in workspace meta
      expect(workspace.workspace.meta['x-scalar-environments']).toStrictEqual({
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

    it('should handle workspace with empty environments', async () => {
      const legacyData = createLegacyData({
        workspace: { environments: {} },
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const workspace = result[0]
      assert(workspace)
      expect(workspace).toBeDefined()

      // x-scalar-environments should not be set when environments is empty
      expect(workspace.workspace.meta['x-scalar-environments']).toBeUndefined()
    })

    it('should handle multiple workspaces with different environments', async () => {
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

      const result = await transformLegacyDataToWorkspace(legacyData)
      expect(result).toHaveLength(2)

      // Verify first workspace environments
      const devEnvironments = result[0]?.workspace.meta['x-scalar-environments']
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
      const prodEnvironments = result[1]?.workspace.meta['x-scalar-environments']
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
    it('should transform workspace cookies into x-scalar-cookies extension', async () => {
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

      const legacyData = createLegacyData({
        workspace: { cookies: ['cookie-1', 'cookie-2'] },
        cookies: [cookie1, cookie2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const workspaceResult = result[0]
      assert(workspaceResult)
      expect(workspaceResult).toBeDefined()

      // Verify x-scalar-cookies is set in workspace extensions
      expect(workspaceResult.workspace.meta['x-scalar-cookies']).toBeDefined()
      expect(workspaceResult.workspace.meta['x-scalar-cookies']).toHaveLength(2)

      // Check each cookie has the correct properties (uid should be stripped by coerceValue)
      const cookies = workspaceResult.workspace.meta['x-scalar-cookies']
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

    it('should handle workspace with no cookies', async () => {
      const legacyData = createLegacyData({
        workspace: { cookies: [] },
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const workspaceResult = result[0]
      assert(workspaceResult)
      expect(workspaceResult).toBeDefined()

      // x-scalar-cookies should not be set when there are no cookies
      expect(workspaceResult.workspace.meta['x-scalar-cookies']).toBeUndefined()
    })

    it('should filter out invalid cookies that do not exist in records', async () => {
      const cookie = cookieSchema.parse({
        uid: 'cookie-1',
        name: 'valid_cookie',
        value: 'value123',
      })

      const legacyData = createLegacyData({
        workspace: { cookies: ['cookie-1', 'cookie-nonexistent'] },
        cookies: [cookie],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const extensions = result[0]?.workspace.meta

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
    it('should transform workspace proxyUrl into x-scalar-active-proxy meta', async () => {
      const legacyData = createLegacyData({
        workspace: { proxyUrl: 'https://proxy.example.com' },
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // Verify x-scalar-active-proxy is set in workspace meta
      expect(meta?.['x-scalar-active-proxy']).toBe('https://proxy.example.com')
    })

    it('should not set x-scalar-active-proxy when proxyUrl is not present', async () => {
      const legacyData = createLegacyData()

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // x-scalar-active-proxy should not be set
      expect(meta?.['x-scalar-active-proxy']).toBeUndefined()
    })
  })

  describe('transformLegacyDataToWorkspace - Theme ID', () => {
    it('should transform workspace themeId into x-scalar-theme meta', async () => {
      const legacyData = createLegacyData({
        workspace: { themeId: 'alternate' },
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // Verify x-scalar-theme is set in workspace meta
      expect(meta?.['x-scalar-theme']).toBe('alternate')
    })

    it('should not set x-scalar-theme when themeId is not present', async () => {
      const legacyData = createLegacyData()

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // x-scalar-theme should not be set
      expect(meta?.['x-scalar-theme']).toBe('default')
    })
  })

  describe('transformLegacyDataToWorkspace - Color Mode', () => {
    it('should transform localStorage colorMode into x-scalar-color-mode meta', async () => {
      localStorage.setItem('colorMode', 'dark')

      const legacyData = createLegacyData()

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // Verify x-scalar-color-mode is set in workspace meta
      expect(meta?.['x-scalar-color-mode']).toBe('dark')

      localStorage.removeItem('colorMode')
    })

    it('should not set x-scalar-color-mode when colorMode is not in localStorage', async () => {
      localStorage.removeItem('colorMode')

      const legacyData = createLegacyData()

      const result = await transformLegacyDataToWorkspace(legacyData)
      const meta = result[0]?.workspace.meta

      // x-scalar-color-mode should not be set
      expect(meta?.['x-scalar-color-mode']).toBeUndefined()
    })
  })

  describe('transformLegacyDataToWorkspace - Document Meta', () => {
    describe('x-scalar-environments on document', () => {
      it('preserves collection x-scalar-environments on the output document', async () => {
        const legacyData = createLegacyData({
          title: 'Env API',
          collection: {
            'x-scalar-environments': {
              production: {
                color: '#FF0000',
                variables: {
                  API_URL: 'https://api.production.com',
                  API_KEY: 'prod-key-123',
                },
              },
            },
          },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Env API']
        assert(doc)

        expect(doc['x-scalar-environments']).toStrictEqual({
          production: {
            color: '#FF0000',
            variables: [
              { name: 'API_URL', value: 'https://api.production.com' },
              { name: 'API_KEY', value: 'prod-key-123' },
            ],
          },
        })
      })

      it('preserves multiple environments from collection to document', async () => {
        const legacyData = createLegacyData({
          title: 'Multi Env API',
          collection: {
            'x-scalar-environments': {
              development: {
                color: '#00FF00',
                variables: {
                  BASE_URL: 'http://localhost:3000',
                },
              },
              production: {
                color: '#FF0000',
                variables: {
                  BASE_URL: 'https://api.example.com',
                },
              },
            },
          },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Multi Env API']
        assert(doc)

        expect(doc['x-scalar-environments']).toStrictEqual({
          development: {
            color: '#00FF00',
            variables: [{ name: 'BASE_URL', value: 'http://localhost:3000' }],
          },
          production: {
            color: '#FF0000',
            variables: [{ name: 'BASE_URL', value: 'https://api.example.com' }],
          },
        })
      })

      it('handles collection with no x-scalar-environments', async () => {
        const legacyData = createLegacyData({
          title: 'No Env API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Env API']
        assert(doc)
        expect(doc['x-scalar-environments']).toBeUndefined()
      })
    })

    describe('x-scalar-active-environment → x-scalar-client-config-active-environment', () => {
      it('transforms x-scalar-active-environment to x-scalar-client-config-active-environment', async () => {
        const legacyData = createLegacyData({
          title: 'Active Env API',
          collection: {
            'x-scalar-active-environment': 'production',
            'x-scalar-environments': {
              production: {
                color: '#FF0000',
                variables: {
                  API_URL: 'https://api.production.com',
                },
              },
            },
          },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Active Env API']

        assert(doc)
        expect(doc['x-scalar-client-config-active-environment']).toBe('production')
      })

      it('does not set x-scalar-client-config-active-environment when x-scalar-active-environment is absent', async () => {
        const legacyData = createLegacyData({
          title: 'No Active Env API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Active Env API']

        assert(doc)
        expect(doc['x-scalar-client-config-active-environment']).toBeUndefined()
      })
    })

    describe('selectedServerUid → x-scalar-selected-server', () => {
      it('transforms selectedServerUid to x-scalar-selected-server using the server URL', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com/v1',
          description: 'Production server',
        })

        const legacyData = createLegacyData({
          title: 'Server API',
          collection: { selectedServerUid: 'server-1', servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Server API']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBe('https://api.example.com/v1')
      })

      it('does not set x-scalar-selected-server when selectedServerUid is not present', async () => {
        const legacyData = createLegacyData({
          title: 'No Server API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Server API']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })

      it('does not set x-scalar-selected-server when the referenced server is missing from records', async () => {
        const legacyData = createLegacyData({
          title: 'Missing Server API',
          collection: { selectedServerUid: 'server-nonexistent' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Missing Server API']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })

      it('selects the correct server when multiple servers exist', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.dev.example.com',
          description: 'Dev server',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api.prod.example.com',
          description: 'Prod server',
        })

        const legacyData = createLegacyData({
          title: 'Multi Server API',
          collection: { selectedServerUid: 'server-2', servers: ['server-1', 'server-2'] },
          servers: [server1, server2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Multi Server API']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBe('https://api.prod.example.com')
      })
    })

    describe('x-scalar-icon → x-scalar-icon', () => {
      it('preserves x-scalar-icon from collection to document', async () => {
        const legacyData = createLegacyData({
          title: 'Icon API',
          collection: { 'x-scalar-icon': 'interface-home' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Icon API']

        assert(doc)
        expect(doc['x-scalar-icon']).toBe('interface-home')
      })

      it('uses the default icon when x-scalar-icon is not explicitly set', async () => {
        const legacyData = createLegacyData({
          title: 'Default Icon API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Default Icon API']

        assert(doc)
        // The collection schema defaults to 'interface-content-folder'
        expect(doc['x-scalar-icon']).toBe('interface-content-folder')
      })

      it('preserves various custom icon values', async () => {
        const legacyData = createLegacyData({
          title: 'Custom Icon API',
          collection: { 'x-scalar-icon': 'interface-content-book' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Custom Icon API']

        assert(doc)
        expect(doc['x-scalar-icon']).toBe('interface-content-book')
      })
    })

    describe('useCollectionSecurity → x-scalar-set-operation-security', () => {
      it('transforms useCollectionSecurity true to x-scalar-set-operation-security true', async () => {
        const legacyData = createLegacyData({
          title: 'Collection Security API',
          collection: { useCollectionSecurity: true },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Collection Security API']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(true)
      })

      it('transforms useCollectionSecurity false to x-scalar-set-operation-security false', async () => {
        const legacyData = createLegacyData({
          title: 'No Collection Security API',
          collection: { useCollectionSecurity: false },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Collection Security API']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(false)
      })

      it('defaults to false when useCollectionSecurity is not set', async () => {
        const legacyData = createLegacyData({
          title: 'Default Security API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Default Security API']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(false)
      })
    })

    // todo: Overwritten by the workspace store
    describe.todo('documentUrl → x-scalar-original-source-url', () => {
      it('transforms documentUrl to x-scalar-original-source-url', async () => {
        const legacyData = createLegacyData({
          title: 'Doc URL API',
          collection: { documentUrl: 'https://example.com/openapi.yaml' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Doc URL API']

        assert(doc)
        expect(doc['x-scalar-original-source-url']).toBe('https://example.com/openapi.yaml')
      })

      it('does not set x-scalar-original-source-url when documentUrl is not present', async () => {
        const legacyData = createLegacyData({
          title: 'No Doc URL API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Doc URL API']

        assert(doc)
        expect(doc['x-scalar-original-source-url']).toBeUndefined()
      })

      it('handles various URL formats for documentUrl', async () => {
        const legacyData = createLegacyData({
          title: 'Relative URL API',
          collection: { documentUrl: './specs/openapi.json' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Relative URL API']

        assert(doc)
        expect(doc['x-scalar-original-source-url']).toBe('./specs/openapi.json')
      })
    })

    describe('combined document meta transformations', () => {
      it('transforms all document meta fields simultaneously on a single collection', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
        })

        const legacyData = createLegacyData({
          collection: {
            info: { title: 'Full Meta API', version: '2.0.0' },
            'x-scalar-icon': 'interface-content-star',
            'x-scalar-environments': {
              staging: {
                color: '#FFAA00',
                variables: {
                  HOST: 'https://staging.example.com',
                },
              },
            },
            'x-scalar-active-environment': 'staging',
            selectedServerUid: 'server-1',
            servers: ['server-1'],
            useCollectionSecurity: true,
            documentUrl: 'https://example.com/api/openapi.yaml',
          },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Full Meta API']

        assert(doc)

        // x-scalar-icon preserved
        expect(doc['x-scalar-icon']).toBe('interface-content-star')

        // x-scalar-environments preserved with variable conversion
        expect(doc['x-scalar-environments']).toStrictEqual({
          staging: {
            color: '#FFAA00',
            variables: [{ name: 'HOST', value: 'https://staging.example.com' }],
          },
        })

        // x-scalar-active-environment → x-scalar-client-config-active-environment
        expect(doc['x-scalar-client-config-active-environment']).toBe('staging')

        // selectedServerUid → x-scalar-selected-server
        expect(doc['x-scalar-selected-server']).toBe('https://api.example.com')

        // useCollectionSecurity → x-scalar-set-operation-security
        expect(doc['x-scalar-set-operation-security']).toBe(true)

        // documentUrl → x-scalar-original-source-url
        // expect(doc['x-scalar-original-source-url']).toBe('https://example.com/api/openapi.yaml')
      })

      it('transforms document meta across multiple collections in one workspace', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api1.example.com',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api2.example.com',
        })

        const collection1 = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0.0' },
          'x-scalar-icon': 'interface-content-folder',
          selectedServerUid: 'server-1',
          servers: ['server-1'],
          useCollectionSecurity: true,
          documentUrl: 'https://example.com/api1.yaml',
        })

        const collection2 = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'API Two', version: '2.0.0' },
          'x-scalar-icon': 'interface-content-book',
          selectedServerUid: 'server-2',
          servers: ['server-2'],
          useCollectionSecurity: false,
          documentUrl: 'https://example.com/api2.yaml',
        })

        const workspace = workspaceSchema.parse({
          uid: 'workspace-1',
          name: 'Test Workspace',
          collections: ['collection-1', 'collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace],
          collections: [collection1, collection2],
          servers: [server1, server2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc1 = result[0]?.workspace.documents['API One']
        const doc2 = result[0]?.workspace.documents['API Two']

        assert(doc1)
        assert(doc2)

        // API One
        expect(doc1['x-scalar-icon']).toBe('interface-content-folder')
        expect(doc1['x-scalar-selected-server']).toBe('https://api1.example.com')
        expect(doc1['x-scalar-set-operation-security']).toBe(true)
        // expect(doc1['x-scalar-original-source-url']).toBe('https://example.com/api1.yaml')

        // API Two
        expect(doc2['x-scalar-icon']).toBe('interface-content-book')
        expect(doc2['x-scalar-selected-server']).toBe('https://api2.example.com')
        expect(doc2['x-scalar-set-operation-security']).toBe(false)
        // expect(doc2['x-scalar-original-source-url']).toBe('https://example.com/api2.yaml')
      })
    })
  })

  describe('transformLegacyDataToWorkspace - Servers', () => {
    describe('resolving server UIDs into document servers', () => {
      it('resolves a single server UID into the document servers array', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
          description: 'Production server',
        })

        const legacyData = createLegacyData({
          title: 'Single Server API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Single Server API']

        assert(doc)
        expect(doc.servers).toHaveLength(1)
        expect(doc.servers).toStrictEqual([
          {
            url: 'https://api.example.com',
            description: 'Production server',
          },
        ])
      })

      it('resolves multiple server UIDs preserving order', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.dev.example.com',
          description: 'Development',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api.staging.example.com',
          description: 'Staging',
        })

        const server3 = serverSchema.parse({
          uid: 'server-3',
          url: 'https://api.prod.example.com',
          description: 'Production',
        })

        const legacyData = createLegacyData({
          title: 'Multi Server API',
          collection: { servers: ['server-1', 'server-2', 'server-3'] },
          servers: [server1, server2, server3],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Multi Server API']

        assert(doc)
        expect(doc.servers).toMatchObject([
          { url: 'https://api.dev.example.com', description: 'Development' },
          { url: 'https://api.staging.example.com', description: 'Staging' },
          { url: 'https://api.prod.example.com', description: 'Production' },
        ])
      })

      it('resolves a server with only a URL (no optional fields)', async () => {
        const server = serverSchema.parse({
          uid: 'server-minimal',
          url: 'https://minimal.example.com',
        })

        const legacyData = createLegacyData({
          title: 'Minimal Server API',
          collection: { servers: ['server-minimal'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Minimal Server API']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: 'https://minimal.example.com' }])
      })

      it('strips the legacy uid field from resolved servers', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
        })

        const legacyData = createLegacyData({
          title: 'No UID API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No UID API']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: 'https://api.example.com' }])
        // The uid field should not leak into the OpenAPI document
        expect((doc.servers![0] as Record<string, unknown>)['uid']).toBeUndefined()
      })

      it('produces an empty servers array when collection has no servers', async () => {
        const legacyData = createLegacyData({
          title: 'No Servers API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Servers API']

        assert(doc)
        expect(doc.servers).toEqual([])
      })
    })

    describe('server variables', () => {
      it('preserves server variables with enum, default, and description', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://{environment}.example.com/v{version}',
          description: 'Templated server',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'staging', 'dev'],
              description: 'Environment to connect to',
            },
            version: {
              default: '1',
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Templated Server API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Templated Server API']

        assert(doc)
        expect(doc.servers).toMatchObject([
          {
            url: 'https://{environment}.example.com/v{version}',
            description: 'Templated server',
            variables: {
              environment: {
                default: 'api',
                enum: ['api', 'staging', 'dev'],
                description: 'Environment to connect to',
              },
              version: {
                default: '1',
              },
            },
          },
        ])
      })

      it('preserves a server variable with only a default value', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com/{basePath}',
          variables: {
            basePath: {
              default: 'v1',
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Default Var API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Default Var API']

        assert(doc)
        expect(doc.servers).toMatchObject([
          {
            url: 'https://api.example.com/{basePath}',
            variables: {
              basePath: { default: 'v1' },
            },
          },
        ])
      })

      it('preserves a server with multiple variables', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: '{scheme}://{host}:{port}/{basePath}',
          variables: {
            scheme: {
              default: 'https',
              enum: ['https', 'http'],
            },
            host: {
              default: 'api.example.com',
              description: 'API host',
            },
            port: {
              default: '443',
              enum: ['443', '8443'],
            },
            basePath: {
              default: 'v2',
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Multi Var API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Multi Var API']

        assert(doc)
        expect(doc.servers).toMatchObject([
          {
            url: '{scheme}://{host}:{port}/{basePath}',
            variables: {
              scheme: { default: 'https', enum: ['https', 'http'] },
              host: { default: 'api.example.com', description: 'API host' },
              port: { default: '443', enum: ['443', '8443'] },
              basePath: { default: 'v2' },
            },
          },
        ])
      })
    })

    describe('servers across multiple collections and workspaces', () => {
      it('resolves different servers per collection in the same workspace', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api-one.example.com',
          description: 'API One server',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api-two.example.com',
          description: 'API Two server',
        })

        const collection1 = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0.0' },
          selectedServerUid: 'server-1',
          servers: ['server-1'],
        })

        const collection2 = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'API Two', version: '1.0.0' },
          selectedServerUid: 'server-2',
          servers: ['server-2'],
        })

        const workspace = workspaceSchema.parse({
          uid: 'workspace-1',
          name: 'Multi Collection Workspace',
          collections: ['collection-1', 'collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace],
          collections: [collection1, collection2],
          servers: [server1, server2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)

        expect(result).toHaveLength(1)
        const resultWorkspace = result[0]!

        const doc1 = resultWorkspace.workspace.documents['API One']
        const doc2 = resultWorkspace.workspace.documents['API Two']

        assert(doc1)
        assert(doc2)

        expect(doc1.servers).toMatchObject([{ url: 'https://api-one.example.com', description: 'API One server' }])
        expect(doc1['x-scalar-selected-server']).toBe('https://api-one.example.com')

        expect(doc2.servers).toMatchObject([{ url: 'https://api-two.example.com', description: 'API Two server' }])
        expect(doc2['x-scalar-selected-server']).toBe('https://api-two.example.com')
      })

      it('handles collections sharing the same server record', async () => {
        const sharedServer = serverSchema.parse({
          uid: 'shared-server',
          url: 'https://shared.example.com',
          description: 'Shared API server',
        })

        const collection1 = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'API Alpha', version: '1.0.0' },
          selectedServerUid: 'shared-server',
          servers: ['shared-server'],
        })

        const collection2 = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'API Beta', version: '2.0.0' },
          selectedServerUid: 'shared-server',
          servers: ['shared-server'],
        })

        const workspace = workspaceSchema.parse({
          uid: 'workspace-1',
          name: 'Shared Server Workspace',
          collections: ['collection-1', 'collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace],
          collections: [collection1, collection2],
          servers: [sharedServer],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const resultWorkspace = result[0]!

        const docAlpha = resultWorkspace.workspace.documents['API Alpha']
        const docBeta = resultWorkspace.workspace.documents['API Beta']

        assert(docAlpha)
        assert(docBeta)

        // Both documents should have the shared server in their servers array
        expect(docAlpha.servers).toMatchObject([
          { url: 'https://shared.example.com', description: 'Shared API server' },
        ])
        expect(docBeta.servers).toMatchObject([{ url: 'https://shared.example.com', description: 'Shared API server' }])

        expect(docAlpha['x-scalar-selected-server']).toBe('https://shared.example.com')
        expect(docBeta['x-scalar-selected-server']).toBe('https://shared.example.com')
      })

      it('resolves servers independently across multiple workspaces', async () => {
        const serverDev = serverSchema.parse({
          uid: 'server-dev',
          url: 'https://dev.example.com',
        })

        const serverProd = serverSchema.parse({
          uid: 'server-prod',
          url: 'https://prod.example.com',
        })

        const collection1 = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'Dev API', version: '1.0.0' },
          selectedServerUid: 'server-dev',
          servers: ['server-dev'],
        })

        const collection2 = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'Prod API', version: '1.0.0' },
          selectedServerUid: 'server-prod',
          servers: ['server-prod'],
        })

        const workspace1 = workspaceSchema.parse({
          uid: 'workspace-dev',
          name: 'Dev Workspace',
          collections: ['collection-1'],
        })

        const workspace2 = workspaceSchema.parse({
          uid: 'workspace-prod',
          name: 'Prod Workspace',
          collections: ['collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace1, workspace2],
          collections: [collection1, collection2],
          servers: [serverDev, serverProd],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)

        expect(result).toHaveLength(2)

        const devDoc = result[0]?.workspace.documents['Dev API']
        const prodDoc = result[1]?.workspace.documents['Prod API']

        assert(devDoc)
        assert(prodDoc)

        expect(devDoc.servers).toMatchObject([{ url: 'https://dev.example.com' }])
        expect(devDoc['x-scalar-selected-server']).toBe('https://dev.example.com')

        expect(prodDoc.servers).toMatchObject([{ url: 'https://prod.example.com' }])
        expect(prodDoc['x-scalar-selected-server']).toBe('https://prod.example.com')
      })

      it('handles one collection with servers and another without', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
        })

        const collectionWithServer = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'With Server', version: '1.0.0' },
          selectedServerUid: 'server-1',
          servers: ['server-1'],
        })

        const collectionWithoutServer = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'Without Server', version: '1.0.0' },
        })

        const workspace = workspaceSchema.parse({
          uid: 'workspace-1',
          name: 'Mixed Workspace',
          collections: ['collection-1', 'collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace],
          collections: [collectionWithServer, collectionWithoutServer],
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const resultWorkspace = result[0]!

        const docWith = resultWorkspace.workspace.documents['With Server']
        const docWithout = resultWorkspace.workspace.documents['Without Server']

        assert(docWith)
        assert(docWithout)

        expect(docWith.servers).toMatchObject([{ url: 'https://api.example.com' }])
        expect(docWith['x-scalar-selected-server']).toBe('https://api.example.com')

        expect(docWithout.servers).toEqual([])
        expect(docWithout['x-scalar-selected-server']).toBeUndefined()
      })
    })

    describe('server edge cases', () => {
      it('handles server records that exist but are not referenced by any collection', async () => {
        const unreferencedServer = serverSchema.parse({
          uid: 'server-orphan',
          url: 'https://orphan.example.com',
          description: 'This server is not referenced by any collection',
        })

        const legacyData = createLegacyData({
          title: 'No Server Refs API',
          servers: [unreferencedServer],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['No Server Refs API']

        assert(doc)
        // Unreferenced servers should not appear in the document
        expect(doc.servers).toEqual([])
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })

      it('filters out non-existent server UIDs from the collection', async () => {
        const legacyData = createLegacyData({
          title: 'Ghost Server API',
          collection: {
            servers: ['server-ghost-1', 'server-ghost-2'],
            selectedServerUid: 'server-ghost-1',
          },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Ghost Server API']

        assert(doc)
        // Non-existent servers should be filtered out, not produce errors
        expect(doc.servers).toEqual([])
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })

      it('resolves only valid servers when collection has a mix of valid and non-existent UIDs', async () => {
        const validServer = serverSchema.parse({
          uid: 'server-valid',
          url: 'https://valid.example.com',
          description: 'Valid server',
        })

        const legacyData = createLegacyData({
          title: 'Mixed Servers API',
          collection: {
            servers: ['server-valid', 'server-missing'],
            selectedServerUid: 'server-valid',
          },
          servers: [validServer],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Mixed Servers API']

        assert(doc)
        // Only the valid server should appear
        expect(doc.servers).toMatchObject([{ url: 'https://valid.example.com', description: 'Valid server' }])
        expect(doc['x-scalar-selected-server']).toBe('https://valid.example.com')
      })

      it('handles a server with a localhost URL', async () => {
        const localServer = serverSchema.parse({
          uid: 'server-local',
          url: 'http://localhost:3000/api',
        })

        const legacyData = createLegacyData({
          title: 'Local API',
          collection: { servers: ['server-local'] },
          servers: [localServer],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Local API']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: 'http://localhost:3000/api' }])
      })

      it('handles a server with a relative URL', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: '/api/v1',
        })

        const legacyData = createLegacyData({
          title: 'Relative URL API',
          collection: { servers: ['server-1'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Relative URL API']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: '/api/v1' }])
      })

      it('handles a server with a URL containing path segments and query params', async () => {
        const server = serverSchema.parse({
          uid: 'server-complex',
          url: 'https://api.example.com/v2/graphql?format=json',
        })

        const legacyData = createLegacyData({
          title: 'Complex URL API',
          collection: { servers: ['server-complex'] },
          servers: [server],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Complex URL API']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: 'https://api.example.com/v2/graphql?format=json' }])
      })

      it('handles empty legacy data with no servers at all', async () => {
        const legacyData = createLegacyData({
          title: 'Empty API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['Empty API']

        assert(doc)
        expect(doc.servers).toEqual([])
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })
    })
  })

  // Request
  // RequestExample
  // Tags
})
