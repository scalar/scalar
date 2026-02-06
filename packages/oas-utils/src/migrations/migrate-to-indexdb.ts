import { extractConfigSecrets, removeSecretFields } from '@scalar/helpers/general/extract-config-secrets'
import { circularToRefs } from '@scalar/helpers/object/circular-to-refs'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import type { Oauth2Flow } from '@scalar/types/entities'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import { getWorkspaceId } from '@scalar/workspace-store/persistence'
import { persistencePlugin } from '@scalar/workspace-store/plugins/client'
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
      const documents: { name: string; document: OpenApiDocument }[] = workspace.collections.flatMap((uid) => {
        const collection = legacyData.records.collections[uid]
        if (!collection) {
          return []
        }

        const documentName = collection.info?.title || collection.uid
        const { document, auth } = transformCollectionToDocument(documentName, collection, legacyData.records)
        workspaceAuth[documentName] = auth

        return { name: documentName, document }
      })

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
        plugins: [
          await persistencePlugin({
            workspaceId: getWorkspaceId('local', workspace.uid),
            debounceDelay: 0,
          }),
        ],
      })

      await Promise.all(
        documents.map(async ({ name, document }) => {
          await store.addDocument({
            // Lowercase drafts to match the new store
            name: name === 'Drafts' ? 'drafts' : name,
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
 * Transforms legacy requests and request examples into OpenAPI paths.
 *
 * Each request becomes an operation in the paths object.
 * Request examples are merged into parameter examples and request body examples.
 */
const transformRequestsToPaths = (
  collection: v_2_5_0['Collection'],
  dataRecords: v_2_5_0['DataRecord'],
): Record<string, any> => {
  const paths = Object.create(null) as Record<string, any>

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
 * The legacy data model uses plural "headers"/"cookies" for parameter categories,
 * but OpenAPI uses singular "header"/"cookie" for the `in` field. This mapping
 * normalizes the legacy names to their OpenAPI equivalents.
 */
const PARAM_TYPE_TO_IN: Record<string, string> = {
  path: 'path',
  query: 'query',
  headers: 'header',
  cookies: 'cookie',
}

/**
 * Merges request example values into OpenAPI parameter objects.
 *
 * In the legacy data model, parameter values live on individual RequestExample
 * objects (one per "example" tab in the UI). OpenAPI instead stores examples
 * directly on each Parameter object via the `examples` map.
 */
const mergeExamplesIntoParameters = (parameters: any[], requestExamples: v_2_5_0['RequestExample'][]): any[] => {
  /**
   * We track parameters and their collected examples together in a single map
   * keyed by `{in}:{name}` (e.g. "query:page") to avoid a second lookup pass.
   */
  const paramEntries = new Map<
    string,
    { param: any; examples: Record<string, { value: string; 'x-disabled': boolean }> }
  >()

  // Seed with the operation's existing parameters so they are preserved even if
  // no request example references them.
  for (const param of parameters) {
    paramEntries.set(`${param.in}:${param.name}`, { param: { ...param }, examples: {} })
  }

  const paramTypes = Object.keys(PARAM_TYPE_TO_IN)

  for (const requestExample of requestExamples) {
    const exampleName = requestExample.name || 'Example'

    for (const paramType of paramTypes) {
      const inValue = PARAM_TYPE_TO_IN[paramType]
      const items = requestExample.parameters?.[paramType as keyof typeof requestExample.parameters] || []

      for (const item of items) {
        const key = `${inValue}:${item.key}`

        // Lazily create a parameter stub when one does not already exist.
        // Path parameters are always required per the OpenAPI spec.
        if (!paramEntries.has(key)) {
          paramEntries.set(key, {
            param: {
              name: item.key,
              in: inValue,
              schema: { type: 'string' },
              ...(inValue === 'path' && { required: true }),
            },
            examples: {},
          })
        }

        // Attach this example's value to the parameter
        paramEntries.get(key)!.examples[exampleName] = {
          value: item.value,
          'x-disabled': !item.enabled,
        }
      }
    }
  }

  // Build the final parameter list, only attaching `examples` when there are any
  return Array.from(paramEntries.values()).map(({ param, examples }) => {
    if (Object.keys(examples).length > 0) {
      param.examples = examples
    }
    return param
  })
}

/** Maps legacy raw body encoding names (e.g. "json", "xml") to their corresponding MIME content types */
const RAW_ENCODING_TO_CONTENT_TYPE: Record<string, string> = {
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'application/yaml',
  edn: 'application/edn',
  text: 'text/plain',
  html: 'text/html',
  javascript: 'application/javascript',
}

/**
 * Extracts the content type and example value from a single request example body.
 *
 * The legacy data model stored body content in one of three shapes:
 * - `raw`      — text-based body with an encoding hint (json, xml, etc.)
 * - `formData` — key/value pairs with either multipart or URL-encoded encoding
 * - `binary`   — file upload with no inline content
 */
const extractBodyExample = (
  body: v_2_5_0['RequestExample']['body'],
): { contentType: string; value: any } | undefined => {
  if (!body?.activeBody) {
    return undefined
  }

  // Raw text body — resolve the short encoding name to a full MIME type
  if (body.activeBody === 'raw' && body.raw) {
    return {
      contentType: RAW_ENCODING_TO_CONTENT_TYPE[body.raw.encoding] || 'text/plain',
      value: body.raw.value,
    }
  }

  // Form data — distinguish between multipart (file uploads) and URL-encoded
  if (body.activeBody === 'formData' && body.formData) {
    return {
      contentType: body.formData.encoding === 'form-data' ? 'multipart/form-data' : 'application/x-www-form-urlencoded',
      value: body.formData.value.map((param) => ({
        key: param.key,
        type: 'string',
        value: param.value,
      })),
    }
  }

  // Binary uploads have no inline content to migrate
  if (body.activeBody === 'binary') {
    return { contentType: 'binary', value: {} }
  }

  return undefined
}

/**
 * Merges request examples into request body examples.
 *
 * The v2.5.0 data model stored request examples separately from the
 * operation's requestBody. In the new model, examples live directly inside
 * `requestBody.content[contentType].examples`. This function bridges the two
 * by grouping examples by content type in a single pass and writing them into
 * the requestBody structure.
 *
 * Returns the original requestBody unchanged when no examples have body content.
 */
const mergeExamplesIntoRequestBody = (requestBody: any, requestExamples: v_2_5_0['RequestExample'][]): any => {
  /**
   * Single pass: extract each example body and bucket it by content type.
   * Using a plain object as the inner value (instead of a nested Map) avoids
   * a second conversion step when assigning to the result.
   */
  const groupedByContentType = new Map<string, Record<string, { value: any }>>()

  for (const example of requestExamples) {
    const extracted = extractBodyExample(example.body)
    if (!extracted) {
      continue
    }

    const name = example.name || 'Example'
    const group = groupedByContentType.get(extracted.contentType)

    if (group) {
      group[name] = { value: extracted.value }
    } else {
      groupedByContentType.set(extracted.contentType, { [name]: { value: extracted.value } })
    }
  }

  // Nothing to merge — return early so we do not mutate the requestBody
  if (groupedByContentType.size === 0) {
    return requestBody
  }

  // Ensure the requestBody and its content map exist before writing
  const result = requestBody ?? {}
  result.content ??= {}

  for (const [contentType, examples] of groupedByContentType) {
    result.content[contentType] ??= {}
    result.content[contentType].examples = examples
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
    /**
     * Preserve all component types from the collection and merge with transformed security schemes.
     * OpenAPI components object supports: schemas, responses, parameters, examples,
     * requestBodies, headers, securitySchemes, links, callbacks, pathItems
     */
    components: {
      // Preserve existing components from the collection (schemas, responses, parameters, etc.)
      ...(collection.components || {}),
      // Merge security schemes (transformed from UIDs) with any existing security schemes
      securitySchemes: {
        ...((collection.components as Record<string, unknown>)?.securitySchemes || {}),
        ...collection.securitySchemes.reduce((acc, uid) => {
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

  // Break any circular JS object references before coercion.
  // The legacy client dereferenced $refs inline, creating circular object graphs
  // that would cause JSON serialization and schema validation to fail.
  const safeDocument = circularToRefs(document, { '$ref-value': '' })

  return {
    document: coerceValue(OpenAPIDocumentSchema, safeDocument),
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
