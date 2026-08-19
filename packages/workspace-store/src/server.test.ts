import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { cwd } from 'node:process'

import { type FastifyInstance, fastify } from 'fastify'
import { assert, beforeEach, describe, expect, it } from 'vitest'

import { isAsyncApiDocument } from '@/schemas'
import { extensions } from '@/schemas/extensions'
import type { TraversedDocument, TraversedEntry } from '@/schemas/navigation'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'

import { allFilesMatch, getOpenApiServerDocument } from '../test/helpers'
import {
  createServerWorkspaceStore,
  escapePaths,
  externalizeComponentReferences,
  externalizePathReferences,
  filterHttpMethodsOnly,
} from './server'

describe('create-server-store', () => {
  const exampleDocument = () => ({
    'openapi': '3.1.1',
    'info': {
      'title': 'Scalar Galaxy',
      'version': '0.3.2',
    },
    'paths': {
      '/planets': {
        get: { summary: 'List planets' },
      },
    },
    'components': {
      'parameters': {
        'planetId': {
          'name': 'planetId',
          'description': 'The ID of the planet to get',
          'in': 'path',
          'required': true,
          'schema': {
            'type': 'integer',
            'format': 'int64',
            'examples': [1],
          },
        },
      },
    },
  })

  describe('ssr', () => {
    it('should be able to pass a list of documents and get the workspace', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'api-1',
            document: exampleDocument(),
          },
          {
            name: 'api-2',
            document: exampleDocument(),
          },
        ],
        meta: {
          'x-scalar-active-document': 'api-1',
          'x-scalar-color-mode': 'dark',
        },
      })

      const workspaceDocument = (name: string) => ({
        'openapi': '3.1.1',
        'info': {
          'title': 'Scalar Galaxy',
          'version': '0.3.2',
        },
        'paths': {
          '/planets': {
            get: {
              '$ref': `https://example.com/${name}/operations/~1planets/get#`,
              $global: true,
            },
          },
        },
        'components': {
          parameters: {
            planetId: {
              '$ref': `https://example.com/${name}/components/parameters/planetId#`,
              $global: true,
            },
          },
        },
        'x-scalar-navigation': {
          type: 'document',
          id: name,
          name: name,
          title: 'Scalar Galaxy',
          children: [
            {
              id: `${name}/description/introduction`,
              title: 'Introduction',
              type: 'text',
            },
            {
              'id': `${name}/GET/planets`,
              method: 'get',
              type: 'operation',
              isDeprecated: false,
              'ref': '#/paths/~1planets/get',
              path: '/planets',
              title: 'List planets',
            },
          ],
        },
        'x-scalar-order': [`${name}/description/introduction`, `${name}/GET/planets`],
        'x-scalar-original-document-hash': '',
      })

      expect(store.getWorkspace()).toEqual({
        'x-scalar-active-document': 'api-1',
        'x-scalar-color-mode': 'dark',
        documents: {
          'api-1': workspaceDocument('api-1'),
          'api-2': workspaceDocument('api-2'),
        },
      })
    })

    it('should be able to get the document chunks', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'doc-1',
            document: exampleDocument(),
          },
        ],
      })

      expect(store.get('#/doc-1/operations/~1planets/get')).toEqual({ summary: 'List planets' })
      expect(store.get('#/doc-1/components/parameters/planetId')).toEqual({
        'name': 'planetId',
        'description': 'The ID of the planet to get',
        'in': 'path',
        'required': true,
        'schema': {
          'type': 'integer',
          'format': 'int64',
          'examples': [1],
        },
      })
    })

    it('should be able to add more documents on the workspace', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'doc-1',
            document: exampleDocument(),
            meta: {
              'x-scalar-selected-server': 'test',
            },
          },
          {
            name: 'doc-2',
            document: exampleDocument(),
          },
        ],
      })

      await store.addDocument({
        name: 'doc-3',
        meta: { 'x-scalar-selected-server': 'test' },
        document: exampleDocument(),
      })
      const workspace = store.getWorkspace()

      expect(workspace.documents['doc-1']).toEqual({
        'openapi': '3.1.1',
        'info': {
          'title': 'Scalar Galaxy',
          'version': '0.3.2',
        },
        'paths': {
          '/planets': {
            get: { '$ref': 'https://example.com/doc-1/operations/~1planets/get#', $global: true },
          },
        },
        'components': {
          'parameters': {
            planetId: {
              '$ref': 'https://example.com/doc-1/components/parameters/planetId#',
              $global: true,
            },
          },
        },
        'x-scalar-selected-server': 'test',
        'x-scalar-navigation': {
          type: 'document',
          id: 'doc-1',
          name: 'doc-1',
          title: 'Scalar Galaxy',
          children: [
            {
              id: 'doc-1/description/introduction',
              title: 'Introduction',
              type: 'text',
            },
            {
              'id': 'doc-1/GET/planets',
              isDeprecated: false,
              method: 'get',
              type: 'operation',
              'ref': '#/paths/~1planets/get',
              path: '/planets',
              title: 'List planets',
            },
          ],
        },
        'x-scalar-order': ['doc-1/description/introduction', 'doc-1/GET/planets'],
        'x-scalar-original-document-hash': '',
      })

      expect(workspace.documents['doc-3']).toEqual({
        'openapi': '3.1.1',
        'info': {
          'title': 'Scalar Galaxy',
          'version': '0.3.2',
        },
        'paths': {
          '/planets': {
            get: { '$ref': 'https://example.com/doc-3/operations/~1planets/get#', $global: true },
          },
        },
        'components': {
          'parameters': {
            planetId: {
              '$ref': 'https://example.com/doc-3/components/parameters/planetId#',
              $global: true,
            },
          },
        },
        'x-scalar-navigation': {
          type: 'document',
          id: 'doc-3',
          name: 'doc-3',
          title: 'Scalar Galaxy',
          children: [
            {
              id: 'doc-3/description/introduction',
              title: 'Introduction',
              type: 'text',
            },
            {
              'id': 'doc-3/GET/planets',
              isDeprecated: false,
              method: 'get',
              type: 'operation',
              'ref': '#/paths/~1planets/get',
              path: '/planets',
              title: 'List planets',
            },
          ],
        },
        'x-scalar-order': ['doc-3/description/introduction', 'doc-3/GET/planets'],
        'x-scalar-original-document-hash': '',
        'x-scalar-selected-server': 'test',
      })
    })

    it('applies workspace navigationOptions when building initial documents', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        navigationOptions: {
          generateOperationSlug: () => 'workspace-operation',
        },
        documents: [
          {
            name: 'doc-1',
            document: exampleDocument(),
          },
        ],
      })

      const document = getOpenApiServerDocument(store, 'doc-1')
      expect(document?.['x-scalar-order']).toEqual(['doc-1/description/introduction', 'doc-1/workspace-operation'])
      expect(document?.['x-scalar-navigation']?.children?.[1]?.id).toBe('doc-1/workspace-operation')
    })

    it('applies addDocument navigationOptions over workspace defaults', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        navigationOptions: {
          generateOperationSlug: () => 'workspace-operation',
        },
        documents: [],
      })

      await store.addDocument(
        {
          name: 'doc-2',
          document: exampleDocument(),
        },
        {
          generateOperationSlug: () => 'add-document-operation',
        },
      )

      const document = getOpenApiServerDocument(store, 'doc-2')
      expect(document?.['x-scalar-order']).toEqual(['doc-2/description/introduction', 'doc-2/add-document-operation'])
      expect(document?.['x-scalar-navigation']?.children?.[1]?.id).toBe('doc-2/add-document-operation')
    })
  })

  describe('ssg', () => {
    it('should generate the workspace file and also all the related chunks', async () => {
      const dir = 'temp'

      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: dir,
        documents: [
          {
            document: exampleDocument(),
            name: 'doc-1',
            meta: {
              'x-scalar-selected-server': 'test',
            },
          },
        ],
        meta: {
          'x-scalar-active-document': 'test',
          'x-scalar-color-mode': 'dark',
          'x-scalar-default-client': 'node/fetch',
          'x-scalar-theme': 'default',
        },
      })

      await store.addDocument({
        document: exampleDocument(),
        name: 'doc-2',
        meta: {
          'x-scalar-selected-server': 'test',
        },
      })
      await store.generateWorkspaceChunks()

      const basePath = `${cwd()}/${dir}`

      const sparseWorkspace = await fs.readFile(`${basePath}/scalar-workspace.json`, { encoding: 'utf-8' })

      // check the workspace is the correct format
      expect(JSON.parse(sparseWorkspace)).toEqual({
        documents: {
          'doc-1': {
            'x-scalar-selected-server': 'test',
            'openapi': '3.1.1',
            'info': {
              'title': 'Scalar Galaxy',
              'version': '0.3.2',
            },
            'paths': {
              '/planets': {
                get: { '$ref': './chunks/doc-1/operations/~1planets/get.json#', $global: true },
              },
            },
            'components': {
              'parameters': {
                planetId: { '$ref': './chunks/doc-1/components/parameters/planetId.json#', $global: true },
              },
            },
            'x-scalar-navigation': {
              type: 'document',
              id: 'doc-1',
              name: 'doc-1',
              title: 'Scalar Galaxy',
              children: [
                {
                  id: 'doc-1/description/introduction',
                  title: 'Introduction',
                  type: 'text',
                },
                {
                  'id': 'doc-1/GET/planets',
                  isDeprecated: false,
                  method: 'get',
                  path: '/planets',
                  title: 'List planets',
                  type: 'operation',
                  'ref': '#/paths/~1planets/get',
                },
              ],
            },
            'x-scalar-order': ['doc-1/description/introduction', 'doc-1/GET/planets'],
            'x-scalar-original-document-hash': '',
          },
          'doc-2': {
            'x-scalar-selected-server': 'test',
            'openapi': '3.1.1',
            'info': {
              'title': 'Scalar Galaxy',
              'version': '0.3.2',
            },
            'paths': {
              '/planets': {
                get: { '$ref': './chunks/doc-2/operations/~1planets/get.json#', $global: true },
              },
            },
            'components': {
              'parameters': {
                planetId: { '$ref': './chunks/doc-2/components/parameters/planetId.json#', $global: true },
              },
            },
            'x-scalar-order': ['doc-2/description/introduction', 'doc-2/GET/planets'],
            'x-scalar-navigation': {
              type: 'document',
              id: 'doc-2',
              name: 'doc-2',
              title: 'Scalar Galaxy',
              children: [
                {
                  id: 'doc-2/description/introduction',
                  title: 'Introduction',
                  type: 'text',
                },
                {
                  'id': 'doc-2/GET/planets',
                  isDeprecated: false,
                  method: 'get',
                  type: 'operation',
                  'ref': '#/paths/~1planets/get',
                  path: '/planets',
                  title: 'List planets',
                },
              ],
            },
            'x-scalar-original-document-hash': '',
          },
        },
        'x-scalar-active-document': 'test',
        'x-scalar-color-mode': 'dark',
        'x-scalar-default-client': 'node/fetch',
        'x-scalar-theme': 'default',
      })

      // check the generated chucks
      expect(
        await allFilesMatch([
          {
            content: JSON.stringify({
              ...exampleDocument().components.parameters.planetId,
            }),
            path: `${basePath}/chunks/doc-1/components/parameters/planetId.json`,
          },
          {
            content: JSON.stringify({
              ...exampleDocument().paths['/planets'].get,
            }),
            path: `${basePath}/chunks/doc-1/operations/~1planets/get.json`,
          },
        ]),
      ).toBe(true)

      await fs.rmdir(basePath, { recursive: true })
    })
  })

  describe('load document on the workspace', () => {
    describe('load from external urls', () => {
      let server: FastifyInstance
      let url: string

      beforeEach(() => {
        server = fastify({ logger: false })

        return async () => {
          await server.close()
        }
      })

      it('should load a document on the workspace from an external url', async () => {
        server.get('/', () => {
          return exampleDocument()
        })
        await server.listen({ port: 0 })
        url = `http://localhost:${(server.server.address() as AddressInfo).port}`

        const store = await createServerWorkspaceStore({
          baseUrl: url,
          documents: [
            {
              name: 'default',
              url: url,
            },
          ],
          mode: 'ssr',
        })

        expect(Object.keys(store.getWorkspace().documents).length).toBe(1)
        expect(Object.keys(store.getWorkspace().documents)[0]).toBe('default')
      })

      it('should be able to add a document from an external url', async () => {
        server.get('/', () => {
          return exampleDocument()
        })
        await server.listen({ port: 0 })
        url = `http://localhost:${(server.server.address() as AddressInfo).port}`

        const store = await createServerWorkspaceStore({
          mode: 'ssr',
          baseUrl: url,
          documents: [],
        })

        expect(Object.keys(store.getWorkspace().documents).length).toBe(0)

        await store.addDocument({
          name: 'default',
          url,
        })

        expect(Object.keys(store.getWorkspace().documents).length).toBe(1)
        expect(Object.keys(store.getWorkspace().documents)[0]).toBe('default')
      })
    })

    describe('load from file system', () => {
      it('should load a document on the workspace from the file path', async () => {
        const fileName = randomUUID()
        await fs.writeFile(fileName, JSON.stringify(exampleDocument()))

        const store = await createServerWorkspaceStore({
          baseUrl: 'example.com',
          documents: [
            {
              path: fileName,
              name: 'default',
            },
          ],
          mode: 'ssr',
        })

        expect(Object.keys(store.getWorkspace().documents).length).toBe(1)
        expect(Object.keys(store.getWorkspace().documents)[0]).toBe('default')

        await fs.rm(fileName)
      })

      it('should add a document to the store from a file path', async () => {
        const fileName = randomUUID()
        await fs.writeFile(fileName, JSON.stringify(exampleDocument()))

        const store = await createServerWorkspaceStore({
          baseUrl: 'example.com',
          documents: [],
          mode: 'ssr',
        })

        expect(Object.keys(store.getWorkspace().documents).length).toBe(0)

        await store.addDocument({
          path: fileName,
          name: 'default',
        })
        await fs.rm(fileName)

        expect(Object.keys(store.getWorkspace().documents).length).toBe(1)
        expect(Object.keys(store.getWorkspace().documents)[0]).toBe('default')
      })
    })
  })

  describe('local reference resolution', () => {
    const refPathItemDocument = () => ({
      'openapi': '3.1.0',
      'info': { 'title': 'Galaxy', 'version': '1.0.0' },
      'paths': {
        '/planets': { 'get': { 'summary': 'List all planets', 'tags': ['Inline'] } },
        '/moons': { '$ref': '#/components/pathItems/Moons' },
      },
      'components': {
        'parameters': { 'Limit': { 'name': 'limit', 'in': 'query' } },
        'pathItems': {
          'Moons': {
            // A path-level key alongside the operation, so the branch that copies non-method keys
            // out of a `$ref`'d path item is actually exercised.
            'summary': 'Everything about moons',
            'get': {
              'summary': 'List all moons',
              'tags': ['Referenced'],
              // A reference nested inside the operation, so the assertions below about what ends up
              // in the stored document and the chunks are not vacuous.
              'parameters': [{ '$ref': '#/components/parameters/Limit' }],
            },
          },
        },
      },
    })

    const navigationTitles = (navigation: TraversedDocument | undefined): string[] => {
      const titles: string[] = []

      const walk = (entries: TraversedEntry[] = []) => {
        for (const entry of entries) {
          titles.push(entry.title)
          walk('children' in entry ? entry.children : undefined)
        }
      }

      walk(navigation?.children)
      return titles
    }

    const addDocument = async (document: Record<string, unknown>) => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [{ name: 'api', document }],
      })

      return { store, document: store.getWorkspace().documents['api'] }
    }

    it('keeps an operation whose path item is a local $ref', async () => {
      const { document } = await addDocument(refPathItemDocument())

      expect(navigationTitles(document?.[extensions.document.navigation])).toContain('List all moons')
    })

    it('keeps an operation whose path item came from another file', async () => {
      // The shape a split-file document has once it reaches the store: bundling rewrites
      // `$ref: './paths-moons.yaml'` into a local pointer into `x-ext` rather than inlining it.
      const { document } = await addDocument({
        'openapi': '3.1.0',
        'info': { 'title': 'Galaxy', 'version': '1.0.0' },
        'paths': { '/moons': { '$ref': '#/x-ext/45c71c7' } },
        'x-ext': {
          '45c71c7': { 'get': { 'summary': 'List all moons', 'tags': ['Referenced'] } },
        },
      })

      expect(navigationTitles(document?.[extensions.document.navigation])).toContain('List all moons')
    })

    it('externalizes the operations of a $ref path item into resolvable chunks', async () => {
      // Navigation entries are only useful when the chunk they point at exists.
      const { store } = await addDocument(refPathItemDocument())

      expect(store.get('#/api/operations/~1moons/get')).toMatchObject({ summary: 'List all moons' })
    })

    it('does not invent a path item from a reference that does not point at one', async () => {
      // A chained or mistargeted `$ref` used to be spread key-by-key into the output, inlining the
      // referenced value and emitting a `$ref-value` key the client never expects.
      const { document } = await addDocument({
        'openapi': '3.1.0',
        'info': { 'title': 'Galaxy', 'version': '1.0.0' },
        'paths': {
          '/chained': { '$ref': '#/components/pathItems/Chained' },
          '/mistargeted': { '$ref': '#/info/title' },
        },
        'components': {
          'pathItems': {
            'Chained': { '$ref': '#/components/pathItems/Moons' },
            'Moons': { 'get': { 'summary': 'List all moons' } },
          },
        },
      })

      // Neither yields a servable path item, which is what main did too. What matters is that
      // neither arrives inlined, self-referential, or carrying invented index keys.
      const paths = JSON.parse(JSON.stringify(document))?.paths ?? {}
      expect(JSON.stringify(paths)).not.toContain('$ref-value')
      expect(paths['/mistargeted']).toEqual({})
      expect(paths['/chained']).toEqual({})
    })

    it('keeps the operations written beside an unresolvable reference', async () => {
      // The sibling operation resolves perfectly well even though the reference does not, and it is
      // what navigation and the chunks are built from — dropping it here would leave the sidebar
      // pointing at a page the document never externalizes.
      const { store, document } = await addDocument({
        'openapi': '3.1.0',
        'info': { 'title': 'Galaxy', 'version': '1.0.0' },
        'paths': {
          '/moons': { '$ref': './never-bundled.yaml', 'get': { 'summary': 'List all moons' } },
        },
      })

      expect(JSON.parse(JSON.stringify(document))?.paths?.['/moons']).toHaveProperty('get')
      expect(store.get('#/api/operations/~1moons/get')).toMatchObject({ summary: 'List all moons' })
    })

    it('leaves an existing document intact when a later one reuses its name and fails', async () => {
      // The assets are written partway through, so undoing a failed add has to restore what was
      // there rather than clear the key outright.
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [{ name: 'api', document: refPathItemDocument() }],
      })

      await store.addDocument({ name: 'api', document: { 'asyncapi': '3.0.0' } })

      expect(store.get('#/api/operations/~1moons/get')).toMatchObject({ summary: 'List all moons' })
    })

    it('drops the chunks of a document that failed to ingest', async () => {
      // The assets are written before the steps that can throw, so a skipped document would
      // otherwise keep serving operation bodies the workspace does not list.
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [{ name: 'broken', document: { 'asyncapi': '3.0.0' } }],
      })

      expect(store.getWorkspace().documents).toEqual({})
      expect(store.get('#/broken')).toBeUndefined()
    })

    it('serializes a self-referential schema without recursing forever', async () => {
      // Resolution must not put a live proxy anywhere that gets serialized: enumerating one expands
      // `$ref-value` on every hop, so a schema that references itself never terminates.
      const { store } = await addDocument({
        'openapi': '3.1.0',
        'info': { 'title': 'Galaxy', 'version': '1.0.0' },
        'paths': { '/planets': { 'get': { 'summary': 'List all planets' } } },
        'components': {
          'schemas': {
            'Node': { 'type': 'object', 'properties': { 'child': { '$ref': '#/components/schemas/Node' } } },
          },
        },
      })

      expect(() => JSON.stringify(store.get('#/api/components/schemas/Node'))).not.toThrow()
    })

    it('carries the bundler buckets through the coerce step', async () => {
      const { document } = await addDocument({
        'openapi': '3.1.0',
        'info': { 'title': 'Galaxy', 'version': '1.0.0' },
        'paths': { '/moons': { '$ref': '#/x-ext/45c71c7' } },
        'x-ext': { '45c71c7': { 'get': { 'summary': 'List all moons' } } },
        'x-ext-urls': { '45c71c7': './paths-moons.yaml' },
      })

      // Both survive: `x-ext` is what rewritten references resolve against, and `x-ext-urls` is
      // what `restoreOriginalRefs` reads to turn them back into the references the author wrote.
      expect(document).toHaveProperty('x-ext')
      expect(document).toHaveProperty('x-ext-urls')
    })

    it('leaves the stored document and its chunks serializing as plain $refs', async () => {
      // `$ref-value` is virtual, so resolution must not leak resolved copies into the output.
      const { store, document } = await addDocument(refPathItemDocument())

      expect(JSON.parse(JSON.stringify(document))?.paths?.['/moons']).toEqual({
        'get': { '$ref': 'https://example.com/api/operations/~1moons/get#', '$global': true },
        'summary': 'Everything about moons',
      })
      expect(JSON.stringify(document)).not.toContain('$ref-value')

      // Serialized rather than subset-matched: a stored proxy satisfies `toMatchObject` but expands
      // its resolved copies the moment it is written to a chunk file.
      const chunk = JSON.parse(JSON.stringify(store.get('#/api/operations/~1moons/get')))
      expect(chunk.parameters[0]['$ref']).toBe('#/components/parameters/Limit')

      // The path-level key survives, and the `$ref` plumbing does not.
      const storedMoons = JSON.parse(JSON.stringify(document))?.paths?.['/moons']
      expect(storedMoons?.summary).toBe('Everything about moons')
      expect(storedMoons).not.toHaveProperty('$ref-value')
    })
  })

  describe('asyncapi documents', () => {
    const exampleAsyncApiDocument = () => ({
      'asyncapi': '3.0.0',
      'info': {
        'title': 'Scalar Galaxy Events',
        'version': '1.0.0',
      },
      'servers': {
        'broker': {
          'host': 'broker.example.com',
          'protocol': 'mqtt',
        },
      },
      'channels': {
        'planetEvents': {
          'address': 'planet/events',
          'messages': {
            'planetCreated': { '$ref': '#/components/messages/PlanetCreated' },
          },
        },
      },
      'operations': {
        'onPlanetCreated': {
          'action': 'receive',
          'channel': { '$ref': '#/channels/planetEvents' },
          'messages': [{ '$ref': '#/channels/planetEvents/messages/planetCreated' }],
        },
      },
      'components': {
        'messages': {
          'PlanetCreated': {
            'name': 'PlanetCreated',
            'title': 'Planet Created',
            'payload': { '$ref': '#/components/schemas/Planet' },
          },
        },
        'schemas': {
          'Planet': {
            'type': 'object',
            'properties': {
              'id': { 'type': 'integer' },
              'name': { 'type': 'string' },
            },
          },
        },
      },
    })

    const addAsyncApiDocument = async (document: Record<string, unknown> = exampleAsyncApiDocument()) => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [{ name: 'events', document }],
      })

      const storedDocument = store.getWorkspace().documents['events']
      assert(isAsyncApiDocument(storedDocument))

      return { store, document: storedDocument }
    }

    it('keeps the channels and operations of an asyncapi document', async () => {
      const { document } = await addAsyncApiDocument()

      const channel = document.channels?.['planetEvents']
      assert(channel && !('$ref' in channel))
      expect(channel.address).toBe('planet/events')
      expect(Object.keys(channel.messages ?? {})).toEqual(['planetCreated'])

      const operation = document.operations?.['onPlanetCreated']
      assert(operation && !('$ref' in operation))
      expect(operation.action).toBe('receive')
      expect(operation.channel).toEqual({ '$ref': '#/channels/planetEvents' })
    })

    it('does not run the openapi ingestion pipeline on an asyncapi document', async () => {
      const { document } = await addAsyncApiDocument()

      // The OpenAPI coerce would set `openapi: ''`, which breaks the discriminator both stores
      // branch on, and would add an empty `paths` object the renderer then treats as an API with
      // no operations.
      expect(document).not.toHaveProperty('openapi')
      expect(document).not.toHaveProperty('paths')
      expect(document.asyncapi).toBe('3.1.0')
    })

    it('records the original asyncapi version and upgrades legacy documents', async () => {
      const { document } = await addAsyncApiDocument({
        'asyncapi': '2.6.0',
        'info': { 'title': 'Legacy Galaxy Events', 'version': '1.0.0' },
        'channels': {
          'planet/events': {
            'publish': {
              'operationId': 'onPlanetCreated',
              'message': { '$ref': '#/components/messages/PlanetCreated' },
            },
          },
        },
        'components': {
          'messages': { 'PlanetCreated': { 'name': 'PlanetCreated' } },
        },
      })

      expect(document.asyncapi).toBe('3.1.0')
      expect(document['x-original-aas-version']).toBe('2.6.0')

      // The 2.x upgrade lifts `publish`/`subscribe` into top-level operations.
      expect(Object.keys(document.operations ?? {})).toEqual(['onPlanetCreated'])
      expect(Object.keys(document.channels ?? {})).toEqual(['planet-events'])
    })

    it('builds channel and operation navigation entries', async () => {
      const { document } = await addAsyncApiDocument()

      const navigation = document['x-scalar-navigation'] as TraversedDocument

      const channelEntry = navigation.children?.find((entry) => entry.type === 'asyncapi-channel')
      assert(channelEntry?.type === 'asyncapi-channel')
      expect(channelEntry.title).toBe('planet/events')
      expect(channelEntry.channelName).toBe('planetEvents')
      expect(channelEntry.channelAddress).toBe('planet/events')

      const operationEntry = channelEntry.children?.[0]
      assert(operationEntry?.type === 'asyncapi-operation')
      expect(operationEntry.operationName).toBe('onPlanetCreated')
      expect(operationEntry.action).toBe('receive')
      expect(operationEntry.channelName).toBe('planetEvents')
      expect(operationEntry.channelAddress).toBe('planet/events')
    })

    it('resolves a referenced message title rather than its map key', async () => {
      // The channel declares `planetCreated` as a `$ref` into `components.messages`, so the
      // sidebar label only reads correctly when local references resolve during traversal.
      const { document } = await addAsyncApiDocument()

      const navigation = document['x-scalar-navigation'] as TraversedDocument
      const channelEntry = navigation.children?.find((entry) => entry.type === 'asyncapi-channel')
      assert(channelEntry?.type === 'asyncapi-channel')
      const operationEntry = channelEntry.children?.[0]
      assert(operationEntry?.type === 'asyncapi-operation')
      const messageEntry = operationEntry.children?.[0]
      assert(messageEntry?.type === 'asyncapi-message')

      expect(messageEntry.messageName).toBe('planetCreated')
      expect(messageEntry.title).toBe('Planet Created')
    })

    it('records the rendered order on the stored document', async () => {
      // The traversal writes `x-scalar-order` while it walks, so the stored copy has to be taken
      // after it runs — otherwise the ordering is lost and cannot be read back.
      const { document } = await addAsyncApiDocument()

      // `x-scalar-order` is written by the traversal and is not modelled on `AsyncApiDocument`.
      const ordered = document as typeof document & { 'x-scalar-order'?: string[] }

      expect(ordered['x-scalar-order']).toEqual([
        'events/description/introduction',
        'events/asyncapi-channel/planetevents',
        'events/models',
      ])
    })

    it('skips a document it cannot process instead of failing the workspace', async () => {
      // One malformed description should not take a whole documentation build down with it.
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          { name: 'broken', document: { 'asyncapi': '3.0.0' } },
          { name: 'events', document: exampleAsyncApiDocument() },
        ],
      })

      expect(Object.keys(store.getWorkspace().documents)).toEqual(['events'])
    })

    it('leaves the document it was handed untouched', async () => {
      // The navigation traversal writes `x-scalar-order` onto channels, and the upgrader rewrites
      // legacy documents in place, so callers that keep using their own object (the docs build
      // does) must not see either.
      const input = exampleAsyncApiDocument()

      await addAsyncApiDocument(input)

      expect(input).toEqual(exampleAsyncApiDocument())
    })

    it('does not externalize asyncapi content into chunks', async () => {
      const { store } = await addAsyncApiDocument()

      expect(store.get('#/events/operations')).toBeUndefined()
      expect(store.get('#/events/components')).toBeUndefined()
    })
  })
})

