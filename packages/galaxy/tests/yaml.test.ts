import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import galaxy from '../src/documents/3.1.yaml?raw'
import galaxyThreeTwo from '../src/documents/3.2.yaml?raw'

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace'

type SecurityRequirement = Record<string, string[]>

type OperationObject = {
  security?: SecurityRequirement[]
  callbacks?: Record<string, CallbackObject>
}

type PathItemObject = Partial<Record<HttpMethod, OperationObject>>

type CallbackObject = Record<string, PathItemObject>

type OpenApiDocument = {
  paths: Record<string, PathItemObject>
  webhooks: Record<string, PathItemObject>
}

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']

const getDocument = (): OpenApiDocument => YAML.parse(galaxy) as OpenApiDocument

// A focused view of the 3.2 document, typed only for the OpenAPI 3.2 features
// exercised below rather than the whole specification surface.
type ThreeTwoMediaType = {
  itemSchema?: unknown
  prefixEncoding?: unknown[]
  itemEncoding?: unknown
}

type ThreeTwoOperation = {
  parameters?: Array<{ in?: string }>
  requestBody?: { content?: Record<string, ThreeTwoMediaType> }
  responses?: Record<string, { content?: Record<string, ThreeTwoMediaType> }>
}

type ThreeTwoPathItem = Partial<Record<HttpMethod, ThreeTwoOperation>> & {
  query?: ThreeTwoOperation
  additionalOperations?: Record<string, ThreeTwoOperation>
}

type ThreeTwoSecurityScheme = {
  deprecated?: boolean
  oauth2MetadataUrl?: string
  flows?: Record<string, { deviceAuthorizationUrl?: string; tokenUrl?: string }>
}

type ThreeTwoDocument = {
  servers: Array<{ url: string; name?: string }>
  tags: Array<{ name: string; summary?: string; parent?: string; kind?: string }>
  paths: Record<string, ThreeTwoPathItem>
  components: {
    securitySchemes: Record<string, ThreeTwoSecurityScheme>
    schemas: Record<string, { properties?: Record<string, { xml?: { nodeType?: string } }> }>
  }
}

const getThreeTwoDocument = (): ThreeTwoDocument => YAML.parse(galaxyThreeTwo) as ThreeTwoDocument

