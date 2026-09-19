import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { cwd } from 'node:process'

import { getActiveOpenApiDocument } from '@test/helpers'
import fastify, { type FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { CHUNK_INDEX_KEY, expandChunkIndex } from '@/helpers/chunk-index'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'
import { createServerWorkspaceStore } from '@/server'

const { bundleSpy, coerceSpy, createNavigationSpy } = vi.hoisted(() => ({
  bundleSpy: vi.fn(),
  coerceSpy: vi.fn(),
  createNavigationSpy: vi.fn(),
}))

// Wrapped rather than replaced, so a test can assert what the client did without changing what it
// does: every call runs the real implementation and is counted on the way through.
vi.mock('@scalar/json-magic/bundle', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/json-magic/bundle')>()

  return { ...actual, bundle: (...args: Parameters<typeof actual.bundle>) => (bundleSpy(), actual.bundle(...args)) }
})

vi.mock('@scalar/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/validation')>()

  return { ...actual, coerce: (...args: Parameters<typeof actual.coerce>) => (coerceSpy(), actual.coerce(...args)) }
})

vi.mock('@/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/navigation')>()

  return {
    ...actual,
    createNavigation: (...args: Parameters<typeof actual.createNavigation>) => (
      createNavigationSpy(), actual.createNavigation(...args)
    ),
  }
})

/** A document exercising everything the index has to carry across unchanged. */
const getDocument = () => ({
  openapi: '3.1.0',
  info: { title: 'Chunked API', version: '1.0.0' },
  components: {
    schemas: {
      // Names that have to survive filename and JSON Pointer escaping.
      'User': { type: 'object', properties: { id: { type: 'string' } } },
      'a/b~c': { type: 'string' },
      '..\\..\\outside#fragment%2f': { type: 'integer' },
      'con': { type: 'boolean' },
      'trailing...': { type: 'null' },
    },
    responses: { NotFound: { description: 'Not found' } },
    parameters: { PageSize: { name: 'pageSize', in: 'query', schema: { type: 'integer' } } },
    securitySchemes: { apiKey: { type: 'apiKey', name: 'X-Key', in: 'header' } },
    pathItems: {
      Shared: {
        summary: 'A shared path item',
        get: { summary: 'Read the shared thing', responses: { '200': { description: 'OK' } } },
      },
    },
  },
  paths: {
    '/users': {
      // Path-item keys that are never externalized and have to come back inline.
      summary: 'Users',
      description: 'Everything about users',
      servers: [{ url: 'https://example.com' }],
      parameters: [{ $ref: '#/components/parameters/PageSize' }],
      'x-internal': { team: 'core' },
      get: {
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } },
            },
          },
        },
      },
      post: { summary: 'Create a user', responses: { '201': { description: 'Created' } } },
    },
    // A `$ref` path item: its operations are externalized, and the reference plumbing is dropped.
    '/shared': { $ref: '#/components/pathItems/Shared' },
    '/a~b/c{id}': { delete: { responses: { '204': { description: 'Gone' } } } },
  },
  // Webhooks are not externalized, so they have to stay on the document whole.
  webhooks: {
    newUser: { post: { summary: 'A user was created', responses: { '200': { description: 'OK' } } } },
  },
})

/** What the browser actually receives, so a comparison is not fooled by `undefined` or a proxy. */
const onTheWire = (document: unknown): Record<string, unknown> => JSON.parse(JSON.stringify(document))

const buildDocuments = async (
  mode: 'static' | 'ssr',
  name: string,
  directory: string,
): Promise<{ sparse: Record<string, unknown>; compact: Record<string, unknown> }> => {
  const props =
    mode === 'ssr' ? ({ mode, baseUrl: 'https://cdn.example.com/workspace' } as const) : ({ mode, directory } as const)

  const [plain, compacted] = await Promise.all([
    createServerWorkspaceStore({ ...props, documents: [{ name, document: getDocument() }] }),
    createServerWorkspaceStore({ ...props, compact: true, documents: [{ name, document: getDocument() }] }),
  ])

  return {
    sparse: onTheWire(plain.getWorkspace().documents[name]),
    compact: onTheWire(compacted.getWorkspace().documents[name]),
  }
}

