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
  externalizeAsyncApiOperationReferences,
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
            'id': 'tag/default/get/planets',
            method: 'get',
            type: 'operation',
            isDeprecated: false,
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
            'id': 'tag/default/get/planets',
            isDeprecated: false,
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
            'id': 'tag/default/get/planets',
            isDeprecated: false,
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
                'id': 'tag/default/get/planets',
                isDeprecated: false,
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
                'id': 'tag/default/get/planets',
                isDeprecated: false,
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

describe('AsyncAPI Server-Side Processing', () => {
  const exampleAsyncApiDocument = () => ({
    'asyncapi': '3.0.0' as const,
    'info': {
      'title': 'User Events API',
      'version': '1.0.0',
      'description': 'An API for handling user events',
    },
    'channels': {
      'user/signedup': {
        'title': 'User signed up',
        'description': 'Channel for user signup events',
        'operations': {
          'publish': 'publishUserSignedUp',
        },
      },
      'user/deleted': {
        'title': 'User deleted',
        'description': 'Channel for user deletion events',
        'operations': {
          'subscribe': 'subscribeUserDeleted',
        },
      },
    },
    'operations': {
      'publishUserSignedUp': {
        'action': 'send' as const,
        'channel': 'user/signedup',
        'title': 'Publish user signed up event',
        'summary': 'Publish when a user signs up',
      },
      'subscribeUserDeleted': {
        'action': 'subscribe' as const,
        'channel': 'user/deleted',
        'title': 'Subscribe to user deleted event',
        'summary': 'Subscribe to user deletion events',
      },
    },
    'components': {
      'schemas': {
        'User': coerceValue(SchemaObjectSchema, {
          'type': 'object',
          'properties': {
            'id': { 'type': 'string' },
            'email': { 'type': 'string' },
          },
        }),
      },
    },
  })

  describe('ssr', () => {
    it('processes AsyncAPI documents without casting to any', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'asyncapi-test',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      const workspace = store.getWorkspace()
      const asyncApiDoc = workspace.documents['asyncapi-test']

      expect(asyncApiDoc).toBeDefined()

      // Type guard to check if it's an AsyncAPI document
      if (asyncApiDoc && 'asyncapi' in asyncApiDoc) {
        expect(asyncApiDoc.asyncapi).toBe('3.0.0')
        expect(asyncApiDoc.info.title).toBe('User Events API')

        // Verify operations are externalized
        expect(asyncApiDoc.operations).toBeDefined()
        expect(asyncApiDoc.operations!.publishUserSignedUp).toEqual({
          '$ref': 'https://example.com/asyncapi-test/operations/publishUserSignedUp#',
          $global: true,
        })
      }
    })

    it('generates correct navigation for AsyncAPI documents', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'asyncapi-test',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      const workspace = store.getWorkspace()
      const asyncApiDoc = workspace.documents['asyncapi-test']

      // Check navigation structure exists
      expect(asyncApiDoc).toBeDefined()

      if (asyncApiDoc) {
        expect(asyncApiDoc['x-scalar-navigation']).toBeDefined()
        const navigation = asyncApiDoc['x-scalar-navigation']

        // Should have channel entries
        const channelEntries = navigation.filter((entry) => entry.type === 'channel')
        expect(channelEntries.length).toBeGreaterThan(0)

        // Verify channel structure
        const userSignedUpChannel = channelEntries.find(
          (entry) => entry.type === 'channel' && entry.name === 'user/signedup',
        )
        expect(userSignedUpChannel).toBeDefined()

        if (userSignedUpChannel && userSignedUpChannel.type === 'channel') {
          expect(userSignedUpChannel.title).toBe('User signed up')

          // Should have asyncapi-operation children
          if (userSignedUpChannel.children && userSignedUpChannel.children.length > 0) {
            const operations = userSignedUpChannel.children.filter((entry) => entry.type === 'asyncapi-operation')
            expect(operations.length).toBeGreaterThan(0)
            if (operations[0] && operations[0].type === 'asyncapi-operation') {
              expect(operations[0].action).toBe('send')
            }
          }
        }
      }
    })

    it('retrieves AsyncAPI operation chunks correctly', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'asyncapi-test',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      const operation = store.get('#/asyncapi-test/operations/publishUserSignedUp') as {
        action: string
        channel: string
        title: string
      }
      expect(operation).toBeDefined()
      expect(operation.action).toBe('send')
      expect(operation.channel).toBe('user/signedup')
      expect(operation.title).toBe('Publish user signed up event')
    })

    it('handles mixed OpenAPI and AsyncAPI documents in the same workspace', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: 'https://example.com',
        documents: [
          {
            name: 'openapi-doc',
            document: {
              'openapi': '3.1.1',
              'info': { title: 'REST API', version: '1.0.0' },
              'paths': {
                '/users': {
                  get: { summary: 'List users' },
                },
              },
            },
          },
          {
            name: 'asyncapi-doc',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      const workspace = store.getWorkspace()

      // Check both documents are present
      expect(workspace.documents['openapi-doc']).toBeDefined()
      expect(workspace.documents['asyncapi-doc']).toBeDefined()

      // Verify OpenAPI document has paths
      const openApiDoc = workspace.documents['openapi-doc']
      if (openApiDoc && 'openapi' in openApiDoc) {
        expect(openApiDoc.openapi).toBe('3.1.1')
        expect(openApiDoc.paths).toBeDefined()
      }

      // Verify AsyncAPI document has operations
      const asyncApiDoc = workspace.documents['asyncapi-doc']
      if (asyncApiDoc && 'asyncapi' in asyncApiDoc) {
        expect(asyncApiDoc.asyncapi).toBe('3.0.0')
        expect(asyncApiDoc.operations).toBeDefined()
      }

      // Verify operations can be retrieved for both
      const restOperation = store.get('#/openapi-doc/operations/~1users/get')
      expect(restOperation).toBeDefined()

      const asyncOperation = store.get('#/asyncapi-doc/operations/publishUserSignedUp')
      expect(asyncOperation).toBeDefined()
    })
  })

  describe('static', () => {
    let tmpDir = ''

    beforeEach(() => {
      tmpDir = `${cwd()}/tmp-test-${randomUUID()}`
    })

    afterEach(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true })
    })

    it('generates AsyncAPI workspace chunks in static mode', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: tmpDir,
        documents: [
          {
            name: 'asyncapi-test',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      await store.generateWorkspaceChunks()

      // Check that the workspace file exists
      const workspaceFile = await fs.readFile(`${tmpDir}/scalar-workspace.json`, 'utf-8')
      expect(workspaceFile).toBeDefined()

      const workspace = JSON.parse(workspaceFile)
      expect(workspace.documents['asyncapi-test']).toBeDefined()

      // Check that operation chunks are created
      const publishOperation = await fs.readFile(
        `${tmpDir}/chunks/asyncapi-test/operations/publishUserSignedUp.json`,
        'utf-8',
      )
      const publishOperationData = JSON.parse(publishOperation)
      expect(publishOperationData.action).toBe('send')
      expect(publishOperationData.channel).toBe('user/signedup')

      const subscribeOperation = await fs.readFile(
        `${tmpDir}/chunks/asyncapi-test/operations/subscribeUserDeleted.json`,
        'utf-8',
      )
      const subscribeOperationData = JSON.parse(subscribeOperation)
      expect(subscribeOperationData.action).toBe('subscribe')
      expect(subscribeOperationData.channel).toBe('user/deleted')

      // Check that component chunks are created (same structure as OpenAPI)
      const userSchema = await fs.readFile(`${tmpDir}/chunks/asyncapi-test/components/schemas/User.json`, 'utf-8')
      const userSchemaData = JSON.parse(userSchema)
      expect(userSchemaData.type).toBe('object')
      expect(userSchemaData.properties).toBeDefined()
    })

    it('generates chunks for mixed OpenAPI and AsyncAPI documents', async () => {
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: tmpDir,
        documents: [
          {
            name: 'openapi-doc',
            document: {
              'openapi': '3.1.1',
              'info': { title: 'REST API', version: '1.0.0' },
              'paths': {
                '/users': {
                  get: { summary: 'List users' },
                },
              },
            },
          },
          {
            name: 'asyncapi-doc',
            document: exampleAsyncApiDocument(),
          },
        ],
      })

      await store.generateWorkspaceChunks()

      // Verify OpenAPI operation chunks exist (nested by path and method)
      const openApiOperation = await fs.readFile(`${tmpDir}/chunks/openapi-doc/operations/~1users/get.json`, 'utf-8')
      expect(JSON.parse(openApiOperation).summary).toBe('List users')

      // Verify AsyncAPI operation chunks exist (flat by operation ID)
      const asyncApiOperation = await fs.readFile(
        `${tmpDir}/chunks/asyncapi-doc/operations/publishUserSignedUp.json`,
        'utf-8',
      )
      expect(JSON.parse(asyncApiOperation).action).toBe('send')
    })
  })
})

