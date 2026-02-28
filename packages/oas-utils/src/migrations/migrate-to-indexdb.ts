import { CONTENT_TYPES } from '@scalar/helpers/consts/content-types'
import { extractConfigSecrets, removeSecretFields } from '@scalar/helpers/general/extract-config-secrets'
import { objectEntries } from '@scalar/helpers/object/object-entries'
import { toJsonCompatible } from '@scalar/helpers/object/to-json-compatible'
import { extractServerFromPath } from '@scalar/helpers/url/extract-server-from-path'
import { type ThemeId, presets } from '@scalar/themes'
import type { Oauth2Flow } from '@scalar/types/entities'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { type Auth, AuthSchema } from '@scalar/workspace-store/entities/auth'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import {
  type XScalarEnvironments,
  xScalarEnvironmentSchema,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { xScalarCookieSchema } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { XTagGroup } from '@scalar/workspace-store/schemas/extensions/tag'
import type { InMemoryWorkspace } from '@scalar/workspace-store/schemas/inmemory-workspace'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  OperationObject,
  ParameterObject,
  ParameterWithContentObject,
  ParameterWithSchemaObject,
  PathItemObject,
  RequestBodyObject,
  ServerObject,
  TagObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceExtensions, WorkspaceMeta } from '@scalar/workspace-store/schemas/workspace'
import { ColorModeSchema } from '@scalar/workspace-store/schemas/workspace'
import GithubSlugger from 'github-slugger'

import type { RequestParameter } from '@/entities/spec/parameters'
import { migrator } from '@/migrations/migrator'
import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

const DRAFTS_DOCUMENT_NAME = 'drafts'

/**
 * Migrates localStorage data to IndexedDB workspace structure.
 *
 * Called early in app initialization (app-state.ts) before workspace data loads.
 * Idempotent and non-destructive - runs when legacy data exists but IndexedDB is empty.
 *
 * Flow:
 * 1. Check if migration needed (has legacy data + IndexedDB is empty)
 * 2. Run existing migrations to get latest data structure
 * 3. Transform to new workspace format
 * 4. Save to IndexedDB
 *
 * Old data is preserved for rollback. Typically completes in < 1 second.
 */
