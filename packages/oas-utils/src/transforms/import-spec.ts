import type { SelectedSecuritySchemeUids } from '@/entities/shared/utility'
import {
  type Collection,
  type CollectionPayload,
  type Request,
  type RequestExample,
  type RequestParameterPayload,
  type RequestPayload,
  type Server,
  type Tag,
  collectionSchema,
  createExampleFromRequest,
  requestSchema,
  serverSchema,
  tagSchema,
} from '@/entities/spec'
import {
  type Oauth2FlowPayload,
  type SecurityScheme,
  type SecuritySchemePayload,
  securitySchemeSchema,
} from '@/entities/spec/security'
import { combineUrlAndPath, isDefined } from '@/helpers'
import { isHttpMethod } from '@/helpers/httpMethods'
import { schemaModel } from '@/helpers/schema-model'
import { keysOf } from '@scalar/object-utils/arrays'
import {
  type LoadResult,
  dereference,
  load,
  upgrade,
} from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import type { UnknownObject } from '@scalar/types/utils'
import type { Entries } from 'type-fest'

/** Takes a string or object and parses it into an openapi spec compliant schema */
export const parseSchema = async (
  spec: string | UnknownObject,
  { shouldLoad = true } = {},
) => {
  if (spec === null || (typeof spec === 'string' && spec.trim() === '')) {
    console.warn('[@scalar/oas-utils] Empty OpenAPI document provided.')

    return {
      schema: {} as OpenAPIV3_1.Document,
      errors: [],
    }
  }

  let filesystem: LoadResult['filesystem'] | string | UnknownObject = spec
  let loadErrors: LoadResult['errors'] = []

  if (shouldLoad) {
    // TODO: Plugins for URLs and files with the proxy is missing here.
    // @see packages/api-reference/src/helpers/parse.ts
    const resp = await load(spec).catch((e) => ({
      errors: [
        {
          code: e.code,
          message: e.message,
        },
      ],
      filesystem: [],
    }))
    filesystem = resp.filesystem
    loadErrors = resp.errors ?? []
  }

  const { specification } = upgrade(filesystem)
  const { schema, errors: derefErrors = [] } = await dereference(specification)

  if (!schema)
    console.warn(
      '[@scalar/oas-utils] OpenAPI Parser Warning: Schema is undefined',
    )
  return {
    /**
     * Temporary fix for the parser returning an empty array
     * TODO: remove this once the parser is fixed
     */
    schema: (Array.isArray(schema) ? {} : schema) as OpenAPIV3_1.Document,
    errors: [...loadErrors, ...derefErrors],
  }
}

/** Converts selected security requirements to uids */
export const getSelectedSecuritySchemeUids = (
  securityRequirements: SelectedSecuritySchemeUids,
  authentication: { preferredSecurityScheme?: string | null } | undefined,
  securitySchemeMap: Record<string, string>,
): SelectedSecuritySchemeUids => {
  const name =
    authentication?.preferredSecurityScheme &&
    securityRequirements.includes(authentication.preferredSecurityScheme)
      ? authentication.preferredSecurityScheme
      : securityRequirements[0]

  const uids = Array.isArray(name)
    ? name.map((k) => securitySchemeMap[k])
    : securitySchemeMap[name]

  return [uids]
}

export type ImportSpecToWorkspaceArgs = Pick<
  CollectionPayload,
  'documentUrl' | 'watchMode'
> &
  Pick<
    ReferenceConfiguration,
    'authentication' | 'baseServerURL' | 'servers'
  > & {
    /** Sets the preferred security scheme on the collection instead of the requests */
    setCollectionSecurity?: boolean
    /** Call the load step from the parser */
    shouldLoad?: boolean
  }

/**
 * Imports an OpenAPI document and converts it to workspace entities (Collection, Request, Server, etc.)
 *
 * The imported entities maintain a close mapping to the original OpenAPI specification to enable:
 * - Bi-directional translation between spec and workspace entities
 * - Preservation of specification details and structure
 * - Accurate representation of relationships between components
 *
 * Relationships between entities are maintained through unique identifiers (UIDs) which allow:
 * - Flexible organization at different levels (workspace, collection, request)
 * - Proper linking between related components
 * - Easy lookup and reference of dependent entities
 */
export async function importSpecToWorkspace(
  spec: string | UnknownObject,
  {
    authentication,
    baseServerURL,
    documentUrl,
    servers: configuredServers,
    setCollectionSecurity = false,
    shouldLoad,
    watchMode = false,
  }: ImportSpecToWorkspaceArgs = {},
): Promise<
  | {
      error: false
      collection: Collection
      requests: Request[]
      schema: OpenAPIV3_1.Document
      examples: RequestExample[]
      servers: Server[]
      tags: Tag[]
      securitySchemes: SecurityScheme[]
    }
  | { error: true; importWarnings: string[] }