describe('yaml', () => {
  it('has OpenAPI version', () => {
    expect(galaxy).toContain('openapi: 3.1.1')
  })

  it('ships a 3.2 document on version 3.2.0', () => {
    expect(galaxyThreeTwo).toContain('openapi: 3.2.0')
  })

  it('gives every server a name', () => {
    const { servers } = getThreeTwoDocument()
    expect(servers.length).toBeGreaterThan(0)
    expect(servers.every((server) => typeof server.name === 'string')).toBe(true)
  })

  it('nests tags with parent, kind and summary', () => {
    const { tags } = getThreeTwoDocument()
    const planets = tags.find((tag) => tag.name === 'Planets')
    expect(planets?.parent).toBe('Celestial Bodies')
    expect(planets?.kind).toBe('nav')
    expect(planets?.summary).toBeTypeOf('string')
    expect(tags.some((tag) => tag.kind === 'badge')).toBe(true)
    expect(tags.some((tag) => tag.kind === 'audience')).toBe(true)
  })

  it('defines a QUERY operation and a custom COPY operation', () => {
    const { paths } = getThreeTwoDocument()
    expect(paths['/planets']?.query).toBeDefined()
    expect(paths['/planets/{planetId}']?.additionalOperations?.COPY).toBeDefined()
  })

  it('describes a full query string with the querystring parameter location', () => {
    const parameters = getThreeTwoDocument().paths['/planets/search']?.get?.parameters ?? []
    expect(parameters.some((parameter) => parameter.in === 'querystring')).toBe(true)
  })

  it('streams items with itemSchema across sequential media types', () => {
    const content = getThreeTwoDocument().paths['/planets/events']?.get?.responses?.['200']?.content ?? {}
    expect(content['text/event-stream']?.itemSchema).toBeDefined()
    expect(content['application/jsonl']?.itemSchema).toBeDefined()
    expect(content['application/json-seq']?.itemSchema).toBeDefined()
  })

  it('encodes multipart streams with prefixEncoding and itemEncoding', () => {
    const content = getThreeTwoDocument().paths['/planets/{planetId}/observations']?.post?.requestBody?.content ?? {}
    const mixed = content['multipart/mixed']
    expect(mixed?.prefixEncoding).toBeDefined()
    expect(mixed?.itemEncoding).toBeDefined()
  })

  it('adds the OAuth 2.0 device authorization flow and metadata url', () => {
    const oauth = getThreeTwoDocument().components.securitySchemes.oAuth2
    expect(oauth.flows?.deviceAuthorization?.deviceAuthorizationUrl).toBeTypeOf('string')
    expect(oauth.oauth2MetadataUrl).toBeTypeOf('string')
  })

  it('marks a legacy security scheme as deprecated', () => {
    expect(getThreeTwoDocument().components.securitySchemes.apiKeyQuery.deprecated).toBe(true)
  })

  it('maps schema properties to XML node types', () => {
    const { schemas } = getThreeTwoDocument().components
    expect(schemas.Planet.properties?.id.xml?.nodeType).toBe('attribute')
    expect(schemas.GalaxyMessage.properties?.value.xml?.nodeType).toBe('text')
  })

  it('uses the expected security requirements for all operations', () => {
    const document = getDocument()
    const expectedSecurityByOperation: Record<string, SecurityRequirement[] | null> = {
      'get /planets': [],
      'post /planets': null,
      'get /planets/{planetId}': [],
      'put /planets/{planetId}': null,
      'delete /planets/{planetId}': null,
      'post /planets/{planetId}/image': null,
      'post /celestial-bodies': null,
      'post /user/signup': [],
      'post /auth/token': [],
      'get /me': [
        { basicAuth: [] },
        { oAuth2: ['read:account'] },
        { bearerAuth: [] },
        { apiKeyHeader: [] },
        { apiKeyQuery: [] },
        { apiKeyHeader: [], apiKeyQuery: [] },
      ],
    }

    const discoveredOperations: string[] = []

    for (const [path, pathItem] of Object.entries(document.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method]
        if (!operation) {
          continue
        }

        const key = `${method} ${path}`
        discoveredOperations.push(key)
        const expectedSecurity = expectedSecurityByOperation[key]

        expect(expectedSecurity, `Missing expected security entry for ${key}`).not.toBeUndefined()
        if (expectedSecurity === null) {
          expect(operation.security, `${key} should inherit root security`).toBeUndefined()
        } else {
          expect(operation.security, `${key} should have explicit security override`).toStrictEqual(expectedSecurity)
        }
      }
    }

    expect(discoveredOperations.sort()).toStrictEqual(Object.keys(expectedSecurityByOperation).sort())
  })

  it('uses the expected security requirements for all callbacks and webhooks', () => {
    const document = getDocument()
    const createPlanet = document.paths['/planets']?.post
    const callbacks = createPlanet?.callbacks ?? {}

    expect(Object.keys(callbacks).sort()).toStrictEqual(['planetCreated', 'planetCreationFailed', 'planetExploded'])

    for (const [callbackName, callback] of Object.entries(callbacks)) {
      for (const [callbackExpression, pathItem] of Object.entries(callback)) {
        for (const method of HTTP_METHODS) {
          const operation = pathItem[method]
          if (!operation) {
            continue
          }

          expect(
            operation.security,
            `${callbackName} (${callbackExpression}) ${method} should not require API auth`,
          ).toStrictEqual([])
        }
      }
    }

    const expectedSecurityByWebhook: Record<string, SecurityRequirement[]> = {
      'post newPlanet': [],
    }
    const discoveredWebhooks: string[] = []

    for (const [webhookName, pathItem] of Object.entries(document.webhooks)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method]
        if (!operation) {
          continue
        }

        const key = `${method} ${webhookName}`
        discoveredWebhooks.push(key)
        expect(operation.security, `${key} should have explicit webhook security`).toStrictEqual(
          expectedSecurityByWebhook[key],
        )
      }
    }

    expect(discoveredWebhooks.sort()).toStrictEqual(Object.keys(expectedSecurityByWebhook).sort())
  })
})