describe('chunk-index', () => {
  beforeEach(() => {
    bundleSpy.mockClear()
    coerceSpy.mockClear()
    createNavigationSpy.mockClear()
  })

  describe.each(['static', 'ssr'] as const)('%s mode', (mode) => {
    // Braces survive `encodeChunkName`, so they exercise the template's brace escaping; the space
    // exercises the encoding itself.
    const name = 'my {doc}'
    const navigationRef =
      mode === 'static'
        ? './chunks/my~x20~{doc}/navigation.json#'
        : 'https://cdn.example.com/workspace/my {doc}/navigation#'

    it('sends an index in place of the chunk references', async () => {
      const { compact } = await buildDocuments(mode, name, 'assets')

      expect(compact['paths']).toBeUndefined()
      expect(compact['components']).toBeUndefined()
      expect(compact[CHUNK_INDEX_KEY]).toMatchObject({ mode })
      expect(compact['x-scalar-navigation']).toEqual({ '$ref': navigationRef, $global: true })
    })

    it('expands to the document a non-compact store would have sent', async () => {
      const { sparse, compact } = await buildDocuments(mode, name, 'assets')

      const store = createWorkspaceStore()
      await store.addDocument({ name, document: compact })

      // Compared as it would be re-serialized, so the magic proxy's virtual `$ref-value` and the
      // meta the client stamps on every document stay out of it.
      const expanded = onTheWire(store.exportWorkspace().documents[name])
      const reference = onTheWire(
        await (async () => {
          const plainStore = createWorkspaceStore()
          await plainStore.addDocument({ name, document: sparse })
          return plainStore.exportWorkspace().documents[name]
        })(),
      )

      // Navigation is the one intended difference: a reference to a chunk rather than the tree.
      expect(expanded['x-scalar-navigation']).toEqual({ '$ref': navigationRef, $global: true })
      delete expanded['x-scalar-navigation']
      delete reference['x-scalar-navigation']

      // The client hashes the bytes it was handed, and the two wire forms are deliberately
      // different bytes.
      expect(expanded['x-scalar-original-document-hash']).toEqual(expect.any(String))
      expect(reference['x-scalar-original-document-hash']).toEqual(expect.any(String))
      delete expanded['x-scalar-original-document-hash']
      delete reference['x-scalar-original-document-hash']

      expect(expanded).toEqual(reference)
      expect(expanded[CHUNK_INDEX_KEY]).toBeUndefined()
    })

    it('keeps the path-item keys that were never externalized', async () => {
      const { compact } = await buildDocuments(mode, name, 'assets')

      const store = createWorkspaceStore()
      await store.addDocument({ name, document: compact })
      const paths = getActiveOpenApiDocument(store)?.paths as Record<string, Record<string, unknown>>

      expect(paths['/users']?.['summary']).toBe('Users')
      expect(paths['/users']?.['description']).toBe('Everything about users')
      expect(paths['/users']?.['servers']).toEqual([{ url: 'https://example.com' }])
      expect((paths['/users']?.['parameters'] as { $ref: string }[])[0]?.$ref).toBe('#/components/parameters/PageSize')
      expect(paths['/users']?.['x-internal']).toEqual({ team: 'core' })
      // The `$ref` path item is externalized per operation, so its reference plumbing is gone and
      // the summary it merged in stays.
      expect(paths['/shared']?.['$ref']).toBeUndefined()
      expect(paths['/shared']?.['summary']).toBe('A shared path item')
    })

    it('leaves webhooks on the document', async () => {
      const { compact } = await buildDocuments(mode, name, 'assets')

      expect((compact['webhooks'] as Record<string, unknown>)['newUser']).toMatchObject({
        post: { summary: 'A user was created' },
      })
    })
  })

  it('skips bundling, coercion and navigation generation for a compact document', async () => {
    const { compact, sparse } = await buildDocuments('static', 'doc', 'assets')

    // The server stores built above generate navigation of their own, which is not what is counted.
    createNavigationSpy.mockClear()

    const store = createWorkspaceStore()
    await store.addDocument({ name: 'doc', document: compact })

    expect(bundleSpy).not.toHaveBeenCalled()
    expect(coerceSpy).not.toHaveBeenCalled()
    expect(createNavigationSpy).not.toHaveBeenCalled()

    // The same document with its chunk references spelled out takes the same path, so the skip is
    // the compact form behaving like a processed document rather than an accident of this fixture.
    await store.addDocument({ name: 'plain', document: sparse })
    expect(bundleSpy).not.toHaveBeenCalled()
  })

  it('expands a workspace handed to loadWorkspace', async () => {
    const { compact } = await buildDocuments('static', 'doc', 'assets')

    const store = createWorkspaceStore()
    store.loadWorkspace({
      documents: { doc: compact as unknown as OpenApiDocument },
      meta: { 'x-scalar-active-document': 'doc' },
      originalDocuments: {},
      intermediateDocuments: {},
      overrides: {},
      history: {},
      auth: {},
    })

    const document = getActiveOpenApiDocument(store)
    expect(document?.[CHUNK_INDEX_KEY as keyof typeof document]).toBeUndefined()
    expect(getPathItemOperation(document?.paths?.['/users'], 'get')).toEqual({
      '$ref': './chunks/doc/operations/~1users/get.json#',
      $global: true,
    })
  })

  it('serves the navigation chunk from get() in ssr mode', async () => {
    const store = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: 'https://cdn.example.com/workspace',
      compact: true,
      documents: [{ name: 'doc', document: getDocument() }],
    })

    expect(store.get('#/doc/navigation')).toMatchObject({ type: 'document', name: 'doc' })
    // The resolved document keeps its navigation whole; only the wire form externalizes it.
    expect(store.getResolvedDocument('doc')?.['x-scalar-navigation']).toMatchObject({ type: 'document' })
  })

  it('writes the navigation chunk in static mode', async () => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-compact-'))

    try {
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(cwd(), fixture),
        compact: true,
        documents: [{ name: 'doc', document: getDocument() }],
      })
      await store.generateWorkspaceChunks()

      const navigation: unknown = JSON.parse(await fs.readFile(join(fixture, 'chunks/doc/navigation.json'), 'utf8'))
      expect(navigation).toMatchObject({ type: 'document', name: 'doc' })

      // Every reference the client rebuilds has to name a file the writer produced, which is what
      // makes sharing `encodeChunkName` between the two sides load-bearing rather than tidy.
      const expanded = onTheWire(store.getWorkspace().documents['doc'])
      expect(expandChunkIndex(expanded)).toBe(true)

      const references = [
        ...Object.values(expanded['components'] as Record<string, Record<string, { $ref: string }>>).flatMap(
          (entries) => Object.values(entries),
        ),
        ...Object.values(expanded['paths'] as Record<string, Record<string, { $ref?: string }>>).flatMap((pathItem) =>
          Object.values(pathItem).filter((value) => typeof value?.$ref === 'string'),
        ),
      ]

      expect(references.length).toBe(13)
      for (const { $ref } of references) {
        await fs.access(join(fixture, $ref!.replace(/^\.\//, '').replace(/#$/, '')))
      }
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })

  it('writes no navigation chunk without the option', async () => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-compact-'))

    try {
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(cwd(), fixture),
        documents: [{ name: 'doc', document: getDocument() }],
      })
      await store.generateWorkspaceChunks()

      await expect(fs.stat(join(fixture, 'chunks/doc/navigation.json'))).rejects.toHaveProperty('code', 'ENOENT')
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })
})