describe('filter-http-methods-only', () => {
  it('should only keep the http methods', () => {
    const result = filterHttpMethodsOnly({
      '/path': {
        get: { description: 'some description' },
        // @ts-expect-error - this is a test
        'x-scalar-test': 'test',
        servers: [],
        parameters: [{ name: 'name', in: 'path' }],
      },
    })

    // check that all the other keys are filtered
    expect(Object.keys(result['/path'] ?? {})).toEqual(['get'])

    // check the contents of the operation
    expect(result['/path']?.get).toEqual({ description: 'some description' })
  })
})

describe('escape-paths', () => {
  it('should correctly escape / paths', () => {
    const result = escapePaths({ '/hello/users': { get: { description: 'some description' } } })
    expect(Object.keys(result)).toEqual(['~1hello~1users'])
    expect(result['~1hello~1users']).toEqual({ get: { description: 'some description' } })
  })

  it('should correctly escape ~ paths', () => {
    const result = escapePaths({ '/hello~world/users': { get: { description: 'some description' } } })
    expect(Object.keys(result)).toEqual(['~1hello~0world~1users'])

    expect(result['~1hello~0world~1users']).toEqual({ get: { description: 'some description' } })
  })
})

describe('externalize-component-references', () => {
  it('should convert the components with refs correctly for ssr mode', () => {
    const result = externalizeComponentReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        components: {
          schemas: {
            'User': coerceValue(SchemaObjectSchema, {
              'type': 'object',
              'required': ['id', 'name', 'email'],
              'properties': {
                'id': {
                  'type': 'string',
                  'format': 'uuid',
                  'example': '123e4567-e89b-12d3-a456-426614174000',
                },
              },
            }),
          },
        },
        'x-scalar-original-document-hash': '',
      },
      {
        mode: 'ssr',
        name: 'name',
        baseUrl: 'https://example.com',
      },
    )

    expect(result).toEqual({
      schemas: { User: { '$ref': 'https://example.com/name/components/schemas/User#', $global: true } },
    })
  })

  it('should convert the components with refs correctly for ssg mode', () => {
    const result = externalizeComponentReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        components: {
          schemas: {
            'User': coerceValue(SchemaObjectSchema, {
              'type': 'object',
              'required': ['id', 'name', 'email'],
              'properties': {
                'id': {
                  'type': 'string',
                  'format': 'uuid',
                  'example': '123e4567-e89b-12d3-a456-426614174000',
                },
              },
            }),
          },
        },
        'x-scalar-original-document-hash': '',
      },
      {
        mode: 'static',
        name: 'name',
        directory: 'assets',
      },
    )

    expect(result).toEqual({
      schemas: { User: { '$ref': './chunks/name/components/schemas/User.json#', $global: true } },
    })
  })
})