> {
  const { schema, errors } = await parseSchema(spec, { shouldLoad })
  const importWarnings: string[] = [...errors.map((e) => e.message)]

  if (!schema) return { importWarnings, error: true }
  // ---------------------------------------------------------------------------
  // Some entities will be broken out as individual lists for modification in the workspace
  const start = performance.now()
  const requests: Request[] = []

  // Add the base server url to any relative servers
  const servers: Server[] = getServersFromOpenApiDocument(
    configuredServers || schema.servers,
    {
      baseServerURL,
    },
  )

  /**
   * List of all tag strings. For non compliant specs we may need to
   * add top level tag objects for missing tag objects
   */
  const tagNames: Set<string> = new Set()

  // ---------------------------------------------------------------------------
  // SECURITY HANDLING

  const security =
    schema.components?.securitySchemes ?? schema?.securityDefinitions ?? {}

  const securitySchemes = (
    Object.entries(security) as Entries<
      Record<string, OpenAPIV3_1.SecuritySchemeObject>
    >
  )
    .map?.(([nameKey, _scheme]) => {
      // Apply any transforms we need before parsing
      const payload = {
        ..._scheme,
        nameKey,
      } as SecuritySchemePayload

      // For oauth2 we need to add the type to the flows + prefill from authentication
      if (payload.type === 'oauth2' && payload.flows) {
        const flowKeys = Object.keys(payload.flows) as Array<
          keyof typeof payload.flows
        >

        flowKeys.forEach((key) => {
          if (!payload.flows?.[key]) return
          const flow = payload.flows[key] as Oauth2FlowPayload

          // Set the type
          flow.type = key

          // Prefill values from authorization config
          if (authentication?.oAuth2) {
            if (authentication.oAuth2.accessToken)
              flow.token = authentication.oAuth2.accessToken

            if (flow.type === 'password') {
              flow.username = authentication.oAuth2.username
              flow.password = authentication.oAuth2.password
            }
            if (authentication.oAuth2.scopes) {
              flow.selectedScopes = authentication.oAuth2.scopes
              flow['x-scalar-client-id'] = authentication.oAuth2.clientId
            }
          }

          // Convert scopes to an object
          if (Array.isArray(flow.scopes))
            flow.scopes = flow.scopes.reduce(
              (prev, s) => ({ ...prev, [s]: '' }),
              {},
            )

          // Handle x-defaultClientId
          if (flow['x-defaultClientId'])
            flow['x-scalar-client-id'] = flow['x-defaultClientId']
        })
      }
      // Otherwise we just prefill
      else if (authentication) {
        // ApiKey
        if (payload.type === 'apiKey' && authentication.apiKey?.token)
          payload.value = authentication.apiKey.token
        // HTTP
        else if (payload.type === 'http') {
          if (payload.scheme === 'basic' && authentication.http?.basic) {
            payload.username = authentication.http.basic.username ?? ''
            payload.password = authentication.http.basic.password ?? ''
          } else if (payload.scheme === 'bearer' && authentication.http?.bearer)
            payload.token = authentication.http.bearer.token ?? ''
        }
      }

      const scheme = schemaModel(payload, securitySchemeSchema, false)
      if (!scheme) importWarnings.push(`Security scheme ${nameKey} is invalid.`)

      return scheme
    })
    .filter((v) => !!v)

  // Map of security scheme names to UIDs
  const securitySchemeMap: Record<string, string> = {}
  securitySchemes.forEach((s) => {
    securitySchemeMap[s.nameKey] = s.uid
  })

  // ---------------------------------------------------------------------------
  // REQUEST HANDLING

  keysOf(schema.paths ?? {}).forEach((pathString) => {
    const path = schema?.paths?.[pathString]

    if (!path) return
    // Path level servers must be saved
    const pathServers = serverSchema.array().parse(path.servers ?? [])
    servers.push(...pathServers)

    // Creates a sorted array of methods based on the path object.
    const methods = Object.keys(path).filter(isHttpMethod)

    methods.forEach((method) => {
      const operation: OpenAPIV3_1.OperationObject = path[method]
      const operationServers = serverSchema
        .array()
        .parse(operation.servers ?? [])

      servers.push(...operationServers)

      // We will save a list of all tags to ensure they exists at the top level
      // TODO: make sure we add any loose requests with no tags to the collection children
      operation.tags?.forEach((t: string) => tagNames.add(t))

      // Remove security here and add it correctly below
      const { security: operationSecurity, ...operationWithoutSecurity } =
        operation

      const securityRequirements: SelectedSecuritySchemeUids = (
        operationSecurity ??
        schema.security ??
        []
      )
        .map((s: OpenAPIV3_1.SecurityRequirementObject) => {
          const keys = Object.keys(s)
          return keys.length > 1 ? keys : keys[0]
        })
        .filter(isDefined)

      // Set the initially selected security scheme
      const selectedSecuritySchemeUids =
        securityRequirements.length && !setCollectionSecurity
          ? getSelectedSecuritySchemeUids(
              securityRequirements,
              authentication,
              securitySchemeMap,
            )
          : []

      const requestPayload: RequestPayload = {
        ...operationWithoutSecurity,
        method,
        path: pathString,
        selectedSecuritySchemeUids,
        // Merge path and operation level parameters
        parameters: [
          ...(path?.parameters ?? []),
          ...(operation.parameters ?? []),
        ] as RequestParameterPayload[],
        servers: [...pathServers, ...operationServers].map((s) => s.uid),
      }

      // Remove any examples from the request payload as they conflict with our examples property and are not valid
      if (requestPayload.examples) {
        console.warn(
          '[@scalar/api-client] operation.examples is not a valid openapi property',
        )
        delete requestPayload.examples
      }

      // Add list of UIDs to associate security schemes
      // As per the spec if there is operation level security we ignore the top level requirements
      if (operationSecurity?.length)
        requestPayload.security = operationSecurity.map(
          (s: OpenAPIV3_1.SecurityRequirementObject) => {
            const keys = Object.keys(s)

            // Handle the case of {} for optional
            if (keys.length) {
              const [key] = Object.keys(s)
              return {
                [key]: s[key],
              }
            } else return s
          },
        )

      // Save parse the request
      const request = schemaModel(requestPayload, requestSchema, false)

      if (!request)
        importWarnings.push(`${method} Request at ${path} is invalid.`)
      else requests.push(request)
    })
  })

  // ---------------------------------------------------------------------------
  // TAG HANDLING

  // TODO: We may need to handle de-duping tags
  const tags = schemaModel(schema?.tags ?? [], tagSchema.array(), false) ?? []

  // Delete any tag names that already have a definition
  tags.forEach((t) => tagNames.delete(t.name))

  // Add an entry for any tags that are used but do not have a definition
  tagNames.forEach((name) => name && tags.push(tagSchema.parse({ name })))

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
    if (r.tags?.length) {
      r.tags.forEach((t) => {
        tagMap[t].children.push(r.uid)
      })
    } else {
      collectionChildren.add(r.uid)
    }
  })

  // ---------------------------------------------------------------------------

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

  // Grab the security requirements for this operation
  const securityRequirements: SelectedSecuritySchemeUids = (
    schema.security ?? []
  ).map((s: OpenAPIV3_1.SecurityRequirementObject) => {
    const keys = Object.keys(s)
    return keys.length > 1 ? keys : keys[0]
  })

  // Set the initially selected security scheme
  const selectedSecuritySchemeUids =
    securityRequirements.length && setCollectionSecurity
      ? getSelectedSecuritySchemeUids(
          securityRequirements,
          authentication,
          securitySchemeMap,
        )
      : []

  const collection = collectionSchema.parse({
    ...schema,
    watchMode,
    documentUrl,
    requests: requests.map((r) => r.uid),
    servers: servers.map((s) => s.uid),
    tags: tags.map((t) => t.uid),
    children: [...collectionChildren],
    security: schema.security ?? [{}],
    selectedServerUid: servers?.[0]?.uid,
    selectedSecuritySchemeUids,
    components: {
      ...schema.components,
    },
    securitySchemes: securitySchemes.map((s) => s.uid),
  })

  const end = performance.now()
  console.log(`workspace: ${Math.round(end - start)} ms`)

  /**
   * Servers and requests will be saved in top level maps and indexed via UID to
   * maintain specification relationships
   */
  return {
    error: false,
    servers,
    schema,
    requests,
    examples,
    collection,
    tags,
    securitySchemes,
  }
}

