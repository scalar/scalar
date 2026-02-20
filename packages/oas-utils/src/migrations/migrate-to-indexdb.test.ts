import { type SecurityScheme, securitySchemeSchema } from '@scalar/types/entities'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { assert, beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'

import { cookieSchema } from '@/entities/cookie'
import { type Collection, collectionSchema } from '@/entities/spec/collection'
import { requestExampleSchema } from '@/entities/spec/request-examples'
import { requestSchema } from '@/entities/spec/requests'
import { serverSchema } from '@/entities/spec/server'
import { tagSchema } from '@/entities/spec/spec-objects'
import { type Workspace, workspaceSchema } from '@/entities/workspace/workspace'

import { DATA_VERSION_LS_LEY } from './data-version'
import { shouldMigrateToIndexDb, transformLegacyDataToWorkspace } from './migrate-to-indexdb'
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
    it('returns false when no legacy data exists', async () => {
      const mockWorkspacePersistence = {
        getAll: async () => [],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(false)
    })

    it('returns false when legacy data exists but IndexedDB already has workspaces', async () => {
      localStorage.setItem('workspace', '[]')
      const mockWorkspacePersistence = {
        getAll: async () => [{ namespace: 'local', slug: 'existing-workspace' }],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(false)
      localStorage.removeItem('workspace')
    })

    it('returns true when workspace data exists and IndexedDB is empty', async () => {
      localStorage.setItem('workspace', '[]')
      const mockWorkspacePersistence = {
        getAll: async () => [],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(true)
      localStorage.removeItem('workspace')
    })

    it('returns true when collection data exists and IndexedDB is empty', async () => {
      localStorage.setItem('collection', '[]')
      const mockWorkspacePersistence = {
        getAll: async () => [],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(true)
      localStorage.removeItem('collection')
    })

    it('returns true when request data exists and IndexedDB is empty', async () => {
      localStorage.setItem('request', '[]')
      const mockWorkspacePersistence = {
        getAll: async () => [],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(true)
      localStorage.removeItem('request')
    })

    it('returns false when no legacy data and IndexedDB is empty', async () => {
      const mockWorkspacePersistence = {
        getAll: async () => [],
      }
      const result = await shouldMigrateToIndexDb(mockWorkspacePersistence as any)
      expect(result).toBe(false)
    })

    it('handles IndexedDB being cleared after migration - migration runs again', async () => {
      // This test verifies the fix for the original issue:
      // If IndexedDB is cleared but legacy data remains, migration should run again
      localStorage.setItem('workspace', '[]')

      // First check: IndexedDB is empty, should migrate
      const emptyPersistence = {
        getAll: async () => [],
      }
      const shouldMigrateFirst = await shouldMigrateToIndexDb(emptyPersistence as any)
      expect(shouldMigrateFirst).toBe(true)

      // Simulate IndexedDB being cleared (user clears browser data, different profile, etc.)
      // Legacy data still exists in localStorage
      const clearedPersistence = {
        getAll: async () => [],
      }
      const shouldMigrateAfterClear = await shouldMigrateToIndexDb(clearedPersistence as any)

      // Migration should run again because IndexedDB is empty but legacy data exists
      expect(shouldMigrateAfterClear).toBe(true)

      localStorage.removeItem('workspace')
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
        resultWorkspace.workspace.documents['test-api']!.components?.securitySchemes?.['api-key-auth'],
      ).toMatchObject({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key authentication',
      })
      expect(
        // @ts-expect-error - value is not in the type
        resultWorkspace.workspace.documents['test-api']!.components?.securitySchemes?.['api-key-auth']?.value,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - uid is not in the type
        resultWorkspace.workspace.documents['test-api']!.components?.securitySchemes?.['api-key-auth']?.uid,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - nameKey is not in the type
        resultWorkspace.workspace.documents['test-api']!.components?.securitySchemes?.['api-key-auth']?.nameKey,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['test-api']?.secrets['api-key-auth']).toEqual({
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
        resultWorkspace.workspace.documents['bearer-api']!.components?.securitySchemes?.['bearer-auth'],
      ).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })
      expect(
        // @ts-expect-error - token is not in the type
        resultWorkspace.workspace.documents['bearer-api']!.components?.securitySchemes?.['bearer-auth']?.token,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - uid is not in the type
        resultWorkspace.workspace.documents['bearer-api']!.components?.securitySchemes?.['bearer-auth']?.uid,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - nameKey is not in the type
        resultWorkspace.workspace.documents['bearer-api']!.components?.securitySchemes?.['bearer-auth']?.nameKey,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['bearer-api']!.secrets['bearer-auth']).toEqual({
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
        resultWorkspace.workspace.documents['basic-auth-api']!.components?.securitySchemes?.['basic-auth'],
      ).toMatchObject({
        type: 'http',
        scheme: 'basic',
      })
      expect(
        // @ts-expect-error - username and password are not in the type
        resultWorkspace.workspace.documents['basic-auth-api']!.components?.securitySchemes?.['basic-auth']?.username,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - username and password are not in the type
        resultWorkspace.workspace.documents['basic-auth-api']!.components?.securitySchemes?.['basic-auth']?.password,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - uid is not in the type
        resultWorkspace.workspace.documents['basic-auth-api']!.components?.securitySchemes?.['basic-auth']?.uid,
      ).toBeUndefined()
      expect(
        // @ts-expect-error - nameKey is not in the type
        resultWorkspace.workspace.documents['basic-auth-api']!.components?.securitySchemes?.['basic-auth']?.nameKey,
      ).toBeUndefined()

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['basic-auth-api']!.secrets['basic-auth']).toEqual({
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
      const oauthScheme = resultWorkspace.workspace.documents['oauth-api']!.components?.securitySchemes?.['oauth2-auth']
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
        expect(
          // @ts-expect-error - uid is not in the type
          oauthScheme.uid,
        ).toBeUndefined()
        expect(
          // @ts-expect-error - nameKey is not in the type
          oauthScheme.nameKey,
        ).toBeUndefined()
      }

      // Verify security scheme secrets are in auth store
      expect(resultWorkspace.workspace.auth['oauth-api']!.secrets['oauth2-auth']).toEqual({
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
      expect(resultWorkspace.workspace.documents['api-one']!.components?.securitySchemes?.['api-key']).toMatchObject({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      })
      expect(
        resultWorkspace.workspace.documents['api-two']!.components?.securitySchemes?.['bearer-token'],
      ).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      })

      // Verify both auth stores have their secrets
      expect(resultWorkspace.workspace.auth['api-one']!.secrets['api-key']).toMatchObject({
        type: 'apiKey',
        'x-scalar-secret-token': 'key-123',
      })
      expect(resultWorkspace.workspace.auth['api-two']!.secrets['bearer-token']).toMatchObject({
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
      expect(resultWorkspace.workspace.documents['no-auth-api']).toBeDefined()
      expect(resultWorkspace.workspace.documents['no-auth-api']!.components?.securitySchemes).toMatchObject({})

      // Auth store should exist but be empty or have empty secrets
      expect(resultWorkspace.workspace.auth['no-auth-api']).toBeDefined()
      expect(Object.keys(resultWorkspace.workspace.auth['no-auth-api']!.secrets)).toHaveLength(0)
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

      // Check each cookie has the correct properties (uid should be stripped)
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

      // Check cookie has correct properties (uid should be stripped)
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
        const doc = result[0]?.workspace.documents['env-api']
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
        const doc = result[0]?.workspace.documents['multi-env-api']
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
        const doc = result[0]?.workspace.documents['no-env-api']
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
        const doc = result[0]?.workspace.documents['active-env-api']

        assert(doc)
        expect(doc['x-scalar-client-config-active-environment']).toBe('production')
      })

      it('does not set x-scalar-client-config-active-environment when x-scalar-active-environment is absent', async () => {
        const legacyData = createLegacyData({
          title: 'No Active Env API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-active-env-api']

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
        const doc = result[0]?.workspace.documents['server-api']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBe('https://api.example.com/v1')
      })

      it('does not set x-scalar-selected-server when selectedServerUid is not present', async () => {
        const legacyData = createLegacyData({
          title: 'No Server API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-server-api']

        assert(doc)
        expect(doc['x-scalar-selected-server']).toBeUndefined()
      })

      it('does not set x-scalar-selected-server when the referenced server is missing from records', async () => {
        const legacyData = createLegacyData({
          title: 'Missing Server API',
          collection: { selectedServerUid: 'server-nonexistent' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['missing-server-api']

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
        const doc = result[0]?.workspace.documents['multi-server-api']

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
        const doc = result[0]?.workspace.documents['icon-api']

        assert(doc)
        expect(doc['x-scalar-icon']).toBe('interface-home')
      })

      it('uses the default icon when x-scalar-icon is not explicitly set', async () => {
        const legacyData = createLegacyData({
          title: 'Default Icon API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['default-icon-api']

        assert(doc)
        // The collection schema defaults to 'interface-content-folder'
        expect(doc['x-scalar-icon']).toBe('interface-content-folder')
      })
    })

    describe('useCollectionSecurity → x-scalar-set-operation-security', () => {
      it('transforms useCollectionSecurity true to x-scalar-set-operation-security true', async () => {
        const legacyData = createLegacyData({
          title: 'Collection Security API',
          collection: { useCollectionSecurity: true },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['collection-security-api']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(true)
      })

      it('transforms useCollectionSecurity false to x-scalar-set-operation-security false', async () => {
        const legacyData = createLegacyData({
          title: 'No Collection Security API',
          collection: { useCollectionSecurity: false },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-collection-security-api']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(false)
      })

      it('defaults to false when useCollectionSecurity is not set', async () => {
        const legacyData = createLegacyData({
          title: 'Default Security API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['default-security-api']

        assert(doc)
        expect(doc['x-scalar-set-operation-security']).toBe(false)
      })
    })

    describe('documentUrl → x-scalar-original-source-url', () => {
      it('transforms documentUrl to x-scalar-original-source-url', async () => {
        const legacyData = createLegacyData({
          title: 'Doc URL API',
          collection: { documentUrl: 'https://example.com/openapi.yaml' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['doc-url-api']

        assert(doc)
        expect(doc['x-scalar-original-source-url']).toBe('https://example.com/openapi.yaml')
      })

      it('does not set x-scalar-original-source-url when documentUrl is not present', async () => {
        const legacyData = createLegacyData({
          title: 'No Doc URL API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-doc-url-api']

        assert(doc)
        expect(doc['x-scalar-original-source-url']).toBeUndefined()
      })

      it('handles various URL formats for documentUrl', async () => {
        const legacyData = createLegacyData({
          title: 'Relative URL API',
          collection: { documentUrl: './specs/openapi.json' },
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['relative-url-api']

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
        const doc = result[0]?.workspace.documents['full-meta-api']

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
        const doc1 = result[0]?.workspace.documents['api-one']
        const doc2 = result[0]?.workspace.documents['api-two']

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
        const doc = result[0]?.workspace.documents['single-server-api']

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
        const doc = result[0]?.workspace.documents['multi-server-api']

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
        const doc = result[0]?.workspace.documents['minimal-server-api']

        assert(doc)
        expect(doc.servers).toMatchObject([{ url: 'https://minimal.example.com' }])
      })

      it('produces an empty servers array when collection has no servers', async () => {
        const legacyData = createLegacyData({
          title: 'No Servers API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-servers-api']

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
        const doc = result[0]?.workspace.documents['templated-server-api']

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
        const doc = result[0]?.workspace.documents['default-var-api']

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
        const doc = result[0]?.workspace.documents['multi-var-api']

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

        const doc1 = resultWorkspace.workspace.documents['api-one']
        const doc2 = resultWorkspace.workspace.documents['api-two']

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

        const docAlpha = resultWorkspace.workspace.documents['api-alpha']
        const docBeta = resultWorkspace.workspace.documents['api-beta']

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

        const devDoc = result[0]?.workspace.documents['dev-api']
        const prodDoc = result[1]?.workspace.documents['prod-api']

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

        const docWith = resultWorkspace.workspace.documents['with-server']
        const docWithout = resultWorkspace.workspace.documents['without-server']

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
        const doc = result[0]?.workspace.documents['no-server-refs-api']

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
        const doc = result[0]?.workspace.documents['ghost-server-api']

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
        const doc = result[0]?.workspace.documents['mixed-servers-api']

        assert(doc)
        // Only the valid server should appear
        expect(doc.servers).toMatchObject([{ url: 'https://valid.example.com', description: 'Valid server' }])
        expect(doc['x-scalar-selected-server']).toBe('https://valid.example.com')
      })
    })
  })

  describe('transformLegacyDataToWorkspace - Tags', () => {
    describe('flat tags (no nesting)', () => {
      it('transforms flat tags into document tags array and filters non-existent UIDs', async () => {
        const tag1 = tagSchema.parse({
          uid: 'tag-users-001',
          name: 'Users',
          description: 'User operations',
          children: [],
        })

        const tag2 = tagSchema.parse({
          uid: 'tag-pets-002',
          name: 'Pets',
          description: 'Pet operations',
          children: [],
        })

        const legacyData = createLegacyData({
          title: 'Tags API',
          collection: {
            tags: ['tag-users-001', 'tag-pets-002', 'tag-nonexistent'],
            children: ['tag-users-001', 'tag-pets-002', 'tag-nonexistent'],
          },
          tags: [tag1, tag2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['tags-api']

        assert(doc)
        expect(doc.tags).toEqual([
          { name: 'Users', description: 'User operations', 'x-scalar-order': [] },
          { name: 'Pets', description: 'Pet operations', 'x-scalar-order': [] },
        ])
        expect(doc['x-tagGroups']).toBeUndefined()
      })
    })

    describe('nested tags (parent-child) → x-tagGroups', () => {
      it('converts a parent tag with child tags into an x-tagGroups entry and filters missing children', async () => {
        const childTag1 = tagSchema.parse({
          uid: 'tag-dogs',
          name: 'Dogs',
          description: 'Dog operations',
          children: [],
        })

        const childTag2 = tagSchema.parse({
          uid: 'tag-cats',
          name: 'Cats',
          description: 'Cat operations',
          children: [],
        })

        /** Parent tag that contains other tags as children, including a non-existent one */
        const parentTag = tagSchema.parse({
          uid: 'tag-animals',
          name: 'Animals',
          description: 'All animal operations',
          children: ['tag-dogs', 'tag-cats', 'tag-missing'],
        })

        const legacyData = createLegacyData({
          title: 'Nested Tags API',
          collection: {
            tags: ['tag-animals', 'tag-dogs', 'tag-cats'],
            children: ['tag-animals'],
          },
          tags: [parentTag, childTag1, childTag2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['nested-tags-api']

        assert(doc)

        expect(doc.tags).toEqual([
          { name: 'Dogs', description: 'Dog operations', 'x-scalar-order': [] },
          { name: 'Cats', description: 'Cat operations', 'x-scalar-order': [] },
        ])

        expect(doc['x-tagGroups']).toEqual([
          {
            name: 'Animals',
            tags: ['Dogs', 'Cats'],
            'x-scalar-order': ['nested-tags-api/tag/dogs', 'nested-tags-api/tag/cats'],
          },
        ])
      })

      it('converts multiple parent tags into multiple x-tagGroups entries', async () => {
        const dogTag = tagSchema.parse({
          uid: 'tag-dogs',
          name: 'Dogs',
          children: [],
        })

        const catTag = tagSchema.parse({
          uid: 'tag-cats',
          name: 'Cats',
          children: [],
        })

        const sedanTag = tagSchema.parse({
          uid: 'tag-sedans',
          name: 'Sedans',
          children: [],
        })

        const truckTag = tagSchema.parse({
          uid: 'tag-trucks',
          name: 'Trucks',
          children: [],
        })

        const animalsGroup = tagSchema.parse({
          uid: 'tag-animals',
          name: 'Animals',
          children: ['tag-dogs', 'tag-cats'],
        })

        const vehiclesGroup = tagSchema.parse({
          uid: 'tag-vehicles',
          name: 'Vehicles',
          children: ['tag-sedans', 'tag-trucks'],
        })

        const legacyData = createLegacyData({
          title: 'Multi Group API',
          collection: {
            tags: ['tag-animals', 'tag-dogs', 'tag-cats', 'tag-vehicles', 'tag-sedans', 'tag-trucks'],
            children: ['tag-animals', 'tag-vehicles'],
          },
          tags: [animalsGroup, dogTag, catTag, vehiclesGroup, sedanTag, truckTag],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['multi-group-api']

        assert(doc)
        expect(doc.tags).toEqual([
          { name: 'Dogs', 'x-scalar-order': [] },
          { name: 'Cats', 'x-scalar-order': [] },
          { name: 'Sedans', 'x-scalar-order': [] },
          { name: 'Trucks', 'x-scalar-order': [] },
        ])
        expect(doc['x-tagGroups']).toEqual([
          {
            name: 'Animals',
            tags: ['Dogs', 'Cats'],
            'x-scalar-order': ['multi-group-api/tag/dogs', 'multi-group-api/tag/cats'],
          },
          {
            name: 'Vehicles',
            tags: ['Sedans', 'Trucks'],
            'x-scalar-order': ['multi-group-api/tag/sedans', 'multi-group-api/tag/trucks'],
          },
        ])
      })

      it('handles a mix of grouped and ungrouped tags', async () => {
        const childTag = tagSchema.parse({
          uid: 'tag-child',
          name: 'ChildTag',
          children: [],
        })

        const parentTag = tagSchema.parse({
          uid: 'tag-parent',
          name: 'ParentGroup',
          children: ['tag-child'],
        })

        const standaloneTag = tagSchema.parse({
          uid: 'tag-standalone',
          name: 'Standalone',
          description: 'A standalone tag',
          children: [],
        })

        const legacyData = createLegacyData({
          title: 'Mixed Tags API',
          collection: {
            tags: ['tag-parent', 'tag-child', 'tag-standalone'],
            children: ['tag-parent', 'tag-standalone'],
          },
          tags: [parentTag, childTag, standaloneTag],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['mixed-tags-api']

        assert(doc)
        expect(doc.tags).toEqual([
          { name: 'ChildTag', 'x-scalar-order': [] },
          { name: 'Standalone', description: 'A standalone tag' },
        ])
        expect(doc['x-tagGroups']).toEqual([
          {
            name: 'ParentGroup',
            tags: ['ChildTag'],
            'x-scalar-order': ['mixed-tags-api/tag/childtag'],
          },
        ])
      })
    })

    describe('tag edge cases', () => {
      it('does not create x-tagGroups when all children are missing', async () => {
        const parentTag = tagSchema.parse({
          uid: 'tag-parent',
          name: 'Parent',
          children: ['tag-missing-1', 'tag-missing-2'],
        })

        const legacyData = createLegacyData({
          title: 'Missing Children API',
          collection: {
            tags: ['tag-parent'],
            children: ['tag-parent'],
          },
          tags: [parentTag],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['missing-children-api']

        assert(doc)
        expect(doc.tags).toEqual([])
        expect(doc['x-tagGroups']).toBeUndefined()
      })

      it('preserves tag description and externalDocs', async () => {
        const tag = tagSchema.parse({
          uid: 'tag-documented-001',
          name: 'Documented Tag',
          description: 'This tag has full metadata',
          externalDocs: {
            url: 'https://docs.example.com/tags/documented',
            description: 'External documentation for this tag',
          },
          children: [],
        })

        const legacyData = createLegacyData({
          title: 'Documented Tags API',
          collection: {
            tags: ['tag-documented-001'],
            children: ['tag-documented-001'],
          },
          tags: [tag],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['documented-tags-api']

        assert(doc)
        expect(doc.tags).toEqual([
          {
            name: 'Documented Tag',
            description: 'This tag has full metadata',
            externalDocs: {
              url: 'https://docs.example.com/tags/documented',
              description: 'External documentation for this tag',
            },
            'x-scalar-order': [],
          },
        ])
      })
    })
  })

  describe('transformLegacyDataToWorkspace - Requests & RequestExamples', () => {
    describe('basic request transformation', () => {
      it('transforms a simple GET request into an OpenAPI operation', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get all users',
          description: 'Retrieves a list of all users',
          operationId: 'getUsers',
          tags: ['Users'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.paths?.['/users']?.get).toEqual({
          summary: 'Get all users',
          description: 'Retrieves a list of all users',
          operationId: 'getUsers',
          tags: ['Users'],
        })
      })

      it('transforms a POST request with request body', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'post',
          summary: 'Create user',
          operationId: 'createUser',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.paths?.['/users']?.post).toEqual({
          summary: 'Create user',
          operationId: 'createUser',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms a request with parameters', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users/{id}',
          method: 'get',
          summary: 'Get user by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ID',
            },
            {
              name: 'include',
              in: 'query',
              schema: { type: 'string' },
              description: 'Related resources to include',
            },
          ],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(getResolvedRef(doc.paths?.['/users/{id}']?.get)?.parameters).toMatchObject([
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
          {
            name: 'include',
            in: 'query',
            schema: { type: 'string' },
            description: 'Related resources to include',
          },
        ])
      })

      it('transforms multiple requests across different paths and methods', async () => {
        const getRequest = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'List users',
        })

        const postRequest = requestSchema.parse({
          uid: 'request-2',
          path: '/users',
          method: 'post',
          summary: 'Create user',
        })

        const deleteRequest = requestSchema.parse({
          uid: 'request-3',
          path: '/users/{id}',
          method: 'delete',
          summary: 'Delete user',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1', 'request-2', 'request-3'] },
          requests: [getRequest, postRequest, deleteRequest],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.paths).toEqual({
          '/users': {
            get: { summary: 'List users' },
            post: { summary: 'Create user' },
          },
          '/users/{id}': {
            delete: {
              summary: 'Delete user',
              parameters: [{ name: 'id', in: 'path' }],
            },
          },
        })
      })
    })

    describe('request examples transformation', () => {
      it('transforms a request with a single example into parameter examples', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Basic Example',
          parameters: {
            query: [
              { key: 'page', value: '1', enabled: true },
              { key: 'limit', value: '10', enabled: true },
            ],
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                parameters: [
                  {
                    name: 'page',
                    in: 'query',
                    examples: {
                      'Basic Example': { value: '1', 'x-disabled': false },
                    },
                  },
                  {
                    name: 'limit',
                    in: 'query',
                    examples: {
                      'Basic Example': { value: '10', 'x-disabled': false },
                    },
                  },
                  {
                    name: 'Accept',
                    in: 'header',
                    examples: {
                      'Basic Example': { value: 'application/json', 'x-disabled': false },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('transforms a request with multiple examples', async () => {
        const example1 = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'First Page',
          parameters: {
            query: [{ key: 'page', value: '1', enabled: true }],
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const example2 = requestExampleSchema.parse({
          uid: 'example-2',
          requestUid: 'request-1',
          name: 'Second Page',
          parameters: {
            query: [{ key: 'page', value: '2', enabled: true }],
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          examples: ['example-1', 'example-2'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example1, example2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                parameters: [
                  {
                    name: 'page',
                    in: 'query',
                    examples: {
                      'First Page': { value: '1', 'x-disabled': false },
                      'Second Page': { value: '2', 'x-disabled': false },
                    },
                  },
                  {
                    name: 'Accept',
                    in: 'header',
                    examples: {
                      'First Page': { value: 'application/json', 'x-disabled': false },
                      'Second Page': { value: 'application/json', 'x-disabled': false },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('removes the accept */* header', async () => {
        /**
         * This test ensures that the Accept wildcard header is removed from the parameters.
         */
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'JSON Accept',
          parameters: {
            headers: [
              { key: 'Accept', value: '*/*', enabled: true },
              { key: 'Authorization', value: 'Bearer token123', enabled: true },
            ],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/api/data',
          method: 'get',
          summary: 'Get data',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['api']
        assert(doc)

        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'API', version: '1.0.0' },
          paths: {
            '/api/data': {
              get: {
                summary: 'Get data',
                parameters: [
                  {
                    name: 'Authorization',
                    in: 'header',
                    examples: {
                      'JSON Accept': { value: 'Bearer token123', 'x-disabled': false },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('transforms an example with a JSON request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Create User Example',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
            },
          },
          parameters: {
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'post',
          summary: 'Create user',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              post: {
                summary: 'Create user',
                requestBody: {
                  content: {
                    'application/json': {
                      examples: {
                        'Create User Example': {
                          value: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms an example with form data', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Form Example',
          body: {
            activeBody: 'formData',
            formData: {
              encoding: 'form-data',
              value: [
                { key: 'username', value: 'johndoe', enabled: true },
                { key: 'password', value: 'secret123', enabled: true },
              ],
            },
          },
          parameters: {
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/login',
          method: 'post',
          summary: 'Login',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Auth API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['auth-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Auth API', version: '1.0.0' },
          paths: {
            '/login': {
              post: {
                summary: 'Login',
                parameters: [
                  {
                    name: 'Accept',
                    in: 'header',
                    examples: {
                      'Form Example': { value: 'application/json', 'x-disabled': false },
                    },
                  },
                ],
                requestBody: {
                  content: {
                    'multipart/form-data': {
                      examples: {
                        'Form Example': {
                          value: [
                            { name: 'username', value: 'johndoe' },
                            { name: 'password', value: 'secret123' },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms an example with URL-encoded form data', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'URL Encoded Example',
          body: {
            activeBody: 'formData',
            formData: {
              encoding: 'urlencoded',
              value: [
                { key: 'email', value: 'user@example.com', enabled: true },
                { key: 'password', value: 'secret', enabled: true },
              ],
            },
          },
          parameters: {
            headers: [{ key: 'Accept', value: '*/*', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/auth',
          method: 'post',
          summary: 'Authenticate',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Auth API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['auth-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Auth API', version: '1.0.0' },
          paths: {
            '/auth': {
              post: {
                summary: 'Authenticate',
                requestBody: {
                  content: {
                    'application/x-www-form-urlencoded': {
                      examples: {
                        'URL Encoded Example': {
                          value: [
                            { name: 'email', value: 'user@example.com' },
                            { name: 'password', value: 'secret' },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms an example with XML request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'XML Example',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'xml',
              value: '<user><name>John Doe</name><email>john@example.com</email></user>',
            },
          },
          parameters: {
            headers: [{ key: 'Content-Type', value: 'application/xml', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'post',
          summary: 'Create user',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              post: {
                summary: 'Create user',
                requestBody: {
                  content: {
                    'application/xml': {
                      examples: {
                        'XML Example': {
                          value: '<user><name>John Doe</name><email>john@example.com</email></user>',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms an example with YAML request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'YAML Example',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'yaml',
              value: 'name: John Doe\nemail: john@example.com',
            },
          },
          parameters: {
            headers: [{ key: 'Content-Type', value: 'application/yaml', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/config',
          method: 'post',
          summary: 'Update config',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Config API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['config-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Config API', version: '1.0.0' },
          paths: {
            '/config': {
              post: {
                summary: 'Update config',
                requestBody: {
                  content: {
                    'application/yaml': {
                      examples: {
                        'YAML Example': {
                          value: 'name: John Doe\nemail: john@example.com',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('transforms an example with EDN request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'EDN Example',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'edn',
              value: '{:name "John Doe" :email "john@example.com"}',
            },
          },
          parameters: {
            headers: [{ key: 'Content-Type', value: 'application/edn', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/data',
          method: 'post',
          summary: 'Submit data',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Data API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['data-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Data API', version: '1.0.0' },
          paths: {
            '/data': {
              post: {
                summary: 'Submit data',
                requestBody: {
                  content: {
                    'application/edn': {
                      examples: {
                        'EDN Example': {
                          value: '{:name "John Doe" :email "john@example.com"}',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      // We do not keep the content type as it should be in the global header
      it('transforms an example with binary file (octet-stream)', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Binary Example',
          body: {
            activeBody: 'binary',
          },
          parameters: {
            headers: [
              { key: 'Content-Type', value: 'application/octet-stream', enabled: true },
              { key: 'Accept', value: '*/*', enabled: true },
            ],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/upload',
          method: 'post',
          summary: 'Upload file',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Upload API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['upload-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Upload API', version: '1.0.0' },
          paths: {
            '/upload': {
              post: {
                summary: 'Upload file',
                requestBody: {
                  content: {
                    binary: {
                      examples: {
                        'Binary Example': {},
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('sets x-scalar-selected-content-type for multiple examples', async () => {
        const formExample = requestExampleSchema.parse({
          uid: 'example-form',
          requestUid: 'request-1',
          name: 'Form Example',
          body: {
            activeBody: 'formData',
            formData: {
              encoding: 'form-data',
              value: [
                { key: 'username', value: 'johndoe', enabled: true },
                { key: 'password', value: 'secret123', enabled: true },
              ],
            },
          },
          parameters: {
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const jsonExample = requestExampleSchema.parse({
          uid: 'example-json',
          requestUid: 'request-1',
          name: 'Create User Example',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
            },
          },
          parameters: {
            headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/login',
          method: 'post',
          summary: 'Login',
          examples: ['example-form', 'example-json'],
        })

        const legacyData = createLegacyData({
          title: 'Auth API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [formExample, jsonExample],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['auth-api']
        expect(
          getResolvedRef(getResolvedRef(doc?.paths?.['/login']?.post)?.requestBody)?.['x-scalar-selected-content-type'],
        ).toEqual({
          'Form Example': 'multipart/form-data',
          'Create User Example': 'application/json',
        })
      })

      it('does not set x-scalar-selected-content-type when there is no request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Get User Example',
          parameters: {
            query: [{ key: 'id', value: '123', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get user',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']
        expect(getResolvedRef(doc?.paths?.['/users']?.get)?.requestBody).toBeUndefined()
      })

      it('transforms an example with path parameters', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Get User 123',
          parameters: {
            path: [{ key: 'id', value: '123', enabled: true }],
            headers: [{ key: 'Accept', value: '*/*', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users/{id}',
          method: 'get',
          summary: 'Get user',
          examples: ['example-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users/{id}': {
              get: {
                summary: 'Get user',
                parameters: [
                  {
                    name: 'id',
                    in: 'path',
                    required: true,
                    examples: {
                      'Get User 123': { value: '123', 'x-disabled': false },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('transforms an example with multiple parameter types and body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'tcHS3GOyvbQeNKQyi6A8r',
          type: 'requestExample',
          requestUid: 'DQOYkZ1uQzzNhuXI-tFWC',
          name: 'Default Example',
          body: {
            raw: {
              encoding: 'json',
              value: '{\n"test": "me"}',
            },
            formData: {
              encoding: 'form-data',
              value: [
                {
                  key: 'just',
                  value: 'amrit',
                  enabled: true,
                },
                {
                  key: 'some',
                  value: 'times',
                  enabled: false,
                },
              ],
            },
            activeBody: 'raw',
          },
          parameters: {
            path: [],
            query: [
              {
                key: '1',
                value: '2',
                enabled: true,
              },
              {
                key: '',
                value: '',
                enabled: false,
              },
            ],
            headers: [
              {
                key: 'Accept',
                value: '*/*',
                enabled: true,
              },
              {
                key: 'Content-Type',
                value: 'application/json',
                enabled: true,
              },
              {
                key: '',
                value: '',
                enabled: false,
              },
            ],
            cookies: [
              {
                key: '',
                value: '',
                enabled: false,
              },
            ],
          },
          serverVariables: {},
        })

        const request = requestSchema.parse({
          uid: 'DQOYkZ1uQzzNhuXI-tFWC',
          path: '/test',
          method: 'post',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          summary: 'Test endpoint',
          examples: ['tcHS3GOyvbQeNKQyi6A8r'],
        })

        const legacyData = createLegacyData({
          title: 'Test API',
          collection: { requests: ['DQOYkZ1uQzzNhuXI-tFWC'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['test-api']
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          servers: [],
          paths: {
            '/test': {
              post: {
                summary: 'Test endpoint',
                requestBody: {
                  content: {
                    'application/json': {
                      schema: { type: 'object' },
                      examples: { 'Default Example': { value: '{\n"test": "me"}' } },
                    },
                    'multipart/form-data': { schema: { type: 'object' } },
                  },
                },
                parameters: [
                  {
                    name: '1',
                    in: 'query',
                    schema: { type: 'string' },
                    examples: { 'Default Example': { value: '2', 'x-disabled': false } },
                  },
                ],
              },
            },
          },
        })
      })

      it('transforms a request with circular schema in request body', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Create Planet',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: '{"name": "Earth", "satellites": [{"name": "Moon"}]}',
            },
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/planets',
          method: 'post',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    satellites: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          summary: 'Create a new planet',
          examples: ['example-1'],
        })

        // Make circular connection
        request.requestBody.content['application/json'].schema.properties.satellites.items =
          request.requestBody.content['application/json'].schema

        const legacyData = createLegacyData({
          title: 'Scalar Galaxy',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['scalar-galaxy']
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Scalar Galaxy', version: '1.0.0' },
          servers: [],
          paths: {
            '/planets': {
              post: {
                summary: 'Create a new planet',
                requestBody: {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/CircularSchema1' },
                      examples: {
                        'Create Planet': {
                          value: '{"name": "Earth", "satellites": [{"name": "Moon"}]}',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            securitySchemes: {},
            schemas: {
              CircularSchema1: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  satellites: {
                    type: 'array',
                    items: {
                      '$ref': '#/components/schemas/CircularSchema1',
                    },
                  },
                },
              },
            },
          },
        })
      })

      it('handles duplicate example names by appending #2, #3, etc', async () => {
        const example1 = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Test Example',
          parameters: {
            query: [{ key: 'page', value: '1', enabled: true }],
          },
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: JSON.stringify({ test: 'first' }),
            },
          },
        })

        const example2 = requestExampleSchema.parse({
          uid: 'example-2',
          requestUid: 'request-1',
          name: 'Test Example',
          parameters: {
            query: [{ key: 'page', value: '2', enabled: true }],
          },
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: JSON.stringify({ test: 'second' }),
            },
          },
        })

        const example3 = requestExampleSchema.parse({
          uid: 'example-3',
          requestUid: 'request-1',
          name: 'Test Example',
          parameters: {
            query: [{ key: 'page', value: '3', enabled: true }],
          },
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: JSON.stringify({ test: 'third' }),
            },
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/data',
          method: 'get',
          summary: 'Get data',
          examples: ['example-1', 'example-2', 'example-3'],
        })

        const legacyData = createLegacyData({
          title: 'Test API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example1, example2, example3],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['test-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {
            '/data': {
              get: {
                summary: 'Get data',
                parameters: [
                  {
                    name: 'page',
                    in: 'query',
                    examples: {
                      'Test Example': { value: '1', 'x-disabled': false },
                      'Test Example #2': { value: '2', 'x-disabled': false },
                      'Test Example #3': { value: '3', 'x-disabled': false },
                    },
                  },
                ],
                requestBody: {
                  content: {
                    'application/json': {
                      examples: {
                        'Test Example': { value: JSON.stringify({ test: 'first' }) },
                        'Test Example #2': { value: JSON.stringify({ test: 'second' }) },
                        'Test Example #3': { value: JSON.stringify({ test: 'third' }) },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })
    })

    describe('request with servers', () => {
      it('transforms a request with server overrides', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
          description: 'Main server',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api-staging.example.com',
          description: 'Staging server',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          servers: ['server-2'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { servers: ['server-1'], requests: ['request-1'] },
          servers: [server1, server2],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                servers: [
                  {
                    url: 'https://api-staging.example.com',
                    description: 'Staging server',
                  },
                ],
              },
            },
          },
        })
      })

      it('transforms a request with multiple server overrides', async () => {
        const server1 = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
          description: 'Production',
        })

        const server2 = serverSchema.parse({
          uid: 'server-2',
          url: 'https://api-staging.example.com',
          description: 'Staging',
        })

        const server3 = serverSchema.parse({
          uid: 'server-3',
          url: 'https://api-dev.example.com',
          description: 'Development',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          servers: ['server-2', 'server-3'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { servers: ['server-1'], requests: ['request-1'] },
          servers: [server1, server2, server3],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                servers: [
                  { url: 'https://api-staging.example.com', description: 'Staging' },
                  { url: 'https://api-dev.example.com', description: 'Development' },
                ],
              },
            },
          },
        })
      })

      it('transforms a request with server variables', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://{environment}.example.com',
          description: 'Templated server',
          variables: {
            environment: {
              default: 'api',
              enum: ['api', 'staging'],
              description: 'Environment',
            },
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          servers: ['server-1'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          servers: [server],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                servers: [
                  {
                    url: 'https://{environment}.example.com',
                    description: 'Templated server',
                    variables: {
                      environment: {
                        default: 'api',
                        enum: ['api', 'staging'],
                        description: 'Environment',
                      },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('handles request with no server overrides', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('filters out non-existent server UIDs from request', async () => {
        const server = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          servers: ['server-1', 'server-nonexistent'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          servers: [server],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                servers: [{ url: 'https://api.example.com' }],
              },
            },
          },
        })
      })
    })

    describe('extracting servers from paths', () => {
      it('extracts server from path with full URL before the slash', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com' }],
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('extracts server from path with URL and port', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'http://localhost:3000/api/users',
          method: 'post',
          summary: 'Create user',
        })

        const legacyData = createLegacyData({
          title: 'Local API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['local-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Local API', version: '1.0.0' },
          servers: [{ url: 'http://localhost:3000' }],
          paths: {
            '/api/users': {
              post: {
                summary: 'Create user',
              },
            },
          },
        })
      })

      it('extracts multiple unique servers from different paths', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          path: 'https://api-staging.example.com/products',
          method: 'get',
          summary: 'Get products',
        })

        const legacyData = createLegacyData({
          title: 'Multi Server API',
          collection: { requests: ['request-1', 'request-2'] },
          requests: [request1, request2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['multi-server-api']

        assert(doc)
        expect(doc.servers).toEqual(
          expect.arrayContaining([{ url: 'https://api.example.com' }, { url: 'https://api-staging.example.com' }]),
        )
        expect(doc.servers).toHaveLength(2)
        expect(doc).toMatchObject({
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
            '/products': {
              get: {
                summary: 'Get products',
              },
            },
          },
        })
      })

      it('does not duplicate servers when URL is already in collection servers', async () => {
        const existingServer = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
          description: 'Production server',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { servers: ['server-1'], requests: ['request-1'] },
          servers: [existingServer],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.servers).toEqual([
          {
            url: 'https://api.example.com',
            description: 'Production server',
          },
        ])
        expect(doc.servers).toHaveLength(1)
        expect(doc).toMatchObject({
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('does not extract servers from paths missing the leading slash', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          path: 'users/places',
          method: 'get',
          summary: 'Get user places',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          path: 'users',
          method: 'post',
          summary: 'Create user',
        })

        const legacyData = createLegacyData({
          title: 'Malformed Paths API',
          collection: { requests: ['request-1', 'request-2'] },
          requests: [request1, request2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['malformed-paths-api']

        assert(doc)
        expect(doc.servers).toEqual([])
        expect(doc).toMatchObject({
          paths: {
            '/users/places': {
              get: {
                summary: 'Get user places',
              },
            },
            '/users': {
              post: {
                summary: 'Create user',
              },
            },
          },
        })
      })

      it('extracts server and preserves existing collection servers', async () => {
        const existingServer = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api-staging.example.com',
          description: 'Staging server',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { servers: ['server-1'], requests: ['request-1'] },
          servers: [existingServer],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.servers).toEqual(
          expect.arrayContaining([
            { url: 'https://api-staging.example.com', description: 'Staging server' },
            { url: 'https://api.example.com' },
          ]),
        )
        expect(doc.servers).toHaveLength(2)
        expect(doc).toMatchObject({
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('extracts server with trailing slash from path', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com//users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com' }],
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('handles mixed paths with and without embedded servers', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          path: '/products',
          method: 'get',
          summary: 'Get products',
        })

        const request3 = requestSchema.parse({
          uid: 'request-3',
          path: 'https://api-v2.example.com/orders',
          method: 'get',
          summary: 'Get orders',
        })

        const legacyData = createLegacyData({
          title: 'Mixed Paths API',
          collection: { requests: ['request-1', 'request-2', 'request-3'] },
          requests: [request1, request2, request3],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['mixed-paths-api']

        assert(doc)
        expect(doc.servers).toEqual(
          expect.arrayContaining([{ url: 'https://api.example.com' }, { url: 'https://api-v2.example.com' }]),
        )
        expect(doc.servers).toHaveLength(2)
        expect(doc).toMatchObject({
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
            '/products': {
              get: {
                summary: 'Get products',
              },
            },
            '/orders': {
              get: {
                summary: 'Get orders',
              },
            },
          },
        })
      })

      it('extracts server from path with complex URL structure', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com:8080/v1/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Complex URL API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['complex-url-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Complex URL API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com:8080' }],
          paths: {
            '/v1/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('does not extract from paths that look like URLs but have no protocol', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'No Protocol API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['no-protocol-api']

        assert(doc)
        expect(doc.servers).toEqual([])
        expect(doc).toMatchObject({
          paths: {
            '/api.example.com/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('extracts same server from multiple paths without duplication', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          path: 'https://api.example.com/products',
          method: 'get',
          summary: 'Get products',
        })

        const request3 = requestSchema.parse({
          uid: 'request-3',
          path: 'https://api.example.com/orders',
          method: 'post',
          summary: 'Create order',
        })

        const legacyData = createLegacyData({
          title: 'Dedup Server API',
          collection: { requests: ['request-1', 'request-2', 'request-3'] },
          requests: [request1, request2, request3],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['dedup-server-api']

        assert(doc)
        expect(doc.servers).toEqual([{ url: 'https://api.example.com' }])
        expect(doc.servers).toHaveLength(1)
        expect(doc).toMatchObject({
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
            '/products': {
              get: {
                summary: 'Get products',
              },
            },
            '/orders': {
              post: {
                summary: 'Create order',
              },
            },
          },
        })
      })

      it('extracts server with path containing query parameters', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users?page=1',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Query Params API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['query-params-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Query Params API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com' }],
          paths: {
            '/users?page=1': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('does not duplicate when extracted server matches existing server with same URL but different description', async () => {
        const existingServer = serverSchema.parse({
          uid: 'server-1',
          url: 'https://api.example.com',
          description: 'Production server',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { servers: ['server-1'], requests: ['request-1'] },
          servers: [existingServer],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc.servers).toEqual([
          {
            url: 'https://api.example.com',
            description: 'Production server',
          },
        ])
        expect(doc.servers).toHaveLength(1)
      })

      it('handles paths with just a domain and no path component', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/',
          method: 'get',
          summary: 'Root endpoint',
        })

        const legacyData = createLegacyData({
          title: 'Root API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['root-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Root API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com' }],
          paths: {
            '/': {
              get: {
                summary: 'Root endpoint',
              },
            },
          },
        })
      })

      it('does not extract from relative paths without protocol', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          path: 'users/places',
          method: 'get',
          summary: 'Get user places',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          path: 'users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Relative Paths API',
          collection: { requests: ['request-1', 'request-2'] },
          requests: [request1, request2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['relative-paths-api']

        assert(doc)
        expect(doc.servers).toEqual([])
        expect(doc).toMatchObject({
          paths: {
            '/users/places': {
              get: {
                summary: 'Get user places',
              },
            },
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('extracts server with subdomain and path', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://v2.api.example.com/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Subdomain API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['subdomain-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Subdomain API', version: '1.0.0' },
          servers: [{ url: 'https://v2.api.example.com' }],
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('handles paths with URL and nested path segments', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: 'https://api.example.com/v1/users/{id}/posts',
          method: 'get',
          summary: 'Get user posts',
        })

        const legacyData = createLegacyData({
          title: 'Nested Path API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['nested-path-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Nested Path API', version: '1.0.0' },
          servers: [{ url: 'https://api.example.com' }],
          paths: {
            '/v1/users/{id}/posts': {
              get: {
                summary: 'Get user posts',
              },
            },
          },
        })
      })
    })

    describe('request with security', () => {
      it('transforms a request with security requirements', async () => {
        const scheme = securitySchemeSchema.parse({
          uid: 'security-1',
          nameKey: 'api-key',
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'secret-key',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/protected',
          method: 'get',
          summary: 'Protected endpoint',
          security: [{ 'api-key': [] }],
          selectedSecuritySchemeUids: ['security-1'],
        })

        const legacyData = createLegacyData({
          title: 'Protected API',
          collection: { securitySchemes: [scheme.uid], requests: ['request-1'] },
          securitySchemes: [scheme],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['protected-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Protected API', version: '1.0.0' },
          paths: {
            '/protected': {
              get: {
                summary: 'Protected endpoint',
                security: [{ 'api-key': [] }],
              },
            },
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
      })

      it('transforms a request with multiple security requirements (AND)', async () => {
        const apiKeyScheme = securitySchemeSchema.parse({
          uid: 'security-1',
          nameKey: 'api-key',
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'key-123',
        })

        const bearerScheme = securitySchemeSchema.parse({
          uid: 'security-2',
          nameKey: 'bearer-auth',
          type: 'http',
          scheme: 'bearer',
          token: 'token-456',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/protected',
          method: 'get',
          summary: 'Protected endpoint',
          security: [{ 'api-key': [], 'bearer-auth': [] }],
          selectedSecuritySchemeUids: ['security-1', 'security-2'],
        })

        const legacyData = createLegacyData({
          title: 'Protected API',
          collection: {
            securitySchemes: [apiKeyScheme.uid, bearerScheme.uid],
            requests: ['request-1'],
          },
          securitySchemes: [apiKeyScheme, bearerScheme],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['protected-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Protected API', version: '1.0.0' },
          paths: {
            '/protected': {
              get: {
                summary: 'Protected endpoint',
                security: [{ 'api-key': [], 'bearer-auth': [] }],
              },
            },
          },
          components: {
            securitySchemes: {
              'api-key': {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header',
              },
              'bearer-auth': {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
        })
      })

      it('transforms a request with alternative security requirements (OR)', async () => {
        const apiKeyScheme = securitySchemeSchema.parse({
          uid: 'security-1',
          nameKey: 'api-key',
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'key-123',
        })

        const bearerScheme = securitySchemeSchema.parse({
          uid: 'security-2',
          nameKey: 'bearer-auth',
          type: 'http',
          scheme: 'bearer',
          token: 'token-456',
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/protected',
          method: 'get',
          summary: 'Protected endpoint',
          security: [{ 'api-key': [] }, { 'bearer-auth': [] }],
          selectedSecuritySchemeUids: ['security-1', 'security-2'],
        })

        const legacyData = createLegacyData({
          title: 'Protected API',
          collection: {
            securitySchemes: [apiKeyScheme.uid, bearerScheme.uid],
            requests: ['request-1'],
          },
          securitySchemes: [apiKeyScheme, bearerScheme],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['protected-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Protected API', version: '1.0.0' },
          paths: {
            '/protected': {
              get: {
                summary: 'Protected endpoint',
                security: [{ 'api-key': [] }, { 'bearer-auth': [] }],
              },
            },
          },
          components: {
            securitySchemes: {
              'api-key': {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header',
              },
              'bearer-auth': {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
        })
      })

      it('transforms a request with OAuth2 security and scopes', async () => {
        const oauthScheme = securitySchemeSchema.parse({
          uid: 'security-1',
          nameKey: 'oauth2',
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
            },
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          security: [{ oauth2: ['read:users'] }],
          selectedSecuritySchemeUids: ['security-1'],
        })

        const legacyData = createLegacyData({
          title: 'OAuth API',
          collection: {
            securitySchemes: [oauthScheme.uid],
            requests: ['request-1'],
          },
          securitySchemes: [oauthScheme],
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['oauth-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'OAuth API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                security: [{ oauth2: ['read:users'] }],
              },
            },
          },
          components: {
            securitySchemes: {
              oauth2: {
                type: 'oauth2',
                flows: {
                  authorizationCode: {
                    authorizationUrl: 'https://example.com/oauth/authorize',
                    tokenUrl: 'https://example.com/oauth/token',
                    refreshUrl: '',
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
      })

      it('transforms a request with empty security (no authentication required)', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/public',
          method: 'get',
          summary: 'Public endpoint',
          security: [],
        })

        const legacyData = createLegacyData({
          title: 'Public API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['public-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Public API', version: '1.0.0' },
          paths: {
            '/public': {
              get: {
                summary: 'Public endpoint',
                security: [],
              },
            },
          },
        })
      })

      it('handles request with no security field', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('transforms different security requirements across multiple requests', async () => {
        const apiKeyScheme = securitySchemeSchema.parse({
          uid: 'security-1',
          nameKey: 'api-key',
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          value: 'key-123',
        })

        const bearerScheme = securitySchemeSchema.parse({
          uid: 'security-2',
          nameKey: 'bearer-auth',
          type: 'http',
          scheme: 'bearer',
          token: 'token-456',
        })

        const publicRequest = requestSchema.parse({
          uid: 'request-1',
          path: '/public',
          method: 'get',
          summary: 'Public endpoint',
          security: [],
        })

        const apiKeyRequest = requestSchema.parse({
          uid: 'request-2',
          path: '/api-key-protected',
          method: 'get',
          summary: 'API key protected',
          security: [{ 'api-key': [] }],
        })

        const bearerRequest = requestSchema.parse({
          uid: 'request-3',
          path: '/bearer-protected',
          method: 'get',
          summary: 'Bearer protected',
          security: [{ 'bearer-auth': [] }],
        })

        const legacyData = createLegacyData({
          title: 'Mixed Security API',
          collection: {
            securitySchemes: [apiKeyScheme.uid, bearerScheme.uid],
            requests: ['request-1', 'request-2', 'request-3'],
          },
          securitySchemes: [apiKeyScheme, bearerScheme],
          requests: [publicRequest, apiKeyRequest, bearerRequest],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['mixed-security-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Mixed Security API', version: '1.0.0' },
          paths: {
            '/public': {
              get: {
                summary: 'Public endpoint',
                security: [],
              },
            },
            '/api-key-protected': {
              get: {
                summary: 'API key protected',
                security: [{ 'api-key': [] }],
              },
            },
            '/bearer-protected': {
              get: {
                summary: 'Bearer protected',
                security: [{ 'bearer-auth': [] }],
              },
            },
          },
          components: {
            securitySchemes: {
              'api-key': {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header',
              },
              'bearer-auth': {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
        })
      })
    })

    describe('request with scalar extensions', () => {
      it('preserves x-scalar-stability extension', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/experimental',
          method: 'get',
          summary: 'Experimental endpoint',
          'x-scalar-stability': 'experimental',
        })

        const legacyData = createLegacyData({
          title: 'Experimental API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['experimental-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Experimental API', version: '1.0.0' },
          paths: {
            '/experimental': {
              get: {
                summary: 'Experimental endpoint',
                'x-scalar-stability': 'experimental',
              },
            },
          },
        })
      })

      it('preserves x-internal extension', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/internal',
          method: 'get',
          summary: 'Internal endpoint',
          'x-internal': true,
        })

        const legacyData = createLegacyData({
          title: 'Internal API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['internal-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Internal API', version: '1.0.0' },
          paths: {
            '/internal': {
              get: {
                summary: 'Internal endpoint',
                'x-internal': true,
              },
            },
          },
        })
      })
    })

    describe('request edge cases', () => {
      it('handles requests with no examples', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
              },
            },
          },
        })
      })

      it('filters out non-existent example UIDs from request', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Valid Example',
          parameters: {
            headers: [{ key: 'Accept', value: 'application/json', enabled: true }],
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          examples: ['example-1', 'example-nonexistent'],
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                parameters: [
                  {
                    name: 'Accept',
                    in: 'header',
                    examples: {
                      'Valid Example': { value: 'application/json', 'x-disabled': false },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('handles orphaned examples that do not reference any request', async () => {
        const orphanedExample = requestExampleSchema.parse({
          uid: 'example-orphan',
          requestUid: 'request-nonexistent',
          name: 'Orphaned Example',
          parameters: {
            headers: [{ key: 'Accept', value: '*/*', enabled: true }],
          },
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          requestExamples: [orphanedExample],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {},
        })
      })

      it('handles collections with no requests', async () => {
        const legacyData = createLegacyData({
          title: 'Empty API',
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['empty-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Empty API', version: '1.0.0' },
          paths: {},
        })
      })

      it('handles request with deprecated flag', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/old-endpoint',
          method: 'get',
          summary: 'Old endpoint',
          deprecated: true,
        })

        const legacyData = createLegacyData({
          title: 'Legacy API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['legacy-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Legacy API', version: '1.0.0' },
          paths: {
            '/old-endpoint': {
              get: {
                summary: 'Old endpoint',
                deprecated: true,
              },
            },
          },
        })
      })

      it('defaults empty string path to /', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '',
          method: 'get',
          summary: 'Root endpoint',
        })

        const legacyData = createLegacyData({
          title: 'Root API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['root-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Root API', version: '1.0.0' },
          paths: {
            '/': {
              get: {
                summary: 'Root endpoint',
              },
            },
          },
        })
      })

      it('defaults undefined path to /', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          method: 'get',
          summary: 'Root endpoint',
        })

        const legacyData = createLegacyData({
          title: 'Root API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['root-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Root API', version: '1.0.0' },
          paths: {
            '/': {
              get: {
                summary: 'Root endpoint',
              },
            },
          },
        })
      })
    })

    describe('requests across multiple collections', () => {
      it('transforms requests independently across multiple collections in one workspace', async () => {
        const request1 = requestSchema.parse({
          uid: 'request-1',
          type: 'request',
          path: '/users',
          method: 'get',
          summary: 'Get users from API One',
        })

        const request2 = requestSchema.parse({
          uid: 'request-2',
          type: 'request',
          path: '/products',
          method: 'get',
          summary: 'Get products from API Two',
        })

        const collection1 = collectionSchema.parse({
          uid: 'collection-1',
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0.0' },
          requests: ['request-1'],
        })

        const collection2 = collectionSchema.parse({
          uid: 'collection-2',
          openapi: '3.1.0',
          info: { title: 'API Two', version: '1.0.0' },
          requests: ['request-2'],
        })

        const workspace = workspaceSchema.parse({
          uid: 'workspace-1',
          name: 'Multi Collection Workspace',
          collections: ['collection-1', 'collection-2'],
        })

        const legacyData = createLegacyData({
          workspaces: [workspace],
          collections: [collection1, collection2],
          requests: [request1, request2],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const resultWorkspace = result[0]!

        const doc1 = resultWorkspace.workspace.documents['api-one']
        const doc2 = resultWorkspace.workspace.documents['api-two']

        assert(doc1)
        assert(doc2)

        expect(doc1).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users from API One',
              },
            },
          },
        })
        expect(doc2).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'API Two', version: '1.0.0' },
          paths: {
            '/products': {
              get: {
                summary: 'Get products from API Two',
              },
            },
          },
        })
      })
    })

    describe('request with responses and callbacks', () => {
      it('preserves response definitions on the request', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                },
              },
            },
            '404': {
              description: 'Not found',
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Users API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['users-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          paths: {
            '/users': {
              get: {
                summary: 'Get users',
                responses: {
                  '200': {
                    description: 'Successful response',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: { type: 'object' },
                        },
                      },
                    },
                  },
                  '404': {
                    description: 'Not found',
                  },
                },
              },
            },
          },
        })
      })

      it('preserves callbacks on the request', async () => {
        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/subscribe',
          method: 'post',
          summary: 'Subscribe to webhooks',
          callbacks: {
            onData: {
              '{$request.body#/callbackUrl}': {
                post: {
                  requestBody: {
                    content: {
                      'application/json': {
                        schema: { type: 'object' },
                      },
                    },
                  },
                  responses: {
                    '200': {
                      description: 'Callback received',
                    },
                  },
                },
              },
            },
          },
        })

        const legacyData = createLegacyData({
          title: 'Webhook API',
          collection: { requests: ['request-1'] },
          requests: [request],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['webhook-api']

        assert(doc)
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Webhook API', version: '1.0.0' },
          paths: {
            '/subscribe': {
              post: {
                summary: 'Subscribe to webhooks',
                callbacks: {
                  onData: {
                    '{$request.body#/callbackUrl}': {
                      post: {
                        requestBody: {
                          content: {
                            'application/json': {
                              schema: { type: 'object' },
                            },
                          },
                        },
                        responses: {
                          '200': {
                            description: 'Callback received',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      })
    })

    describe('circular documents', () => {
      it('migrates collection with self-referencing circular schema (tree node)', async () => {
        const treeNodeSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: {} as Record<string, unknown>,
            },
          },
        }

        const legacyData = createLegacyData({
          title: 'Tree API',
          collection: {
            components: {
              schemas: {
                TreeNode: treeNodeSchema,
              },
            },
          },
        })

        // @ts-expect-error: Yolo
        legacyData.records.collections['collection-1'].components.schemas.TreeNode.properties.children.items =
          // @ts-expect-error: Yolo
          legacyData.records.collections['collection-1'].components.schemas.TreeNode

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['tree-api']
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: {
            title: 'Tree API',
            version: '1.0.0',
          },
          servers: [],
          paths: {},
          components: {
            schemas: {
              TreeNode: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  children: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/TreeNode',
                    },
                  },
                },
              },
            },
          },
          security: [],
          tags: [],
        })
      })

      it('migrates collection with mutually circular schemas (person and company)', async () => {
        const personSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            employer: {
              type: 'object',
              properties: {
                companyName: { type: 'string' },
                employees: {
                  type: 'array',
                  items: {} as Record<string, unknown>,
                },
              },
            },
          },
        }

        const legacyData = createLegacyData({
          title: 'People API',
          collection: {
            components: {
              schemas: {
                Person: personSchema,
              },
            },
          },
        })

        // @ts-expect-error: Yolo
        legacyData.records.collections[
          'collection-1'
        ].components.schemas.Person.properties.employer.properties.employees.items =
          // @ts-expect-error: Yolo
          legacyData.records.collections['collection-1'].components.schemas.Person

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['people-api']
        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'People API', version: '1.0.0' },
          servers: [],
          paths: {},
          components: {
            schemas: {
              Person: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  employer: {
                    type: 'object',
                    properties: {
                      companyName: { type: 'string' },
                      employees: { type: 'array', items: { $ref: '#/components/schemas/Person' } },
                    },
                  },
                },
              },
            },
            securitySchemes: {},
          },
          security: [],
          tags: [],
        })
      })

      it('migrates request with complex circular request body (planets with nested satellites)', async () => {
        const example = requestExampleSchema.parse({
          uid: 'example-1',
          requestUid: 'request-1',
          name: 'Create Planet',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: '{"name": "Earth", "satellites": [{"name": "Moon", "satellites": []}]}',
            },
          },
        })

        const request = requestSchema.parse({
          uid: 'request-1',
          path: '/planets',
          method: 'post',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  additionalProperties: false,
                  description: 'A planet in the Scalar Galaxy',
                  properties: {
                    atmosphere: {
                      type: 'array',
                      description: 'Atmospheric composition',
                      items: {},
                    },
                    creator: {
                      description: 'A user',
                      type: 'object',
                      val: {},
                      properties: {},
                    },
                    description: {
                      type: 'array',
                      examples: [['A planet in the Scalar Galaxy']],
                    },
                    discoveredAt: {
                      type: 'string',
                      format: 'date-time',
                      examples: ['2024-01-01T00:00:00Z'],
                    },
                    failureCallbackURL: {
                      type: 'string',
                      format: 'url',
                      description: 'URL which gets invoked upon a failed operation',
                      examples: ['https://example.com/callback'],
                    },
                    habitabilityIndex: {
                      type: 'number',
                      format: 'float',
                      minimum: 0,
                      maximum: 1,
                      description: 'A score from 0 to 1 indicating potential habitability',
                      examples: [0.8],
                    },
                    id: {
                      type: 'integer',
                      format: 'int64',
                      readOnly: true,
                      examples: [1],
                      'x-variable': 'planetId',
                    },
                    image: {
                      type: 'array',
                      examples: [['https://example.com/planet.jpg']],
                    },
                    lastUpdated: {
                      type: 'string',
                      format: 'date-time',
                      readOnly: true,
                      examples: ['2024-01-01T00:00:00Z'],
                    },
                    name: {
                      type: 'string',
                      examples: ['Earth'],
                    },
                    physicalProperties: {
                      type: 'object',
                      additionalProperties: {},
                      properties: {},
                    },
                    satellites: {
                      type: 'array',
                      description: 'Every satellite in the Scalar Galaxy',
                      items: {},
                    },
                    successCallbackURL: {
                      type: 'string',
                      format: 'url',
                      description: 'URL which gets invoked upon a successful operation',
                      examples: ['https://example.com/callback'],
                    },
                    type: {
                      type: 'string',
                      enum: ['rocky', 'gas', 'ice', 'dwarf'],
                      'x-enum-varnames': ['Rocky', 'Gas', 'Ice', 'Dwarf'],
                      'x-enum-descriptions': {},
                    },
                  },
                  required: ['id', 'name'],
                  type: 'object',
                },
              },
            },
          },
          summary: 'Create a new planet',
          description:
            "It's easy to say you know them all, but do you really know all the planets and check whether you missed one.",
          operationId: 'createPlanet',
          examples: ['example-1'],
        })

        request.requestBody.content['application/json'].schema.properties.satellites.items =
          request.requestBody.content['application/json'].schema

        const legacyData = createLegacyData({
          title: 'Scalar Galaxy',
          collection: { requests: ['request-1'] },
          requests: [request],
          requestExamples: [example],
        })

        const result = await transformLegacyDataToWorkspace(legacyData)
        const doc = result[0]?.workspace.documents['scalar-galaxy']

        expect(doc).toMatchObject({
          openapi: '3.1.0',
          info: { title: 'Scalar Galaxy', version: '1.0.0' },
          servers: [],
          paths: {
            '/planets': {
              post: {
                summary: 'Create a new planet',
                description:
                  "It's easy to say you know them all, but do you really know all the planets and check whether you missed one.",
                operationId: 'createPlanet',
                requestBody: {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/CircularSchema1' },
                      examples: {
                        'Create Planet': {
                          value: '{"name": "Earth", "satellites": [{"name": "Moon", "satellites": []}]}',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            securitySchemes: {},
            schemas: {
              CircularSchema1: {
                additionalProperties: false,
                description: 'A planet in the Scalar Galaxy',
                type: 'object',
                required: ['id', 'name'],
                properties: {
                  atmosphere: {
                    type: 'array',
                    description: 'Atmospheric composition',
                    items: {},
                  },
                  creator: {
                    description: 'A user',
                    type: 'object',
                    val: {},
                    properties: {},
                  },
                  description: {
                    type: 'array',
                    examples: [['A planet in the Scalar Galaxy']],
                  },
                  discoveredAt: {
                    type: 'string',
                    format: 'date-time',
                    examples: ['2024-01-01T00:00:00Z'],
                  },
                  failureCallbackURL: {
                    type: 'string',
                    format: 'url',
                    description: 'URL which gets invoked upon a failed operation',
                    examples: ['https://example.com/callback'],
                  },
                  habitabilityIndex: {
                    type: 'number',
                    format: 'float',
                    minimum: 0,
                    maximum: 1,
                    description: 'A score from 0 to 1 indicating potential habitability',
                    examples: [0.8],
                  },
                  id: {
                    type: 'integer',
                    format: 'int64',
                    readOnly: true,
                    examples: [1],
                    'x-variable': 'planetId',
                  },
                  image: {
                    type: 'array',
                    examples: [['https://example.com/planet.jpg']],
                  },
                  lastUpdated: {
                    type: 'string',
                    format: 'date-time',
                    readOnly: true,
                    examples: ['2024-01-01T00:00:00Z'],
                  },
                  name: {
                    type: 'string',
                    examples: ['Earth'],
                  },
                  physicalProperties: {
                    type: 'object',
                    additionalProperties: {},
                    properties: {},
                  },
                  satellites: {
                    type: 'array',
                    description: 'Every satellite in the Scalar Galaxy',
                    items: {
                      $ref: '#/components/schemas/CircularSchema1',
                    },
                  },
                  successCallbackURL: {
                    type: 'string',
                    format: 'url',
                    description: 'URL which gets invoked upon a successful operation',
                    examples: ['https://example.com/callback'],
                  },
                  type: {
                    type: 'string',
                    enum: ['rocky', 'gas', 'ice', 'dwarf'],
                    'x-enum-varnames': ['Rocky', 'Gas', 'Ice', 'Dwarf'],
                    'x-enum-descriptions': {},
                  },
                },
              },
            },
          },
        })
      })
    })
  })

  describe('document name slugification', () => {
    it('handles multiple documents with the same name by creating unique slugs', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'My API',
          version: '2.0.0',
        },
      })

      const collection3 = collectionSchema.parse({
        uid: 'collection-3',
        openapi: '3.1.0',
        info: {
          title: 'My API',
          version: '3.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2', 'collection-3'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2, collection3],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(3)
      expect(documentNames).toContain('my-api')
      expect(documentNames).toContain('my-api-1')
      expect(documentNames).toContain('my-api-2')

      expect(resultWorkspace.workspace.documents['my-api']?.info.version).toBe('1.0.0')
      expect(resultWorkspace.workspace.documents['my-api-1']?.info.version).toBe('2.0.0')
      expect(resultWorkspace.workspace.documents['my-api-2']?.info.version).toBe('3.0.0')
    })

    it('handles documents with special characters in names', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'API: Special & Chars!',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'API: Special & Chars!',
          version: '2.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(2)
      expect(documentNames).toContain('api-special--chars')
      expect(documentNames).toContain('api-special--chars-1')
    })

    it('handles mix of unique and duplicate document names', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Unique API',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'Duplicate API',
          version: '1.0.0',
        },
      })

      const collection3 = collectionSchema.parse({
        uid: 'collection-3',
        openapi: '3.1.0',
        info: {
          title: 'Duplicate API',
          version: '2.0.0',
        },
      })

      const collection4 = collectionSchema.parse({
        uid: 'collection-4',
        openapi: '3.1.0',
        info: {
          title: 'Another Unique API',
          version: '1.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2', 'collection-3', 'collection-4'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2, collection3, collection4],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(4)
      expect(documentNames).toContain('unique-api')
      expect(documentNames).toContain('duplicate-api')
      expect(documentNames).toContain('duplicate-api-1')
      expect(documentNames).toContain('another-unique-api')

      expect(resultWorkspace.workspace.documents['unique-api']?.info.version).toBe('1.0.0')
      expect(resultWorkspace.workspace.documents['duplicate-api']?.info.version).toBe('1.0.0')
      expect(resultWorkspace.workspace.documents['duplicate-api-1']?.info.version).toBe('2.0.0')
      expect(resultWorkspace.workspace.documents['another-unique-api']?.info.version).toBe('1.0.0')
    })

    it('handles documents without title falling back to default title', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'my-collection',
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'my-collection-2',
        openapi: '3.1.0',
        info: {
          version: '2.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['my-collection', 'my-collection-2'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(2)
      expect(documentNames).toContain('api')
      expect(documentNames).toContain('api-1')
    })

    it('handles duplicate documents when title is missing and defaults to API', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'same-uid',
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'same-uid',
        openapi: '3.1.0',
        info: {
          version: '2.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['same-uid', 'same-uid'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(2)
      expect(documentNames).toContain('api')
      expect(documentNames).toContain('api-1')
    })

    it('handles many duplicate documents with incremental naming', async () => {
      const collections = Array.from({ length: 5 }, (_, i) =>
        collectionSchema.parse({
          uid: `collection-${i}`,
          openapi: '3.1.0',
          info: {
            title: 'Repeated API',
            version: `${i + 1}.0.0`,
          },
        }),
      )

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: collections.map((c) => c.uid),
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections,
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(5)
      expect(documentNames).toContain('repeated-api')
      expect(documentNames).toContain('repeated-api-1')
      expect(documentNames).toContain('repeated-api-2')
      expect(documentNames).toContain('repeated-api-3')
      expect(documentNames).toContain('repeated-api-4')

      expect(resultWorkspace.workspace.documents['repeated-api']?.info.version).toBe('1.0.0')
      expect(resultWorkspace.workspace.documents['repeated-api-1']?.info.version).toBe('2.0.0')
      expect(resultWorkspace.workspace.documents['repeated-api-2']?.info.version).toBe('3.0.0')
      expect(resultWorkspace.workspace.documents['repeated-api-3']?.info.version).toBe('4.0.0')
      expect(resultWorkspace.workspace.documents['repeated-api-4']?.info.version).toBe('5.0.0')
    })

    it('preserves "Drafts" special case normalization with duplicates', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Drafts',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'Drafts',
          version: '2.0.0',
        },
      })

      const workspace = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Test Workspace',
        collections: ['collection-1', 'collection-2'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace],
        collections: [collection1, collection2],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)
      const resultWorkspace = result[0]!

      const documentNames = Object.keys(resultWorkspace.workspace.documents)

      expect(documentNames).toHaveLength(2)
      expect(documentNames).toContain('drafts')
      expect(documentNames).toContain('drafts-1')

      expect(resultWorkspace.workspace.documents['drafts']?.info.version).toBe('1.0.0')
      expect(resultWorkspace.workspace.documents['drafts-1']?.info.version).toBe('2.0.0')
    })

    it('ensures uniqueness is per workspace, not global', async () => {
      const collection1 = collectionSchema.parse({
        uid: 'collection-1',
        openapi: '3.1.0',
        info: {
          title: 'Shared Name API',
          version: '1.0.0',
        },
      })

      const collection2 = collectionSchema.parse({
        uid: 'collection-2',
        openapi: '3.1.0',
        info: {
          title: 'Shared Name API',
          version: '2.0.0',
        },
      })

      const collection3 = collectionSchema.parse({
        uid: 'collection-3',
        openapi: '3.1.0',
        info: {
          title: 'Shared Name API',
          version: '3.0.0',
        },
      })

      const collection4 = collectionSchema.parse({
        uid: 'collection-4',
        openapi: '3.1.0',
        info: {
          title: 'Shared Name API',
          version: '4.0.0',
        },
      })

      const workspace1 = workspaceSchema.parse({
        uid: 'workspace-1',
        name: 'Workspace One',
        collections: ['collection-1', 'collection-2'],
      })

      const workspace2 = workspaceSchema.parse({
        uid: 'workspace-2',
        name: 'Workspace Two',
        collections: ['collection-3', 'collection-4'],
      })

      const legacyData = createLegacyData({
        workspaces: [workspace1, workspace2],
        collections: [collection1, collection2, collection3, collection4],
      })

      const result = await transformLegacyDataToWorkspace(legacyData)

      expect(result).toHaveLength(2)

      const workspace1Result = result[0]!
      const workspace2Result = result[1]!

      const workspace1DocNames = Object.keys(workspace1Result.workspace.documents)
      const workspace2DocNames = Object.keys(workspace2Result.workspace.documents)

      expect(workspace1DocNames).toHaveLength(2)
      expect(workspace1DocNames).toContain('shared-name-api')
      expect(workspace1DocNames).toContain('shared-name-api-1')

      expect(workspace2DocNames).toHaveLength(2)
      expect(workspace2DocNames).toContain('shared-name-api')
      expect(workspace2DocNames).toContain('shared-name-api-1')

      expect(workspace1Result.workspace.documents['shared-name-api']?.info.version).toBe('1.0.0')
      expect(workspace1Result.workspace.documents['shared-name-api-1']?.info.version).toBe('2.0.0')
      expect(workspace2Result.workspace.documents['shared-name-api']?.info.version).toBe('3.0.0')
      expect(workspace2Result.workspace.documents['shared-name-api-1']?.info.version).toBe('4.0.0')
    })
  })
})
