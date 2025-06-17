import { describe, expect, test } from 'vitest'
import {
  createServerWorkspaceStore,
  escapePaths,
  externalizeComponentReferences,
  externalizePathReferences,
  filterHttpMethodsOnly,
} from './server'
import fs from 'node:fs/promises'
import { cwd } from 'node:process'
import { allFilesMatch } from '../test/helpers'

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
    test('should be able to pass a list of documents and get the workspace', async () => {
      const store = createServerWorkspaceStore({
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

    test('should be able to get the document chunks', async () => {
      const store = createServerWorkspaceStore({
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

    test('should be able to add more documents on the workspace', async () => {
      const store = createServerWorkspaceStore({
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

      store.addDocument(exampleDocument(), { name: 'doc-3', 'x-scalar-active-auth': 'test' })
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
    test('should generate the workspace file and also all the related chunks', async () => {
      const dir = 'temp'

      const store = createServerWorkspaceStore({
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
          'x-scalar-default-client': 'node',
          'x-scalar-theme': 'default',
        },
      })

      store.addDocument(exampleDocument(), {
        name: 'doc-2',
        'x-scalar-active-auth': 'test',
        'x-scalar-active-server': 'test',
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
        'x-scalar-default-client': 'node',
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
})

describe('filter-http-methods-only', () => {
  test('should only keep the http methods', () => {
    const result = filterHttpMethodsOnly({
      '/path': {
        get: { description: 'some description' },
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
  test('should correctly escape / paths', () => {
    const result = escapePaths({ '/hello/users': { get: { description: 'some description' } } })
    expect(Object.keys(result)).toEqual(['~1hello~1users'])
    expect(result['~1hello~1users']).toEqual({ get: { description: 'some description' } })
  })

  test('should correctly escape ~ paths', () => {
    const result = escapePaths({ '/hello~world/users': { get: { description: 'some description' } } })
    expect(Object.keys(result)).toEqual(['~1hello~0world~1users'])

    expect(result['~1hello~0world~1users']).toEqual({ get: { description: 'some description' } })
  })
})

describe('externalize-component-references', () => {
  test('should convert the components with refs correctly for ssr mode', () => {
    const result = externalizeComponentReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        components: {
          schemas: {
            'User': {
              'type': 'object',
              'required': ['id', 'name', 'email'],
              'properties': {
                'id': {
                  'type': 'string',
                  'format': 'uuid',
                  'example': '123e4567-e89b-12d3-a456-426614174000',
                },
              },
            },
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

  test('should convert the components with refs correctly for ssg mode', () => {
    const result = externalizeComponentReferences(
      {
        info: {
          title: '',
          version: '',
        },
        openapi: '',
        components: {
          schemas: {
            'User': {
              'type': 'object',
              'required': ['id', 'name', 'email'],
              'properties': {
                'id': {
                  'type': 'string',
                  'format': 'uuid',
                  'example': '123e4567-e89b-12d3-a456-426614174000',
                },
              },
            },
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
  test('should correctly replace the contents with a ref for ssr mode', () => {
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

  test('should replace the http methods with the reference while preserving other properties', () => {
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

  test('should correctly replace the contents with a ref for ssg mode', () => {
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
