import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'

/** Helper to base64-encode `user:password` for Basic auth. */
const basic = (credentials: string) => `Basic ${btoa(credentials)}`

const securitySchemes: OpenAPIV3_1.ComponentsObject['securitySchemes'] = {
  basicAuth: { type: 'http', scheme: 'basic' },
  bearerAuth: { type: 'http', scheme: 'bearer' },
  apiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
  apiKeyQuery: { type: 'apiKey', in: 'query', name: 'api_key' },
}

const okResponse: OpenAPIV3_1.ResponsesObject = {
  '200': {
    description: 'OK',
    content: { 'application/json': { example: { ok: true } } },
  },
}

/** Build a document with a single secured `GET /secret` operation. */
const documentWith = ({
  operationSecurity,
  globalSecurity,
}: {
  operationSecurity?: OpenAPIV3_1.SecurityRequirementObject[]
  globalSecurity?: OpenAPIV3_1.SecurityRequirementObject[]
}): OpenAPIV3_1.Document => ({
  openapi: '3.1.1',
  info: { title: 'Test', version: '1.0.0' },
  ...(globalSecurity ? { security: globalSecurity } : {}),
  paths: {
    '/secret': {
      get: {
        ...(operationSecurity ? { security: operationSecurity } : {}),
        responses: okResponse,
      },
    },
  },
  components: { securitySchemes },
})

describe('handleAuthentication', () => {
  it('rejects a request without credentials', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ bearerAuth: [] }] }) })

    const response = await server.request('/secret')

    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toContain('Bearer')
  })

  it('accepts a valid bearer token', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ bearerAuth: [] }] }) })

    const response = await server.request('/secret', { headers: { Authorization: 'Bearer token-123' } })

    expect(response.status).toBe(200)
  })

  it('rejects a bearer scheme with an empty token', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ bearerAuth: [] }] }) })

    const response = await server.request('/secret', { headers: { Authorization: 'Bearer ' } })

    expect(response.status).toBe(401)
  })

  it('accepts a well-formed basic credential', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ basicAuth: [] }] }) })

    const response = await server.request('/secret', { headers: { Authorization: basic('user:password') } })

    expect(response.status).toBe(200)
  })

  it('rejects a basic credential that is not valid base64', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ basicAuth: [] }] }) })

    const response = await server.request('/secret', { headers: { Authorization: 'Basic not-base64!!' } })

    expect(response.status).toBe(401)
  })

  it('rejects a basic credential without a colon', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ basicAuth: [] }] }) })

    const response = await server.request('/secret', { headers: { Authorization: basic('useronly') } })

    expect(response.status).toBe(401)
  })

  it('accepts an API key in a header', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ apiKeyHeader: [] }] }) })

    const response = await server.request('/secret', { headers: { 'X-API-Key': 'abc' } })

    expect(response.status).toBe(200)
  })

  it('accepts an API key in the query string', async () => {
    const server = await createMockServer({ document: documentWith({ operationSecurity: [{ apiKeyQuery: [] }] }) })

    const response = await server.request('/secret?api_key=abc')

    expect(response.status).toBe(200)
  })

  describe('AND semantics (multiple schemes in one requirement)', () => {
    const both: OpenAPIV3_1.SecurityRequirementObject[] = [{ bearerAuth: [], apiKeyHeader: [] }]

    it('requires every scheme in the requirement', async () => {
      const server = await createMockServer({ document: documentWith({ operationSecurity: both }) })

      // Only the bearer token, missing the API key.
      const response = await server.request('/secret', { headers: { Authorization: 'Bearer token-123' } })

      expect(response.status).toBe(401)
    })

    it('passes when every scheme is satisfied', async () => {
      const server = await createMockServer({ document: documentWith({ operationSecurity: both }) })

      const response = await server.request('/secret', {
        headers: { Authorization: 'Bearer token-123', 'X-API-Key': 'abc' },
      })

      expect(response.status).toBe(200)
    })
  })

  describe('OR semantics (multiple requirement objects)', () => {
    const either: OpenAPIV3_1.SecurityRequirementObject[] = [{ bearerAuth: [] }, { apiKeyHeader: [] }]

    it('passes when any requirement is satisfied', async () => {
      const server = await createMockServer({ document: documentWith({ operationSecurity: either }) })

      const response = await server.request('/secret', { headers: { 'X-API-Key': 'abc' } })

      expect(response.status).toBe(200)
    })

    it('advertises a challenge for each scheme', async () => {
      const server = await createMockServer({ document: documentWith({ operationSecurity: either }) })

      const response = await server.request('/secret')

      const challenge = response.headers.get('WWW-Authenticate') ?? ''
      expect(challenge).toContain('Bearer')
      expect(challenge).toContain('ApiKey')
    })
  })

  describe('global security inheritance', () => {
    it('enforces document-level security when the operation defines none', async () => {
      const server = await createMockServer({ document: documentWith({ globalSecurity: [{ bearerAuth: [] }] }) })

      const response = await server.request('/secret')

      expect(response.status).toBe(401)
    })

    it('lets an operation opt out of global security with an empty array', async () => {
      const server = await createMockServer({
        document: documentWith({ globalSecurity: [{ bearerAuth: [] }], operationSecurity: [] }),
      })

      const response = await server.request('/secret')

      expect(response.status).toBe(200)
    })
  })

  it('treats an empty requirement object as optional auth', async () => {
    const server = await createMockServer({
      document: documentWith({ operationSecurity: [{ bearerAuth: [] }, {}] }),
    })

    const response = await server.request('/secret')

    expect(response.status).toBe(200)
  })
})
