import { getRaw } from '@scalar/json-magic/magic-proxy'
import { getActiveOpenApiDocument, getOpenApiDocument } from '@test/helpers'
import fastify, { type FastifyInstance } from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { isReactive } from 'vue'

import { createWorkspaceStore } from '@/client'
import { isDetectChangesProxyObject } from '@/helpers/detect-changes-proxy'
import { getDocumentRevision } from '@/helpers/document-revision'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isOverridesProxyObject } from '@/helpers/overrides-proxy'
import type { InMemoryWorkspace } from '@/schemas/inmemory-workspace'
import { createServerWorkspaceStore } from '@/server'
import type { WorkspaceStateChangeEvent } from '@/workspace-plugin'

/**
 * `reactive: false` is for a read-mostly consumer — a server render walks one document across thousands
 * of pages, mutates nothing and observes nothing, and paying for Vue reactivity plus change detection on
 * every property read is the single largest cost in that walk.
 *
 * These tests pin both halves of the contract: the store keeps its whole API and reads resolve exactly
 * as they do by default, while nothing observes a write.
 */

/** Passes `bundle` calls straight through so `resolve()` still works, and counts them. */
const { bundleSpy } = vi.hoisted(() => ({ bundleSpy: vi.fn() }))

vi.mock('@scalar/json-magic/bundle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/json-magic/bundle')>()

  return {
    ...actual,
    bundle: (...args: Parameters<typeof actual.bundle>) => {
      bundleSpy(...args)
      return actual.bundle(...args)
    },
  }
})

const getDocument = () => ({
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The user ID' },
          name: { type: 'string', description: 'The user name' },
        },
      },
    },
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
    },
  },
})

/** A store with a plugin that records every state change event it is handed. */
const createStoreWithPlugin = (options?: { reactive?: boolean }) => {
  const events: WorkspaceStateChangeEvent[] = []
  const store = createWorkspaceStore({
    ...options,
    plugins: [{ hooks: { onWorkspaceStateChanges: (event) => void events.push(event) } }],
  })

  return { store, events }
}

