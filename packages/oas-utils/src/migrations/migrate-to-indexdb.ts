import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceMeta } from '@scalar/workspace-store/schemas/workspace'

import { DATA_VERSION_LS_LEY } from '@/migrations/data-version'
import { migrator } from '@/migrations/migrator'
import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

const MIGRATION_FLAG_KEY = 'scalar_indexdb_migration_complete'

/**
 * Checks if migration is needed by verifying the completion flag and presence of old data.
 */
export const shouldMigrateToIndexDb = (): boolean => {
  // Check if migration already completed
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
    return false
  }

  // Check if there is any old data in localStorage
  const hasOldData =
    localStorage.getItem('workspace') !== null ||
    localStorage.getItem('collection') !== null ||
    localStorage.getItem('request') !== null

  return hasOldData
}

/**
 * Transforms legacy localStorage data into IndexedDB workspace structure.
 *
 * Transformations:
 * - Collections → Documents (collections were OpenAPI specs)
 * - Environments → x-scalar-environments in meta
 * - Cookies → x-scalar-cookies in meta
 * - Workspace properties → meta extensions (activeEnvironmentId, proxyUrl, themeId)
 *
 * Creates a default workspace if none exist. Falls back to collection uid if info.title is missing.
 */
export const transformLegacyDataToWorkspace = (
  legacyData: v_2_5_0['DataArray'],
): Array<{ id: string; name: string; workspace: InMemoryWorkspace }> => {
  const workspaceMap = new Map<
    string,
    {
      id: string
      name: string
      workspace: InMemoryWorkspace
    }
  >()

  // If we have workspaces, process each one
  if (legacyData.workspaces.length > 0) {
    legacyData.workspaces.forEach((workspace) => {
      // Find collections that belong to this workspace
      // In the old system, collections are essentially OpenAPI documents
      const workspaceCollections = legacyData.collections.filter((collection) =>
        workspace.collections.includes(collection.uid),
      )

      // Create documents from collections
      // Each collection becomes a document in the new system
      const documents: Record<string, OpenApiDocument> = {}

      workspaceCollections.forEach((collection) => {
        // The collection IS the OpenAPI document (not wrapped in a spec property)
        const documentName = collection.info?.title || collection.uid

        documents[documentName] = coerceValue(OpenAPIDocumentSchema, {
          openapi: collection.openapi || '3.1.0',
          info: collection.info || {
            title: documentName,
            version: '1.0',
          },
          servers: [],
          paths: {},
          components: collection.components || {},
          security: collection.security || [],
          tags: [],
          webhooks: collection.webhooks,
          externalDocs: collection.externalDocs,
          // Preserve scalar extensions
          'x-scalar-icon': collection['x-scalar-icon'],
          'x-scalar-environments': collection['x-scalar-environments'],
          'x-scalar-secrets': collection['x-scalar-secrets'],
          'x-scalar-original-document-hash': '',
        })
      })

      // Build workspace meta from old workspace data
      const meta: WorkspaceMeta & {
        'x-scalar-environments'?: Record<string, XScalarEnvironment>
        'x-scalar-active-environment'?: string
        'x-scalar-cookies'?: XScalarCookie[]
        'x-scalar-active-proxy'?: string
        'x-scalar-active-document'?: string
      } = {}

      // Map old workspace properties to new meta structure
      // Note: activeCollection was removed in favor of activeDocument
      // We will set the first collection as active if it exists
      if (workspaceCollections.length > 0) {
        const firstCollection = workspaceCollections[0]
        if (firstCollection) {
          const documentName = firstCollection.info?.title || firstCollection.uid
          meta['x-scalar-active-document'] = documentName
        }
      }

      // Add environments to meta
      if (legacyData.environments.length > 0) {
        meta['x-scalar-environments'] = legacyData.environments.reduce(
          (acc, env) => {
            acc[env.uid] = {
              color: env.color || '#FFFFFF',
              variables: [
                {
                  name: env.name || 'Default Environment',
                  // Old environment structure had a 'value' field, not 'variables'
                  value: env.value || '',
                },
              ],
            }
            return acc
          },
          {} as Record<string, XScalarEnvironment>,
        )
      }

      // Add active environment
      if (workspace.activeEnvironmentId) {
        meta['x-scalar-active-environment'] = workspace.activeEnvironmentId
      }

      // Add cookies to meta
      if (legacyData.cookies.length > 0) {
        meta['x-scalar-cookies'] = legacyData.cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
        }))
      }

      // Add proxy URL if present
      if (workspace.proxyUrl) {
        meta['x-scalar-active-proxy'] = workspace.proxyUrl
      }

      // Add theme if present
      if (workspace.themeId) {
        meta['x-scalar-theme'] = workspace.themeId
      }

      workspaceMap.set(workspace.uid, {
        id: workspace.uid,
        name: workspace.name || 'Workspace',
        workspace: {
          meta,
          documents,
          originalDocuments: {},
          intermediateDocuments: {},
          overrides: {},
          documentConfigs: Object.keys(documents).reduce(
            (acc, docName) => {
              acc[docName] = {}
              return acc
            },
            {} as Record<string, Config>,
          ),
        },
      })
    })
  }

  // Handle case where there are collections but no workspace
  if (workspaceMap.size === 0 && legacyData.collections.length > 0) {
    const documents: Record<string, OpenApiDocument> = {}

    legacyData.collections.forEach((collection) => {
      const documentName = collection.info?.title || collection.uid

      documents[documentName] = {
        openapi: collection.openapi || '3.1.0',
        info: collection.info || {
          title: documentName,
          version: '1.0',
        },
        servers: [],
        paths: {},
        components: collection.components || {},
        security: collection.security || [],
        tags: [],
        webhooks: collection.webhooks,
        externalDocs: collection.externalDocs,
        'x-scalar-icon': collection['x-scalar-icon'],
        'x-scalar-environments': collection['x-scalar-environments'],
        'x-scalar-secrets': collection['x-scalar-secrets'],
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument
    })

    // If still no documents, create a default one
    if (Object.keys(documents).length === 0) {
      documents.default = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0',
        },
        paths: {},
        'x-scalar-original-document-hash': '',
      } as OpenApiDocument
    }

    // Build meta from environments and cookies
    const meta: WorkspaceMeta & {
      'x-scalar-environments'?: Record<string, XScalarEnvironment>
      'x-scalar-cookies'?: XScalarCookie[]
    } = {}

    if (legacyData.environments.length > 0) {
      meta['x-scalar-environments'] = legacyData.environments.reduce(
        (acc, env) => {
          acc[env.uid] = {
            color: env.color || '#FFFFFF',
            variables: [
              {
                name: env.name || 'Default Environment',
                value: env.value || '',
              },
            ],
          }
          return acc
        },
        {} as Record<string, XScalarEnvironment>,
      )
    }

    if (legacyData.cookies.length > 0) {
      meta['x-scalar-cookies'] = legacyData.cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
      }))
    }

    workspaceMap.set('default', {
      id: 'default',
      name: 'Default Workspace',
      workspace: {
        meta,
        documents,
        originalDocuments: {},
        intermediateDocuments: {},
        overrides: {},
        documentConfigs: {},
      },
    })
  }

  // Handle case where there is absolutely no data - create a minimal default workspace
  if (workspaceMap.size === 0) {
    workspaceMap.set('default', {
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
            'x-scalar-original-document-hash': '',
          } as OpenApiDocument,
        },
        originalDocuments: {},
        intermediateDocuments: {},
        overrides: {},
        documentConfigs: {
          default: {},
        },
      },
    })
  }

  return Array.from(workspaceMap.values())
}

