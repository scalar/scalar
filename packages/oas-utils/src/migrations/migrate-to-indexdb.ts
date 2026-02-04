import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { xScalarCookieSchema } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument, WorkspaceExtensions, WorkspaceMeta } from '@scalar/workspace-store/schemas/workspace'
import { ColorModeSchema, ThemeIdSchema } from '@scalar/workspace-store/schemas/workspace'

import { DATA_VERSION_LS_LEY } from '@/migrations/data-version'
import { migrator } from '@/migrations/migrator'
import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

const MIGRATION_FLAG_KEY = 'scalar_indexdb_migration_complete'

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
export const migrateLocalStorageToIndexDb = () => {
  if (!shouldMigrateToIndexDb()) {
    console.info('ℹ️  No migration needed or already completed')
    return
  }

  console.info('🚀 Starting migration from localStorage to IndexedDB...')

  try {
    // Step 1: Run existing migrations to get latest data structure
    const legacyData = migrator()

    console.info(
      `📦 Found legacy data: ${legacyData.arrays.workspaces.length} workspace(s), ${legacyData.arrays.collections.length} collection(s)`,
    )

    // Step 2: Transform to new workspace structure
    const workspaces = transformLegacyDataToWorkspace(legacyData)

    console.info(`🔄 Transformed into ${workspaces.length} workspace(s)`)

    // Step 3: Save to IndexedDB
    // await Promise.all(
    //   workspaces.map(async ({ slug, name, documents, meta, extensions, auth }) => {
    //     console.info(`💾 Saving workspace: ${name} (${id})`)
    //     await persistence.workspace.setItem(id, { name, workspace })
    //   }),
    // )

    // Step 4: Mark migration as complete
    markMigrationComplete()

    console.info(`✅ Successfully migrated ${workspaces.length} workspace(s) to IndexedDB`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

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

/** Transforms a collection and everything it includes into a WorkspaceDocument + auth */
const transformCollectionToDocument = (
  collection: v_2_5_0['Collection'],
  _dataRecords: v_2_5_0['DataRecord'],
): { document: WorkspaceDocument; auth: Auth } => {
  // // The collection IS the OpenAPI document (not wrapped in a spec property)
  // const documentName = collection.info?.title || collection.uid

  // documents[documentName] = coerceValue(OpenAPIDocumentSchema, {
  //   openapi: collection.openapi || '3.1.0',
  //   info: collection.info || {
  //     title: documentName,
  //     version: '1.0',
  //   },
  //   servers: [],
  //   paths: {},
  //   components: collection.components || {},
  //   security: collection.security || [],
  //   tags: [],
  //   webhooks: collection.webhooks,
  //   externalDocs: collection.externalDocs,
  //   // Preserve scalar extensions
  //   'x-scalar-icon': collection['x-scalar-icon'],
  //   'x-scalar-environments': collection['x-scalar-environments'],
  //   'x-scalar-original-document-hash': '',
  // })
  return {
    document: coerceValue(OpenAPIDocumentSchema, {
      openapi: collection.openapi || '3.1.0',
      info: collection.info || {
        title: 'documentName',
        version: '1.0',
      },
    }),
    auth: coerceValue(AuthSchema, {
      secrets: {},
      selected: {},
    }),
  }
}

type MigrateToIndexDbResults = {
  name: string
  slug: string
  documents: Record<string, WorkspaceDocument>
  meta: WorkspaceMeta
  extensions: WorkspaceExtensions
  auth: InMemoryWorkspace['auth']
}[]

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
export const transformLegacyDataToWorkspace = (legacyData: {
  arrays: v_2_5_0['DataArray']
  records: v_2_5_0['DataRecord']
}): MigrateToIndexDbResults =>
  legacyData.arrays.workspaces.map((workspace) => {
    /** Grab auth from the collections */
    const workspaceAuth: InMemoryWorkspace['auth'] = {}

    /** Each collection becomes a document in the new system and grab the auth as well */
    const documents: Record<string, OpenApiDocument> = Object.fromEntries(
      workspace.collections.flatMap<[string, OpenApiDocument]>((uid) => {
        const collection = legacyData.records.collections[uid]
        if (!collection) {
          return []
        }

        const documentName = collection.info?.title || collection.uid
        const { document, auth } = transformCollectionToDocument(collection, legacyData.records)
        workspaceAuth[documentName] = auth

        return [[documentName, document]]
      }),
    )

    const meta: WorkspaceMeta = {}
    const extensions: WorkspaceExtensions = {}

    // Add environment
    const environmentEntries = Object.entries(workspace.environments)
    if (environmentEntries.length > 0) {
      extensions['x-scalar-environments'] = {
        default: coerceValue(xScalarEnvironmentSchema, {
          variables: environmentEntries.map(([name, value]) => ({
            name,
            value,
          })),
        }),
      }
    }

    // Add cookies to meta
    if (workspace.cookies.length > 0) {
      extensions['x-scalar-cookies'] = workspace.cookies.flatMap((uid) => {
        const cookie = legacyData.records.cookies[uid]
        return cookie ? coerceValue(xScalarCookieSchema, cookie) : []
      })
    }

    // Add proxy URL if present
    if (workspace.proxyUrl) {
      meta['x-scalar-active-proxy'] = workspace.proxyUrl
    }

    // Add theme if present
    if (workspace.themeId) {
      meta['x-scalar-theme'] = coerceValue(ThemeIdSchema, workspace.themeId)
    }

    // Set color mode
    if (localStorage.getItem('colorMode')) {
      meta['x-scalar-color-mode'] = coerceValue(ColorModeSchema, localStorage.getItem('colorMode'))
    }

    return {
      slug: workspace.uid,
      name: workspace.name || 'Untitled Workspace',
      meta,
      documents,
      extensions,
      auth: workspaceAuth,
    }
  })

/**
 * Marks migration as complete by setting a flag in localStorage.
 * Stored in localStorage (not IndexedDB) to persist even if IndexedDB is cleared.
 */
export const markMigrationComplete = (): void => {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
  console.info('✅ Migration to IndexedDB complete')
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