/**
 * Retrieves a list of servers from an OpenAPI document and converts them to a list of Server entities.
 */
export function getServersFromOpenApiDocument(
  servers: OpenAPIV3_1.ServerObject[] | undefined,
  { baseServerURL }: Pick<ReferenceConfiguration, 'baseServerURL'> = {},
): Server[] {
  if (!servers || !Array.isArray(servers)) return []

  return servers
    .map((server): Server | undefined => {
      try {
        // Validate the server against the schema
        const parsedSchema = serverSchema.parse(server)

        // Prepend with the base server URL (if the given URL is relative)
        if (parsedSchema?.url?.startsWith('/')) {
          // Use the base server URL (if provided)
          if (baseServerURL) {
            parsedSchema.url = combineUrlAndPath(
              baseServerURL,
              parsedSchema.url,
            )

            return parsedSchema
          }

          // Fallback to the current window origin
          if (typeof window?.location?.origin === 'string') {
            parsedSchema.url = combineUrlAndPath(
              window.location.origin,
              parsedSchema.url,
            )

            return parsedSchema
          }
        }

        // Must be good, return it
        return parsedSchema
      } catch (error) {
        console.warn(`Oops, that’s an invalid server configuration.`)
        console.warn('Server:', server)
        console.warn('Error:', error)

        // Return undefined to remove the server
        return undefined
      }
    })
    .filter(isDefined)
}
