import { DATA_VERSION_LS_LEY } from '@/migrations/data-version'
import { migrator } from '@/migrations/migrator'
import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

const MIGRATION_FLAG_KEY = 'scalar_indexdb_migration_complete'

/**
 * Checks if localStorage data exists and has not been migrated yet.
 *
 * Returns true if:
 * - Migration has not been completed yet (flag not set)
 * - Old data exists in localStorage (workspace, collection, or request keys)
 *
 * Returns false if:
 * - Migration already completed
 * - No old data exists
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
 * Transforms old localStorage data structure into new IndexedDB workspace structure.
 *
 * This function handles the core data transformation logic, converting the old flat
 * structure into the new nested workspace format.
 *
 * ## Transformation Logic
 *
 * ### Collections → Documents
 * In the old system, collections were essentially OpenAPI documents. Each collection
 * becomes a document in the new system, with the collection's info.title used as the
 * document name.
 *
 * ### Environments → Meta
 * Environments are extracted and stored in workspace meta as `x-scalar-environments`.
 * The old structure had a 'value' field, which is preserved in the new structure.
 *
 * ### Cookies → Meta
 * Cookies are extracted and stored in workspace meta as `x-scalar-cookies`.
 *
 * ### Workspace Properties → Meta
 * Old workspace properties are mapped to new meta structure:
 * - activeEnvironmentId → x-scalar-active-environment
 * - proxyUrl → x-scalar-active-proxy
 * - themeId → x-scalar-theme
 * - First collection → x-scalar-active-document
 *
 * ## Edge Cases Handled
 * - No workspaces but has collections: Creates a default workspace
 * - No data at all: Creates a minimal default workspace with blank document
 * - Missing info.title: Falls back to collection uid
 *
 * @param legacyData - The migrated legacy data from the old system
 * @returns Array of workspace objects ready to be saved to IndexedDB
 */
export const transformLegacyDataToWorkspace = (
  legacyData: v_2_5_0['DataArray'],
): Array<{ id: string; name: string; workspace: any }> => {
  const workspaceMap = new Map<
    string,
    {
      id: string
      name: string
      workspace: any
    }
  >()

  // If we have workspaces, process each one
  if (legacyData.workspaces.length > 0) {
    legacyData.workspaces.forEach((workspace) => {
      // Find collections that belong to this workspace
      // In the old system, collections are essentially OpenAPI documents
      const workspaceCollections = legacyData.collections.filter(() => {
        // Collections might have a workspace reference or we treat all as belonging to first workspace
        return true
      })

      // Create documents from collections
      // Each collection becomes a document in the new system
      const documents: Record<string, any> = {}

      workspaceCollections.forEach((collection) => {
        // The collection IS the OpenAPI document (not wrapped in a spec property)
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
          // Preserve scalar extensions
          'x-scalar-icon': collection['x-scalar-icon'],
          'x-scalar-environments': collection['x-scalar-environments'],
          'x-scalar-secrets': collection['x-scalar-secrets'],
        }
      })

      // If no collections, create a blank document
      if (Object.keys(documents).length === 0) {
        documents.default = {
          openapi: '3.1.0',
          info: {
            title: 'API',
            version: '1.0',
          },
          paths: {},
        }
      }

      // Build workspace meta from old workspace data
      const meta: any = {}

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
              name: env.name,
              // Old environment structure had a 'value' field, not 'variables'
              value: env.value || '',
            }
            return acc
          },
          {} as Record<string, any>,
        )
      }

      // Add active environment
      if (workspace.activeEnvironmentId) {
        meta['x-scalar-active-environment'] = workspace.activeEnvironmentId
      }

      // Add cookies to meta
      if (legacyData.cookies.length > 0) {
        meta['x-scalar-cookies'] = legacyData.cookies.reduce(
          (acc, cookie) => {
            acc[cookie.uid] = {
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path,
            }
            return acc
          },
          {} as Record<string, any>,
        )
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
              acc[docName] = {
                selectedServerUid: null,
              }
              return acc
            },
            {} as Record<string, any>,
          ),
        },
      })
    })
  }

  // Handle case where there are collections but no workspace
  if (workspaceMap.size === 0 && legacyData.collections.length > 0) {
    const documents: Record<string, any> = {}

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
      }
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
      }
    }

    // Build meta from environments and cookies
    const meta: any = {}

    if (legacyData.environments.length > 0) {
      meta['x-scalar-environments'] = legacyData.environments.reduce(
        (acc, env) => {
          acc[env.uid] = {
            name: env.name,
            value: env.value || '',
          }
          return acc
        },
        {} as Record<string, any>,
      )
    }

    if (legacyData.cookies.length > 0) {
      meta['x-scalar-cookies'] = legacyData.cookies.reduce(
        (acc, cookie) => {
          acc[cookie.uid] = {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
          }
          return acc
        },
        {} as Record<string, any>,
      )
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
        documentConfigs: Object.keys(documents).reduce(
          (acc, docName) => {
            acc[docName] = {
              selectedServerUid: null,
            }
            return acc
          },
          {} as Record<string, any>,
        ),
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
  }

  return Array.from(workspaceMap.values())
}