describe('externalize-path-references', () => {
  it('should correctly replace the contents with a ref for ssr mode', () => {
    const result = externalizePathReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        paths: {
          '/test': {
            get: {
              description: 'string',
            },
          },
        },
        'x-scalar-original-document-hash': '',
      },
      {
        mode: 'ssr',
        baseUrl: 'https://example.com',
        name: 'name',
      },
    )

    expect(result).toEqual({
      '/test': { get: { '$ref': 'https://example.com/name/operations/~1test/get#', $global: true } },
    })
  })

  it('should replace the http methods with the reference while preserving other properties', () => {
    const result = externalizePathReferences(
      {
        paths: {
          '/test': {
            get: {
              description: 'string',
            },
            // @ts-expect-error
            otherProperty: {
              description: 'I should still be in the output',
            },
          },
        },
      },
      {
        mode: 'ssr',
        baseUrl: 'https://example.com',
        name: 'name',
      },
    )

    expect(result).toEqual({
      '/test': {
        get: { '$ref': 'https://example.com/name/operations/~1test/get#', $global: true },
        otherProperty: { description: 'I should still be in the output' },
      },
    })
  })

  it('should correctly replace the contents with a ref for ssg mode', () => {
    const result = externalizePathReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        paths: {
          '/test': {
            get: {
              description: 'string',
            },
          },
        },
        'x-scalar-original-document-hash': '',
      },
      {
        mode: 'static',
        directory: 'assets',
        name: 'name',
      },
    )

    expect(result).toEqual({
      '/test': { get: { '$ref': './chunks/name/operations/~1test/get.json#', $global: true } },
    })
  })

  it('externalizes operations of a $ref path item without emitting a hybrid component ref', () => {
    const result = externalizePathReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        'x-scalar-original-document-hash': '',
        paths: {
          '/test': {
            $ref: '#/components/pathItems/Test',
            // The bundled store keeps the resolved value alongside the $ref
            '$ref-value': {
              get: {
                description: 'string',
              },
            },
            // A path-level sibling declared next to the $ref should still survive
            parameters: [{ name: 'tenant', in: 'header' }],
          } as any,
        },
      },
      {
        mode: 'ssr',
        baseUrl: 'https://example.com',
        name: 'name',
      },
    )

    expect(result).toEqual({
      '/test': {
        get: { '$ref': 'https://example.com/name/operations/~1test/get#', $global: true },
        parameters: [{ name: 'tenant', in: 'header' }],
      },
    })
  })
})
