import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import type { ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { getDocumentRevision } from '@scalar/workspace-store/helpers/document-revision'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, isReactive, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'
import { createApiReference } from '@/standalone/lib/html-api'

// Observe the real stores, including the separate store used by the embedded client.
vi.mock('@scalar/workspace-store/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@scalar/workspace-store/client')>()
  return { ...original, createWorkspaceStore: vi.fn(original.createWorkspaceStore) }
})

const configuration: Partial<ApiReferenceConfigurationWithSource> = {
  slug: 'test',
  servers: [{ url: 'https://configured.example.com' }],
  content: {
    openapi: '3.1.0',
    info: { title: 'Server rendering test', version: '1.0.0' },
    servers: [{ url: 'https://original.example.com' }],
    paths: {
      '/pets': {
        get: {
          summary: 'List pets',
          responses: {
            '200': {
              description: 'Pet response',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
            },
          },
        },
      },
    },
    components: {
      schemas: { Pet: { type: 'object', properties: { petName: { type: 'string', example: 'Fido' } } } },
    },
    'x-scalar-environments': {
      production: { variables: [{ name: 'token', value: 'production-token' }] },
      staging: { variables: [{ name: 'token', value: 'staging-token' }] },
    },
    'x-scalar-active-environment': 'staging',
  },
}

const render = (config = configuration): Promise<string> => {
  const app = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
  app.config.idPrefix = 'scalar-refs'
  return renderToString(app)
}

const referenceStores = (): WorkspaceStore[] =>
  vi
    .mocked(createWorkspaceStore)
    .mock.results.flatMap((result, index) =>
      vi.mocked(createWorkspaceStore).mock.calls[index]?.[0]?.reactive !== undefined && result.type === 'return'
        ? [result.value]
        : [],
    )

beforeEach(() => vi.clearAllMocks())

describe('ApiReference.reactivity', () => {
  it('renders with non-reactive stores even when the server renderer has a DOM', async () => {
    const html = await render()
    const stores = referenceStores()
    expect(stores.length).toBe(2)
    for (const store of stores) {
      expect(isReactive(store.workspace)).toBe(false)
      const document = store.workspace.activeDocument
      expect(isOpenApiDocument(document)).toBe(true)
      expect(isReactive(document)).toBe(false)
      expect(getDocumentRevision(document)).toBe(0)
      expect(store.workspace['x-scalar-active-environment']).toBe('staging')
      if (!isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      const operation = getResolvedRef(getResolvedRef(document.paths?.['/pets'])?.get)
      const schema = operation?.responses?.['200']
      const response = getResolvedRef(schema)
      expect(response?.description).toBe('Pet response')
      const responseSchema = getResolvedRef(response?.content?.['application/json']?.schema)
      const property = responseSchema && 'properties' in responseSchema ? responseSchema.properties?.petName : undefined
      expect(property).toStrictEqual({
        type: 'string',
        example: 'Fido',
      })
    }
    const [source, client] = stores
    expect(source?.workspace.activeDocument?.servers).toStrictEqual([{ url: 'https://original.example.com' }])
    expect(client?.workspace.activeDocument?.servers).toStrictEqual(configuration.servers)
    expect(client?.workspace.activeDocument?.['x-scalar-selected-server']).toBe('https://configured.example.com')
    expect(html).toContain('Server rendering test')
    expect(html).toContain('List pets')
  })

  it('keeps hydrated stores reactive and responds to configuration updates', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    // Exercise store reactivity after hydration independently of existing markup mismatch warnings.
    const config = apiReferenceConfigurationWithSourceSchema({
      slug: 'test',
      content: JSON.stringify({ openapi: '3.1.0', info: { title: 'Initial API', version: '1' }, paths: {} }),
    })
    container.innerHTML = await render(config)
    vi.mocked(createWorkspaceStore).mockClear()
    const reference = createApiReference(container, config)
    try {
      await flushPromises()
      const stores = referenceStores()
      expect(stores.length).toBe(2)
      for (const store of stores) {
        expect(isReactive(store.workspace)).toBe(true)
      }
      reference.updateConfiguration(configuration)
      await flushPromises()
      await nextTick()
      expect(container.textContent).toContain('Server rendering test')
      expect(container.textContent).toContain('List pets')
      const client = stores[1]
      if (!client) {
        throw new Error('Expected a client store')
      }
      expect(client?.workspace.activeDocument?.servers).toStrictEqual(configuration.servers)
      expect(client.workspace['x-scalar-active-environment']).toBe('staging')
      const revision = getDocumentRevision(client.workspace.activeDocument)
      client.updateDocument('test', 'x-scalar-selected-server', 'https://edited.example.com')
      expect(getDocumentRevision(client.workspace.activeDocument)).toBeGreaterThan(revision)
    } finally {
      reference.destroy()
      container.remove()
    }
  })
})
