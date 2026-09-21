import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { cwd } from 'node:process'

import { getActiveOpenApiDocument } from '@test/helpers'
import fastify from 'fastify'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { CHUNK_INDEX_KEY, type ChunkIndex, expandChunkIndex } from '@/helpers/chunk-index'
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
const documentFixture = {
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
    const { compact } = await buildDocuments(mode, name, 'assets')

    expect(compact['paths']).toBeUndefined()
    expect(compact['components']).toBeUndefined()
    expect((compact[CHUNK_INDEX_KEY] as ChunkIndex).mode).toBe(mode)
    expect(compact['x-scalar-navigation']).toStrictEqual({ '$ref': navigationRef, $global: true })
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

      // Navigation is the one intended difference: a reference to a chunk rather than the tree.
      expect(expanded['x-scalar-navigation']).toStrictEqual({ '$ref': navigationRef, $global: true })
      delete expanded['x-scalar-navigation']
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

  it('resolves the same chunks as a non-compact document, and the navigation only on request', async ({
    onTestFinished,
  }) => {
    const server = fastify({ logger: false })
    onTestFinished(async () => {
      await server.close()
    })
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

    // Read the generated fixtures once so requests only access a fixed set of in-memory files.
    const files = new Map<string, string>(
      await Promise.all(
        (await fs.readdir(basePath, { recursive: true }))
          .filter((path) => path.endsWith('.json'))
          .map(async (path) => [`/${path}`, await fs.readFile(join(basePath, path), 'utf-8')] as const),
      ),
    )
    const requests: string[] = []
    server.get('/*', (req, res) => {
      requests.push(req.url)
      const content = files.get(decodeURIComponent(req.url))
      return content === undefined ? res.code(404).send() : res.send(content)
    })
    const url = await server.listen({ port: 0, host: '127.0.0.1' })

    try {
      const store = createWorkspaceStore()
      await store.addDocument({ name: 'default', url: `${url}/default.json` })

      // Nothing beyond the document itself is loaded up front — the navigation included
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
      expect(getResolvedRef(getActiveOpenApiDocument(store)?.components?.schemas?.['User'])).toStrictEqual(
        expectedSchema,
      )
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

      // The navigation is a chunk like any other: not fetched until it is asked for
      await store.resolve(['x-scalar-navigation'])
      expect(requests.slice(4)).toStrictEqual(['/chunks/default/navigation.json'])
      const { sparse } = await buildDocuments('static', 'default', 'assets')
      expect(getResolvedRef(getActiveOpenApiDocument(store)?.['x-scalar-navigation'])).toStrictEqual(
        sparse['x-scalar-navigation'],
      )
    } finally {
      await fs.rm(basePath, { recursive: true, force: true })
    }
  })
})