/**
 * Marks the migration as complete in localStorage.
 *
 * Sets a flag to prevent the migration from running again. This is stored in
 * localStorage (not IndexedDB) so it persists even if IndexedDB is cleared.
 */
export const markMigrationComplete = (): void => {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
  console.info('✅ Migration to IndexedDB complete')
}

/**
 * LocalStorage to IndexedDB Migration
 *
 * Main migration function that handles the one-time migration from the old localStorage-based
 * data structure to the new IndexedDB-based workspace architecture.
 *
 * This function should be called early in app initialization, before any workspace
 * data is loaded, to ensure data consistency.
 *
 * ## Integration Point
 * Called in `packages/api-client/src/v2/features/app/app-state.ts` during app initialization:
 * ```typescript
 * const { workspace: persistence } = await createWorkspaceStorePersistence()
 * await migrateLocalStorageToIndexDb({ workspace: persistence })
 * ```
 *
 * ## Migration Flow
 * 1. Check if migration is needed (not already done, has old data)
 * 2. Run existing version migrations to get latest data structure
 * 3. Transform old structure (collections, requests, etc.) to new workspace format
 * 4. Save to IndexedDB using persistence layer
 * 5. Mark migration as complete to prevent re-running
 *
 * ## Safety Features
 * - Idempotent: Only runs once per user
 * - Non-destructive: Old localStorage data is preserved
 * - Error handling: Wrapped in try-catch with detailed logging
 * - Graceful fallback: App can still function if migration fails
 *
 * ## Data Structure Transformation
 * Old (localStorage):
 * - collection, cookie, environment, request, workspace (all flatted JSON)
 *
 * New (IndexedDB):
 * - workspace table with meta, documents, originalDocuments, intermediateDocuments, overrides, documentConfigs
 *
 * Key transformations:
 * - Collections → Documents (old collections were OpenAPI specs)
 * - Environments → Meta (stored as x-scalar-environments)
 * - Cookies → Meta (stored as x-scalar-cookies)
 * - Workspace properties → Meta with proper extension fields
 *
 * ## Migration Steps
 * 1. Check if migration is needed (via shouldMigrateToIndexDb)
 * 2. Run existing migrations to get data in latest format (via migrator)
 * 3. Transform legacy data to new workspace structure (via transformLegacyDataToWorkspace)
 * 4. Save each workspace to IndexedDB (via persistence.workspace.setItem)
 * 5. Mark migration as complete (via markMigrationComplete)
 *
 * ## Performance
 * - Typically completes in < 1 second for normal data sizes
 * - Blocks app initialization (intentional for data consistency)
 * - Loads all old data into memory temporarily during migration
 *
 * ## Error Handling
 * If migration fails, the error is logged and re-thrown. The app can still function
 * because the old localStorage data is preserved.
 *
 * ## Testing
 * To test manually:
 * 1. Add old data: `localStorage.setItem('collection', '[{"uid":"test","info":{"title":"Test API"}}]')`
 * 2. Clear flag: `localStorage.removeItem('scalar_indexdb_migration_complete')`
 * 3. Reload app and check console for migration logs
 * 4. Verify data in DevTools → Application → IndexedDB → scalar-workspace-store
 *
 * @param persistence - The IndexedDB persistence layer with workspace.setItem method
 */
export const migrateLocalStorageToIndexDb = async (persistence: {
  workspace: {
    setItem: (id: string, value: { name: string; workspace: any }) => Promise<void>
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
 * This function is intentionally NOT called automatically to provide a safety net.
 * The old data is preserved in case rollback is needed or issues are discovered.
 *
 * ## When to Call
 * Only call this after:
 * - Migration has succeeded
 * - User has successfully used the app with new data
 * - A grace period has passed (e.g., 30 days)
 * - Optional: User has been notified
 *
 * ## Rollback Strategy
 * If issues are discovered before calling this function:
 * 1. Old localStorage data is still present
 * 2. Remove the `scalar_indexdb_migration_complete` flag
 * 3. Clear IndexedDB data
 * 4. Reload app to re-run migration with fixes
 *
 * ## Future Considerations
 * Consider adding:
 * - Migration timestamp storage
 * - Automatic cleanup after grace period
 * - User notification before cleanup
 * - Analytics event for cleanup
 *
 * @example
 * ```typescript
 * // After 30 days grace period
 * const migrationDate = localStorage.getItem('scalar_migration_date')
 * if (migrationDate && Date.now() - Number(migrationDate) > 30 * 24 * 60 * 60 * 1000) {
 *   clearLegacyLocalStorage()
 * }
 * ```
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