/**
 * Marks migration as complete by setting a flag in localStorage.
 * Stored in localStorage (not IndexedDB) to persist even if IndexedDB is cleared.
 */
export const markMigrationComplete = (): void => {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
  console.info('✅ Migration to IndexedDB complete')
}

/**
 * Migrates localStorage data to IndexedDB workspace structure.
 *
 * Called early in app initialization (app-state.ts) before workspace data loads.
 * Idempotent and non-destructive - only runs once, preserves old data.
 *
 * Flow:
 * 1. Check if migration needed
 * 2. Run existing migrations to get latest data structure
 * 3. Transform to new workspace format
 * 4. Save to IndexedDB
 * 5. Mark complete
 *
 * Old data is preserved for rollback. Typically completes in < 1 second.
 */
export const migrateLocalStorageToIndexDb = async (persistence: {
  workspace: {
    setItem: (id: string, value: { name: string; workspace: InMemoryWorkspace }) => Promise<void>
  }
}): Promise<void> => {
  if (!shouldMigrateToIndexDb()) {
    console.info('ℹ️  No migration needed or already completed')
    return
  }

  console.info('🚀 Starting migration from localStorage to IndexedDB...')

  try {
    // Step 1: Run existing migrations to get latest data structure
    const legacyData = migrator()

    console.info(
      `📦 Found legacy data: ${legacyData.workspaces.length} workspace(s), ${legacyData.collections.length} collection(s)`,
    )

    // Step 2: Transform to new workspace structure
    const workspaces = transformLegacyDataToWorkspace(legacyData)

    console.info(`🔄 Transformed into ${workspaces.length} workspace(s)`)

    // Step 3: Save to IndexedDB
    await Promise.all(
      workspaces.map(async ({ id, name, workspace }) => {
        console.info(`💾 Saving workspace: ${name} (${id})`)
        await persistence.workspace.setItem(id, { name, workspace })
      }),
    )

    // Step 4: Mark migration as complete
    markMigrationComplete()

    console.info(`✅ Successfully migrated ${workspaces.length} workspace(s) to IndexedDB`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Clears legacy localStorage data after successful migration.
 *
 * NOT called automatically - old data is preserved as a safety net for rollback.
 * Call only after migration succeeds and a grace period passes (e.g., 30 days).
 *
 * To rollback: remove the migration flag, clear IndexedDB, and reload.
 */
export const clearLegacyLocalStorage = (): void => {
  const keysToRemove = [
    'collection',
    'cookie',
    'environment',
    'requestExample',
    'request',
    'securityScheme',
    'server',
    'tag',
    'workspace',
    DATA_VERSION_LS_LEY,
  ]

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key)
  })

  console.info('🧹 Cleared legacy localStorage data')
}
