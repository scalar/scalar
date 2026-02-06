import { extractConfigSecrets, removeSecretFields } from '@scalar/helpers/general/extract-config-secrets'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { Oauth2Flow } from '@scalar/types/entities'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import {
  type XScalarEnvironments,
  xScalarEnvironmentSchema,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { xScalarCookieSchema } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XTagGroup } from '@scalar/workspace-store/schemas/extensions/tag/x-tag-groups'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type OpenApiDocument,
  type TagObject,
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
export const migrateLocalStorageToIndexDb = async () => {
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
    const workspaces = await transformLegacyDataToWorkspace(legacyData)

    console.info(`🔄 Transformed into ${workspaces.length} workspace(s)`)

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
export const transformLegacyDataToWorkspace = async (legacyData: {
  arrays: v_2_5_0['DataArray']
  records: v_2_5_0['DataRecord']
}) =>
  await Promise.all(
    legacyData.arrays.workspaces.map(async (workspace) => {
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
          const { document, auth } = transformCollectionToDocument(documentName, collection, legacyData.records)
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

      const store = createWorkspaceStore({
        meta,
      })

      await Promise.all(
        Object.entries(documents).map(async ([name, document]) => {
          await store.addDocument({
            name,
            document,
          })
        }),
      )

      // Load the auth into the store
      store.auth.load(workspaceAuth)

      // Load the extensions into the store
      objectEntries(extensions).forEach(([key, value]) => {
        store.update(key, value)
      })

      return {
        slug: workspace.uid.toString(), // Convert to string to convert it to a simple string type
        name: workspace.name || 'Untitled Workspace',
        workspace: store.exportWorkspace(),
      }
    }),
  )

/**
 * Converts legacy environment variables from record format to the new array format.
 *
 * Legacy format:  { variables: { API_URL: 'https://...', API_KEY: 'secret' } }
 * New format:     { variables: [{ name: 'API_URL', value: 'https://...' }, { name: 'API_KEY', value: 'secret' }] }
 */
const transformLegacyEnvironments = (
  environments: v_2_5_0['Collection']['x-scalar-environments'],
): XScalarEnvironments | undefined => {
  const entries = Object.entries(environments || {})
  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(
    entries.map(([envName, env]) => [
      envName,
      coerceValue(xScalarEnvironmentSchema, {
        color: env.color,
        variables: Object.entries(env.variables || {}).map(([name, value]) => ({
          name,
          value: typeof value === 'string' ? value : value.default || '',
        })),
      }),
    ]),
  )
}

/**
 * Transforms legacy tags into OpenAPI tags and x-tagGroups.
 *
 * Legacy tags have a parent-child structure where:
 * - Parent tags (tags with children) become x-tagGroups entries
 * - Child tags become regular OpenAPI tags
 * - Tags that appear in collection.children are considered top-level
 *
 * @param collection - The legacy collection containing tag UIDs
 * @param dataRecords - The data records containing actual tag objects
 * @returns Object with tags array and tagGroups array
 */
/**
 * Transforms legacy requests and request examples into OpenAPI paths.
 *
 * Each request becomes an operation in the paths object.
 * Request examples are merged into parameter examples and request body examples.
 */
const transformRequestsToPaths = (
  collection: v_2_5_0['Collection'],
  dataRecords: v_2_5_0['DataRecord'],
): Record<string, any> => {
  const paths: Record<string, any> = {}

  for (const requestUid of collection.requests || []) {
    const request = dataRecords.requests[requestUid]
    if (!request) {
      continue
    }

    const {
      path,
      method,
      uid: _uid,
      type: _type,
      selectedServerUid: _selectedServerUid,
      examples,
      servers,
      selectedSecuritySchemeUids: _selectedSecuritySchemeUids,
      ...operation
    } = request

    // Initialize path object if it doesn't exist
    if (!paths[path]) {
      paths[path] = {}
    }

    // Get request examples for this request
    const requestExamples = (examples || []).flatMap((exampleUid) => {
      const example = dataRecords.requestExamples[exampleUid]
      return example ? [example] : []
    })

    // Merge examples into parameters and request body
    if (requestExamples.length > 0) {
      operation.parameters = mergeExamplesIntoParameters(operation.parameters || [], requestExamples)
      operation.requestBody = mergeExamplesIntoRequestBody(operation.requestBody, requestExamples)
    }

    // Add server overrides if present
    if (servers && servers.length > 0) {
      ;(operation as any).servers = servers.flatMap((serverUid) => {
        const server = dataRecords.servers[serverUid]
        if (!server) {
          return []
        }
        const { uid: _, ...rest } = server
        return [rest]
      })
    }

    paths[path][method] = operation
  }

  return paths
}

/**
 * Merges request examples into parameter examples.
 *
 * For each parameter in the operation, we collect all example values from request examples
 * and add them to the parameter's examples object.
 */
const mergeExamplesIntoParameters = (parameters: any[], requestExamples: v_2_5_0['RequestExample'][]): any[] => {
  const parameterMap = new Map<string, any>()

  // Initialize with existing parameters
  for (const param of parameters) {
    const key = `${param.in}:${param.name}`
    parameterMap.set(key, { ...param })
  }

  // Collect all parameter examples
  const examplesByParam = new Map<string, Map<string, { value: string; disabled: boolean }>>()

  for (const example of requestExamples) {
    const paramTypes = ['path', 'query', 'headers', 'cookies'] as const

    for (const paramType of paramTypes) {
      const params = example.parameters?.[paramType] || []

      for (const param of params) {
        const inValue = paramType === 'headers' ? 'header' : paramType === 'cookies' ? 'cookie' : paramType
        const key = `${inValue}:${param.key}`

        if (!examplesByParam.has(key)) {
          examplesByParam.set(key, new Map())
        }

        examplesByParam.get(key)!.set(example.name || 'Example', {
          value: param.value,
          disabled: !param.enabled,
        })

        // Ensure parameter exists with minimal required fields
        if (!parameterMap.has(key)) {
          const newParam: any = {
            name: param.key,
            in: inValue,
            schema: { type: 'string' },
          }

          // Only add required if it's a path parameter
          if (inValue === 'path') {
            newParam.required = true
          }

          parameterMap.set(key, newParam)
        }
      }
    }
  }

  // Merge examples into parameters
  const result: any[] = []

  for (const [key, param] of parameterMap) {
    const examples = examplesByParam.get(key)

    if (examples && examples.size > 0) {
      param.examples = Object.fromEntries(
        Array.from(examples.entries()).map(([name, { value, disabled }]) => [name, { value, 'x-disabled': disabled }]),
      )
    }

    result.push(param)
  }

  return result
}

/**
 * Merges request examples into request body examples.
 *
 * Creates or updates the requestBody with examples from request examples.
 */
const mergeExamplesIntoRequestBody = (
  requestBody: any,
  requestExamples: v_2_5_0['RequestExample'][],
): any | undefined => {
  const bodyExamples = new Map<string, { contentType: string; value: any }>()

  for (const example of requestExamples) {
    const body = example.body

    if (!body || !body.activeBody) {
      continue
    }

    const exampleName = example.name || 'Example'

    if (body.activeBody === 'raw' && body.raw) {
      const contentTypeMap: Record<string, string> = {
        json: 'application/json',
        xml: 'application/xml',
        yaml: 'application/yaml',
        edn: 'application/edn',
        text: 'text/plain',
        html: 'text/html',
        javascript: 'application/javascript',
      }

      const contentType = contentTypeMap[body.raw.encoding] || 'text/plain'
      bodyExamples.set(exampleName, { contentType, value: body.raw.value })
    } else if (body.activeBody === 'formData' && body.formData) {
      const contentType =
        body.formData.encoding === 'form-data' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'

      const value = body.formData.value.map((param) => ({
        key: param.key,
        type: 'string',
        value: param.value,
      }))

      bodyExamples.set(exampleName, { contentType, value })
    } else if (body.activeBody === 'binary') {
      bodyExamples.set(exampleName, { contentType: 'binary', value: {} })
    }
  }

  if (bodyExamples.size === 0) {
    return requestBody
  }

  // Group examples by content type
  const examplesByContentType = new Map<string, Map<string, any>>()

  for (const [name, { contentType, value }] of bodyExamples) {
    if (!examplesByContentType.has(contentType)) {
      examplesByContentType.set(contentType, new Map())
    }
    examplesByContentType.get(contentType)!.set(name, { value })
  }

  // Build request body
  const result = requestBody || {}

  if (!result.content) {
    result.content = {}
  }

  for (const [contentType, examples] of examplesByContentType) {
    if (!result.content[contentType]) {
      result.content[contentType] = {}
    }

    result.content[contentType].examples = Object.fromEntries(examples)
  }

  return result
}

/**
 * Transforms legacy tags into OpenAPI tags and tag groups.
 *
 * Legacy structure:
 * - Tags can have children (nested tags)
 * - Top-level parent tags become tag groups
 * - Child tags and standalone tags become regular tags
 */
const transformLegacyTags = (
  collection: v_2_5_0['Collection'],
  dataRecords: v_2_5_0['DataRecord'],
): { tags: TagObject[]; tagGroups: Array<{ name: string; tags: string[] }> } => {
  const tags: TagObject[] = []
  const tagGroups: XTagGroup[] = []

  /**
   * Identifies which tags are top-level (appear in collection.children).
   * Top-level parent tags become tag groups, others become regular tags.
   */
  const topLevelTagUids = new Set(collection.children.filter((uid) => dataRecords.tags[uid] !== undefined))

  /**
   * Identifies which tags have children.
   * Only top-level parent tags become tag groups.
   */
  const parentTagUids = new Set(
    collection.tags.filter((uid) => {
      const tag = dataRecords.tags[uid]
      return tag?.children && tag.children.length > 0
    }),
  )

  /**
   * Process each tag to create either a tag group or a regular tag.
   */
  for (const tagUid of collection.tags) {
    const tag = dataRecords.tags[tagUid]
    if (!tag) {
      continue
    }

    const isTopLevelParent = topLevelTagUids.has(tagUid) && parentTagUids.has(tagUid)

    if (isTopLevelParent) {
      /**
       * Top-level parent tags become tag groups.
       * Resolve child tag names, filtering out any missing children.
       */
      const childTagNames = tag.children
        .map((childUid) => dataRecords.tags[childUid]?.name)
        .filter((name): name is string => name !== undefined)

      if (childTagNames.length > 0) {
        tagGroups.push({
          name: tag.name,
          tags: childTagNames,
        })
      }
    } else {
      /**
       * All other tags (child tags and standalone tags) become regular tags.
       * Preserve optional fields from the legacy tag.
       */
      const tagObject: TagObject = { name: tag.name }

      if (tag.description) {
        tagObject.description = tag.description
      }
      if (tag.externalDocs) {
        tagObject.externalDocs = tag.externalDocs
      }

      tags.push(tagObject)
    }
  }

  return { tags, tagGroups }
}

/** Transforms a collection and everything it includes into a WorkspaceDocument + auth */
const transformCollectionToDocument = (
  documentName: string,
  collection: v_2_5_0['Collection'],
  dataRecords: v_2_5_0['DataRecord'],
): { document: WorkspaceDocument; auth: Auth } => {
  // Resolve selectedServerUid → server URL for x-scalar-selected-server
  const selectedServerUrl =
    collection.selectedServerUid && dataRecords.servers[collection.selectedServerUid]
      ? dataRecords.servers[collection.selectedServerUid]?.url
      : undefined

  // Transform tags: separate parent tags (groups) from child tags
  const { tags, tagGroups } = transformLegacyTags(collection, dataRecords)

  // Transform requests into paths
  const paths = transformRequestsToPaths(collection, dataRecords)

  const document: Record<string, unknown> = {
    openapi: collection.openapi || '3.1.0',
    info: collection.info || {
      title: documentName,
      version: '1.0',
    },
    servers: collection.servers.flatMap((uid) => {
      const server = dataRecords.servers[uid]
      if (!server) {
        return []
      }

      const { uid: _, ...rest } = server
      return [rest]
    }),
    paths,
    components: {
      securitySchemes: collection.securitySchemes.reduce((acc, uid) => {
        const securityScheme = dataRecords.securitySchemes[uid]
        if (!securityScheme) {
          return acc
        }

        // Clean the flows
        if (securityScheme.type === 'oauth2') {
          const selectedScopes = new Set<string>()

          return {
            ...acc,
            [securityScheme.nameKey]: {
              ...securityScheme,
              flows: objectEntries(securityScheme.flows).reduce(
                (acc, [key, flow]) => {
                  if (!flow) {
                    return acc
                  }

                  // Store any selected scopes from the config
                  if ('selectedScopes' in flow && Array.isArray(flow.selectedScopes)) {
                    flow.selectedScopes?.forEach((scope) => selectedScopes.add(scope))
                  }

                  acc[key] = removeSecretFields(flow) as Oauth2Flow
                  return acc
                },
                {} as Record<string, Oauth2Flow>,
              ),
              'x-default-scopes': Array.from(selectedScopes),
            },
          }
        }

        /** We don't want any secrets in the document */
        const cleanedSecurityScheme = removeSecretFields(securityScheme)

        return {
          ...acc,
          [securityScheme.nameKey]: cleanedSecurityScheme,
        }
      }, {}),
    },
    security: collection.security || [],
    tags,
    webhooks: collection.webhooks,
    externalDocs: collection.externalDocs,
    'x-scalar-original-document-hash': '',

    // Preserve scalar extensions
    'x-scalar-icon': collection['x-scalar-icon'],

    // Convert legacy record-based environment variables to the new array format
    'x-scalar-environments': transformLegacyEnvironments(collection['x-scalar-environments']),

    // useCollectionSecurity → x-scalar-set-operation-security
    'x-scalar-set-operation-security': collection.useCollectionSecurity ?? false,
  }

  // Add x-tagGroups if there are any parent tags
  if (tagGroups.length > 0) {
    document['x-tagGroups'] = tagGroups
  }

  // x-scalar-active-environment → x-scalar-client-config-active-environment
  if (collection['x-scalar-active-environment']) {
    document['x-scalar-client-config-active-environment'] = collection['x-scalar-active-environment']
  }

  // selectedServerUid → x-scalar-selected-server (resolved to URL)
  if (selectedServerUrl) {
    document['x-scalar-selected-server'] = selectedServerUrl
  }

  // documentUrl → x-scalar-original-source-url
  if (collection.documentUrl) {
    document['x-scalar-original-source-url'] = collection.documentUrl
  }

  return {
    document: coerceValue(OpenAPIDocumentSchema, document),
    auth: coerceValue(AuthSchema, {
      secrets: collection.securitySchemes.reduce((acc, uid) => {
        const securityScheme = dataRecords.securitySchemes[uid]
        if (!securityScheme) {
          return acc
        }

        // Oauth 2
        if (securityScheme.type === 'oauth2') {
          return {
            ...acc,
            [securityScheme.nameKey]: {
              type: securityScheme.type,
              ...objectEntries(securityScheme.flows).reduce(
                (acc, [key, flow]) => {
                  if (!flow) {
                    return acc
                  }

                  acc[key] = extractConfigSecrets(flow)
                  return acc
                },
                {} as Record<string, Record<string, string>>,
              ),
            },
          }
        }

        // The rest
        return {
          ...acc,
          [securityScheme.nameKey]: {
            type: securityScheme.type,
            ...extractConfigSecrets(securityScheme),
          },
        }
      }, {}),

      selected: {},
    }),
  }
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
