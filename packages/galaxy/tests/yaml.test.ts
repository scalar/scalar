import { describe, expect, it } from 'vitest'
import YAML from 'yaml'

import galaxy from '../src/documents/3.1.yaml?raw'

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

describe('yaml', () => {
  it('has OpenAPI version', () => {
    expect(galaxy).toContain('openapi: 3.1.1')
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
