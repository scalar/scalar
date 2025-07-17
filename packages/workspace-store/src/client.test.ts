import { setTimeout } from 'node:timers/promises'
import { createWorkspaceStore } from '@/client'
import { defaultReferenceConfig } from '@/schemas/reference-config'
import { createServerWorkspaceStore } from '@/server'
import { consoleErrorSpy, resetConsoleSpies } from '@scalar/helpers/testing/console-spies'
import fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Test document
const getDocument = (version?: string) => ({
  openapi: version ?? '3.0.0',
  info: { title: 'My API', version: '1.0.0' },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The user ID',
          },
          name: {
            type: 'string',
            description: 'The user name',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'The user email',
          },
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
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})

describe('create-workspace-store', () => {
  let server: FastifyInstance
  const port = 9988

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
    await setTimeout(100)
  })

  it('correctly update workspace metadata', async () => {
    const store = await createWorkspaceStore({
      meta: {
        'x-scalar-theme': 'default',
        'x-scalar-dark-mode': false,
      },
    })

    store.update('x-scalar-dark-mode', true)
    store.update('x-scalar-theme', 'saturn')

    expect(store.workspace['x-scalar-dark-mode']).toBe(true)
    expect(store.workspace['x-scalar-theme']).toBe('saturn')
  })

  it('correctly update document metadata', async () => {
    const store = await createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: {
            openapi: '3.0.0',
            info: { title: 'My API' },
          },
          meta: {
            'x-scalar-active-auth': 'Bearer',
            'x-scalar-active-server': 'server-1',
          },
        },
      ],
    })

    // Should update the active document
    store.updateDocument('active', 'x-scalar-active-server', 'server-2')
    store.updateDocument('active', 'x-scalar-active-auth', undefined)
    expect(store.workspace.documents['default']['x-scalar-active-auth']).toBe(undefined)
    expect(store.workspace.documents['default']['x-scalar-active-server']).toBe('server-2')

    // Should update a specific document
    store.updateDocument('default', 'x-scalar-active-server', 'server-3')
    store.updateDocument('default', 'x-scalar-active-auth', 'Bearer')
    expect(store.workspace.documents['default']['x-scalar-active-auth']).toBe('Bearer')
    expect(store.workspace.documents['default']['x-scalar-active-server']).toBe('server-3')
  })

  it('correctly get the correct document', async () => {
    const store = await createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: {
            openapi: '3.0.0',
            info: { title: 'My API' },
          },
          meta: {
            'x-scalar-active-auth': 'Bearer',
            'x-scalar-active-server': 'server-1',
          },
        },
        {
          name: 'document2',
          document: {
            openapi: '3.0.0',
            info: { title: 'Second API' },
          },
          meta: {
            'x-scalar-active-auth': 'Bearer',
            'x-scalar-active-server': 'server-1',
          },
        },
      ],
      meta: {
        'x-scalar-active-document': 'default',
      },
    })

    // Correctly gets the active document
    expect(store.workspace.activeDocument?.info?.title).toBe('My API')

    store.update('x-scalar-active-document', 'document2')
    expect(store.workspace.activeDocument?.info?.title).toBe('Second API')

    // Correctly get a specific document
    expect(store.workspace.documents['default']).toEqual({
      info: {
        title: 'My API',
        version: '',
      },
      openapi: '3.1.1',
      'x-scalar-active-auth': 'Bearer',
      'x-scalar-active-server': 'server-1',
      'x-scalar-navigation': [],
    })
  })

  it('correctly add new documents', async () => {
    const store = await createWorkspaceStore({
      documents: [],
    })

    await store.addDocument({
      document: {
        openapi: '3.0.0',
        info: { title: 'My API' },
      },
      name: 'default',
    })

    store.update('x-scalar-active-document', 'default')
    expect(store.workspace.activeDocument).toEqual({
      info: {
        title: 'My API',
        version: '',
      },
      openapi: '3.1.1',
      'x-scalar-navigation': [],
    })
  })

  it('correctly resolve refs on the fly', async () => {
    const store = await createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: {
            openapi: '3.0.0',
            info: { title: 'My API' },
            components: {
              schemas: {
                User: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'The user ID',
                    },
                    name: {
                      type: 'string',
                      description: 'The user name',
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      description: 'The user email',
                    },
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
                          schema: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/User',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    })

    expect(
      (store.workspace.activeDocument?.paths?.['/users'].get as any)?.responses?.[200].content['application/json']
        .schema.items.properties.name,
    ).toEqual({
      type: 'string',
      description: 'The user name',
    })
  })

  it('correctly resolve chunks from the remote server', async () => {
    server.get('/*', (req, res) => {
      const path = req.url
      const contents = serverStore.get(path)

      res.send(contents)
    })

    await server.listen({ port })

    const serverStore = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: `http://localhost:${port}`,
      documents: [
        {
          name: 'default',
          document: getDocument(),
        },
      ],
    })

    const store = createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: serverStore.getWorkspace().documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users']?.get).toEqual({
      '$ref': 'http://localhost:9988/default/operations/~1users/get#',
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    // We expect the ref to have been resolved with the correct contents
    expect(store.workspace.activeDocument?.paths?.['/users'].get?.summary).toEqual(
      getDocument().paths['/users'].get.summary,
    )

    expect(
      (store.workspace.activeDocument?.paths?.['/users'].get as any).responses[200].content['application/json'].schema
        .items,
    ).toEqual({
      ...getDocument().components.schemas.User,
      'x-original-ref': '#/components/schemas/User',
    })
  })

  it('load files form the remote url', async () => {
    const url = `http://localhost:${port}`

    // Send the default document
    server.get('/', (_, reply) => {
      reply.send(getDocument())
    })

    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      url: url,
      name: 'default',
    })

    expect(Object.keys(store.workspace.documents)).toEqual(['default'])
    expect(store.workspace.documents['default'].info?.title).toEqual(getDocument().info.title)

    // Add a new remote file
    await store.addDocument({ name: 'new', url: url })

    expect(Object.keys(store.workspace.documents)).toEqual(['default', 'new'])
    expect(store.workspace.documents['new'].info?.title).toEqual(getDocument().info.title)
  })

  it('handle circular references when we try to resolve all remote chunks recursively', async () => {
    const getDocument = () => ({
      openapi: '3.0.0',
      info: { title: 'My API', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The user ID',
              },
              name: {
                $ref: '#/components/schemas/Rec',
              },
            },
          },
          Rec: {
            type: 'object',
            properties: {
              id: {
                $ref: '#/components/schemas/User',
              },
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
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    server.get('/*', (req, res) => {
      const path = req.url
      const contents = serverStore.get(path)

      res.send(contents)
    })

    await server.listen({ port })

    const serverStore = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: `http://localhost:${port}`,
      documents: [
        {
          name: 'default',
          document: getDocument(),
        },
      ],
    })

    const store = createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: serverStore.getWorkspace().documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users']?.get).toEqual({
      '$ref': `http://localhost:${port}/default/operations/~1users/get#`,
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    expect((store.workspace.activeDocument?.components?.schemas?.['User'] as any)?.type).toBe('object')
  })

  it('build the sidebar client side', async () => {
    const store = await createWorkspaceStore({
      documents: [],
    })

    await store.addDocument({
      document: {
        openapi: '3.0.3',
        info: {
          title: 'Todo API',
          version: '1.0.0',
        },
        paths: {
          '/todos': {
            get: {
              summary: 'List all todos',
              responses: {
                200: {
                  description: 'A list of todos',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Todo',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Todo: {
              type: 'object',
              properties: {
                id: { 'type': 'string' },
                title: { 'type': 'string' },
                completed: { 'type': 'boolean' },
              },
            },
          },
        },
      },
      name: 'default',
    })

    store.update('x-scalar-active-document', 'default')
    expect(store.workspace.activeDocument).toEqual({
      'components': {
        'schemas': {
          'Todo': {
            'properties': {
              'completed': {
                'type': 'boolean',
              },
              'id': {
                'type': 'string',
              },
              'title': {
                'type': 'string',
              },
            },
            'type': 'object',
          },
        },
      },
      'info': {
        'title': 'Todo API',
        'version': '1.0.0',
      },
      'openapi': '3.1.1',
      'paths': {
        '/todos': {
          'get': {
            'responses': {
              '200': {
                'content': {
                  'application/json': {
                    'schema': {
                      'items': {
                        'x-original-ref': '#/components/schemas/Todo',
                        'properties': {
                          'completed': {
                            'type': 'boolean',
                          },
                          'id': {
                            'type': 'string',
                          },
                          'title': {
                            'type': 'string',
                          },
                        },
                        'type': 'object',
                      },
                      'type': 'array',
                    },
                  },
                },
                'description': 'A list of todos',
              },
            },
            'summary': 'List all todos',
          },
        },
      },
      'x-scalar-navigation': [
        {
          'id': 'List all todos',
          'method': 'get',
          'path': '/todos',
          'title': 'List all todos',
          ref: '#/paths/~1todos/get',
          type: 'operation',
        },
        {
          'children': [
            {
              'id': 'Todo',
              'name': 'Todo',
              'title': 'Todo',
              ref: '#/content/components/schemas/Todo',
              type: 'model',
            },
          ],
          'id': '',
          'title': 'Models',
          type: 'text',
        },
      ],
    })
  })

  it('correctly get the config #1', () => {
    const store = createWorkspaceStore({
      config: {
        'x-scalar-reference-config': {
          features: {
            showDownload: false,
          },
          appearance: {
            css: 'body { background: #f0f0f0; }',
          },
        },
      },
    })

    expect(store.config['x-scalar-reference-config']).toEqual({
      ...defaultReferenceConfig,
      features: {
        ...defaultReferenceConfig.features,
        showDownload: false,
      },
      appearance: {
        ...defaultReferenceConfig.appearance,
        css: 'body { background: #f0f0f0; }',
      },
    })
  })

  it('correctly get the config #2', () => {
    const store = createWorkspaceStore({
      config: {
        'x-scalar-reference-config': {
          appearance: {
            css: 'body { background: #f0f0f0; }',
          },
        },
      },
    })

    store.addDocumentSync({
      name: 'default',
      document: {
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
      config: {
        'x-scalar-reference-config': {
          features: {
            showDownload: false,
          },
          appearance: {
            css: 'body { background: #f0f0f0; }\n.scalar-reference { color: red; }',
          },
        },
      },
    })

    expect(store.config['x-scalar-reference-config']).toEqual({
      ...defaultReferenceConfig,
      features: {
        ...defaultReferenceConfig.features,
        showDownload: false,
      },
      appearance: {
        ...defaultReferenceConfig.appearance,
        css: 'body { background: #f0f0f0; }\n.scalar-reference { color: red; }',
      },
    })
  })

  describe('download original document', () => {
    it('gets the original document from the store json', async () => {
      const store = createWorkspaceStore({
        documents: [
          {
            name: 'api-1',
            document: {
              info: { title: 'My API', version: '1.0.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-2',
            document: {
              info: { title: 'My API 2', version: '1.2.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-3',
            document: getDocument(),
          },
        ],
      })

      expect(store.exportDocument('api-1', 'json')).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json')).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-3', 'json')).toBe(
        '{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}',
      )
    })

    it('gets the original document from the store yaml', async () => {
      const store = createWorkspaceStore({
        documents: [
          {
            name: 'api-1',
            document: {
              info: { title: 'My API', version: '1.0.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-2',
            document: {
              info: { title: 'My API 2', version: '1.2.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-3',
            document: getDocument(),
          },
        ],
      })

      expect(store.exportDocument('api-1', 'yaml')).toBe('info:\n  title: My API\n  version: 1.0.0\nopenapi: 3.1.1\n')

      expect(store.exportDocument('api-2', 'yaml')).toBe('info:\n  title: My API 2\n  version: 1.2.0\nopenapi: 3.1.1\n')

      expect(store.exportDocument('api-3', 'yaml')).toBe(
        `openapi: 3.1.1\ninfo:\n  title: My API\n  version: 1.0.0\ncomponents:\n  schemas:\n    User:\n      type: object\n      properties:\n        id:\n          type: string\n          description: The user ID\n        name:\n          type: string\n          description: The user name\n        email:\n          type: string\n          format: email\n          description: The user email\npaths:\n  /users:\n    get:\n      summary: Get all users\n      responses:\n        "200":\n          description: Successful response\n          content:\n            application/json:\n              schema:\n                type: array\n                items:\n                  $ref: "#/components/schemas/User"\n`,
      )
    })
  })

  describe('save document', () => {
    it('writes back to the original document', async () => {
      const store = createWorkspaceStore({
        documents: [
          {
            name: 'api-1',
            document: {
              info: { title: 'My API', version: '1.0.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-2',
            document: {
              info: { title: 'My API 2', version: '1.2.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-3',
            document: getDocument(),
          },
        ],
      })

      if (store.workspace.documents['api-3']?.info?.title) {
        store.workspace.documents['api-3'].info.title = 'Updated API'
      }

      // Write the changes back to the original document
      store.saveDocument('api-3')

      // Should return the original document without any modifications
      expect(store.exportDocument('api-1', 'json')).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json')).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      // Should return the updated document without any extensions
      expect(store.exportDocument('api-3', 'json')).toEqual(
        '{"openapi":"3.1.1","info":{"title":"Updated API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}',
      )
    })

    it('does not write back external bundled documents', async () => {
      const document = getDocument()

      server.get('/*', () => {
        return { description: 'This is an external document' }
      })

      await server.listen({ port })

      const store = createWorkspaceStore({
        documents: [
          {
            name: 'default',
            document: {
              ...document,
              paths: {
                ...document.paths,
                '/external': {
                  get: {
                    $ref: `http://localhost:${port}`,
                  },
                },
              },
            },
          },
        ],
      })

      if (store.workspace.activeDocument?.info?.title) {
        store.workspace.activeDocument.info.title = 'Updated API'
      }

      // Bundle external documents
      await store.resolve(['paths'])

      // Write the changes back to the original document
      store.saveDocument('default')

      // Should return the updated document without any extensions
      expect(store.exportDocument('default', 'json')).toEqual(
        '{"openapi":"3.1.1","info":{"title":"Updated API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}}}',
      )
    })
  })

  describe('revert', () => {
    it('should revert the changes made to the document', async () => {
      const store = createWorkspaceStore({
        documents: [
          {
            name: 'api-1',
            document: {
              info: { title: 'My API', version: '1.0.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-2',
            document: {
              info: { title: 'My API 2', version: '1.2.0' },
              openapi: '3.1.1',
            },
          },
          {
            name: 'api-3',
            document: getDocument(),
          },
        ],
      })

      if (store.workspace.documents['api-3']?.info?.title) {
        store.workspace.documents['api-3'].info.title = 'Updated API'
      }

      expect(store.workspace?.documents['api-3']?.info?.title).toBe('Updated API')

      // Revert the changes
      store.revertDocumentChanges('api-3')

      // Should return the original document without any modifications
      expect(store.exportDocument('api-1', 'json')).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json')).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      // Should return the updated document without any extensions
      expect(store.exportDocument('api-3', 'json')).toEqual(
        '{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}',
      )
    })
  })

  describe('export', () => {
    it('should export the workspace internal state as a json document', () => {
      const store = createWorkspaceStore({
        documents: [
          {
            name: 'default',
            document: {
              openapi: '3.0.0',
              info: {
                title: 'My API',
                version: '1.0.0',
              },
            },
            config: {
              'x-scalar-reference-config': {
                features: {
                  showModels: false,
                  showDownload: false,
                },
              },
            },
            meta: {
              'x-scalar-active-server': 'server-1',
            },
          },
        ],
        meta: {
          'x-scalar-active-document': 'default',
          'x-scalar-dark-mode': true,
          'x-scalar-default-client': 'c/libcurl',
          'x-scalar-theme': 'saturn',
        },
      })

      store.addDocumentSync({
        name: 'pet-store',
        document: {
          openapi: '3.0.0',
          info: {
            title: 'Pet Store API',
            version: '1.0.0',
          },
          paths: {
            '/users': {
              get: {
                description: 'Get all users',
              },
            },
          },
        },
      })

      expect(store.exportWorkspace()).toBe(
        JSON.stringify({
          documents: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-navigation': [],
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              paths: { '/users': { get: { description: 'Get all users' } } },
              'x-scalar-navigation': [
                {
                  id: '',
                  title: '/users',
                  path: '/users',
                  method: 'get',
                  ref: '#/paths/~1users/get',
                  type: 'operation',
                },
              ],
            },
          },
          meta: {
            'x-scalar-active-document': 'default',
            'x-scalar-dark-mode': true,
            'x-scalar-default-client': 'c/libcurl',
            'x-scalar-theme': 'saturn',
          },
          documentConfigs: {
            default: { 'x-scalar-reference-config': { 'features': { 'showModels': false, 'showDownload': false } } },
            'pet-store': {},
          },
          originalDocuments: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              paths: { '/users': { get: { description: 'Get all users' } } },
            },
          },
          intermediateDocuments: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              'paths': { '/users': { 'get': { 'description': 'Get all users' } } },
            },
          },
        }),
      )
    })
  })

  describe('loadWorkspace', () => {
    it('should load the workspace from a json document', () => {
      const store = createWorkspaceStore()

      // Load the workspace form a json document
      store.loadWorkspace(
        JSON.stringify({
          documents: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-navigation': [],
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              paths: { '/users': { get: { description: 'Get all users' } } },
              'x-scalar-navigation': [
                {
                  id: '',
                  title: '/users',
                  path: '/users',
                  method: 'get',
                  ref: '#/paths/~1users/get',
                  type: 'operation',
                },
              ],
            },
          },
          meta: {
            'x-scalar-active-document': 'default',
            'x-scalar-dark-mode': true,
            'x-scalar-default-client': 'c/libcurl',
            'x-scalar-theme': 'saturn',
          },
          documentConfigs: {
            default: { 'x-scalar-reference-config': { 'features': { 'showModels': false, 'showDownload': false } } },
            'pet-store': {},
          },
          originalDocuments: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              paths: { '/users': { get: { description: 'Get all users' } } },
            },
          },
          intermediateDocuments: {
            default: {
              openapi: '3.1.1',
              info: { title: 'My API', version: '1.0.0' },
              'x-scalar-active-server': 'server-1',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              'paths': { '/users': { 'get': { 'description': 'Get all users' } } },
            },
          },
        }),
      )

      // Should have loaded the workspace correctly
      expect(store.workspace.activeDocument).toEqual({
        openapi: '3.1.1',
        info: { title: 'My API', version: '1.0.0' },
        'x-scalar-navigation': [],
        'x-scalar-active-server': 'server-1',
      })

      expect(store.config['x-scalar-reference-config'].features.showModels).toBe(false)
      expect(store.config['x-scalar-reference-config'].features.showDownload).toBe(false)

      expect(store.workspace.documents).toEqual({
        default: {
          openapi: '3.1.1',
          info: { title: 'My API', version: '1.0.0' },
          'x-scalar-navigation': [],
          'x-scalar-active-server': 'server-1',
        },
        'pet-store': {
          openapi: '3.1.1',
          info: { title: 'Pet Store API', version: '1.0.0' },
          paths: { '/users': { get: { description: 'Get all users' } } },
          'x-scalar-navigation': [
            {
              id: '',
              title: '/users',
              path: '/users',
              method: 'get',
              ref: '#/paths/~1users/get',
              type: 'operation',
            },
          ],
        },
      })

      expect(store.workspace['x-scalar-theme']).toBe('saturn')
      expect(store.workspace['x-scalar-dark-mode']).toBe(true)
      expect(store.workspace['x-scalar-active-document']).toBe('default')
      expect(store.workspace['x-scalar-default-client']).toBe('c/libcurl')
    })
  })

  describe('addDocument error handling', () => {
    beforeEach(() => {
      resetConsoleSpies()
    })

    afterEach(() => {
      resetConsoleSpies()
    })

    it('logs specific error when resolve.ok is false', async () => {
      const store = createWorkspaceStore()

      // Mock fetch to return a failed response
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await store.addDocument({
        name: 'failed-doc',
        url: 'https://example.com/api.json',
        fetch: mockFetch,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch document 'failed-doc': request was not successful")
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('logs specific error when resolve.data is not an object', async () => {
      const store = createWorkspaceStore()

      // Mock fetch to return a successful response but with non-object data
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('not an object'),
      })

      await store.addDocument({
        name: 'invalid-doc',
        url: 'https://example.com/api.json',
        fetch: mockFetch,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load document 'invalid-doc': response data is not a valid object",
      )
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('logs different errors for different failure conditions', async () => {
      const store = createWorkspaceStore()

      // Test first condition: resolve.ok is false
      const mockFetch1 = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await store.addDocument({
        name: 'server-error-doc',
        url: 'https://example.com/api.json',
        fetch: mockFetch1,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch document 'server-error-doc': request was not successful",
      )

      // Reset the spy
      resetConsoleSpies()

      // Test second condition: resolve.data is not an object
      const mockFetch2 = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(null),
      })

      await store.addDocument({
        name: 'null-data-doc',
        url: 'https://example.com/api2.json',
        fetch: mockFetch2,
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load document 'null-data-doc': response data is not a valid object",
      )
    })
  })
})
