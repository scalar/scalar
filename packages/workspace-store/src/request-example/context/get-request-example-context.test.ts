import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'

import { getRequestExampleContext } from './get-request-example-context'

const createMinimalDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: {},
      },
    },
  },
  components: {
    securitySchemes: {
      apiKeyHeader: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
  ...overrides,
})

describe('getRequestExampleContext', () => {
  it('merges options.authentication securitySchemes into security.schemes', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'scalar-galaxy',
      document: createMinimalDocument(),
    })

    const result = getRequestExampleContext(
      workspaceStore,
      'scalar-galaxy',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'YOUR_SECRET_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      value: 'YOUR_SECRET_TOKEN',
      'x-scalar-secret-token': 'YOUR_SECRET_TOKEN',
    })
  })

  it('applies options.authentication when using fallbackDocument only', () => {
    const workspaceStore = createWorkspaceStore()
    const fallbackDocument = createMinimalDocument()

    const result = getRequestExampleContext(
      workspaceStore,
      'not-in-workspace',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        fallbackDocument,
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'CONFIG_ONLY_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      'x-scalar-secret-token': 'CONFIG_ONLY_TOKEN',
    })
  })

  it('prefers auth store secrets over options.authentication for the same scheme', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument(),
    })

    workspaceStore.auth.setAuthSecrets('doc', 'apiKeyHeader', {
      type: 'apiKey',
      'x-scalar-secret-token': 'STORE_TOKEN',
    })

    const result = getRequestExampleContext(
      workspaceStore,
      'doc',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {
        authentication: {
          securitySchemes: {
            apiKeyHeader: {
              value: 'CONFIG_TOKEN',
            },
          },
        },
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.data.security.schemes.apiKeyHeader).toMatchObject({
      value: 'CONFIG_TOKEN',
      'x-scalar-secret-token': 'STORE_TOKEN',
    })
  })
})
