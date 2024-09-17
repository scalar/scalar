import {
  type Collection,
  type Request,
  type RequestExample,
  type Server,
  type Tag,
  collectionSchema,
  createExampleFromRequest,
  requestMethods,
  requestSchema,
  serverSchema,
  tagSchema,
} from '@/entities/spec'
import {
  type SecurityScheme,
  securitySchemeSchema,
} from '@/entities/spec/security'
import { schemaModel } from '@/helpers/schema-model'
import { keysOf } from '@scalar/object-utils/arrays'
import { dereference, load, upgrade } from '@scalar/openapi-parser'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Import an OpenAPI spec file and convert it to workspace entities
 *
 * We will aim to keep the entities as close to the specification as possible
 * to leverage bi-directional translation. Where entities are able to be
 * created and used at various levels we will index via the uids to create
 * the relationships
 */
export async function importSpecToWorkspace(
  spec: string | UnknownObject,
): Promise<
  | {
      error: false
      collection: Collection
      requests: Request[]
      examples: RequestExample[]
      servers: Server[]
      tags: Tag[]
      securitySchemes: SecurityScheme[]
    }
  | { error: true; importWarnings: string[] }
> {
  const { filesystem } = await load(spec)
  const { specification } = upgrade(filesystem)
  const { schema: _schema, errors = [] } = await dereference(specification)
  const schema = _schema as OpenAPIV3.Document | OpenAPIV3_1.Document

  const importWarnings: string[] = [...errors.map((e) => e.message)]

  if (!schema) return { importWarnings, error: true }
  // ---------------------------------------------------------------------------
  // Some entities will be broken out as individual lists for modification in the workspace
  const requests: Request[] = []
  const servers: Server[] = serverSchema.array().parse(
    schema.servers?.map(
      (s) =>
        s ?? [
          {
            url:
              typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost',
            description: 'Replace with your API server',
          },
        ],
    ) ?? [],
  )

  /**
   * List of all tag strings. For non compliant specs we may need to
   * add top level tag objects for missing tag objects
   */
  const tagNames: Set<string> = new Set()

  // ---------------------------------------------------------------------------
  // SECURITY HANDLING

  const security = schema.components?.securitySchemes ?? {}

  const securitySchemes = schemaModel(
    Object.entries(security).map?.(([nameKey, s]) => ({
      ...s,
      nameKey,
    })),
    securitySchemeSchema.array(),
  )

  // Map of security scheme names to UIDs
  const securitySchemeMap: Record<string, string> = {}
  securitySchemes.forEach((s) => {
    securitySchemeMap[s.nameKey] = s.uid
  })

  const specSecurityRequirements = Object.keys(schema.security ?? []).map(
    (s) => securitySchemeMap[s],
  )

  // ---------------------------------------------------------------------------
  // REQUEST HANDLING

  keysOf(schema.paths ?? {}).forEach((pathString) => {
    const path = schema?.paths?.[pathString]

    if (!path) return
    // Path level servers must be saved
    const pathServers = serverSchema.array().parse(path.servers ?? [])
    servers.push(...pathServers)

    requestMethods.forEach((method) => {
      const operation: OpenAPIV3_1.OperationObject<{
        tags?: string[]
        security?: OpenAPIV3_1.SecurityRequirementObject
      }> = path[method as keyof typeof path]
      if (operation && typeof operation === 'object') {
        const operationServers = serverSchema
          .array()
          .parse(operation.servers ?? [])

        servers.push(...operationServers)

        // We will save a list of all tags to ensure they exists at the top level
        // TODO: make sure we add any loose requests with no tags to the collection children
        operation.tags?.forEach((t) => tagNames.add(t))

        // Format the request
        const request = requestSchema.parse({
          method,
          path: pathString,
          history: [],
          selectedSecuritySchemeUids: [],
          securitySchemeUids: [],
          ...operation,
          // Merge path and operation level parameters
          parameters: [
            ...(path?.parameters ?? []),
            ...(operation.parameters ?? []),
          ],
          servers: [...pathServers, ...operationServers].map((s) => s.uid),
          // Add list of UIDs to associate security schemes
          // As per the spec if there is operation level security we ignore the top level requirements
          security: operation.security
            ? Object.keys(operation.security ?? []).map(
                (s) => securitySchemeMap[s],
              )
            : specSecurityRequirements,
        })

        requests.push(request)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // TAG HANDLING

  // TODO: We may need to handle de-duping tags
  const tags = schemaModel(schema?.tags ?? [], tagSchema.array(), false) ?? []

  // Delete any tag names that already have a definition
  tags.forEach((t) => tagNames.delete(t.name))

  // Add an entry for any tags that are used but do not have a definition
  tagNames.forEach((name) => tags.push(tagSchema.parse({ name })))

  // Tag name to UID map
  const tagMap: Record<string, Tag> = {}
  tags.forEach((t) => {
    tagMap[t.name] = t
  })

  // Add all tags by default. We will remove nested ones
  const collectionChildren = new Set(tags.map((t) => t.uid))

  // Nested folders go before any requests
  tags.forEach((t) => {
    t['x-scalar-children']?.forEach((c) => {
      // Add the uid to the appropriate parent.children
      const nestedUid = tagMap[c.tagName].uid
      t.children.push(nestedUid)

      // Remove the nested uid from the root folder
      collectionChildren.delete(nestedUid)
    })
  })

  // Add the request UIDs to the tag children (or collection root)
  requests.forEach((r) => {
    if (r.tags) {
      r.tags.forEach((t) => {
        tagMap[t].children.push(r.uid)
      })
    } else {
      collectionChildren.add(r.uid)
    }
  })

  // ---------------------------------------------------------------------------\

  const examples: RequestExample[] = []

  // Ensure each request has at least 1 example
  requests.forEach((request) => {
    // TODO: Need to handle parsing examples
    // if (request['x-scalar-examples']) return

    // Create the initial example
    const example = createExampleFromRequest(request, 'Default Example')

    examples.push(example)
    request.examples.push(example.uid)
  })

  // ---------------------------------------------------------------------------
  // Generate Collection

  const collection = collectionSchema.parse({
    ...schema,
    requests: requests.map((r) => r.uid),
    servers: servers.map((s) => s.uid),
    tags: tags.map((t) => t.uid),
    children: [...collectionChildren],
    security: schema.security ?? [{}],
    components: {
      ...schema.components,
    },
    securitySchemes: securitySchemes.map((s) => s.uid),
  })

  /**
   * Servers and requests will be saved in top level maps and indexed via UID to
   * maintain specification relationships
   */
  return {
    error: false,
    servers,
    requests,
    examples,
    collection,
    tags,
    securitySchemes,
  }
}