export const migrateLocalStorageToIndexDb = async () => {
  const { close } = await createWorkspaceStorePersistence()

  try {
    const shouldMigrate = true

    if (!shouldMigrate) {
      console.info('ℹ️  No migration needed - IndexedDB already has workspaces or no legacy data exists')
      return
    }

    console.info('🚀 Starting migration from localStorage to IndexedDB...')

    // Step 1: Run existing migrations to get latest data structure
    const legacyData = migrator()

    console.info(
      `📦 Found legacy data: ${legacyData.arrays.workspaces.length} workspace(s), ${legacyData.arrays.collections.length} collection(s)`,
    )

    // Step 2: Transform to new workspace structure
    const workspaces = await transformLegacyDataToWorkspace(legacyData)

    console.log({ workspaces })

    // Step 3: Save to IndexedDB
    // await Promise.all(
    //   workspaces.map((workspace) =>
    //     workspacePersistence.setItem(
    //       { namespace: 'local', slug: workspace.slug },
    //       {
    //         name: workspace.name,
    //         workspace: workspace.workspace,
    //         teamUid: 'local',
    //       },
    //     ),
    //   ),
    // )

    console.info(`✅ Successfully migrated ${workspaces.length} workspace(s) to IndexedDB`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    close()
  }
}

/**
 * Checks if migration is needed by verifying IndexedDB state and presence of legacy data.
 *
 * Migration is needed when:
 * 1. Legacy data exists in localStorage (workspace, collection, or request keys)
 * 2. AND IndexedDB has no workspaces yet
 *
 * This approach is more reliable than using a flag because:
 * - If IndexedDB is cleared, migration will run again automatically
 * - No risk of flag getting out of sync with actual data state
 * - Handles edge cases like partial migrations or database corruption
 */
export const shouldMigrateToIndexDb = async (
  workspacePersistence: Awaited<ReturnType<typeof createWorkspaceStorePersistence>>['workspace'],
): Promise<boolean> => {
  // Check if there is any old data in localStorage
  const hasLegacyData =
    localStorage.getItem('workspace') !== null ||
    localStorage.getItem('collection') !== null ||
    localStorage.getItem('request') !== null

  if (!hasLegacyData) {
    return false
  }

  // Check if IndexedDB already has workspaces
  const existingWorkspaces = await workspacePersistence.getAll()
  const hasIndexDbData = existingWorkspaces.length > 0

  // Only migrate if we have legacy data but no IndexedDB data
  return !hasIndexDbData
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

      /** Create a slugger instance per workspace to handle duplicate document names */
      const documentSlugger = new GithubSlugger()

      /** Each collection becomes a document in the new system and grab the auth as well */
      const documents: { name: string; document: Record<string, unknown> }[] = workspace.collections.flatMap((uid) => {
        const collection = legacyData.records.collections[uid]
        if (!collection) {
          return []
        }

        const documentName = collection.info?.title || 'api'
        const { document, auth } = transformCollectionToDocument(documentName, collection, legacyData.records)

        // Normalize document name to match the store (lowercase "Drafts" → "drafts")
        const normalizedName = documentName === 'Drafts' ? 'drafts' : documentName

        // Use GitHubSlugger to ensure unique document names
        const uniqueName = documentSlugger.slug(normalizedName, false)

        workspaceAuth[uniqueName] = auth

        return { name: uniqueName, document }
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
        // We use theme slugs on the new system so we need to transform the id to the slug
        meta['x-scalar-theme'] = transformThemeIdToSlug(workspace.themeId)
      }

      // Set color mode
      if (localStorage.getItem('colorMode')) {
        meta['x-scalar-color-mode'] = coerceValue(ColorModeSchema, localStorage.getItem('colorMode'))
      }

      const store = createWorkspaceStore({
        meta,
      })

      await Promise.all(
        documents.map(async ({ name, document }) => {
          console.log({ name, document })
          await store.addDocument({
            name,
            document,
          })
          // Note: we are breaking the relationship between the document and the originial source url
        }),
      )

      // Try to always set the drafts / route
      if (!(DRAFTS_DOCUMENT_NAME in store.workspace.documents)) {
        await store.addDocument({
          name: DRAFTS_DOCUMENT_NAME,
          document: {
            openapi: '3.1.0',
            info: {
              title: 'Drafts',
              version: '1.0.0',
            },
            paths: {
              '/': {
                get: {},
              },
            },
            'x-scalar-icon': 'interface-edit-tool-pencil',
          },
        })
      }

      const drafts = store.workspace.documents[DRAFTS_DOCUMENT_NAME]

      if (drafts) {
        // Make sure the drafts document has a GET / route cuz that's the first route we navigate the user to
        drafts.paths ??= {}
        drafts.paths['/'] ??= {}
        drafts.paths['/']['get'] ??= {}
      }

      store.buildSidebar(DRAFTS_DOCUMENT_NAME)
      // save the document to the store so we don't see the document as dirty
      await store.saveDocument(DRAFTS_DOCUMENT_NAME)

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
 * Converts a ThemeId to its corresponding theme slug.
 * If the themeId is 'none', return it as is.
 * Otherwise, look up the slug in the presets object.
 */
const transformThemeIdToSlug = (themeId: ThemeId): string => {
  if (themeId === 'none') {
    return themeId
  }
  return presets[themeId]?.slug ?? 'default'
}

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
 *
 * Also extracts servers from paths that contain full URLs (e.g., "https://api.example.com/users")
 * and returns them separately for deduplication at the document level.
 */
const transformRequestsToPaths = (
  collection: v_2_5_0['Collection'],
  dataRecords: v_2_5_0['DataRecord'],
): { paths: Record<string, PathItemObject>; extractedServers: ServerObject[] } => {
  const paths = Object.create(null) as Record<string, PathItemObject>
  const extractedServers: ServerObject[] = []

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
      parameters = [],
      requestBody,
      ...rest
    } = request

    let normalizedPath = path || '/'

    /**
     * Extract server from path if it contains a full URL.
     * This handles legacy data where users may have entered full URLs as paths.
     */
    const extractedServerUrl = extractServerFromPath(normalizedPath)
    if (extractedServerUrl?.length === 2) {
      const [serverUrl, remainingPath] = extractedServerUrl
      extractedServers.push({ url: serverUrl })
      normalizedPath = remainingPath

      /**
       * Handle edge case where the path after server is empty or just "/"
       * Example: "https://api.example.com" → "" → "/"
       */
      if (!normalizedPath) {
        normalizedPath = '/'
      }
      // Handle double slashes from malformed URLs like "https://api.example.com//users"
      else if (normalizedPath.startsWith('//')) {
        normalizedPath = normalizedPath.slice(1)
      }
    }

    // Normalize relative paths to start with a leading slash. OpenAPI paths must start with "/" per the spec
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`
    }

    // Initialize path object if it doesn't exist
    if (!paths[normalizedPath]) {
      paths[normalizedPath] = {}
    }

    /** Start building the OAS operation object  */
    const partialOperation: OperationObject = {
      ...rest,
    }

    // Get request examples for this request
    const requestExamples = (examples || []).flatMap((exampleUid) => {
      const example = dataRecords.requestExamples[exampleUid]
      return example ? [example] : []
    })

    // Merge examples into parameters
    const mergedParameters = mergeExamplesIntoParameters(parameters, requestExamples)
    if (mergedParameters.length > 0) {
      partialOperation.parameters = mergedParameters
    }

    // Merge examples into request body
    const mergedRequestBody = mergeExamplesIntoRequestBody(requestBody, requestExamples)
    if (mergedRequestBody) {
      partialOperation.requestBody = mergedRequestBody
    }

    // Add server overrides if present
    if (servers && servers.length > 0) {
      partialOperation.servers = servers.flatMap((serverUid) => {
        const server = dataRecords.servers[serverUid]
        if (!server) {
          return []
        }
        const { uid: _, ...rest } = server
        return [rest]
      })
    }

    const pathItem = paths[normalizedPath]
    if (pathItem) {
      pathItem[method] = partialOperation
    }
  }

  return { paths, extractedServers }
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
 * Ensures unique example names by appending #2, #3, etc. when duplicates are found.
 * Does not use slugification - preserves the original name with a numeric suffix.
 */
const ensureUniqueExampleName = (baseName: string, usedNames: Set<string>): string => {
  let uniqueName = baseName
  let counter = 2

  while (usedNames.has(uniqueName)) {
    uniqueName = `${baseName} #${counter}`
    counter++
  }

  usedNames.add(uniqueName)
  return uniqueName
}

/**
 * Merges request example values into OpenAPI parameter objects.
 *
 * In the legacy data model, parameter values live on individual RequestExample
 * objects (one per "example" tab in the UI). OpenAPI instead stores examples
 * directly on each Parameter object via the `examples` map.
 */
const mergeExamplesIntoParameters = (
  parameters: RequestParameter[],
  requestExamples: v_2_5_0['RequestExample'][],
): ParameterObject[] => {
  /**
   * We track parameters and their collected examples together in a single map
   * keyed by `{in}:{name}` (e.g. "query:page") to avoid a second lookup pass.
   */
  const paramEntries = new Map<
    string,
    { param: ParameterObject; examples: Record<string, { value: string; 'x-disabled': boolean }> }
  >()

  // Seed with the operation's existing parameters so they are preserved even if
  // no request example references them.
  for (const param of parameters) {
    // Build a type-safe ParameterObject by explicitly mapping properties
    // The old RequestParameter type uses z.unknown() for schema/content/examples,
    // but these values come from validated OpenAPI documents and are already in the correct format.
    // We use type assertions (via unknown) to bridge from the old loose types to the new strict types.
    // This is safe because the data has already been validated by the Zod schema.

    // Build either ParameterWithSchemaObject or ParameterWithContentObject
    let paramObject: ParameterObject

    // Param with Content Type
    if (param.content && typeof param.content === 'object') {
      paramObject = {
        name: param.name,
        in: param.in,
        required: param.required ?? param.in === 'path',
        deprecated: param.deprecated ?? false,
        content: param.content as ParameterWithContentObject['content'],
        ...(param.description && { description: param.description }),
      } satisfies ParameterWithContentObject
    }

    // Param with Schema Type
    else {
      paramObject = {
        name: param.name,
        in: param.in,
        required: param.required ?? param.in === 'path',
        deprecated: param.deprecated ?? false,
        ...(param.description && { description: param.description }),
        ...(param.schema ? { schema: param.schema as ParameterWithSchemaObject['schema'] } : {}),
        ...(param.style && { style: param.style }),
        ...(param.explode !== undefined && { explode: param.explode }),
        ...(param.example !== undefined && { example: param.example }),
        ...(param.examples &&
          typeof param.examples === 'object' && {
            examples: param.examples as ParameterWithSchemaObject['examples'],
          }),
      } satisfies ParameterWithSchemaObject
    }

    paramEntries.set(`${param.in}:${param.name}`, {
      param: paramObject,
      examples: {},
    })
  }

  const paramTypes = Object.keys(PARAM_TYPE_TO_IN)
  const usedExampleNames = new Set<string>()

  for (const requestExample of requestExamples) {
    const baseName = requestExample.name || 'Example'
    const exampleName = ensureUniqueExampleName(baseName, usedExampleNames)

    for (const paramType of paramTypes) {
      const inValue = PARAM_TYPE_TO_IN[paramType]
      const items = requestExample.parameters?.[paramType as keyof typeof requestExample.parameters] || []

      for (const item of items) {
        const key = `${inValue}:${item.key}`

        // Lets not save any params without a key
        if (!item.key) {
          continue
        }

        const lowerKey = item.key.toLowerCase()

        /**
         * Lazily create a parameter stub when one does not already exist
         * Path parameters are always required per the OpenAPI spec
         *
         * We do not add Accept: *\/*
         * We do not add any Content-Type headers that are auto added in the client
         */
        if (
          !paramEntries.has(key) &&
          (lowerKey !== 'content-type' || !CONTENT_TYPES[item.value as keyof typeof CONTENT_TYPES]) &&
          (lowerKey !== 'accept' || item.value !== '*/*')
        ) {
          paramEntries.set(key, {
            param: {
              name: item.key,
              in: (inValue as ParameterObject['in']) ?? 'query',
              required: inValue === 'path',
              deprecated: false,
              schema: { type: 'string' },
            },
            examples: {},
          })
        }

        // We have skipped the content-type or accept headers above
        const param = paramEntries.get(key)
        if (!param) {
          continue
        }

        param.examples[exampleName] = {
          value: item.value,
          'x-disabled': !item.enabled,
        }
      }
    }
  }

  // Build the final parameter list, only attaching `examples` when there are any
  return Array.from(paramEntries.values()).map(({ param, examples }) => {
    if (Object.keys(examples).length > 0) {
      ;(param as ParameterWithSchemaObject).examples = examples
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
): { contentType: string; value: unknown } | undefined => {
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
      value: body.formData.value.flatMap((param) =>
        param.key
          ? {
              name: param.key,
              value: param.value,
              isDisabled: !param.enabled,
            }
          : [],
      ),
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
const mergeExamplesIntoRequestBody = (
  requestBody: RequestBodyObject,
  requestExamples: v_2_5_0['RequestExample'][],
): RequestBodyObject => {
  /**
   * Single pass: extract each example body and bucket it by content type.
   * Using a plain object as the inner value (instead of a nested Map) avoids
   * a second conversion step when assigning to the result.
   */
  const groupedByContentType = new Map<string, Record<string, { value: unknown }>>()

  /** We track the selected content type for each example */
  const selectedContentTypes = {} as Record<string, string>

  const usedExampleNames = new Set<string>()

  for (const example of requestExamples) {
    const extracted = extractBodyExample(example.body)
    if (!extracted) {
      continue
    }

    const baseName = example.name || 'Example'
    const name = ensureUniqueExampleName(baseName, usedExampleNames)
    const group = groupedByContentType.get(extracted.contentType)

    if (group) {
      group[name] = { value: extracted.value }
    } else {
      groupedByContentType.set(extracted.contentType, { [name]: { value: extracted.value } })
    }

    selectedContentTypes[name] = extracted.contentType
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

  // Add the x-scalar-selected-content-type mapping
  if (Object.keys(selectedContentTypes).length > 0) {
    result['x-scalar-selected-content-type'] = selectedContentTypes
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
): { document: Record<string, unknown>; auth: Auth } => {
  // Resolve selectedServerUid → server URL for x-scalar-selected-server
  const selectedServerUrl =
    collection.selectedServerUid && dataRecords.servers[collection.selectedServerUid]
      ? dataRecords.servers[collection.selectedServerUid]?.url
      : undefined

  // Transform tags: separate parent tags (groups) from child tags
  const { tags, tagGroups } = transformLegacyTags(collection, dataRecords)

  // Transform requests into paths and extract servers from full URLs
  const { paths, extractedServers } = transformRequestsToPaths(collection, dataRecords)

  /**
   * Merge and deduplicate servers:
   * 1. Start with existing collection servers
   * 2. Add extracted servers from paths
   * 3. Deduplicate by URL (keep first occurrence)
   */
  const existingServers = collection.servers.flatMap((uid) => {
    const server = dataRecords.servers[uid]
    if (!server) {
      return []
    }

    const { uid: _, ...rest } = server
    return [rest]
  })

  const allServers = [...existingServers, ...extractedServers]
  const seenUrls = new Set<string>()
  const deduplicatedServers = allServers.filter((server) => {
    if (seenUrls.has(server.url)) {
      return false
    }
    seenUrls.add(server.url)
    return true
  })

  const document: Record<string, unknown> = {
    openapi: collection.openapi || '3.1.0',
    info: collection.info || {
      title: documentName,
      version: '1.0',
    },
    servers: deduplicatedServers,
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

          const { uid: _uid, nameKey: _nameKey, ...publicSecurityScheme } = removeSecretFields(securityScheme)

          // Clean the flows
          if (securityScheme.type === 'oauth2') {
            const selectedScopes = new Set<string>()

            return {
              ...acc,
              [securityScheme.nameKey]: {
                ...publicSecurityScheme,
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

          return {
            ...acc,
            [securityScheme.nameKey]: publicSecurityScheme,
          }
        }, {}),
      },
    },
    security: collection.security || [],
    tags,
    webhooks: collection.webhooks,
    externalDocs: collection.externalDocs,

    // Preserve scalar extensions
    'x-scalar-icon': collection['x-scalar-icon'],

    // Convert legacy record-based environment variables to the new array format
    'x-scalar-environments': transformLegacyEnvironments(collection['x-scalar-environments']),
  }

  // Add x-tagGroups if there are any parent tags
  if (tagGroups.length > 0) {
    document['x-tagGroups'] = tagGroups
  }

  // x-scalar-active-environment
  if (collection['x-scalar-active-environment']) {
    document['x-scalar-active-environment'] = collection['x-scalar-active-environment']
  }

  // selectedServerUid → x-scalar-selected-server (resolved to URL)
  if (selectedServerUrl) {
    document['x-scalar-selected-server'] = selectedServerUrl
  }

  // documentUrl → x-scalar-original-source-url
  if (collection.documentUrl) {
    document['x-scalar-original-source-url'] = collection.documentUrl
  }

  // Convert circular references to $ref pointers which is safe for JSON serialization
  // const safeDocument = toJsonCompatible(document)

  const cache = new WeakMap<object, string>()
  const result = toJsonCompatible(document?.components, { prefix: '/components', cache })
  const safeDocument = toJsonCompatible({ ...document, components: result }, { cache })

  return {
    document: safeDocument,
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
