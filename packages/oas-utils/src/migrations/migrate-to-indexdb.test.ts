import type { SecurityScheme } from '@scalar/types/entities'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Cookie } from '@/entities/cookie/cookie'
import type { Environment } from '@/entities/environment/environment'
import type { Collection } from '@/entities/spec/collection'
import type { RequestExample } from '@/entities/spec/request-examples'
import type { Request } from '@/entities/spec/requests'
import type { Server } from '@/entities/spec/server'
import type { Tag } from '@/entities/spec/spec-objects'
import type { Workspace } from '@/entities/workspace/workspace'

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

  describe('transformLegacyDataToWorkspace', () => {
    /**
     * Test Case 1: Empty Data
     * When there is absolutely no data, should create a minimal default workspace
     */
    describe('empty data scenarios', () => {
      it('should create a default workspace when all arrays are empty', () => {
        const emptyData: v_2_5_0['DataArray'] = {
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
          workspaces: [],
        }

        const result = transformLegacyDataToWorkspace(emptyData)

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
          id: 'default',
          name: 'Default Workspace',
          workspace: {
            meta: {},
            documents: {
              default: {
                openapi: '3.1.0',
                info: {
                  title: 'API',
                  version: '1.0',
                },
                paths: {},
              },
            },
            originalDocuments: {},
            intermediateDocuments: {},
            overrides: {},
            documentConfigs: {
              default: {
                selectedServerUid: null,
              },
            },
          },
        })
      })
    })

    /**
     * Test Case 2: Workspace Entity Coverage
     * Test all Workspace type fields
     */
    describe('workspace entity type coverage', () => {
      it('should handle workspace with all required fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test Description',
          collections: [],
          environments: {},
          activeEnvironmentId: 'env-1',
          cookies: [],
          proxyUrl: 'https://proxy.example.com',
          themeId: 'deepSpace',
          selectedHttpClient: {
            targetKey: 'javascript',
            clientKey: 'fetch',
          },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
        expect(result[0]!.name).toBe('Test Workspace')
        expect(result[0]!.workspace.meta['x-scalar-active-environment']).toBe('env-1')
        expect(result[0]!.workspace.meta['x-scalar-active-proxy']).toBe('https://proxy.example.com')
        expect(result[0]!.workspace.meta['x-scalar-theme']).toBe('deepSpace')
      })

      it('should handle workspace with minimal fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-minimal' as any,
          name: 'Minimal Workspace',
          description: 'Basic Scalar Workspace',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-minimal')
        // activeEnvironmentId has a default value of 'default', so it will be in meta
        expect(result[0]!.workspace.meta['x-scalar-active-environment']).toBe('default')
        expect(result[0]!.workspace.meta).not.toHaveProperty('x-scalar-active-proxy')
        // themeId has a default value of 'default', so it will be in meta
        expect(result[0]!.workspace.meta['x-scalar-theme']).toBe('default')
      })

      it('should handle workspace without name (fallback to default)', () => {
        const workspace: Workspace = {
          uid: 'workspace-no-name' as any,
          name: '',
          description: 'Basic Scalar Workspace',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: {
            targetKey: 'shell',
            clientKey: 'curl',
          },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.name).toBe('Workspace')
      })

      it('should handle multiple workspaces', () => {
        const workspace1: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Workspace One',
          description: 'First workspace',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const workspace2: Workspace = {
          uid: 'workspace-2' as any,
          name: 'Workspace Two',
          description: 'Second workspace',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace1, workspace2],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(2)
        expect(result[0]!.id).toBe('workspace-1')
        expect(result[1]!.id).toBe('workspace-2')
      })
    })

    /**
     * Test Case 3: Collection Entity Coverage
     * Test all Collection type fields and transformations
     */
    describe('collection entity type coverage', () => {
      it('should transform collection with all fields to document', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: {
            title: 'Test API',
            version: '2.0.0',
            description: 'Test API Description',
            summary: 'Test Summary',
          },
          security: [{ apiKey: [] }],
          components: {
            schemas: {
              User: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
          },
          webhooks: {
            newUser: {
              post: {
                summary: 'New user webhook',
              },
            },
          },
          externalDocs: {
            url: 'https://docs.example.com',
            description: 'External docs',
          },
          'x-scalar-icon': 'custom-icon',
          'x-scalar-environments': {
            'env-1': {
              variables: {
                baseUrl: 'https://api.prod.com',
              },
            },
          },
          'x-scalar-secrets': {
            'secret-1': {
              example: 'secret-value',
            },
          },
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        const document = result[0]!.workspace.documents['Test API']
        expect(document).toBeDefined()
        expect(document.openapi).toBe('3.1.0')
        expect(document.info.title).toBe('Test API')
        expect(document.info.version).toBe('2.0.0')
        expect(document.info.description).toBe('Test API Description')
        expect(document.components).toEqual(collection.components)
        expect(document.security).toEqual(collection.security)
        expect(document.webhooks).toEqual(collection.webhooks)
        expect(document.externalDocs).toEqual(collection.externalDocs)
        expect(document['x-scalar-icon']).toBe('custom-icon')
        expect(document['x-scalar-environments']).toEqual(collection['x-scalar-environments'])
        expect(document['x-scalar-secrets']).toEqual(collection['x-scalar-secrets'])
      })

      it('should handle collection without info.title (fallback to uid)', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-no-title' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: {
            title: '',
            version: '1.0',
          },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['collection-no-title']).toBeDefined()
      })

      it('should handle collection with minimal fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-minimal' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: {
            title: 'Minimal API',
            version: '1.0',
          },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        const document = result[0]!.workspace.documents['Minimal API']
        expect(document).toBeDefined()
        expect(document.openapi).toBe('3.1.0')
        expect(document.info.title).toBe('Minimal API')
        expect(document.servers).toEqual([])
        expect(document.paths).toEqual({})
        expect(document.components).toEqual({})
        expect(document.security).toEqual([])
        expect(document.tags).toEqual([])
      })

      it('should handle multiple collections', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection1: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const collection2: Collection = {
          uid: 'collection-2' as any,
          type: 'collection',
          openapi: '3.0.0',
          info: { title: 'API Two', version: '2.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection1, collection2],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(Object.keys(result[0]!.workspace.documents)).toHaveLength(2)
        expect(result[0]!.workspace.documents['API One']).toBeDefined()
        expect(result[0]!.workspace.documents['API Two']).toBeDefined()
      })

      it('should set first collection as active document in meta', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'First API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-active-document']).toBe('First API')
      })
    })

    /**
     * Test Case 4: Environment Entity Coverage
     * Test all Environment type fields
     */
    describe('environment entity type coverage', () => {
      it('should transform environments to meta with all fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const environment: Environment = {
          uid: 'env-1' as any,
          name: 'Production',
          color: '#00FF00',
          value: 'https://api.prod.com',
          isDefault: true,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [environment],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-environments']).toEqual({
          'env-1': {
            name: 'Production',
            value: 'https://api.prod.com',
          },
        })
      })

      it('should handle environment with minimal fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const environment: Environment = {
          uid: 'env-minimal' as any,
          name: 'Default Environment',
          color: '#FFFFFF',
          value: '',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [environment],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-environments']).toEqual({
          'env-minimal': {
            name: 'Default Environment',
            value: '',
          },
        })
      })

      it('should handle multiple environments', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const env1: Environment = {
          uid: 'env-1' as any,
          name: 'Development',
          color: '#0000FF',
          value: 'https://api.dev.com',
        }

        const env2: Environment = {
          uid: 'env-2' as any,
          name: 'Staging',
          color: '#FFFF00',
          value: 'https://api.staging.com',
        }

        const env3: Environment = {
          uid: 'env-3' as any,
          name: 'Production',
          color: '#00FF00',
          value: 'https://api.prod.com',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [env1, env2, env3],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(Object.keys(result[0]!.workspace.meta['x-scalar-environments'])).toHaveLength(3)
        expect(result[0]!.workspace.meta['x-scalar-environments']['env-1']).toEqual({
          name: 'Development',
          value: 'https://api.dev.com',
        })
        expect(result[0]!.workspace.meta['x-scalar-environments']['env-2']).toEqual({
          name: 'Staging',
          value: 'https://api.staging.com',
        })
        expect(result[0]!.workspace.meta['x-scalar-environments']['env-3']).toEqual({
          name: 'Production',
          value: 'https://api.prod.com',
        })
      })

      it('should handle environment without value field (fallback to empty string)', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const environment: Environment = {
          uid: 'env-no-value' as any,
          name: 'No Value Env',
          color: '#FFFFFF',
          value: '',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [environment],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-environments']['env-no-value'].value).toBe('')
      })
    })

    /**
     * Test Case 5: Cookie Entity Coverage
     * Test all Cookie type fields
     */
    describe('cookie entity type coverage', () => {
      it('should transform cookies to meta with all fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const cookie: Cookie = {
          uid: 'cookie-1' as any,
          name: 'session_token',
          value: 'abc123xyz',
          domain: '.example.com',
          path: '/',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [cookie],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-cookies']).toEqual({
          'cookie-1': {
            name: 'session_token',
            value: 'abc123xyz',
            domain: '.example.com',
            path: '/',
          },
        })
      })

      it('should handle cookie with minimal fields', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const cookie: Cookie = {
          uid: 'cookie-minimal' as any,
          name: 'simple_cookie',
          value: 'value123',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [cookie],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-cookies']['cookie-minimal']).toEqual({
          name: 'simple_cookie',
          value: 'value123',
          domain: undefined,
          path: undefined,
        })
      })

      it('should handle multiple cookies', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const cookie1: Cookie = {
          uid: 'cookie-1' as any,
          name: 'auth_token',
          value: 'token1',
          domain: '.example.com',
          path: '/',
        }

        const cookie2: Cookie = {
          uid: 'cookie-2' as any,
          name: 'user_pref',
          value: 'dark_mode',
          domain: '.example.com',
          path: '/app',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [cookie1, cookie2],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(Object.keys(result[0]!.workspace.meta['x-scalar-cookies'])).toHaveLength(2)
        expect(result[0]!.workspace.meta['x-scalar-cookies']['cookie-1'].name).toBe('auth_token')
        expect(result[0]!.workspace.meta['x-scalar-cookies']['cookie-2'].name).toBe('user_pref')
      })

      it('should handle cookie with empty name and value', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const cookie: Cookie = {
          uid: 'cookie-empty' as any,
          name: '',
          value: '',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [cookie],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-cookies']['cookie-empty']).toEqual({
          name: '',
          value: '',
          domain: undefined,
          path: undefined,
        })
      })
    })

    /**
     * Test Case 6: Collections without Workspace
     * Edge case where collections exist but no workspace
     */
    describe('collections without workspace scenarios', () => {
      it('should create default workspace when collections exist but no workspace', () => {
        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Orphan API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('default')
        expect(result[0]!.name).toBe('Default Workspace')
        expect(result[0]!.workspace.documents['Orphan API']).toBeDefined()
      })

      it('should handle multiple collections without workspace', () => {
        const collection1: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'API One', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const collection2: Collection = {
          uid: 'collection-2' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'API Two', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [],
          collections: [collection1, collection2],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('default')
        expect(Object.keys(result[0]!.workspace.documents)).toHaveLength(2)
      })

      it('should include environments and cookies in default workspace', () => {
        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const environment: Environment = {
          uid: 'env-1' as any,
          name: 'Production',
          color: '#00FF00',
          value: 'https://api.prod.com',
        }

        const cookie: Cookie = {
          uid: 'cookie-1' as any,
          name: 'session',
          value: 'xyz',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [],
          collections: [collection],
          cookies: [cookie],
          environments: [environment],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-environments']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-cookies']).toBeDefined()
      })
    })

    /**
     * Test Case 7: Complex Integration Scenarios
     * Test combinations of multiple entity types
     */
    describe('complex integration scenarios', () => {
      it('should handle workspace with all entity types', () => {
        const workspace: Workspace = {
          uid: 'workspace-full' as any,
          name: 'Full Workspace',
          description: 'Complete workspace',
          collections: [],
          environments: {},
          activeEnvironmentId: 'env-prod',
          cookies: [],
          proxyUrl: 'https://proxy.example.com',
          themeId: 'deepSpace',
          selectedHttpClient: { targetKey: 'javascript', clientKey: 'axios' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: {
            title: 'Complete API',
            version: '1.0.0',
            description: 'Full featured API',
          },
          security: [{ bearerAuth: [] }],
          components: {
            schemas: {
              User: { type: 'object' },
            },
          },
          'x-scalar-icon': 'api-icon',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const environment: Environment = {
          uid: 'env-prod' as any,
          name: 'Production',
          color: '#00FF00',
          value: 'https://api.prod.com',
          isDefault: true,
        }

        const cookie: Cookie = {
          uid: 'cookie-auth' as any,
          name: 'auth_token',
          value: 'secret123',
          domain: '.example.com',
          path: '/',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [cookie],
          environments: [environment],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-full')
        expect(result[0]!.name).toBe('Full Workspace')
        expect(result[0]!.workspace.documents['Complete API']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-active-environment']).toBe('env-prod')
        expect(result[0]!.workspace.meta['x-scalar-active-proxy']).toBe('https://proxy.example.com')
        expect(result[0]!.workspace.meta['x-scalar-theme']).toBe('deepSpace')
        expect(result[0]!.workspace.meta['x-scalar-environments']['env-prod']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-cookies']['cookie-auth']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-active-document']).toBe('Complete API')
      })

      it('should handle workspace with multiple collections, environments, and cookies', () => {
        const workspace: Workspace = {
          uid: 'workspace-multi' as any,
          name: 'Multi Workspace',
          description: 'Multiple entities',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collections: Collection[] = [
          {
            uid: 'col-1' as any,
            type: 'collection',
            openapi: '3.1.0',
            info: { title: 'API 1', version: '1.0' },
            security: [],
            'x-scalar-icon': 'interface-content-folder',
            securitySchemes: [],
            selectedSecuritySchemeUids: [],
            servers: [],
            requests: [],
            tags: [],
            children: [],
            watchMode: false,
            watchModeStatus: 'IDLE',
            useCollectionSecurity: false,
          },
          {
            uid: 'col-2' as any,
            type: 'collection',
            openapi: '3.1.0',
            info: { title: 'API 2', version: '1.0' },
            security: [],
            'x-scalar-icon': 'interface-content-folder',
            securitySchemes: [],
            selectedSecuritySchemeUids: [],
            servers: [],
            requests: [],
            tags: [],
            children: [],
            watchMode: false,
            watchModeStatus: 'IDLE',
            useCollectionSecurity: false,
          },
        ]

        const environments: Environment[] = [
          { uid: 'env-1' as any, name: 'Dev', color: '#0000FF', value: 'https://dev.com' },
          { uid: 'env-2' as any, name: 'Prod', color: '#00FF00', value: 'https://prod.com' },
        ]

        const cookies: Cookie[] = [
          { uid: 'cookie-1' as any, name: 'c1', value: 'v1' },
          { uid: 'cookie-2' as any, name: 'c2', value: 'v2' },
        ]

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections,
          cookies,
          environments,
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(Object.keys(result[0]!.workspace.documents)).toHaveLength(2)
        expect(Object.keys(result[0]!.workspace.meta['x-scalar-environments'])).toHaveLength(2)
        expect(Object.keys(result[0]!.workspace.meta['x-scalar-cookies'])).toHaveLength(2)
      })
    })

    /**
     * Test Case 8: Request, RequestExample, Server, Tag, SecurityScheme Coverage
     * These entities are not directly transformed but should be tested for completeness
     */
    describe('additional entity types (not directly transformed)', () => {
      it('should handle data with Request entities present', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const request: Request = {
          uid: 'request-1' as any,
          type: 'request',
          path: '/users',
          method: 'get',
          summary: 'Get users',
          description: 'Retrieve all users',
          tags: ['users'],
          servers: [],
          selectedServerUid: null,
          examples: [],
          selectedSecuritySchemeUids: [],
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [request],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // Requests are not directly transformed, but should not cause errors
        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
      })

      it('should handle data with RequestExample entities present', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const requestExample: RequestExample = {
          uid: 'example-1' as any,
          type: 'requestExample',
          requestUid: 'request-1' as any,
          name: 'Example 1',
          body: {
            activeBody: 'raw',
            raw: {
              encoding: 'json',
              value: '{"test": "data"}',
            },
          },
          parameters: {
            path: [],
            query: [],
            headers: [{ key: 'Accept', value: '*/*', enabled: true }],
            cookies: [],
          },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [requestExample],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // Request examples are not directly transformed, but should not cause errors
        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
      })

      it('should handle data with Server entities present', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const server: Server = {
          uid: 'server-1' as any,
          url: 'https://api.example.com',
          description: 'Production server',
          variables: {
            version: {
              default: 'v1',
              enum: ['v1', 'v2'],
              description: 'API version',
              value: 'v1',
            },
          },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [server],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // Servers are not directly transformed, but should not cause errors
        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
      })

      it('should handle data with Tag entities present', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const tag: Tag = {
          uid: 'tag-1' as any,
          type: 'tag',
          name: 'Users',
          description: 'User management endpoints',
          externalDocs: {
            url: 'https://docs.example.com/users',
            description: 'User docs',
          },
          children: [],
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [tag],
        }

        const result = transformLegacyDataToWorkspace(data)

        // Tags are not directly transformed, but should not cause errors
        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
      })

      it('should handle data with SecurityScheme entities present', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const securityScheme: SecurityScheme = {
          uid: 'security-1' as any,
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication',
          nameKey: 'bearerAuth',
          username: '',
          password: '',
          token: '',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [securityScheme],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // Security schemes are not directly transformed, but should not cause errors
        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-1')
      })

      it('should handle data with all entity types present', () => {
        const workspace: Workspace = {
          uid: 'workspace-all' as any,
          name: 'All Entities Workspace',
          description: 'Test all',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Test API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const environment: Environment = {
          uid: 'env-1' as any,
          name: 'Prod',
          color: '#00FF00',
          value: 'https://api.com',
        }

        const cookie: Cookie = {
          uid: 'cookie-1' as any,
          name: 'session',
          value: 'abc',
        }

        const request: Request = {
          uid: 'request-1' as any,
          type: 'request',
          path: '/test',
          method: 'get',
          servers: [],
          selectedServerUid: null,
          examples: [],
          selectedSecuritySchemeUids: [],
        }

        const requestExample: RequestExample = {
          uid: 'example-1' as any,
          type: 'requestExample',
          name: 'Test Example',
          body: { activeBody: 'raw' },
          parameters: {
            path: [],
            query: [],
            headers: [{ key: 'Accept', value: '*/*', enabled: true }],
            cookies: [],
          },
        }

        const server: Server = {
          uid: 'server-1' as any,
          url: 'https://api.example.com',
        }

        const tag: Tag = {
          uid: 'tag-1' as any,
          type: 'tag',
          name: 'Test',
          children: [],
        }

        const securityScheme: SecurityScheme = {
          uid: 'security-1' as any,
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          nameKey: 'bearerAuth',
          username: '',
          password: '',
          token: '',
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [cookie],
          environments: [environment],
          requestExamples: [requestExample],
          requests: [request],
          securitySchemes: [securityScheme],
          servers: [server],
          tags: [tag],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result).toHaveLength(1)
        expect(result[0]!.id).toBe('workspace-all')
        expect(result[0]!.workspace.documents['Test API']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-environments']).toBeDefined()
        expect(result[0]!.workspace.meta['x-scalar-cookies']).toBeDefined()
      })
    })

    /**
     * Test Case 9: Edge Cases and Error Handling
     */
    describe('edge cases and error handling', () => {
      it('should handle collection with OpenAPI 3.0.0', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.0.0',
          info: { title: 'Old API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['Old API'].openapi).toBe('3.0.0')
      })

      it('should handle collection without openapi field (fallback to 3.1.0)', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Partial<Collection> = {
          uid: 'collection-1' as any,
          type: 'collection',
          info: { title: 'No Version API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection as Collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['No Version API'].openapi).toBe('3.1.0')
      })

      it('should handle collection without info field (fallback to defaults)', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Partial<Collection> = {
          uid: 'collection-no-info' as any,
          type: 'collection',
          openapi: '3.1.0',
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection as Collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        const document = result[0]!.workspace.documents['collection-no-info']
        expect(document.info.title).toBe('collection-no-info')
        expect(document.info.version).toBe('1.0')
      })

      it('should handle workspace without activeEnvironmentId', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // activeEnvironmentId has a default value of 'default', so it will always be present
        expect(result[0]!.workspace.meta['x-scalar-active-environment']).toBe('default')
      })

      it('should handle workspace without proxyUrl', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.meta['x-scalar-active-proxy']).toBeUndefined()
      })

      it('should handle workspace without themeId', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        // themeId has a default value of 'default', so it will always be present
        expect(result[0]!.workspace.meta['x-scalar-theme']).toBe('default')
      })

      it('should create documentConfigs for all documents', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection1: Collection = {
          uid: 'col-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'API 1', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const collection2: Collection = {
          uid: 'col-2' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'API 2', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection1, collection2],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(Object.keys(result[0]!.workspace.documentConfigs)).toHaveLength(2)
        expect(result[0]!.workspace.documentConfigs['API 1']).toEqual({
          selectedServerUid: null,
        })
        expect(result[0]!.workspace.documentConfigs['API 2']).toEqual({
          selectedServerUid: null,
        })
      })

      it('should initialize originalDocuments, intermediateDocuments, and overrides as empty objects', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.originalDocuments).toEqual({})
        expect(result[0]!.workspace.intermediateDocuments).toEqual({})
        expect(result[0]!.workspace.overrides).toEqual({})
      })
    })

    /**
     * Test Case 10: Collection with special OpenAPI extensions
     */
    describe('collection with special extensions', () => {
      it('should preserve x-scalar-icon in document', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Icon API', version: '1.0' },
          'x-scalar-icon': 'custom-icon-name',
          security: [],
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['Icon API']['x-scalar-icon']).toBe('custom-icon-name')
      })

      it('should preserve x-scalar-environments in document', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Env API', version: '1.0' },
          'x-scalar-environments': {
            'env-1': {
              variables: {
                baseUrl: 'http://localhost:3000',
              },
            },
          },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['Env API']['x-scalar-environments']).toEqual({
          'env-1': {
            variables: {
              baseUrl: 'http://localhost:3000',
            },
          },
        })
      })

      it('should preserve x-scalar-secrets in document', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Secrets API', version: '1.0' },
          'x-scalar-secrets': {
            'secret-1': {
              description: 'API Key',
              example: 'secret-value',
            },
          },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        expect(result[0]!.workspace.documents['Secrets API']['x-scalar-secrets']).toEqual({
          'secret-1': {
            description: 'API Key',
            example: 'secret-value',
          },
        })
      })

      it('should handle collection with undefined optional extensions', () => {
        const workspace: Workspace = {
          uid: 'workspace-1' as any,
          name: 'Test Workspace',
          description: 'Test',
          collections: [],
          environments: {},
          activeEnvironmentId: 'default',
          cookies: [],
          themeId: 'default',
          selectedHttpClient: { targetKey: 'shell', clientKey: 'curl' },
        }

        const collection: Collection = {
          uid: 'collection-1' as any,
          type: 'collection',
          openapi: '3.1.0',
          info: { title: 'Plain API', version: '1.0' },
          security: [],
          'x-scalar-icon': 'interface-content-folder',
          securitySchemes: [],
          selectedSecuritySchemeUids: [],
          servers: [],
          requests: [],
          tags: [],
          children: [],
          watchMode: false,
          watchModeStatus: 'IDLE',
          useCollectionSecurity: false,
        }

        const data: v_2_5_0['DataArray'] = {
          workspaces: [workspace],
          collections: [collection],
          cookies: [],
          environments: [],
          requestExamples: [],
          requests: [],
          securitySchemes: [],
          servers: [],
          tags: [],
        }

        const result = transformLegacyDataToWorkspace(data)

        const document = result[0]!.workspace.documents['Plain API']
        // x-scalar-icon has a default value, so it will always be present
        expect(document['x-scalar-icon']).toBe('interface-content-folder')
        expect(document['x-scalar-environments']).toBeUndefined()
        expect(document['x-scalar-secrets']).toBeUndefined()
      })
    })
  })
})