describe('chunk-index round trip', () => {
  let server: FastifyInstance
  const port = 9991
  const url = `http://localhost:${port}`

  beforeEach(() => {
    server = fastify({ logger: false })

    return async () => {
      await server.close()
    }
  })

  it('resolves the same chunks as a non-compact document, and the navigation only on request', async () => {
    const dir = `scalar-compact-${Date.now()}`
    const basePath = `${cwd()}/${dir}`

    const serverStore = await createServerWorkspaceStore({
      mode: 'static',
      directory: dir,
      compact: true,
      documents: [{ name: 'default', document: getDocument() }],
    })
    await serverStore.generateWorkspaceChunks()

    await fs.writeFile(`${basePath}/default.json`, JSON.stringify(serverStore.getWorkspace().documents['default']))

    const requests: string[] = []
    server.get('/*', async (req, res) => {
      requests.push(req.url)
      res.send(await fs.readFile(`${basePath}${decodeURIComponent(req.url)}`, 'utf-8'))
    })
    await server.listen({ port })

    try {
      const store = createWorkspaceStore()
      await store.addDocument({ name: 'default', url: `${url}/default.json` })

      // Nothing beyond the document itself is loaded up front — the navigation included
      expect(getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get')).toEqual({
        '$ref': './chunks/default/operations/~1users/get.json#',
        $global: true,
      })
      expect(requests).toEqual(['/default.json'])

      await store.resolve(['paths', '/users', 'get'])

      const get = getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get') as any
      expect(get['$ref-value'].summary).toBe('Get all users')
      expect((getActiveOpenApiDocument(store)?.components?.schemas?.['User'] as any)['$ref-value'].type).toBe('object')
      expect(requests.slice(1).sort()).toEqual([
        '/chunks/default/components/schemas/User.json',
        '/chunks/default/operations/~1users/get.json',
      ])

      // A property referencing a shared component reaches the schema through its stub
      const items = get['$ref-value'].responses[200].content['application/json'].schema.items
      expect(items.$ref).toBe('#/components/schemas/User')
      expect(getResolvedRef(items)).toMatchObject({ type: 'object' })

      // A second operation using the same schema costs one request, its own chunk
      await store.resolve(['paths', '/users', 'post'])
      expect(requests.slice(3)).toEqual(['/chunks/default/operations/~1users/post.json'])

      // The navigation is a chunk like any other: not fetched until it is asked for
      await store.resolve(['x-scalar-navigation'])
      expect(requests.slice(4)).toEqual(['/chunks/default/navigation.json'])
      expect(getResolvedRef(getActiveOpenApiDocument(store)?.['x-scalar-navigation'] as never)).toMatchObject({
        type: 'document',
        name: 'default',
      })
    } finally {
      await fs.rm(basePath, { recursive: true, force: true })
    }
  })
})
