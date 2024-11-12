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
  requestMethods,
  requestSchema,
  serverSchema,
  tagSchema,
} from '@/entities/spec'
import {
  type SecurityScheme,
  type SecuritySchemeExampleValue,
  type SecuritySchemePayload,
  authExampleFromSchema,
  securitySchemeSchema,
} from '@/entities/spec/security'
import { schemaModel } from '@/helpers/schema-model'
import { keysOf } from '@scalar/object-utils/arrays'
import { dereference, load, upgrade } from '@scalar/openapi-parser'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import type { UnknownObject } from '@scalar/types/utils'
import type { Entries } from 'type-fest'

/**
 * We need to convert from openapi spec flows to our singular flow object here
 * If we ever go spec compliant (flows), we will no longer need this conversion
 */
const convertOauth2Flows = (
  security: OpenAPIV3_1.OAuth2SecurityScheme,
  nameKey: string,
  auth?: ReferenceConfiguration['authentication'],
) => {
  if (security.type === 'oauth2') {
    const entries = Object.entries(security.flows ?? {})
    if (entries.length) {
      const [[type, flow]] = entries

      const payload = {
        ...security,
        nameKey,
        flow: {
          ...flow,
          scopes:
            // Ensure we convert array scope to an object
            Array.isArray(flow.scopes) && typeof flow.scopes[0] === 'string'
              ? flow.scopes.reduce((prev, s) => ({ ...prev, [s]: '' }), {})
              : flow.scopes,
          type,
        },
      } as Extract<SecuritySchemePayload, { type: 'oauth2' }>

      if (auth?.oAuth2 && payload.flow) {
        // Set client id
        if (auth.oAuth2.clientId)
          payload['x-scalar-client-id'] = auth.oAuth2.clientId
        // Set selected scopes
        if (auth.oAuth2.scopes) payload.flow.selectedScopes = auth.oAuth2.scopes
      }

      // Handle x-defaultClientId
      if (
        'x-defaultClientId' in flow &&
        typeof flow['x-defaultClientId'] === 'string'
      )
        payload['x-scalar-client-id'] = flow['x-defaultClientId']

      return payload
    }
  }

  return {
    ...security,
    nameKey,
  }
}

/** Pre-fill baseValues if we have authentication config */
export const getBaseAuthValues = (
  scheme: SecurityScheme,
  auth?: ReferenceConfiguration['authentication'],
): Record<string, never> | Partial<SecuritySchemeExampleValue> => {
  if (!auth) return {}

  // ApiKey
  if (scheme.type === 'apiKey') return { value: auth.apiKey?.token ?? '' }
  // HTTP
  else if (scheme.type === 'http') {
    if (scheme.scheme === 'basic')
      return {
        username: auth.http?.basic?.username ?? '',
        password: auth.http?.basic?.password ?? '',
      }
    else if (scheme.scheme === 'bearer')
      return { token: auth.http?.bearer?.token ?? '' }
  }
  // oauth2 implicit only for now, when we support multi flow can expand this
  else if (scheme.type === 'oauth2') {
    if (scheme.flow?.type === 'implicit')
      return {
        type: 'oauth-implicit',
        token: auth.oAuth2?.accessToken ?? '',
      }
    else if (scheme.flow?.type === 'password')
      return {
        type: 'oauth-password',
        token: auth.oAuth2?.accessToken ?? '',
        username: auth.oAuth2?.username ?? '',
        password: auth.oAuth2?.password ?? '',
      }
  }

  return {}
}

/** Takes a string or object and parses it into an openapi spec compliant schema */
export const parseSchema = async (spec: string | UnknownObject) => {
  const { filesystem } = await load(spec)
  const { specification } = upgrade(filesystem)
  const { schema, errors = [] } = await dereference(specification)

  return { schema: schema as OpenAPIV3.Document | OpenAPIV3_1.Document, errors }
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
  }

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
  {
    authentication,
    baseServerURL,
    documentUrl,
    servers: overloadServers,
    setCollectionSecurity = false,
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
  const { schema, errors } = await parseSchema(spec)
  const importWarnings: string[] = [...errors.map((e) => e.message)]

  if (!schema) return { importWarnings, error: true }
  // ---------------------------------------------------------------------------
  // Some entities will be broken out as individual lists for modification in the workspace
  const requests: Request[] = []

  // Grab the base server URL for relative servers
  const backupBaseServerUrl =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
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

  const securitySchemes = (Object.entries(security) as Entries<typeof security>)
    .map?.(([nameKey, s]) => {
      const scheme = schemaModel(
        // We must convert flows to a singular object, technically not spec compliant so we grab the first
        s.type === 'oauth2'
          ? convertOauth2Flows(
              s as OpenAPIV3_1.OAuth2SecurityScheme,
              nameKey as string,
              authentication,
            )
          : {
              ...s,
              nameKey,
            },
        securitySchemeSchema,
        false,
      )

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

    requestMethods.forEach((method) => {
      const operation: OpenAPIV3_1.OperationObject<{
        tags?: string[]
        security?: OpenAPIV3_1.SecurityRequirementObject[]
      }> = path[method as keyof typeof path]
      if (operation && typeof operation === 'object') {
        const operationServers = serverSchema
          .array()
          .parse(operation.servers ?? [])

        servers.push(...operationServers)

        // We will save a list of all tags to ensure they exists at the top level
        // TODO: make sure we add any loose requests with no tags to the collection children
        operation.tags?.forEach((t) => tagNames.add(t))

        // Remove security here and add it correctly below
        const { security: operationSecurity, ...operationWithoutSecurity } =
          operation

        // Grab the security requirements for this operation
        const securityRequirements = (
          operationSecurity ??
          (schema.security as OpenAPIV3_1.SecurityRequirementObject[]) ??
          []
        ).flatMap((s) => {
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
          requestPayload.security = operationSecurity.map((s) => {
            const keys = Object.keys(s)

            // Handle the case of {} for optional
            if (keys.length) {
              const [key] = Object.keys(s)
              return {
                [key]: s[key],
              }
            } else return s
          })

        // Save parse the request
        const request = schemaModel(requestPayload, requestSchema, false)

        if (!request)
          importWarnings.push(`${method} Request at ${path} is invalid.`)
        else requests.push(request)
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
  // Create the auth examples
  const auth = securitySchemes?.reduce<Collection['auth']>((prev, s) => {
    const baseValues = getBaseAuthValues(s, authentication)
    const example = authExampleFromSchema(s, baseValues)

    if (example) prev[s.uid] = example
    return prev
  }, {})

  const securityKeys = Object.keys(security)
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
    auth,
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
