import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'

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

  it('resolves selectedSchemes using selectedIndex from the selected security', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        security: [{ apiKeyHeader: [] }],
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    expect(result.ok).toBe(true)
    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(0)
    expect(result.data.security.selectedSchemes).toStrictEqual([
      expect.objectContaining({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      }),
    ])
  })

  it('returns empty selectedSchemes when selectedIndex is -1 (optional auth)', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        security: [{}],
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(-1)
    expect(result.data.security.selectedSchemes).toStrictEqual([])
  })

  it('resolves selectedSchemes from the correct index when multiple requirements exist', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        components: {
          securitySchemes: {
            apiKeyHeader: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
            },
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
        security: [{ apiKeyHeader: [] }, { bearerAuth: [] }],
      }),
    })

    workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'doc' },
      {
        selectedIndex: 1,
        selectedSchemes: [{ apiKeyHeader: [] }, { bearerAuth: [] }],
      },
    )

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: '/pets',
      method: 'get',
      exampleName: 'default',
    })

    expect(result.ok).toBe(true)
    assert(result.ok)

    expect(result.data.security.selected.selectedIndex).toBe(1)
    expect(result.data.security.selectedSchemes).toStrictEqual([
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    ])
  })

  describe('webhooks', () => {
    const createDocumentWithWebhook = (): OpenApiDocument =>
      createMinimalDocument({
        webhooks: {
          newPet: {
            post: {
              operationId: 'newPetWebhook',
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { name: { type: 'string' } } },
                  },
                },
              },
              responses: {
                '200': { description: 'Acknowledged' },
              },
            },
          },
        },
      })

    it('resolves the operation from document.webhooks when isWebhook is true', async () => {
      const workspaceStore = createWorkspaceStore()
      await workspaceStore.addDocument({
        name: 'scalar-galaxy',
        document: createDocumentWithWebhook(),
      })

      const result = getRequestExampleContext(workspaceStore, 'scalar-galaxy', {
        path: 'newPet',
        method: 'post',
        exampleName: 'default',
        isWebhook: true,
      })

      expect(result.ok).toBe(true)
      assert(result.ok)
      expect(result.data.operation.operationId).toBe('newPetWebhook')
    })

    it('falls back to fallbackDocument webhooks when the document is not in the workspace', () => {
      const workspaceStore = createWorkspaceStore()
      const fallbackDocument = createDocumentWithWebhook()

      const result = getRequestExampleContext(
        workspaceStore,
        'not-in-workspace',
        { path: 'newPet', method: 'post', exampleName: 'default', isWebhook: true },
        { fallbackDocument },
      )

      expect(result.ok).toBe(true)
      assert(result.ok)
      expect(result.data.operation.operationId).toBe('newPetWebhook')
    })

    it('returns a webhook-specific error when the webhook name is unknown', async () => {
      const workspaceStore = createWorkspaceStore()
      await workspaceStore.addDocument({
        name: 'scalar-galaxy',
        document: createDocumentWithWebhook(),
      })

      const result = getRequestExampleContext(workspaceStore, 'scalar-galaxy', {
        path: 'unknownWebhook',
        method: 'post',
        exampleName: 'default',
        isWebhook: true,
      })

      expect(result.ok).toBe(false)
      assert(!result.ok)
      expect(result.error).toContain('Webhook unknownWebhook not found')
    })

    it('returns a webhook-specific error when the method is missing on the webhook', async () => {
      const workspaceStore = createWorkspaceStore()
      await workspaceStore.addDocument({
        name: 'scalar-galaxy',
        document: createDocumentWithWebhook(),
      })

      const result = getRequestExampleContext(workspaceStore, 'scalar-galaxy', {
        path: 'newPet',
        method: 'get',
        exampleName: 'default',
        isWebhook: true,
      })

      expect(result.ok).toBe(false)
      assert(!result.ok)
      expect(result.error).toContain('Method get not found on webhook newPet')
    })

    it('does not match a webhook name when isWebhook is false (default)', async () => {
      const workspaceStore = createWorkspaceStore()
      await workspaceStore.addDocument({
        name: 'scalar-galaxy',
        document: createDocumentWithWebhook(),
      })

      const result = getRequestExampleContext(workspaceStore, 'scalar-galaxy', {
        path: 'newPet',
        method: 'post',
        exampleName: 'default',
      })

      expect(result.ok).toBe(false)
      assert(!result.ok)
      expect(result.error).toContain('Path newPet not found')
    })
  })
})