describe('client-non-reactive', () => {
  beforeEach(() => {
    bundleSpy.mockClear()
  })

  describe('proxy layers', () => {
    it('leaves the workspace and its documents unwrapped', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'default', document: getDocument() })

      expect(isReactive(store.workspace)).toBe(false)
      expect(isDetectChangesProxyObject(store.workspace)).toBe(false)

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      expect(isReactive(document)).toBe(false)
      expect(isDetectChangesProxyObject(document)).toBe(false)
      // Nothing overrides this document, so the overrides proxy is skipped as well
      expect(isOverridesProxyObject(document)).toBe(false)
    })

    it('keeps both layers by default', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({ name: 'default', document: getDocument() })

      expect(isReactive(store.workspace)).toBe(true)
      expect(isDetectChangesProxyObject(store.workspace)).toBe(true)

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      expect(isReactive(document)).toBe(true)
      expect(isOverridesProxyObject(document)).toBe(true)
    })

    it('keeps the overrides proxy for a document that has overrides', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({
        name: 'default',
        document: getDocument(),
        overrides: { info: { title: 'Overridden title' } },
      })

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      expect(isOverridesProxyObject(document)).toBe(true)
      expect(document.info?.title).toBe('Overridden title')
    })
  })

  describe('reads', () => {
    it('resolves $ref-value through the magic proxy', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'default', document: getDocument() })

      const operation = getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get') as any
      const schema = operation?.responses?.['200']?.content?.['application/json']?.schema

      expect(schema?.items?.['$ref-value']).toEqual(getDocument().components.schemas.User)
    })

    it('resolves $ref-value through a pass-through $global stub', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.1.0',
          info: { title: 'My API', version: '1.0.0' },
          // What `resolve()` leaves behind: the component is a stub and the content sits under `x-ext`
          'x-ext': { abc: { type: 'object', title: 'Resolved through two hops' } },
          components: {
            schemas: {
              User: { $ref: '#/x-ext/abc', $global: true },
              Wrapper: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
            },
          },
        },
      })

      const wrapper = getActiveOpenApiDocument(store)?.components?.schemas?.['Wrapper'] as Record<string, any>
      const resolved = getResolvedRef(wrapper.properties.user) as Record<string, unknown> | undefined

      expect(resolved?.title).toBe('Resolved through two hops')
    })

    it('follows the active document when the workspace meta changes', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'first', document: getDocument() })
      await store.addDocument({
        name: 'second',
        document: { ...getDocument(), info: { title: 'Second API', version: '2.0.0' } },
      })

      expect(store.workspace.activeDocument?.info?.title).toBe('My API')

      store.update('x-scalar-active-document', 'second')

      expect(store.workspace['x-scalar-active-document']).toBe('second')
      expect(store.workspace.activeDocument?.info?.title).toBe('Second API')
    })

    it('applies updateDocument writes on the next read', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'default', document: getDocument() })

      expect(store.updateDocument('active', 'x-scalar-selected-server', 'staging')).toBe(true)
      expect(getActiveOpenApiDocument(store)?.['x-scalar-selected-server']).toBe('staging')
    })
  })

  describe('hydration', () => {
    it('reads a processed document back without fetching or bundling it again', async () => {
      const serverStore = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'http://localhost:1234',
        documents: [{ name: 'default', document: getDocument() }],
      })

      const resolvedDocument = serverStore.getResolvedDocument('default')
      assert(resolvedDocument !== undefined)

      const exported: InMemoryWorkspace = {
        documents: { default: getRaw(resolvedDocument) },
        meta: { 'x-scalar-active-document': 'default' },
        originalDocuments: {},
        intermediateDocuments: {},
        overrides: {},
        history: {},
        auth: {},
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      bundleSpy.mockClear()

      const store = createWorkspaceStore({ reactive: false })
      store.loadWorkspace(exported)

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(bundleSpy).not.toHaveBeenCalled()
      fetchSpy.mockRestore()

      // The document is readable straight away, references and all
      const document = getActiveOpenApiDocument(store)
      expect(document?.info?.title).toBe('My API')

      const operation = getPathItemOperation(document?.paths?.['/users'], 'get') as any
      expect(operation?.summary).toBe('Get all users')
      expect(operation?.responses?.['200']?.content?.['application/json']?.schema?.items?.['$ref-value']?.type).toBe(
        'object',
      )
    })

    it('skips bundle, coerce and navigation for a document that carries a navigation', async () => {
      const serverStore = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'http://localhost:1234',
        documents: [{ name: 'default', document: getDocument() }],
      })

      const store = createWorkspaceStore({ reactive: false })
      bundleSpy.mockClear()

      await store.addDocument({ name: 'default', document: serverStore.getWorkspace().documents['default'] ?? {} })

      expect(bundleSpy).not.toHaveBeenCalled()
      // The server-generated navigation survives rather than being rebuilt
      expect(getActiveOpenApiDocument(store)?.['x-scalar-navigation']).toEqual(
        serverStore.getWorkspace().documents['default']?.['x-scalar-navigation'],
      )
    })
  })

  describe('resolve', () => {
    let server: FastifyInstance
    const port = 9987
    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })

      return async () => {
        await server.close()
      }
    })

    it('loads a chunk from the remote server', async () => {
      server.get('/*', (req, res) => {
        res.send(serverStore.get(req.url))
      })
      await server.listen({ port })

      const serverStore = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: url,
        documents: [{ name: 'default', document: getDocument() }],
      })

      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'default', document: serverStore.getWorkspace().documents['default'] ?? {} })

      // The operation arrives as a chunk reference
      expect(getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get')).toEqual({
        $ref: `${url}/default/operations/~1users/get#`,
        $global: true,
      })

      await store.resolve(['paths', '/users', 'get'])

      const operation = getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get') as any
      expect(operation['$ref-value'].summary).toBe('Get all users')
      expect(
        operation['$ref-value'].responses[200].content['application/json'].schema.items['$ref-value']['$ref-value'],
      ).toEqual(getDocument().components.schemas.User)
    })
  })

  describe('change notification', () => {
    it('does not notify plugins on a write', async () => {
      const { store, events } = createStoreWithPlugin({ reactive: false })
      await store.addDocument({ name: 'default', document: getDocument() })

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      events.length = 0
      document.info.title = 'Edited'
      store.update('x-scalar-color-mode', 'dark')

      expect(events).toEqual([])
      // The write itself still lands
      expect(getOpenApiDocument(store, 'default')?.info?.title).toBe('Edited')
      expect(store.workspace['x-scalar-color-mode']).toBe('dark')
    })

    it('notifies plugins on a write by default', async () => {
      const { store, events } = createStoreWithPlugin()
      await store.addDocument({ name: 'default', document: getDocument() })

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      events.length = 0
      document.info.title = 'Edited'
      store.update('x-scalar-color-mode', 'dark')

      expect(events.some((event) => event.type === 'documents')).toBe(true)
      expect(events.some((event) => event.type === 'meta')).toBe(true)
    })

    it('leaves the document revision and the dirty flag alone', async () => {
      const store = createWorkspaceStore({ reactive: false })
      await store.addDocument({ name: 'default', document: getDocument() })

      const document = getOpenApiDocument(store, 'default')
      assert(document !== undefined)

      document.info.title = 'Edited'

      expect(getDocumentRevision(document)).toBe(0)
      expect(document['x-scalar-is-dirty']).toBeUndefined()
    })
  })

  describe('workspace round trip', () => {
    it('exports from a reactive store into a non-reactive one and back', async () => {
      const reactiveStore = createWorkspaceStore({ meta: { 'x-scalar-active-document': 'default' } })
      await reactiveStore.addDocument({ name: 'default', document: getDocument() })

      const nonReactiveStore = createWorkspaceStore({ reactive: false })
      nonReactiveStore.loadWorkspace(reactiveStore.exportWorkspace())

      expect(nonReactiveStore.exportWorkspace()).toEqual(reactiveStore.exportWorkspace())
      expect(getActiveOpenApiDocument(nonReactiveStore)?.info?.title).toBe('My API')

      // And back the other way, so a server render can hand its workspace to the browser store
      const rehydrated = createWorkspaceStore()
      rehydrated.loadWorkspace(nonReactiveStore.exportWorkspace())

      expect(rehydrated.exportWorkspace()).toEqual(reactiveStore.exportWorkspace())
      expect(isReactive(rehydrated.workspace)).toBe(true)
      expect(getActiveOpenApiDocument(rehydrated)?.info?.title).toBe('My API')
    })
  })
})
