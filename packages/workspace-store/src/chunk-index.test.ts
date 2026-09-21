import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { cwd } from 'node:process'

import { getActiveOpenApiDocument } from '@test/helpers'
import fastify from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { effect } from 'vue'

import { createWorkspaceStore } from '@/client'
import { CHUNK_INDEX_KEY, type ChunkIndex, expandChunkIndex } from '@/helpers/chunk-index'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { updateSelectedSecuritySchemes } from '@/mutators/auth'
import type { TraversedDocument } from '@/schemas/navigation'
import { isOpenApiDocument } from '@/schemas/type-guards'
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
const documentFixture = {
  openapi: '3.1.0',
  info: { title: 'Chunked API', version: '1.0.0' },
  // Reaches the navigation as `icon`, so the inline header has a field beyond the required ones.
  'x-scalar-icon': 'interface-content-book',
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
}

const getDocument = (): typeof documentFixture => structuredClone(documentFixture)

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

/** The navigation a non-compact store sends, which is the whole tree. */
const wholeNavigation = (sparse: Record<string, unknown>): TraversedDocument =>
  sparse['x-scalar-navigation'] as TraversedDocument

/** The navigation a document carries, read the way every consumer reads it: plain property access. */
const navigationOf = (store: ReturnType<typeof createWorkspaceStore>): TraversedDocument | undefined =>
  getActiveOpenApiDocument(store)?.['x-scalar-navigation']

/**
 * Publishes a compact workspace to a local server and records every request made to it.
 *
 * The sparse document is served beside its chunks and loaded by url, which is what gives the client
 * an origin to resolve the relative `./chunks/` references against. The generated files are read
 * once up front, so a request can only reach the fixture.
 */
const serveCompactWorkspace = async (
  onTestFinished: (fn: () => Promise<void>) => void,
): Promise<{ url: string; requests: string[] }> => {
  const directory = `scalar-compact-${randomUUID()}`
  const basePath = `${cwd()}/${directory}`
  onTestFinished(async () => {
    await fs.rm(basePath, { recursive: true, force: true })
  })

  const serverStore = await createServerWorkspaceStore({
    mode: 'static',
    directory,
    compact: true,
    documents: [{ name: 'default', document: getDocument() }],
  })
  await serverStore.generateWorkspaceChunks()
  await fs.writeFile(`${basePath}/default.json`, JSON.stringify(serverStore.getWorkspace().documents['default']))

  const files = new Map<string, string>(
    await Promise.all(
      (await fs.readdir(basePath, { recursive: true }))
        .filter((path) => path.endsWith('.json'))
        .map(async (path) => [`/${path}`, await fs.readFile(join(basePath, path), 'utf-8')] as const),
    ),
  )

  const server = fastify({ logger: false })
  onTestFinished(async () => {
    await server.close()
  })

  const requests: string[] = []
  server.get('/*', (req, res) => {
    requests.push(req.url)
    const content = files.get(decodeURIComponent(req.url))
    return content === undefined ? res.code(404).send() : res.send(content)
  })
  const url = await server.listen({ port: 0, host: '127.0.0.1' })

  return { url: `${url}/default.json`, requests }
}

/** A store holding the published compact document, plus the requests it has made so far. */
const addCompactDocument = async (
  onTestFinished: (fn: () => Promise<void>) => void,
  props?: Parameters<typeof createWorkspaceStore>[0],
) => {
  const { url, requests } = await serveCompactWorkspace(onTestFinished)
  const store = createWorkspaceStore(props)
  await store.addDocument({ name: 'default', url })

  return { store, requests }
}