describe('externalize-asyncapi-operation-references', () => {
  it('externalizes AsyncAPI operations correctly for ssr mode', () => {
    const result = externalizeAsyncApiOperationReferences(
      {
        asyncapi: '3.0.0',
        info: {
          title: 'Test AsyncAPI',
          version: '1.0.0',
        },
        operations: {
          'publishUserSignedUp': {
            'action': 'send' as const,
            'channel': 'user/signedup',
            'title': 'Publish user signed up event',
          },
          'subscribeUserDeleted': {
            'action': 'receive' as const,
            'channel': 'user/deleted',
            'title': 'Subscribe to user deleted event',
          },
        },
      },
      {
        mode: 'ssr',
        name: 'asyncapi-test',
        baseUrl: 'https://example.com',
      },
    )

    expect(result).toEqual({
      'publishUserSignedUp': {
        '$ref': 'https://example.com/asyncapi-test/operations/publishUserSignedUp#',
        $global: true,
      },
      'subscribeUserDeleted': {
        '$ref': 'https://example.com/asyncapi-test/operations/subscribeUserDeleted#',
        $global: true,
      },
    })
  })

  it('externalizes AsyncAPI operations correctly for static mode', () => {
    const result = externalizeAsyncApiOperationReferences(
      {
        asyncapi: '3.0.0',
        info: {
          title: 'Test AsyncAPI',
          version: '1.0.0',
        },
        operations: {
          'publishUserSignedUp': {
            'action': 'send' as const,
            'channel': 'user/signedup',
            'title': 'Publish user signed up event',
          },
        },
      },
      {
        mode: 'static',
        name: 'asyncapi-test',
        directory: 'assets',
      },
    )

    expect(result).toEqual({
      'publishUserSignedUp': {
        '$ref': './chunks/asyncapi-test/operations/publishUserSignedUp.json#',
        $global: true,
      },
    })
  })

  it('handles AsyncAPI documents without operations', () => {
    const result = externalizeAsyncApiOperationReferences(
      {
        asyncapi: '3.0.0',
        info: {
          title: 'Test AsyncAPI',
          version: '1.0.0',
        },
      },
      {
        mode: 'ssr',
        name: 'asyncapi-test',
        baseUrl: 'https://example.com',
      },
    )

    expect(result).toEqual({})
  })
})
