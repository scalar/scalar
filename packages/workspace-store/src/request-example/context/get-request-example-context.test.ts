import { assert, describe, expect, it } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedPathItem } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { generateClientMutators } from '@/mutators'
import { buildRequest } from '@/request-example/builder/build-request'
import { resolveServerUrl } from '@/request-example/builder/helpers/resolve-server-url'
import { requestFactory } from '@/request-example/builder/request-factory'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'

import { getRequestExampleContext } from './get-request-example-context'
import { prepareServerSelection } from './servers'

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
  it.each(['document', 'path', 'operation'] as const)(
    'migrates a legacy %s selection during hydration while keeping reads side-effect free',
    async (scope) => {
      const workspaceStore = createWorkspaceStore()
      const previousUrl = 'https://api.example.com/tenant/v1{suffix}'
      const authoredUrl = '/tenant//v1{suffix}'
      const selection = {
        servers: [{ url: 'https://other.example.com' }, { url: authoredUrl, variables: { suffix: { default: '' } } }],
        'x-scalar-selected-server': previousUrl,
      }
      await workspaceStore.addDocument({
        name: 'test',
        documentSource: 'https://api.example.com/openapi.json',
        document: createMinimalDocument({
          ...(scope === 'document' ? selection : {}),
          paths: {
            '/pets': {
              ...(scope === 'path' ? selection : {}),
              get: { responses: {}, ...(scope === 'operation' ? selection : {}) },
            },
          },
        }),
      })

      const meta = { path: '/pets', method: 'get', exampleName: 'default' }
      const getSavedKey = (store: ReturnType<typeof createWorkspaceStore>): string | undefined => {
        const document = store.workspace.documents.test
        assert(isOpenApiDocument(document))
        const pathItem = getResolvedPathItem(document.paths?.['/pets'])
        const target = {
          document,
          path: pathItem,
          operation: getResolvedRef(pathItem?.get),
        }[scope]
        return target?.['x-scalar-selected-server']
      }
      const before = getRequestExampleContext(workspaceStore, 'test', meta)
      assert(before.ok)
      expect(before.data.servers.selected?.url).toBe(authoredUrl)
      expect(getSavedKey(workspaceStore)).toBe(previousUrl)

      const restored = createWorkspaceStore()
      restored.loadWorkspace(JSON.parse(JSON.stringify(workspaceStore.exportWorkspace())))
      expect(getSavedKey(restored)).toBe(authoredUrl)
      const after = getRequestExampleContext(restored, 'test', meta)
      assert(after.ok)
      expect(resolveServerUrl(after.data.servers.selected)).toBe('https://api.example.com/tenant//v1')
    },
  )

  it.each([false, true])('uses and edits inherited path servers (referenced path: %s)', async (referenced) => {
    const workspaceStore = createWorkspaceStore()
    const pathItem = {
      servers: [{ url: '{prefix}/v1', variables: { prefix: { default: '' } } }, { url: 'https://backup.example.com' }],
      get: { responses: {} },
      post: { responses: {} },
    }
    await workspaceStore.addDocument({
      name: 'test',
      documentSource: 'https://api.example.com/openapi.json',
      document: createMinimalDocument({
        servers: [{ url: 'https://production.example.com' }],
        'x-scalar-selected-server': 'https://production.example.com',
        paths: { '/pets': referenced ? { $ref: '#/components/pathItems/Pets' } : pathItem },
        components: referenced ? { pathItems: { Pets: pathItem } } : undefined,
      }),
    })

    const meta = { path: '/pets', method: 'get', exampleName: 'default' }
    const result = getRequestExampleContext(workspaceStore, 'test', meta)
    assert(result.ok)
    const context = result.data
    expect(context.servers.meta).toStrictEqual({ type: 'path', path: '/pets' })
    const { request } = requestFactory({
      ...meta,
      operation: context.operation,
      environment: context.environment.environment,
      server: context.servers.selected,
      globalCookies: [],
      proxyUrl: '',
      defaultHeaders: {},
      isElectron: false,
      selectedSecuritySchemes: [],
    })
    const built = buildRequest(request, { envVariables: {} })
    assert(built.ok)
    expect(String(built.data.requestPayload[0])).toBe('https://api.example.com/v1/pets')

    const mutators = generateClientMutators(workspaceStore).doc('test').server
    mutators.updateServerVariables({ index: 0, key: 'prefix', value: '/internal', meta: context.servers.meta })
    mutators.updateSelectedServer({ url: 'https://backup.example.com', meta: context.servers.meta })

    const restored = createWorkspaceStore()
    restored.loadWorkspace(JSON.parse(JSON.stringify(workspaceStore.exportWorkspace())))
    const secondOperation = getRequestExampleContext(restored, 'test', { ...meta, method: 'post' })
    assert(secondOperation.ok)
    expect(secondOperation.data.servers.selected?.url).toBe('https://backup.example.com')
    expect(secondOperation.data.servers.list[0]?.variables?.prefix?.default).toBe('/internal')
    const document = restored.workspace.documents.test
    assert(isOpenApiDocument(document))
    expect(document['x-scalar-selected-server']).toBe('https://production.example.com')
    expect(getResolvedPathItem(document.paths?.['/pets'])?.get).toStrictEqual({ responses: {} })
  })

  it('targets document variables when configured servers override operation servers', async () => {
    const workspaceStore = createWorkspaceStore()
    const configuredServers = [{ url: 'https://{env}.example.com', variables: { env: { default: 'prod' } } }]
    await workspaceStore.addDocument({
      name: 'test',
      document: createMinimalDocument({
        servers: configuredServers,
        'x-scalar-selected-server': 'https://{env}.example.com',
        paths: {
          '/pets': {
            servers: [{ url: 'https://path.example.com' }],
            get: { servers: [{ url: 'https://operation.example.com' }], responses: {} },
          },
        },
      }),
    })
    const result = getRequestExampleContext(
      workspaceStore,
      'test',
      { path: '/pets', method: 'get', exampleName: 'default' },
      { servers: configuredServers },
    )
    assert(result.ok)
    expect(result.data.servers.meta).toStrictEqual({ type: 'document' })
    expect(result.data.servers.selected).toStrictEqual(configuredServers[0])

    const withoutOverride = getRequestExampleContext(
      workspaceStore,
      'test',
      { path: '/pets', method: 'get', exampleName: 'default' },
      {},
    )
    assert(withoutOverride.ok)
    expect(withoutOverride.data.servers.meta).toStrictEqual({ type: 'operation', path: '/pets', method: 'get' })
    expect(withoutOverride.data.servers.selected?.url).toBe('https://operation.example.com')
  })

  it('retains the selected path server when its URL is edited to a root-relative path', async () => {
    const store = createWorkspaceStore()
    const documentUrl = 'https://api.example.com/openapi.json'
    await store.addDocument({
      name: 'test',
      documentSource: documentUrl,
      document: createMinimalDocument({
        paths: {
          '/pets': {
            get: { responses: {} },
            servers: [{ url: 'https://first.example.com' }, { url: 'https://selected.example.com' }],
            'x-scalar-selected-server': 'https://selected.example.com',
          },
        },
      }),
    })

    generateClientMutators(store)
      .doc('test')
      .server.updateServer({
        index: 1,
        server: { url: '/new' },
        meta: { type: 'path', path: '/pets' },
      })

    const document = store.workspace.documents.test
    assert(isOpenApiDocument(document))
    const pathItem = getResolvedPathItem(document.paths?.['/pets'])
    assert(pathItem)
    expect(resolveServerUrl(prepareServerSelection(pathItem, { documentUrl }))).toBe('https://api.example.com/new')
    expect(pathItem['x-scalar-selected-server']).toBe('/new')

    const meta = { path: '/pets', method: 'get', exampleName: 'default' }
    const result = getRequestExampleContext(store, 'test', meta)
    assert(result.ok)
    expect(result.data.servers.selected?.url).toBe('/new')
    expect(resolveServerUrl(result.data.servers.selected)).toBe('https://api.example.com/new')
    expect(pathItem['x-scalar-selected-server']).toBe('/new')
    expect(pathItem.servers?.[1]?.url).toBe('/new')

    const restored = createWorkspaceStore()
    restored.loadWorkspace(JSON.parse(JSON.stringify(store.exportWorkspace())))
    const reloaded = getRequestExampleContext(restored, 'test', meta)
    assert(reloaded.ok)
    expect(resolveServerUrl(reloaded.data.servers.selected)).toBe('https://api.example.com/new')
  })

  it('keeps distinct authored selections when an edit resolves to another server template', async () => {
    const store = createWorkspaceStore()
    const path = '/pets'
    const documentUrl = 'https://api.example.com/openapi.json'
    const selected = 'https://another.example.com/{version}'
    await store.addDocument({
      name: 'test',
      documentSource: documentUrl,
      document: createMinimalDocument({
        paths: {
          [path]: {
            get: { responses: {} },
            'x-scalar-selected-server': selected,
            servers: [
              { url: 'https://api.example.com/{version}', variables: { version: { default: 'v1' } } },
              { url: selected, variables: { version: { default: 'v2' } } },
            ],
          },
        },
      }),
    })
    generateClientMutators(store)
      .doc('test')
      .server.updateServer({
        index: 1,
        server: { url: '/{version}' },
        meta: { type: 'path', path },
      })

    const meta = { path, method: 'get', exampleName: 'default' }
    const request = getRequestExampleContext(store, 'test', meta)
    assert(request.ok)
    expect(request.data.servers.list.map(({ url }) => url)).toStrictEqual([
      'https://api.example.com/{version}',
      '/{version}',
    ])
    expect(resolveServerUrl(request.data.servers.selected)).toBe('https://api.example.com/v2')

    const document = store.workspace.documents.test
    assert(isOpenApiDocument(document))
    const pathItem = getResolvedPathItem(document.paths?.[path])
    assert(pathItem)
    expect(resolveServerUrl(prepareServerSelection(pathItem, { documentUrl }))).toBe('https://api.example.com/v2')

    const restored = createWorkspaceStore()
    restored.loadWorkspace(JSON.parse(JSON.stringify(store.exportWorkspace())))
    const reloaded = getRequestExampleContext(restored, 'test', meta, { baseServerUrl: 'https://new.example.com' })
    assert(reloaded.ok)
    expect(resolveServerUrl(reloaded.data.servers.selected)).toBe('https://new.example.com/v2')
  })

  it('shares the selected server across paths that reference the same Path Item', async () => {
    const store = createWorkspaceStore()
    const ref = { $ref: '#/components/pathItems/Pets' }
    await store.addDocument({
      name: 'test',
      document: createMinimalDocument({
        paths: { '/pets': ref, '/animals': { ...ref } },
        components: {
          pathItems: {
            Pets: {
              get: { responses: {} },
              servers: [{ url: '/primary' }, { url: '/backup' }],
            },
          },
        },
      }),
    })

    const mutators = generateClientMutators(store).doc('test').server
    const meta = { type: 'path', path: '/pets' } as const
    mutators.updateSelectedServer({ url: '/backup', meta })
    mutators.updateServer({ index: 1, server: { url: '/sandbox' }, meta })

    for (const path of ['/pets', '/animals']) {
      const context = getRequestExampleContext(store, 'test', { path, method: 'get', exampleName: 'default' })
      assert(context.ok)
      expect(context.data.servers.selected?.url).toBe('/sandbox')
    }
  })

  it('keeps a webhook recipient independent of OpenAPI server selection', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test',
      document: createMinimalDocument({
        servers: [{ url: 'https://document.example.com' }],
        webhooks: {
          constructor: {
            servers: [{ url: 'https://path.example.com' }],
            post: { responses: {}, servers: [{ url: 'https://operation.example.com' }] },
          },
        },
      }),
    })

    const context = getRequestExampleContext(
      store,
      'test',
      { path: 'constructor', method: 'post', exampleName: 'default', isWebhook: true },
      { servers: [{ url: 'https://configured.example.com' }] },
    )
    assert(context.ok)
    expect(context.data.servers).toStrictEqual({ list: [], selected: null, meta: { type: 'document' } })
  })

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

  it('resolves webhook operations without inheriting document servers', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        servers: [{ url: 'https://api.example.com' }],
        webhooks: {
          'delivery.created': {
            post: {
              summary: 'Receive a delivery',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        eventType: { type: 'string' },
                        deliveryId: { type: 'string' },
                      },
                    },
                  },
                },
              },
              responses: {},
            },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'post',
      exampleName: 'default',
      isWebhook: true,
    })

    assert(result.ok)
    expect(result.data.operation.summary).toBe('Receive a delivery')
    expect(result.data.servers.list).toStrictEqual([])
    expect(result.data.servers.selected).toBeNull()
  })

  it('does not resolve webhook names as API paths', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        webhooks: {
          'delivery.created': {
            post: { responses: {} },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'post',
      exampleName: 'default',
    })

    expect(result).toStrictEqual({
      ok: false,
      error: 'Path delivery.created not found',
    })
  })

  it('reports a missing webhook operation method', async () => {
    const workspaceStore = createWorkspaceStore()
    await workspaceStore.addDocument({
      name: 'doc',
      document: createMinimalDocument({
        openapi: '3.1.1',
        webhooks: {
          'delivery.created': {
            post: { responses: {} },
          },
        },
      }),
    })

    const result = getRequestExampleContext(workspaceStore, 'doc', {
      path: 'delivery.created',
      method: 'get',
      exampleName: 'default',
      isWebhook: true,
    })

    expect(result).toStrictEqual({
      ok: false,
      error: 'Method get not found on webhook delivery.created',
    })
  })
})