describe('chunk-index', () => {
  beforeEach(() => {
    bundleSpy.mockClear()
    coerceSpy.mockClear()
    createNavigationSpy.mockClear()
  })

  // Braces and spaces exercise template escaping and filename encoding in both modes.
  const name = 'my {doc}'
  const modes = [
    { mode: 'static', navigationRef: './chunks/my~x20~{doc}/navigation.json#' },
    { mode: 'ssr', navigationRef: 'https://cdn.example.com/workspace/my {doc}/navigation#' },
  ] as const

  it.each(modes)('sends an index in place of the chunk references in $mode mode', async ({ mode, navigationRef }) => {
    const { sparse, compact } = await buildDocuments(mode, name, 'assets')

    expect(compact['paths']).toBeUndefined()
    expect(compact['components']).toBeUndefined()
    expect((compact[CHUNK_INDEX_KEY] as ChunkIndex).mode).toBe(mode)

    // The navigation header travels inline, whole but for the children, which are the chunk.
    const { children, ...header } = wholeNavigation(sparse)
    expect(children?.length).toBeGreaterThan(0)
    expect(compact['x-scalar-navigation']).toStrictEqual({ ...header, children: [] })
    expect(compact['x-scalar-navigation-chunk']).toBe(navigationRef)

    // A document that was not sent compact keeps its navigation whole and names no chunk.
    expect(sparse['x-scalar-navigation-chunk']).toBeUndefined()
  })

  it('keeps the auth mutators working on a compact document', async () => {
    const { compact } = await buildDocuments('static', 'doc', 'assets')

    const store = createWorkspaceStore()
    await store.addDocument({ name: 'doc', document: compact })

    // The name the auth and history stores key on, by plain access and without resolving anything.
    expect(navigationOf(store)?.name).toBe('doc')

    await updateSelectedSecuritySchemes(store, store.workspace.activeDocument ?? null, {
      selectedRequirements: [{ apiKey: [] }],
      newSchemes: [],
      meta: { type: 'document' },
    })

    expect(store.auth.getAuthSelectedSchemas({ type: 'document', documentName: 'doc' })).toStrictEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKey: [] }],
    })
  })

  it.each(modes)(
    'expands to the document a non-compact store would have sent in $mode mode',
    async ({ mode, navigationRef }) => {
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

      // The navigation children are the one intended difference: they are still in their chunk.
      const { children: _children, ...header } = wholeNavigation(reference)
      expect(expanded['x-scalar-navigation']).toStrictEqual({ ...header, children: [] })
      expect(expanded['x-scalar-navigation-chunk']).toBe(navigationRef)
      delete expanded['x-scalar-navigation']
      delete expanded['x-scalar-navigation-chunk']
      delete reference['x-scalar-navigation']

      // The client hashes the bytes it was handed, and the two wire forms are deliberately
      // different bytes.
      expect(expanded['x-scalar-original-document-hash']).toStrictEqual(expect.any(String))
      expect(reference['x-scalar-original-document-hash']).toStrictEqual(expect.any(String))
      delete expanded['x-scalar-original-document-hash']
      delete reference['x-scalar-original-document-hash']

      expect(expanded).toStrictEqual(reference)
      expect(expanded[CHUNK_INDEX_KEY]).toBeUndefined()
    },
  )

  it.each(modes)('keeps the path-item keys that were never externalized in $mode mode', async ({ mode }) => {
    const { compact } = await buildDocuments(mode, name, 'assets')

    const store = createWorkspaceStore()
    await store.addDocument({ name, document: compact })
    const paths = getActiveOpenApiDocument(store)?.paths as Record<string, Record<string, unknown>>

    expect(paths['/users']?.['summary']).toBe('Users')
    expect(paths['/users']?.['description']).toBe('Everything about users')
    expect(paths['/users']?.['servers']).toStrictEqual([{ url: 'https://example.com' }])
    expect((paths['/users']?.['parameters'] as { $ref: string }[])[0]?.$ref).toBe('#/components/parameters/PageSize')
    expect(paths['/users']?.['x-internal']).toStrictEqual({ team: 'core' })
    // The `$ref` path item is externalized per operation, so its reference plumbing is gone and
    // the summary it merged in stays.
    expect(paths['/shared']?.['$ref']).toBeUndefined()
    expect(paths['/shared']?.['summary']).toBe('A shared path item')
  })

  it.each(modes)('leaves webhooks on the document in $mode mode', async ({ mode }) => {
    const { compact } = await buildDocuments(mode, name, 'assets')

    expect(compact['webhooks']).toStrictEqual(getDocument().webhooks)
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
    expect(getPathItemOperation(document?.paths?.['/users'], 'get')).toStrictEqual({
      '$ref': './chunks/doc/operations/~1users/get.json#',
      '$ref-value': undefined,
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

    const { sparse } = await buildDocuments('ssr', 'doc', 'assets')
    expect(onTheWire(store.get('#/doc/navigation'))).toStrictEqual(sparse['x-scalar-navigation'])
    // The resolved document keeps its navigation whole; only the wire form externalizes it.
    expect(onTheWire(store.getResolvedDocument('doc')?.['x-scalar-navigation'])).toStrictEqual(
      sparse['x-scalar-navigation'],
    )
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
      const { sparse } = await buildDocuments('static', 'doc', 'assets')
      expect(navigation).toStrictEqual(sparse['x-scalar-navigation'])

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

  it('resolves the same chunks as a non-compact document', async ({ onTestFinished }) => {
    const { store, requests } = await addCompactDocument(onTestFinished)

    // Nothing beyond the document itself is loaded up front — the navigation children included
    expect(getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get')).toStrictEqual({
      '$ref': './chunks/default/operations/~1users/get.json#',
      '$ref-value': undefined,
      $global: true,
    })
    expect(requests).toStrictEqual(['/default.json'])

    await store.resolve(['paths', '/users', 'get'])

    const operation = getResolvedRef(getPathItemOperation(getActiveOpenApiDocument(store)?.paths?.['/users'], 'get'))
    expect(operation?.summary).toBe('Get all users')
    const expectedSchema = { type: 'object', properties: { id: { type: 'string' } } }
    expect(getResolvedRef(getActiveOpenApiDocument(store)?.components?.schemas?.['User'])).toStrictEqual(expectedSchema)
    expect(requests.slice(1).sort()).toStrictEqual([
      '/chunks/default/components/schemas/User.json',
      '/chunks/default/operations/~1users/get.json',
    ])

    // A property referencing a shared component reaches the schema through its stub
    const response = getResolvedRef(operation?.responses?.['200'])
    const schema = getResolvedRef(response?.content?.['application/json']?.schema)
    assert(schema && typeof schema === 'object' && 'items' in schema)
    const items = schema.items
    assert(items && typeof items === 'object' && '$ref' in items)
    expect(items.$ref).toBe('#/components/schemas/User')
    expect(getResolvedRef(items)).toStrictEqual(expectedSchema)

    // A second operation using the same schema costs one request, its own chunk
    await store.resolve(['paths', '/users', 'post'])
    expect(requests.slice(3)).toStrictEqual(['/chunks/default/operations/~1users/post.json'])
  })

  it('loads the navigation children on request, and only once', async ({ onTestFinished }) => {
    const { store, requests } = await addCompactDocument(onTestFinished)
    const { sparse } = await buildDocuments('static', 'default', 'assets')

    // The header is there from the start; the children are empty until they are asked for.
    expect(navigationOf(store)?.title).toBe('Chunked API')
    expect(navigationOf(store)?.children).toStrictEqual([])
    expect(requests).toStrictEqual(['/default.json'])

    await store.resolve(['x-scalar-navigation'])

    expect(requests.slice(1)).toStrictEqual(['/chunks/default/navigation.json'])
    // Read by plain access: materializing leaves the navigation a tree, not a reference.
    expect(navigationOf(store)?.children).toStrictEqual(wholeNavigation(sparse).children)
    expect(navigationOf(store)).toStrictEqual(wholeNavigation(sparse))

    // Navigation has one owner, so the children go straight onto it: the document says nothing
    // about a chunk any more, and nothing was parked in `x-ext` on the way.
    const document = onTheWire(store.exportWorkspace().documents['default'])
    expect(document['x-scalar-navigation-chunk']).toBeUndefined()
    expect(document['x-ext']).toBeUndefined()
    expect(document['x-ext-urls']).toBeUndefined()

    // The children are on the document now, so asking again costs nothing.
    await store.resolve(['x-scalar-navigation'])
    expect(requests.slice(2)).toStrictEqual([])
  })

  it('loads the navigation children once for concurrent resolves', async ({ onTestFinished }) => {
    const { store, requests } = await addCompactDocument(onTestFinished)

    await Promise.all([
      store.resolve(['x-scalar-navigation']),
      store.resolve(['x-scalar-navigation']),
      // A path under the navigation loads the children too.
      store.resolve(['x-scalar-navigation', 'children', '0']),
    ])

    expect(requests.slice(1)).toStrictEqual(['/chunks/default/navigation.json'])
    expect(navigationOf(store)?.children?.length).toBeGreaterThan(0)
  })

  it('loads the navigation children with reactive: false', async ({ onTestFinished }) => {
    const { store, requests } = await addCompactDocument(onTestFinished, { reactive: false })
    const { sparse } = await buildDocuments('static', 'default', 'assets')

    expect(navigationOf(store)?.children).toStrictEqual([])

    await store.resolve(['x-scalar-navigation'])

    expect(requests.slice(1)).toStrictEqual(['/chunks/default/navigation.json'])
    expect(navigationOf(store)?.children).toStrictEqual(wholeNavigation(sparse).children)
  })

  it('re-runs an effect reading the navigation children when they load', async ({ onTestFinished }) => {
    const { store } = await addCompactDocument(onTestFinished)
    const document = store.workspace.documents['default']

    const counts: number[] = []
    effect(() => {
      counts.push(isOpenApiDocument(document) ? (document['x-scalar-navigation']?.children?.length ?? 0) : 0)
    })

    expect(counts).toStrictEqual([0])

    await store.resolve(['x-scalar-navigation'])

    expect(counts.length).toBe(2)
    expect(counts[1]).toBeGreaterThan(0)
  })

  it('leaves the children loadable for a workspace exported before they were', async ({ onTestFinished }) => {
    const { store, requests } = await addCompactDocument(onTestFinished)
    const { sparse } = await buildDocuments('static', 'default', 'assets')

    const second = createWorkspaceStore()
    second.loadWorkspace(structuredClone(store.exportWorkspace()))

    expect(navigationOf(second)?.name).toBe('default')
    expect(navigationOf(second)?.children).toStrictEqual([])

    await second.resolve(['x-scalar-navigation'])

    expect(requests.slice(1)).toStrictEqual(['/chunks/default/navigation.json'])
    expect(navigationOf(second)?.children).toStrictEqual(wholeNavigation(sparse).children)

    // Once loaded, the children travel with the workspace and cost the next store nothing.
    const third = createWorkspaceStore()
    third.loadWorkspace(structuredClone(second.exportWorkspace()))
    await third.resolve(['x-scalar-navigation'])

    expect(requests.slice(2)).toStrictEqual([])
    expect(navigationOf(third)?.children).toStrictEqual(wholeNavigation(sparse).children)
  })
})
