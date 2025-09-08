import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { cwd } from 'node:process'
import { setTimeout } from 'node:timers/promises'

import { type FastifyInstance, fastify } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'

import { allFilesMatch } from '../test/helpers'
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
          'x-scalar-dark-mode': true,
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
        'x-scalar-navigation': [
          {
            id: 'List planets',
            method: 'get',
            type: 'operation',
            'ref': '#/paths/~1planets/get',
            path: '/planets',
            title: 'List planets',
          },
        ],
      })

      expect(store.getWorkspace()).toEqual({
        'x-scalar-active-document': 'api-1',
        'x-scalar-dark-mode': true,
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
              'x-scalar-active-auth': 'test',
            },
          },
          {
            name: 'doc-2',
            document: exampleDocument(),
          },
        ],
      })

      await store.addDocument({ name: 'doc-3', meta: { 'x-scalar-active-auth': 'test' }, document: exampleDocument() })
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
        'x-scalar-active-auth': 'test',
        'x-scalar-navigation': [
          {
            id: 'List planets',
            method: 'get',
            type: 'operation',
            'ref': '#/paths/~1planets/get',
            path: '/planets',
            title: 'List planets',
          },
        ],
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
        'x-scalar-active-auth': 'test',
        'x-scalar-navigation': [
          {
            id: 'List planets',
            method: 'get',
            type: 'operation',
            'ref': '#/paths/~1planets/get',
            path: '/planets',
            title: 'List planets',
          },
        ],
      })
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
              'x-scalar-active-auth': 'test',
              'x-scalar-active-server': 'test',
            },
          },
        ],
        meta: {
          'x-scalar-active-document': 'test',
          'x-scalar-dark-mode': true,
          'x-scalar-default-client': 'node/fetch',
          'x-scalar-theme': 'default',
        },
      })

      await store.addDocument({
        document: exampleDocument(),
        name: 'doc-2',
        meta: {
          'x-scalar-active-auth': 'test',
          'x-scalar-active-server': 'test',
        },
      })
      await store.generateWorkspaceChunks()

      const basePath = `${cwd()}/${dir}`

      const sparseWorkspace = await fs.readFile(`${basePath}/scalar-workspace.json`, { encoding: 'utf-8' })

      // check the workspace is the correct format
      expect(JSON.parse(sparseWorkspace)).toEqual({
        documents: {
          'doc-1': {
            'x-scalar-active-auth': 'test',
            'x-scalar-active-server': 'test',
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
            'x-scalar-navigation': [
              {
                id: 'List planets',
                method: 'get',
                path: '/planets',
                title: 'List planets',
                type: 'operation',
                'ref': '#/paths/~1planets/get',
              },
            ],
          },
          'doc-2': {
            'x-scalar-active-auth': 'test',
            'x-scalar-active-server': 'test',
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
            'x-scalar-navigation': [
              {
                id: 'List planets',
                method: 'get',
                type: 'operation',
                'ref': '#/paths/~1planets/get',
                path: '/planets',
                title: 'List planets',
              },
            ],
          },
        },
        'x-scalar-active-document': 'test',
        'x-scalar-dark-mode': true,
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
      const port = 6287
      const url = `http://localhost:${port}`

      beforeEach(() => {
        server = fastify({ logger: false })
      })

      afterEach(async () => {
        await server.close()
        await setTimeout(100)
      })

      it('should load a document on the workspace from an external url', async () => {
        server.get('/', () => {
          return exampleDocument()
        })
        await server.listen({ port })

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
        await server.listen({ port })

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
            // @ts-ignore
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
})
