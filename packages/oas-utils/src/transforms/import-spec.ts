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
import { isHttpMethod } from '@/helpers/httpMethods'
import { schemaModel } from '@/helpers/schema-model'
import { keysOf } from '@scalar/object-utils/arrays'
import {
  type LoadResult,
  dereference,
  load,
  upgrade,
} from '@scalar/openapi-parser'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import type { UnknownObject } from '@scalar/types/utils'
import type { Entries } from 'type-fest'

/** Takes a string or object and parses it into an openapi spec compliant schema */
export const parseSchema = async (
  spec: string | UnknownObject,
  { shouldLoad = true } = {},
) => {
  // TODO: Plugins for URLs and files with the proxy is missing here.
  // @see packages/api-reference/src/helpers/parse.ts

  let filesystem: LoadResult['filesystem'] | string | UnknownObject = spec
  let loadErrors: LoadResult['errors'] = []

  if (shouldLoad) {
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
    schema: (Array.isArray(schema) ? {} : schema) as
      | OpenAPIV3.Document
      | OpenAPIV3_1.Document,
    errors: [...loadErrors, ...derefErrors],
  }
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
    servers: overloadServers,
    setCollectionSecurity = false,
    shouldLoad,
    watchMode = false,
  }: ImportSpecToWorkspaceArgs = {},
): Promise<
  | {
      error: false
      collection: Collection
      requests: Request[]
      schema: OpenAPIV3.Document | OpenAPIV3_1.Document
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

  // Grab the base server URL for relative servers
  const backupBaseServerUrl =
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  const _baseServerUrl = baseServerURL ?? backupBaseServerUrl

  // Add the base server url to any relative servers
  const servers: Server[] = serverSchema.array().parse(
    (overloadServers ?? schema.servers)?.map((s) => {
      // Prepend base server url if relative
      if (s?.url?.startsWith('/'))
        return {
          ...s,
          // Ensure we only have one slash between
          url: [
            _baseServerUrl.replace(/\/$/, ''),
            s.url.replace(/^\//, ''),
          ].join('/'),
        }

      // Just return a regular server
      if (s.url) return s
      // Failsafe for no URL, use the base
      else
        return {
          url: _baseServerUrl,
          description: 'Replace with your API server',
        }
    }) ?? [],
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
      const operation = path[method]
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

      // Grab the security requirements for this operation
      const securityRequirements = (
        operationSecurity ??
        (schema.security as OpenAPIV3_1.SecurityRequirementObject[]) ??
        []
      ).flatMap((s: OpenAPIV3_1.SecurityRequirementObject) => {
        const keys = Object.keys(s)
        if (keys.length) return keys[0]
        else return []
      })

      let selectedSecuritySchemeUids: string[] = []

      // Set the initially selected security scheme
      if (securityRequirements.length && !setCollectionSecurity) {
        const name =
          authentication?.preferredSecurityScheme &&
          securityRequirements.includes(
            authentication.preferredSecurityScheme ?? '',
          )
            ? authentication.preferredSecurityScheme
            : securityRequirements[0]
        const uid = securitySchemeMap[name]
        selectedSecuritySchemeUids = [uid]
      }

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
    if (r.tags) {
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
  const securityKeys = Object.keys(schema.security?.[0] ?? security ?? {})
  let selectedSecuritySchemeUids: string[] = []

  /** Selected security scheme UIDs for the collection, defaults to the first key */
  if (setCollectionSecurity && securityKeys.length) {
    const preferred = authentication?.preferredSecurityScheme || securityKeys[0]
    const uid = securitySchemeMap[preferred]

    selectedSecuritySchemeUids = [uid]
  }

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
