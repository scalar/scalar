import { setTimeout } from 'node:timers/promises'

import { consoleErrorSpy, resetConsoleSpies } from '@scalar/helpers/testing/console-spies'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import fastify, { type FastifyInstance } from 'fastify'
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { defaultReferenceConfig } from '@/schemas/reference-config'
import { createServerWorkspaceStore } from '@/server'

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
  const url = `http://localhost:${port}`

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
    await setTimeout(100)
  })

  it('correctly update workspace metadata', async () => {
    const store = createWorkspaceStore({
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
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.0.0',
        info: { title: 'My API' },
      },
      meta: {
        'x-scalar-active-auth': 'Bearer',
        'x-scalar-active-server': 'server-1',
      },
    })

    // Should update the active document
    store.updateDocument('active', 'x-scalar-active-server', 'server-2')
    store.updateDocument('active', 'x-scalar-active-auth', undefined)
    expect(store.workspace.documents['default']?.['x-scalar-active-auth']).toBe(undefined)
    expect(store.workspace.documents['default']?.['x-scalar-active-server']).toBe('server-2')

    // Should update a specific document
    store.updateDocument('default', 'x-scalar-active-server', 'server-3')
    store.updateDocument('default', 'x-scalar-active-auth', 'Bearer')
    expect(store.workspace.documents['default']?.['x-scalar-active-auth']).toBe('Bearer')
    expect(store.workspace.documents['default']?.['x-scalar-active-server']).toBe('server-3')
  })

  it('correctly get the correct document', async () => {
    const store = createWorkspaceStore({
      meta: {
        'x-scalar-active-document': 'default',
      },
    })

    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.0.0',
        info: { title: 'My API' },
      },
      meta: {
        'x-scalar-active-auth': 'Bearer',
        'x-scalar-active-server': 'server-1',
      },
    })

    await store.addDocument({
      name: 'document2',
      document: {
        openapi: '3.0.0',
        info: { title: 'Second API' },
      },
      meta: {
        'x-scalar-active-auth': 'Bearer',
        'x-scalar-active-server': 'server-1',
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
      'x-scalar-navigation': {
        'children': [],
        'id': 'default',
        'title': 'default',
        'type': 'document',
      },
      'x-original-oas-version': '3.0.0',
      'x-ext-urls': {},
      'x-scalar-original-document-hash': 'cb852d702f435acc04ac19ac9b9fcf96ed0679cd0f5d63444d4f0125c47d165d',
    })
  })

  it('correctly add new documents', async () => {
    const store = createWorkspaceStore()

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
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [],
      },
      'x-original-oas-version': '3.0.0',
      'x-ext-urls': {},
      'x-scalar-original-document-hash': 'cb852d702f435acc04ac19ac9b9fcf96ed0679cd0f5d63444d4f0125c47d165d',
    })
  })

  it('correctly resolve refs on the fly', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
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
    })

    expect(
      (store?.workspace?.activeDocument?.paths?.['/users']?.get as any)?.responses?.[200]?.content['application/json']
        .schema.items['$ref-value'].properties.name,
    ).toEqual({
      type: 'string',
      description: 'The user name',
    })
  })

  // TODO: See (1*) note
  it.skip('correctly resolve chunks from the remote server', async () => {
    server.get('/*', (req, res) => {
      const path = req.url
      const contents = serverStore.get(path)

      res.send(contents)
    })

    await server.listen({ port })

    const serverStore = await createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: url,
      documents: [
        {
          name: 'default',
          document: getDocument(),
        },
      ],
    })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: serverStore.getWorkspace().documents['default'] ?? {},
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users']?.get).toEqual({
      '$ref': 'http://localhost:9988/default/operations/~1users/get#',
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    // We expect the ref to have been resolved with the correct contents
    expect((store.workspace.activeDocument?.paths?.['/users']?.get as any)['$ref-value'].summary).toEqual(
      getDocument().paths['/users'].get.summary,
    )

    expect(
      (store.workspace.activeDocument?.paths?.['/users']?.get as any)['$ref-value']?.responses?.[200]?.content[
        'application/json'
      ]?.schema?.items['$ref-value']['$ref-value'],
    ).toEqual({
      ...getDocument().components.schemas.User,
    })
  })

  it('load files form the remote url', async () => {
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
    expect(store.workspace.documents['default']?.info?.title).toEqual(getDocument().info.title)

    // Add a new remote file
    await store.addDocument({ name: 'new', url: url })

    expect(Object.keys(store.workspace.documents)).toEqual(['default', 'new'])
    expect(store.workspace.documents['new']?.info?.title).toEqual(getDocument().info.title)
  })

  // TODO: handle server side preprocessed documents (nested refs)
  // Detailed explanation (1*)
  it.skip('handle circular references when we try to resolve all remote chunks recursively', async () => {
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
      baseUrl: url,
      documents: [
        {
          name: 'default',
          document: getDocument(),
        },
      ],
    })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: serverStore.getWorkspace().documents['default'] ?? {},
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users']?.get).toEqual({
      '$ref': `${url}/default/operations/~1users/get#`,
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    expect((store.workspace.activeDocument?.components?.schemas?.['User'] as any)['$ref-value'].type).toBe('object')
  })

  it('build the sidebar client side', async () => {
    const store = createWorkspaceStore()

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
                        '$ref': '#/components/schemas/Todo',
                        '$ref-value': {
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
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/todos',
            'method': 'get',
            'path': '/todos',
            'isDeprecated': false,
            'title': 'List all todos',
            ref: '#/paths/~1todos/get',
            type: 'operation',
          },
          {
            'children': [
              {
                'id': 'default/model/todo',
                'name': 'Todo',
                'title': 'Todo',
                ref: '#/components/schemas/Todo',
                type: 'model',
              },
            ],
            'id': 'default/models',
            'title': 'Models',
            'type': 'models',
            'name': 'Models',
          },
        ],
      },
      'x-original-oas-version': '3.0.3',
      'x-ext-urls': {},
      'x-scalar-original-document-hash': '0322930fc0a082f7d96959869c683ae5d1fe2815c3eedcce551283d338947eee',
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

  it('correctly get the config #2', async () => {
    const store = createWorkspaceStore({
      config: {
        'x-scalar-reference-config': {
          appearance: {
            css: 'body { background: #f0f0f0; }',
          },
        },
      },
    })

    await store.addDocument({
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

  it('bundles the document if the document is not preprocessed by the server-side-store', async () => {
    server.get('/', () => {
      return {
        get: {
          summary: 'Ping the remote server',
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      }
    })
    await server.listen({ port })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        paths: {
          '/ping': {
            $ref: url,
          },
        },
      },
    })

    expect(store.workspace.documents['default']).toEqual({
      info: {
        title: '',
        version: '',
      },
      openapi: '',
      paths: {
        '/ping': {
          '$ref-value': {
            get: {
              responses: {
                200: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                      },
                    },
                  },
                  description: 'Successful response',
                },
              },
              summary: 'Ping the remote server',
            },
          },
          '$ref': '#/x-ext/c766ed8',
        },
      },
      'x-ext': {
        'c766ed8': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
                description: 'Successful response',
              },
            },
            summary: 'Ping the remote server',
          },
        },
      },
      'x-ext-urls': {
        'c766ed8': 'http://localhost:9988',
      },
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [],
      },
      'x-scalar-original-document-hash': 'f6adcc0b8fa08674c990893905750d4f53f24a7b0f23d6292ccb676c7f09b0f0',
    })
  })

  it('correctly resolves any `externalValue` on the example object', async () => {
    server.get('/', () => ({ someKey: 'someValue' }))
    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        ...getDocument(),
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
                      examples: {
                        someExample: {
                          externalValue: `http://localhost:${port}`,
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
    })

    expect(store.workspace.documents['default']).toEqual({
      components: {
        schemas: {
          User: {
            properties: {
              email: {
                description: 'The user email',
                'format': 'email',
                'type': 'string',
              },
              id: {
                description: 'The user ID',
                type: 'string',
              },
              name: {
                description: 'The user name',
                type: 'string',
              },
            },
            type: 'object',
          },
        },
      },
      info: {
        title: 'My API',
        version: '1.0.0',
      },
      openapi: '3.1.1',
      paths: {
        '/users': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    examples: {
                      someExample: {
                        externalValue: 'http://localhost:9988',
                        value: {
                          someKey: 'someValue',
                        },
                      },
                    },
                    schema: {
                      items: {
                        $ref: '#/components/schemas/User',
                        '$ref-value': {
                          properties: {
                            email: {
                              description: 'The user email',
                              format: 'email',
                              type: 'string',
                            },
                            id: {
                              description: 'The user ID',
                              type: 'string',
                            },
                            name: {
                              description: 'The user name',
                              type: 'string',
                            },
                          },
                          type: 'object',
                        },
                      },
                      type: 'array',
                    },
                  },
                },
                description: 'Successful response',
              },
            },
            summary: 'Get all users',
          },
        },
      },
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/users',
            method: 'get',
            path: '/users',
            isDeprecated: false,
            ref: '#/paths/~1users/get',
            title: 'Get all users',
            type: 'operation',
            children: [
              {
                id: 'default/tag/default/get/users/example/someexample',
                name: 'someExample',
                title: 'someExample',
                type: 'example',
              },
            ],
          },
          {
            children: [
              {
                'id': 'default/model/user',
                name: 'User',
                ref: '#/components/schemas/User',
                title: 'User',
                type: 'model',
              },
            ],
            'id': 'default/models',
            title: 'Models',
            name: 'Models',
            type: 'models',
          },
        ],
      },
      'x-original-oas-version': '3.0.0',
      'x-ext-urls': {},
      'x-scalar-original-document-hash': 'a738325c6faa05a68c9f2c79e0de3781e274290936b1cd7941ee0b878c3c47ee',
    })
  })

  it('coerces internal references and validates the input', async () => {
    const client = createWorkspaceStore()

    await client.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.1',
        paths: {
          '/users': {
            get: {
              requestBody: {
                $ref: '#/$defs/usersRequestBody',
              },
            },
          },
        },
        $defs: {
          usersRequestBody: {
            description: 'Some description',
          },
        },
      },
    })

    expect(client.exportWorkspace()).toBe(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description","content":{}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"bf96489b1218b732451df97f5aa15ac410c4295228cead4d7b9b19cfd2fce93f","x-ext-urls":{},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description"}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description"}}}},"overrides":{"default":{}}}',
    )
  })

  it('coerces external values after it bundles them', async () => {
    server.get('/', () => ({ description: 'Some description' }))
    await server.listen({ port })

    const client = createWorkspaceStore()

    await client.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.1',
        paths: {
          '/users': {
            get: {
              requestBody: {
                $ref: url,
              },
            },
          },
        },
      },
    })

    expect(client.exportWorkspace()).toBe(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/x-ext/c766ed8"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"ec53082a1e5719600c17038b4092efcba79a68c8f16d47322d1d4a4aee568f6c","x-ext-urls":{"c766ed8":"http://localhost:9988"},"x-ext":{"c766ed8":{"description":"Some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"overrides":{"default":{}}}',
    )
  })

  it('coerces internal references and validates the input', async () => {
    const client = createWorkspaceStore()

    await client.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.1',
        paths: {
          '/users': {
            get: {
              requestBody: {
                $ref: '#/$defs/usersRequestBody',
              },
            },
          },
        },
        $defs: {
          usersRequestBody: {
            description: 'Some description',
          },
        },
      },
    })

    expect(client.exportWorkspace()).toBe(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description","content":{}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"bf96489b1218b732451df97f5aa15ac410c4295228cead4d7b9b19cfd2fce93f","x-ext-urls":{},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description"}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/$defs/usersRequestBody"}}}},"$defs":{"usersRequestBody":{"description":"Some description"}}}},"overrides":{"default":{}}}',
    )
  })

  it('coerces external values after it bundles them', async () => {
    server.get('/', () => ({ description: 'Some description' }))
    await server.listen({ port })

    const client = createWorkspaceStore()

    await client.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.1',
        paths: {
          '/users': {
            get: {
              requestBody: {
                $ref: url,
              },
            },
          },
        },
      },
    })

    expect(client.exportWorkspace()).toBe(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/x-ext/c766ed8"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"ec53082a1e5719600c17038b4092efcba79a68c8f16d47322d1d4a4aee568f6c","x-ext-urls":{"c766ed8":"http://localhost:9988"},"x-ext":{"c766ed8":{"description":"Some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"overrides":{"default":{}}}',
    )
  })

  it('ingress documents with circular references', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.0.1',
        info: {
          title: 'API with Circular Dependencies',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Base: {
              required: ['Type'],
              type: 'object',
              anyOf: [{ $ref: '#/components/schemas/Derived1' }, { $ref: '#/components/schemas/Derived2' }],
              discriminator: {
                propertyName: 'Type',
                mapping: {
                  Value1: '#/components/schemas/Derived1',
                  Value2: '#/components/schemas/Derived2',
                },
              },
            },
            Derived1: {
              properties: {
                Type: {
                  enum: ['Value1'],
                  type: 'string',
                },
              },
            },
            Derived2: {
              required: ['Ref'],
              properties: {
                Type: {
                  enum: ['Value2'],
                  type: 'string',
                },
                Ref: {
                  $ref: '#/components/schemas/Base',
                },
              },
            },
          },
        },
      },
    })

    expect(JSON.stringify(getRaw(store.workspace.activeDocument))).toBe(
      '{"openapi":"3.1.1","info":{"title":"API with Circular Dependencies","version":"1.0.0"},"components":{"schemas":{"Base":{"required":["Type"],"type":"object","anyOf":[{"$ref":"#/components/schemas/Derived1","__scalar_":""},{"$ref":"#/components/schemas/Derived2","__scalar_":""}],"discriminator":{"propertyName":"Type","mapping":{"Value1":"#/components/schemas/Derived1","Value2":"#/components/schemas/Derived2"}}},"Derived1":{"properties":{"Type":{"enum":["Value1"],"type":"string"}},"type":"object"},"Derived2":{"required":["Ref"],"properties":{"Type":{"enum":["Value2"],"type":"string"},"Ref":{"$ref":"#/components/schemas/Base","__scalar_":""}},"type":"object"}}},"x-original-oas-version":"3.0.1","x-scalar-original-document-hash":"2c4f60085abf9c2a68d8f5b44995674a2eceb751a40f0e7d6f1517b6f1b122e9","x-ext-urls":{},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/base","title":"Base","name":"Base","ref":"#/components/schemas/Base","type":"model"},{"id":"default/model/derived1","title":"Derived1","name":"Derived1","ref":"#/components/schemas/Derived1","type":"model"},{"id":"default/model/derived2","title":"Derived2","name":"Derived2","ref":"#/components/schemas/Derived2","type":"model"}]}]}}',
    )
  })

  it('another circular reference', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        components: {
          schemas: {
            JsonObject: {
              additionalProperties: {
                $ref: '#/components/schemas/JsonValue',
              },
              type: 'object',
            },
            JsonValue: {
              anyOf: [
                {
                  type: 'string',
                },
                {
                  type: 'number',
                  format: 'double',
                },
                {
                  type: 'boolean',
                },
                {
                  $ref: '#/components/schemas/JsonObject',
                },
              ],
            },
          },
        },
        paths: {
          '/get': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/JsonObject',
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

    expect(JSON.stringify(getRaw(store.workspace.activeDocument))).toBe(
      '{"openapi":"3.1.0","info":{"title":"Hello World","version":"1.0.0"},"components":{"schemas":{"JsonObject":{"additionalProperties":{"$ref":"#/components/schemas/JsonValue","__scalar_":""},"type":"object"},"JsonValue":{"anyOf":[{"type":"string"},{"type":"number","format":"double"},{"type":"boolean"},{"$ref":"#/components/schemas/JsonObject","__scalar_":""}],"__scalar_":""}}},"paths":{"/get":{"get":{"responses":{"200":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/JsonObject","__scalar_":""}}},"description":""}}}}},"x-original-oas-version":"3.1.0","x-scalar-original-document-hash":"304c546eded46fb6ab9a7e1a1d5cd68f98c49d1a089264671464b28f12094317","x-ext-urls":{},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/get","title":"/get","path":"/get","method":"get","ref":"#/paths/~1get/get","type":"operation","isDeprecated":false},{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/jsonobject","title":"JsonObject","name":"JsonObject","ref":"#/components/schemas/JsonObject","type":"model"},{"id":"default/model/jsonvalue","title":"JsonValue","name":"JsonValue","ref":"#/components/schemas/JsonValue","type":"model"}]}]}}',
    )
  })

  it('a third circular reference', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.0',
        paths: {
          '/test': {
            post: {
              operationId: 'post',
              parameters: [
                {
                  name: 'filter',
                  required: true,
                  in: 'query',
                  schema: {
                    $ref: '#/components/schemas/FilterSet',
                  },
                },
              ],
              responses: null,
            },
          },
        },
        info: {
          title: 'API Reference',
          description: 'API Reference',
          version: '1.0.0',
          contact: {},
        },
        tags: [],
        servers: [],
        components: {
          schemas: {
            FilterSet: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              id: 'FilterSet',
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  const: 'nested',
                },
                conjunction: {
                  type: 'string',
                  enum: ['and', 'or'],
                },
                conditions: {
                  type: 'array',
                  items: {
                    anyOf: [
                      {
                        anyOf: [
                          {
                            type: 'object',
                            properties: {
                              type: {
                                type: 'string',
                                const: 'single',
                              },
                              field: {
                                type: 'string',
                              },
                              operator: {
                                type: 'string',
                                enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'like', 'nlike'],
                              },
                              value: {
                                type: 'string',
                              },
                            },
                          },
                        ],
                      },
                      {
                        $ref: '#/components/schemas/FilterSet',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(JSON.stringify(getRaw(store.workspace.activeDocument))).toBe(
      '{"openapi":"3.1.0","paths":{"/test":{"post":{"operationId":"post","parameters":[{"name":"filter","required":true,"in":"query","schema":{"$ref":"#/components/schemas/FilterSet"}}],"responses":{}}}},"info":{"title":"API Reference","description":"API Reference","version":"1.0.0","contact":{}},"tags":[],"servers":[],"components":{"schemas":{"FilterSet":{"$schema":"https://json-schema.org/draft/2020-12/schema","id":"FilterSet","type":"object","properties":{"type":{"type":"string","const":"nested"},"conjunction":{"type":"string","enum":["and","or"]},"conditions":{"type":"array","items":{"anyOf":[{"anyOf":[{"type":"object","properties":{"type":{"type":"string","const":"single"},"field":{"type":"string"},"operator":{"type":"string","enum":["eq","ne","gt","lt","gte","lte","like","nlike"]},"value":{"type":"string"}}}]},{"$ref":"#/components/schemas/FilterSet"}]}}}}}},"x-original-oas-version":"3.1.0","x-scalar-original-document-hash":"dc00763e18f96067995fab0795a75a345ec3a857aefcef2078e38fc356adcfdc","x-ext-urls":{},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/description/introduction","title":"Introduction","type":"text"},{"id":"default/tag/default/post/test","title":"/test","path":"/test","method":"post","ref":"#/paths/~1test/post","type":"operation","isDeprecated":false},{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/filterset","title":"FilterSet","name":"FilterSet","ref":"#/components/schemas/FilterSet","type":"model"}]}]}}',
    )
  })

  it('clean up the document to support non-compliant documents', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        openapi: '3.1.1',
        info: {
          title: 'Missing Object Type Example',
          version: '1.0.0',
        },
        paths: {
          '/user': {
            get: {
              summary: 'Get user info',
              responses: {
                200: {
                  description: 'User object without explicit type: object',
                  content: {
                    'application/json': {
                      schema: {
                        items: {
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
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
    })

    expect(JSON.stringify(getRaw(store.workspace.activeDocument))).toEqual(
      '{"openapi":"3.1.1","info":{"title":"Missing Object Type Example","version":"1.0.0"},"paths":{"/user":{"get":{"summary":"Get user info","responses":{"200":{"description":"User object without explicit type: object","content":{"application/json":{"schema":{"items":{"properties":{"id":{"type":"string"},"name":{"type":"string"}},"type":"object"},"type":"array"}}}}}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"5ec917113f398c95826b5ed3834ead9e2b55073445382660cf34be39fa5e91dd","x-ext-urls":{},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/user","title":"Get user info","path":"/user","method":"get","ref":"#/paths/~1user/get","type":"operation","isDeprecated":false}]}}',
    )
  })

  it('should resolve relative references on the document correctly', async () => {
    server.get('/', () => ({
      openapi: '3.1.1',
      paths: {
        '/users': {
          get: {
            requestBody: {
              $ref: `${url}/a`,
            },
          },
        },
      },
    }))

    server.get('/a', () => ({
      description: 'Some description',
      content: {},
    }))
    await server.listen({ port })

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      url,
    })

    expect(store.exportWorkspace()).toEqual(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/x-ext/8fad302"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"20e33d47fdc0cc4782367e1c90b5abb266a2962b9200e37f78f9f00a0ac2e0cd","x-scalar-original-source-url":"http://localhost:9988","x-ext-urls":{"8fad302":"http://localhost:9988/a"},"x-ext":{"8fad302":{"description":"Some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]},"servers":[{"url":"http://localhost:9988"}]}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"overrides":{"default":{}}}',
    )

    await store.revertDocumentChanges('default')

    expect(store.exportWorkspace()).toEqual(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/x-ext/8fad302"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"20e33d47fdc0cc4782367e1c90b5abb266a2962b9200e37f78f9f00a0ac2e0cd","x-scalar-original-source-url":"http://localhost:9988","x-ext-urls":{"8fad302":"http://localhost:9988/a"},"x-ext":{"8fad302":{"description":"Some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]},"servers":[{"url":"http://localhost:9988"}]}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"overrides":{"default":{}}}',
    )

    await store.replaceDocument('default', getRaw(store.workspace.documents['default'] ?? {}))

    expect(store.exportWorkspace()).toEqual(
      '{"documents":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"#/x-ext/8fad302"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"20e33d47fdc0cc4782367e1c90b5abb266a2962b9200e37f78f9f00a0ac2e0cd","x-scalar-original-source-url":"http://localhost:9988","x-ext-urls":{"8fad302":"http://localhost:9988/a"},"x-ext":{"8fad302":{"description":"Some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"/users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false}]},"servers":[{"url":"http://localhost:9988"}]}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/users":{"get":{"requestBody":{"$ref":"http://localhost:9988/a"}}}}}},"overrides":{"default":{}}}',
    )
  })

  it('uses the fetcher to resolve external refs', async () => {
    const fn = vi.fn()

    server.get('/', () => {
      return {
        paths: {
          '/users': {
            get: {
              $ref: '/path',
            },
          },
        },
      }
    })

    server.get('/path', () => {
      return {
        summary: 'User path',
      }
    })

    await server.listen({ port })

    const customFetch = async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      fn(input, init)
      return fetch(input, init)
    }

    const client = createWorkspaceStore()

    await client.addDocument({
      name: 'default',
      url: url,
      fetch: customFetch,
    })

    expect(client.workspace.documents['default']).toEqual({
      'info': {
        'title': '',
        'version': '',
      },
      'openapi': '',
      'paths': {
        '/users': {
          'get': {
            '$ref': '#/x-ext/a327830',
            '$ref-value': {
              'summary': 'User path',
            },
          },
        },
      },
      'servers': [
        {
          'description': undefined,
          'url': 'http://localhost:9988',
          'variables': undefined,
        },
      ],
      'x-ext': {
        'a327830': {
          'summary': 'User path',
        },
      },
      'x-ext-urls': {
        'a327830': 'http://localhost:9988/path',
      },
      'x-original-oas-version': undefined,
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/users',
            'method': 'get',
            'path': '/users',
            'isDeprecated': false,
            'ref': '#/paths/~1users/get',
            'title': 'User path',
            'type': 'operation',
          },
        ],
      },
      'x-scalar-original-document-hash': 'c7ea23b57be29dab8975a695146f0c97d948db8addbd4bbc162597e5ae72dc83',
      'x-scalar-original-source-url': 'http://localhost:9988',
    })

    expect(fn).toBeCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, url, { headers: undefined })
    expect(fn).toHaveBeenNthCalledWith(2, `${url}/path`, { headers: undefined })
  })

  it('uses workspace fetcher to resolve documents if not specified per document', async () => {
    const fn = vi.fn()

    server.get('/', () => {
      return {
        paths: {
          '/users': {
            get: {
              $ref: '/path',
            },
          },
        },
      }
    })

    server.get('/path', () => {
      return {
        summary: 'User path',
      }
    })

    await server.listen({ port })

    const customFetch = async (input: string | URL | globalThis.Request, init?: RequestInit) => {
      fn(input, init)
      return fetch(input, init)
    }

    const client = createWorkspaceStore({
      fetch: customFetch,
    })

    await client.addDocument({
      name: 'default',
      url: url,
    })

    expect(client.workspace.documents['default']).toEqual({
      'info': {
        'title': '',
        'version': '',
      },
      'openapi': '',
      'paths': {
        '/users': {
          'get': {
            '$ref': '#/x-ext/a327830',
            '$ref-value': {
              'summary': 'User path',
            },
          },
        },
      },
      'servers': [
        {
          'description': undefined,
          'url': 'http://localhost:9988',
          'variables': undefined,
        },
      ],
      'x-ext': {
        'a327830': {
          'summary': 'User path',
        },
      },
      'x-original-oas-version': undefined,
      'x-ext-urls': {
        'a327830': 'http://localhost:9988/path',
      },
      'x-scalar-navigation': {
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/users',
            'method': 'get',
            'isDeprecated': false,
            'path': '/users',
            'ref': '#/paths/~1users/get',
            'title': 'User path',
            'type': 'operation',
          },
        ],
      },
      'x-scalar-original-document-hash': 'c7ea23b57be29dab8975a695146f0c97d948db8addbd4bbc162597e5ae72dc83',
      'x-scalar-original-source-url': 'http://localhost:9988',
    })

    expect(fn).toBeCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, url, { headers: undefined })
    expect(fn).toHaveBeenNthCalledWith(2, `${url}/path`, { headers: undefined })
  })

  it('add the original oas version on the consuming document #1', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        'swagger': '2.0',
        'info': {
          'version': '1.0.0',
          'title': 'Minimal API',
        },
        'host': 'api.example.com',
        'basePath': '/v1',
        'schemes': ['https'],
        'paths': {
          '/ping': {
            'get': {
              'summary': 'Ping',
              'description': 'Health check endpoint',
              'produces': ['application/json'],
              'responses': {
                '200': {
                  'description': 'Pong response',
                  'schema': {
                    'type': 'object',
                    'properties': {
                      'message': { 'type': 'string', 'example': 'pong' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(store.workspace.activeDocument?.['x-original-oas-version']).toBe('2.0')
  })

  it('add the original oas version on the consuming document #2', async () => {
    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: {
        'openapi': '3.0.0',
        'info': {
          'version': '1.0.0',
          'title': 'Minimal API',
        },
        'servers': [{ 'url': 'https://api.example.com/v1' }],
        'paths': {
          '/ping': {
            'get': {
              'summary': 'Ping',
              'description': 'Health check endpoint',
              'responses': {
                '200': {
                  'description': 'Pong response',
                  'content': {
                    'application/json': {
                      'schema': {
                        'type': 'object',
                        'properties': {
                          'message': { 'type': 'string', 'example': 'pong' },
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
    })

    expect(store.workspace.activeDocument?.['x-original-oas-version']).toBe('3.0.0')
  })

  describe('download original document', () => {
    it('gets the original document from the store json', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'api-1',
        document: {
          info: { title: 'My API', version: '1.0.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-2',
        document: {
          info: { title: 'My API 2', version: '1.2.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-3',
        document: getDocument(),
      })

      expect(store.exportDocument('api-1', 'json', true)).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json', true)).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-3', 'json', true)).toBe(
        '{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}',
      )
    })

    it('gets the original document from the store yaml', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'api-1',
        document: {
          info: { title: 'My API', version: '1.0.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-2',
        document: {
          info: { title: 'My API 2', version: '1.2.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-3',
        document: getDocument(),
      })

      expect(store.exportDocument('api-1', 'yaml')).toBe('info:\n  title: My API\n  version: 1.0.0\nopenapi: 3.1.1\n')

      expect(store.exportDocument('api-2', 'yaml')).toBe('info:\n  title: My API 2\n  version: 1.2.0\nopenapi: 3.1.1\n')

      expect(store.exportDocument('api-3', 'yaml')).toBe(
        `openapi: 3.0.0\ninfo:\n  title: My API\n  version: 1.0.0\ncomponents:\n  schemas:\n    User:\n      type: object\n      properties:\n        id:\n          type: string\n          description: The user ID\n        name:\n          type: string\n          description: The user name\n        email:\n          type: string\n          format: email\n          description: The user email\npaths:\n  /users:\n    get:\n      summary: Get all users\n      responses:\n        "200":\n          description: Successful response\n          content:\n            application/json:\n              schema:\n                type: array\n                items:\n                  $ref: "#/components/schemas/User"\n`,
      )
    })
  })

  describe('save document', () => {
    it('writes back to the original document', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'api-1',
        document: {
          info: { title: 'My API', version: '1.0.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-2',
        document: {
          info: { title: 'My API 2', version: '1.2.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-3',
        document: getDocument(),
      })

      if (store.workspace.documents['api-3']?.info?.title) {
        store.workspace.documents['api-3'].info.title = 'Updated API'
      }

      // Write the changes back to the original document
      await store.saveDocument('api-3')

      // Should return the original document without any modifications
      expect(store.exportDocument('api-1', 'json', true)).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json', true)).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      // Should return the updated document without any extensions
      expect(store.exportDocument('api-3', 'json', true)).toEqual(
        '{"openapi":"3.1.1","info":{"title":"Updated API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"9f9099f27952ac0b22b19c0cf5c6fcce84c8417a6887e39daa4ba31756bde3f5"}',
      )
    })

    it('does not write back external bundled documents', async () => {
      const document = getDocument()

      server.get('/*', () => {
        return { description: 'This is an external document' }
      })

      await server.listen({ port })

      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          ...document,
          paths: {
            ...document.paths,
            '/external': {
              get: {
                $ref: url,
              },
            },
          },
        },
      })

      if (store.workspace.activeDocument?.info?.title) {
        store.workspace.activeDocument.info.title = 'Updated API'
      }

      // Write the changes back to the original document
      await store.saveDocument('default')

      // Should return the updated document without any extensions
      expect(store.exportDocument('default', 'json', true)).toEqual(
        '{"openapi":"3.1.1","info":{"title":"Updated API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"1406a0a6639a38f308a60dfc7f952398cfa07d72c7d877735be44a36674204a1"}',
      )
    })

    it('does detect changes on the refs and write them back', async () => {
      const store = createWorkspaceStore()

      server.get('/', () => {
        return { description: 'This is an external document' }
      })

      server.get('/some-other-path', () => {
        return { description: 'New content' }
      })

      await server.listen({ port })

      const document = getDocument()

      await store.addDocument({
        name: 'default',
        document: {
          ...document,
          paths: {
            ...document.paths,
            '/external': {
              get: {
                $ref: url,
              },
            },
          },
        },
      })

      expect(store.exportWorkspace()).toEqual(
        '{"documents":{"default":{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"#/x-ext/c766ed8"}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"1406a0a6639a38f308a60dfc7f952398cfa07d72c7d877735be44a36674204a1","x-ext-urls":{"c766ed8":"http://localhost:9988"},"x-ext":{"c766ed8":{"description":"This is an external document"}},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"Get all users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false},{"id":"default/tag/default/get/external","title":"/external","path":"/external","method":"get","ref":"#/paths/~1external/get","type":"operation","isDeprecated":false},{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/user","title":"User","name":"User","ref":"#/components/schemas/User","type":"model"}]}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}}}},"intermediateDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}}}},"overrides":{"default":{}}}',
      )

      await store.replaceDocument('default', {
        ...document,
        paths: {
          ...document.paths,
          '/external': {
            get: {
              $ref: `${url}/some-other-path`,
            },
          },
        },
      })

      expect(store.exportWorkspace()).toEqual(
        '{"documents":{"default":{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"#/x-ext/29442af"}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"1406a0a6639a38f308a60dfc7f952398cfa07d72c7d877735be44a36674204a1","x-ext-urls":{"29442af":"http://localhost:9988/some-other-path"},"x-ext":{"29442af":{"description":"New content"}},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"Get all users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false},{"id":"default/tag/default/get/external","title":"/external","path":"/external","method":"get","ref":"#/paths/~1external/get","type":"operation","isDeprecated":false},{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/user","title":"User","name":"User","ref":"#/components/schemas/User","type":"model"}]}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}}}},"intermediateDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}},"/external":{"get":{"$ref":"http://localhost:9988"}}}}},"overrides":{"default":{}}}',
      )
    })
  })

  describe('revert', () => {
    it('should revert the changes made to the document', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'api-1',
        document: {
          info: { title: 'My API', version: '1.0.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-2',
        document: {
          info: { title: 'My API 2', version: '1.2.0' },
          openapi: '3.1.1',
        },
      })
      await store.addDocument({
        name: 'api-3',
        document: getDocument(),
      })

      if (store.workspace.documents['api-3']?.info?.title) {
        store.workspace.documents['api-3'].info.title = 'Updated API'
      }

      expect(store.workspace?.documents['api-3']?.info?.title).toBe('Updated API')

      // Revert the changes
      await store.revertDocumentChanges('api-3')

      // Should return the original document without any modifications
      expect(store.exportDocument('api-1', 'json', true)).toBe(
        '{"info":{"title":"My API","version":"1.0.0"},"openapi":"3.1.1"}',
      )

      expect(store.exportDocument('api-2', 'json', true)).toBe(
        '{"info":{"title":"My API 2","version":"1.2.0"},"openapi":"3.1.1"}',
      )

      // Should return the updated document without any extensions
      expect(store.exportDocument('api-3', 'json', true)).toEqual(
        '{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}',
      )
    })
  })

  describe('export', () => {
    it('should export the workspace internal state as a json document', async () => {
      const store = createWorkspaceStore({
        meta: {
          'x-scalar-active-document': 'default',
          'x-scalar-dark-mode': true,
          'x-scalar-default-client': 'c/libcurl',
          'x-scalar-theme': 'saturn',
        },
      })
      await store.addDocument({
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
      })

      await store.addDocument({
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
          'documents': {
            'default': {
              'openapi': '3.1.1',
              'info': { 'title': 'My API', 'version': '1.0.0' },
              'x-scalar-active-server': 'server-1',
              'x-original-oas-version': '3.0.0',
              'x-scalar-original-document-hash': '6f8cf7f2a5b6e1643c8011e47891b494dd5ef6e5b1095688625b15b1cead6fb9',
              'x-ext-urls': {},
              'x-scalar-navigation': { 'id': 'default', 'type': 'document', 'title': 'default', 'children': [] },
            },
            'pet-store': {
              'openapi': '3.1.1',
              'info': { 'title': 'Pet Store API', 'version': '1.0.0' },
              'paths': { '/users': { 'get': { 'description': 'Get all users' } } },
              'x-original-oas-version': '3.0.0',
              'x-scalar-original-document-hash': '12c530a88762ba2d5b05d2ba31dbf193cb602d73091b2ddbb62bbea68fc65474',
              'x-ext-urls': {},
              'x-scalar-navigation': {
                'id': 'pet-store',
                'type': 'document',
                'title': 'pet-store',
                'children': [
                  {
                    'id': 'pet-store/tag/default/get/users',
                    'title': '/users',
                    'path': '/users',
                    'method': 'get',
                    'ref': '#/paths/~1users/get',
                    'type': 'operation',
                    'isDeprecated': false,
                  },
                ],
              },
            },
          },
          'meta': {
            'x-scalar-active-document': 'default',
            'x-scalar-dark-mode': true,
            'x-scalar-default-client': 'c/libcurl',
            'x-scalar-theme': 'saturn',
          },
          'documentConfigs': {
            'default': { 'x-scalar-reference-config': { 'features': { 'showModels': false, 'showDownload': false } } },
            'pet-store': {},
          },
          'originalDocuments': {
            'default': { 'openapi': '3.0.0', 'info': { 'title': 'My API', 'version': '1.0.0' } },
            'pet-store': {
              'openapi': '3.0.0',
              'info': { 'title': 'Pet Store API', 'version': '1.0.0' },
              'paths': { '/users': { 'get': { 'description': 'Get all users' } } },
            },
          },
          'intermediateDocuments': {
            'default': { 'openapi': '3.0.0', 'info': { 'title': 'My API', 'version': '1.0.0' } },
            'pet-store': {
              'openapi': '3.0.0',
              'info': { 'title': 'Pet Store API', 'version': '1.0.0' },
              'paths': { '/users': { 'get': { 'description': 'Get all users' } } },
            },
          },
          'overrides': { 'default': {}, 'pet-store': {} },
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
              'x-scalar-navigation': {
                type: 'document',
                id: 'default',
                title: 'default',
                children: [],
              },
              'x-scalar-active-server': 'server-1',
              'x-scalar-original-document-hash': '',
            },
            'pet-store': {
              openapi: '3.1.1',
              info: { title: 'Pet Store API', version: '1.0.0' },
              paths: { '/users': { get: { description: 'Get all users' } } },
              'x-scalar-navigation': {
                type: 'document',
                id: 'pet-store',
                title: 'pet-store',
                children: [
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
              'x-scalar-original-document-hash': '',
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
        'x-scalar-navigation': {
          type: 'document',
          id: 'default',
          title: 'default',
          children: [],
        },
        'x-scalar-active-server': 'server-1',
        'x-scalar-original-document-hash': '',
      })

      expect(store.config['x-scalar-reference-config'].features.showModels).toBe(false)
      expect(store.config['x-scalar-reference-config'].features.showDownload).toBe(false)

      expect(store.workspace.documents).toEqual({
        default: {
          openapi: '3.1.1',
          info: { title: 'My API', version: '1.0.0' },
          'x-scalar-navigation': {
            type: 'document',
            id: 'default',
            title: 'default',
            children: [],
          },
          'x-scalar-active-server': 'server-1',
          'x-scalar-original-document-hash': '',
        },
        'pet-store': {
          openapi: '3.1.1',
          info: { title: 'Pet Store API', version: '1.0.0' },
          paths: { '/users': { get: { description: 'Get all users' } } },
          'x-scalar-navigation': {
            type: 'document',
            id: 'pet-store',
            title: 'pet-store',
            children: [
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
          'x-scalar-original-document-hash': '',
        },
      })

      expect(store.workspace['x-scalar-theme']).toBe('saturn')
      expect(store.workspace['x-scalar-dark-mode']).toBe(true)
      expect(store.workspace['x-scalar-active-document']).toBe('default')
      expect(store.workspace['x-scalar-default-client']).toBe('c/libcurl')
    })
  })

  describe('override documents', () => {
    it('override documents with new content', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        },
        overrides: {
          openapi: '3.1.1',
          info: { title: 'My Updated API', version: '2.0.0' },
        },
      })

      expect(store.workspace.documents['default']?.info?.title).toBe('My Updated API')
      expect(store.workspace.documents['default']?.info?.version).toBe('2.0.0')
      expect(store.workspace.documents['default']?.openapi).toBe('3.1.1')
    })

    it('edit the override values', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        },
        overrides: {
          openapi: '3.1.1',
          info: { title: 'My Updated API', version: '2.0.0' },
        },
      })

      const defaultDocument = store.workspace.documents['default']

      if (!defaultDocument) {
        throw new Error('Default document not found')
      }

      defaultDocument.info.title = 'Edited title'

      expect(defaultDocument.info.title).toBe('Edited title')
      expect(defaultDocument.info.version).toBe('2.0.0')
      expect(defaultDocument.openapi).toBe('3.1.1')
    })

    it('does not write back the overrides to the intermediate object', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        },
        overrides: {
          openapi: '3.1.1',
          info: { title: 'My Updated API', version: '2.0.0' },
        },
      })

      const defaultDocument = store.workspace.documents['default']

      if (!defaultDocument) {
        throw new Error('Default document not found')
      }

      defaultDocument.info.title = 'Edited title'

      expect(defaultDocument.info.title).toBe('Edited title')
      expect(defaultDocument.info.version).toBe('2.0.0')
      expect(defaultDocument.openapi).toBe('3.1.1')

      await store.saveDocument('default')
      expect(store.exportDocument('default', 'json', true)).toBe(
        '{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"6f8cf7f2a5b6e1643c8011e47891b494dd5ef6e5b1095688625b15b1cead6fb9"}',
      )
    })

    it('should preserve overrides when exporting and reloading the workspace', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        },
        overrides: {
          openapi: '3.1.1',
          info: { title: 'My Updated API', version: '2.0.0' },
        },
      })

      const defaultDocument = store.workspace.documents['default']

      if (!defaultDocument) {
        throw new Error('Default document not found')
      }

      defaultDocument.info.title = 'Edited title'

      expect(defaultDocument.info.title).toBe('Edited title')
      expect(defaultDocument.info.version).toBe('2.0.0')
      expect(defaultDocument.openapi).toBe('3.1.1')

      await store.saveDocument('default')
      const exported = store.exportWorkspace()

      // Create a new store and load the exported workspace
      const newStore = createWorkspaceStore()
      newStore.loadWorkspace(exported)

      expect(newStore.workspace.documents['default']?.info.title).toBe('Edited title')
      expect(newStore.workspace.documents['default']?.info.version).toBe('2.0.0')
      expect(newStore.workspace.documents['default']?.openapi).toBe('3.1.1')
    })

    it('revert should never change the overrides fields', async () => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: { title: 'My API', version: '1.0.0' },
        },
        overrides: {
          openapi: '3.1.1',
          info: { title: 'My Updated API', version: '2.0.0' },
        },
      })

      const defaultDocument = store.workspace.documents['default']

      if (!defaultDocument) {
        throw new Error('Default document not found')
      }

      defaultDocument.info.title = 'Edited title'

      expect(defaultDocument.info.title).toBe('Edited title')
      expect(defaultDocument.info.version).toBe('2.0.0')
      expect(defaultDocument.openapi).toBe('3.1.1')

      // Revert the changes
      await store.revertDocumentChanges('default')

      expect(defaultDocument.info.title).toBe('Edited title')
      expect(defaultDocument.info.version).toBe('2.0.0')
      expect(defaultDocument.openapi).toBe('3.1.1')
    })

    it('correctly reverts back the document while preserving external references', async () => {
      server.get('/', () => ({
        description: 'some description',
      }))
      server.get('/a', () => ({
        description: 'updated',
      }))
      await server.listen({ port })

      const store = createWorkspaceStore()

      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.1.1',
          paths: {
            '/': {
              get: {
                requestBody: {
                  $ref: url,
                },
              },
            },
          },
        },
      })

      expect(store.exportWorkspace()).toBe(
        '{"documents":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"#/x-ext/c766ed8"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"538e5c81ef5541b8ec5024c193bc1f94275ce5ab284328661673e9d1661ecf29","x-ext-urls":{"c766ed8":"http://localhost:9988"},"x-ext":{"c766ed8":{"description":"some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/","title":"/","path":"/","method":"get","ref":"#/paths/~1/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"overrides":{"default":{}}}',
      )

      await store.replaceDocument('default', {
        openapi: '3.1.1',
        paths: {
          '/': {
            get: {
              requestBody: {
                $ref: `${url}/a`,
              },
            },
          },
        },
      })
      expect(store.exportWorkspace()).toBe(
        '{"documents":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"#/x-ext/8fad302"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"538e5c81ef5541b8ec5024c193bc1f94275ce5ab284328661673e9d1661ecf29","x-ext-urls":{"8fad302":"http://localhost:9988/a"},"x-ext":{"8fad302":{"description":"updated","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/","title":"/","path":"/","method":"get","ref":"#/paths/~1/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"overrides":{"default":{}}}',
      )

      await store.revertDocumentChanges('default')

      expect(store.exportWorkspace()).toBe(
        '{"documents":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"#/x-ext/c766ed8"}}}},"x-original-oas-version":"3.1.1","x-scalar-original-document-hash":"538e5c81ef5541b8ec5024c193bc1f94275ce5ab284328661673e9d1661ecf29","x-ext-urls":{"c766ed8":"http://localhost:9988"},"x-ext":{"c766ed8":{"description":"some description","content":{}}},"info":{"title":"","version":""},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/","title":"/","path":"/","method":"get","ref":"#/paths/~1/get","type":"operation","isDeprecated":false}]}}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"intermediateDocuments":{"default":{"openapi":"3.1.1","paths":{"/":{"get":{"requestBody":{"$ref":"http://localhost:9988"}}}}}},"overrides":{"default":{}}}',
      )
    })
  })

  describe('importWorkspaceFromSpecification', () => {
    let server: FastifyInstance
    const port = 9989

    const url = `http://localhost:${port}`

    beforeEach(() => {
      server = fastify({ logger: false })
    })

    afterEach(async () => {
      await server.close()
      await setTimeout(100)
    })

    it('should create a workspace from a specification file', async () => {
      server.get('/default', () => {
        return getDocument()
      })
      await server.listen({ port })

      const store = createWorkspaceStore()
      await store.importWorkspaceFromSpecification({
        info: {
          title: 'Scalar Workspace',
        },
        workspace: 'draft',
        documents: {
          'default': {
            $ref: `${url}/default`,
          },
        },
      })

      expect(store.exportWorkspace()).toBe(
        '{"documents":{"default":{"openapi":"3.1.1","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"9f9099f27952ac0b22b19c0cf5c6fcce84c8417a6887e39daa4ba31756bde3f5","x-scalar-original-source-url":"http://localhost:9989/default","x-ext-urls":{},"x-scalar-navigation":{"id":"default","type":"document","title":"default","children":[{"id":"default/tag/default/get/users","title":"Get all users","path":"/users","method":"get","ref":"#/paths/~1users/get","type":"operation","isDeprecated":false},{"type":"models","id":"default/models","title":"Models","name":"Models","children":[{"id":"default/model/user","title":"User","name":"User","ref":"#/components/schemas/User","type":"model"}]}]},"servers":[{"url":"http://localhost:9989"}]}},"meta":{},"documentConfigs":{"default":{}},"originalDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}},"intermediateDocuments":{"default":{"openapi":"3.0.0","info":{"title":"My API","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}}}},"overrides":{"default":{}}}',
      )
    })

    it('should add the overrides to the workspace when we import from the specifications', async () => {
      server.get('/default', () => {
        return getDocument()
      })
      await server.listen({ port })

      const store = createWorkspaceStore()
      await store.importWorkspaceFromSpecification({
        info: {
          title: 'Scalar Workspace',
        },
        workspace: 'draft',
        documents: {
          'default': {
            $ref: `${url}/default`,
          },
        },
        overrides: {
          default: {
            openapi: '3.1.1',
            info: { title: 'My Updated API', version: '2.0.0' },
          },
        },
      })

      expect(store.workspace.documents['default']?.info.title).toBe('My Updated API')
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

    it('allows relative urls', async () => {
      const store = createWorkspaceStore()

      // We don not care about the response, we just want to make sure the fetch is called
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      })

      await store.addDocument({
        name: 'relative-doc',
        url: 'examples/openapi.json',
        fetch: mockFetch,
      })

      expect(mockFetch).toHaveBeenCalledWith('examples/openapi.json', { headers: undefined })
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

  describe('replaceDocument', () => {
    // TODO: here check why models are not generated
    it('should replace the document with the new provided document', async () => {
      const store = createWorkspaceStore()

      await store.addDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: {
            title: 'My API',
            version: '1.0.0',
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
          components: {
            schemas: {
              User: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'The user ID' },
                  name: { type: 'string', description: 'The user name' },
                  email: { type: 'string', format: 'email', description: 'The user email' },
                },
              },
            },
          },
        },
      })

      expect(store.workspace.documents['default']).toEqual({
        'openapi': '3.1.1',
        'info': { 'title': 'My API', 'version': '1.0.0' },
        'paths': {
          '/users': {
            'get': {
              'summary': 'Get all users',
              'responses': {
                '200': {
                  'description': 'Successful response',
                  'content': {
                    'application/json': {
                      'schema': {
                        'type': 'array',
                        'items': {
                          '$ref': '#/components/schemas/User',
                          '$ref-value': {
                            'type': 'object',
                            'properties': {
                              'id': { 'type': 'string', 'description': 'The user ID' },
                              'name': { 'type': 'string', 'description': 'The user name' },
                              'email': { 'type': 'string', 'format': 'email', 'description': 'The user email' },
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
        'components': {
          'schemas': {
            'User': {
              'type': 'object',
              'properties': {
                'id': { 'type': 'string', 'description': 'The user ID' },
                'name': { 'type': 'string', 'description': 'The user name' },
                'email': { 'type': 'string', 'format': 'email', 'description': 'The user email' },
              },
            },
          },
        },
        'x-original-oas-version': '3.0.0',
        'x-ext-urls': {},
        'x-scalar-navigation': {
          type: 'document',
          id: 'default',
          title: 'default',
          children: [
            {
              'id': 'default/tag/default/get/users',
              'title': 'Get all users',
              'isDeprecated': false,
              'path': '/users',
              'method': 'get',
              'ref': '#/paths/~1users/get',
              'type': 'operation',
            },
            {
              'id': 'default/models',
              'name': 'Models',
              'title': 'Models',
              'children': [
                {
                  'id': 'default/model/user',
                  'title': 'User',
                  'name': 'User',
                  'ref': '#/components/schemas/User',
                  'type': 'model',
                },
              ],
              'type': 'models',
            },
          ],
        },
        'x-scalar-original-document-hash': '283d6bd0b5e08369e55003cbb93d2862c38d57b9c12d45c5a672224dc43e1281',
      })

      await store.replaceDocument('default', {
        openapi: '3.0.0',
        info: {
          title: 'Updated API',
          version: '1.0.0',
        },
        paths: {
          '/users-v2': {
            get: {
              summary: 'Get all users',
              responses: {
                '200': {
                  description: 'This is an updated description',
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
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Updated user id schema description' },
                name: { type: 'string', description: 'The user name' },
                email: { type: 'string', format: 'email', description: 'The user email' },
              },
            },
          },
        },
      })

      // Should still preserve the generated navigation and upgrade the document to the latest when we try to replace it
      expect(store.workspace.documents['default']).toEqual({
        components: {
          schemas: {
            User: {
              properties: {
                email: {
                  description: 'The user email',
                  format: 'email',
                  type: 'string',
                },
                id: {
                  description: 'Updated user id schema description',
                  type: 'string',
                },
                name: {
                  description: 'The user name',
                  type: 'string',
                },
              },
              type: 'object',
            },
          },
        },
        info: {
          title: 'Updated API',
          version: '1.0.0',
        },
        openapi: '3.1.1',
        paths: {
          '/users-v2': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        items: {
                          '$ref': '#/components/schemas/User',
                          '$ref-value': {
                            properties: {
                              email: {
                                description: 'The user email',
                                format: 'email',
                                type: 'string',
                              },
                              id: {
                                description: 'Updated user id schema description',
                                type: 'string',
                              },
                              name: {
                                description: 'The user name',
                                type: 'string',
                              },
                            },
                            type: 'object',
                          },
                        },
                        type: 'array',
                      },
                    },
                  },
                  description: 'This is an updated description',
                },
              },
              summary: 'Get all users',
            },
          },
        },
        'x-ext-urls': {},
        'x-original-oas-version': '3.0.0',
        'x-scalar-active-auth': undefined,
        'x-scalar-active-server': undefined,
        'x-scalar-navigation': {
          type: 'document',
          id: 'default',
          title: 'default',
          children: [
            {
              id: 'default/tag/default/get/users-v2',
              method: 'get',
              path: '/users-v2',
              isDeprecated: false,
              ref: '#/paths/~1users-v2/get',
              title: 'Get all users',
              type: 'operation',
            },
            {
              children: [
                {
                  'id': 'default/model/user',
                  name: 'User',
                  ref: '#/components/schemas/User',
                  title: 'User',
                  type: 'model',
                },
              ],
              id: 'default/models',
              title: 'Models',
              name: 'Models',
              type: 'models',
            },
          ],
        },
        'x-scalar-original-document-hash': '283d6bd0b5e08369e55003cbb93d2862c38d57b9c12d45c5a672224dc43e1281',
      })
    })

    it('should log a warning if the document does not exist', () => {
      const store = createWorkspaceStore()

      // Spy on console.warn
      void store.replaceDocument('non-existing', {
        openapi: '3.0.0',
        info: {
          title: 'My API',
          version: '1.0.0',
        },
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith("Document 'non-existing' does not exist in the workspace.")
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('does persist document configuration when adding a new document and replacing the old one', async () => {
      const store = createWorkspaceStore()

      await store.addDocument({
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
            settings: {
              servers: [{ url: 'http://some-custom-server.com' }],
            },
          },
        },
      })

      await store.addDocument({
        name: 'pet-store',
        document: {
          openapi: '3.0.0',
          info: {
            title: 'Pet Store API',
            version: '1.0.0',
          },
        },
        config: {
          'x-scalar-reference-config': {
            settings: {
              servers: [{ url: 'http://pet-store-server.com' }],
            },
          },
        },
      })

      await store.replaceDocument('default', {
        openapi: '3.0.0',
        info: {
          title: 'My Updated API',
          version: '2.0.0',
        },
      })

      expect(store.workspace.documents.default?.servers).toEqual([{ url: 'http://some-custom-server.com' }])
    })
  })

  describe('rebaseDocument', () => {
    it('should correctly return all conflicts when we try to rebase with a new origin', async () => {
      const documentName = 'default'
      const store = createWorkspaceStore()
      await store.addDocument({
        name: documentName,
        document: getDocument(),
      })

      store.workspace.activeDocument!.info.title = 'new title'
      await store.saveDocument(documentName)

      const result = await store.rebaseDocument({
        document: {
          ...getDocument(),
          info: { title: 'A new title which should conflict', version: '1.0.0' },
        },
        name: documentName,
      })

      assert(result)

      expect(result.conflicts).toEqual([
        [
          [
            {
              changes: 'A new title which should conflict',
              path: ['info', 'title'],
              type: 'update',
            },
          ],
          [
            {
              changes: 'new title',
              path: ['info', 'title'],
              type: 'update',
            },
          ],
        ],
      ])
    })

    it('should apply the changes when there are conflicts but we have a resolved conflicts array provided', async () => {
      const documentName = 'default'
      const store = createWorkspaceStore()
      await store.addDocument({
        name: documentName,
        document: getDocument(),
      })

      store.workspace.activeDocument!.info.title = 'new title'
      await store.saveDocument(documentName)

      const newDocument = {
        ...getDocument(),
        info: { title: 'A new title which should conflict', version: '1.0.0' },
      }

      const result = await store.rebaseDocument({ name: documentName, document: newDocument })

      assert(result)

      expect(result.conflicts).toEqual([
        [
          [
            {
              changes: 'A new title which should conflict',
              path: ['info', 'title'],
              type: 'update',
            },
          ],
          [
            {
              changes: 'new title',
              path: ['info', 'title'],
              type: 'update',
            },
          ],
        ],
      ])

      // Expect the original
      expect(store.exportDocument(documentName, 'json', true)).toEqual(
        '{"openapi":"3.1.1","info":{"title":"new title","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"9f9099f27952ac0b22b19c0cf5c6fcce84c8417a6887e39daa4ba31756bde3f5"}',
      )

      // Apply the resolved changes (we choose the incoming changes in this case)
      await result.applyChanges(result.conflicts.flatMap((it) => it[0]))

      // Check if the new intermediate document is correct
      expect(store.exportDocument(documentName, 'json', true)).toEqual(
        '{"openapi":"3.1.1","info":{"title":"A new title which should conflict","version":"1.0.0"},"components":{"schemas":{"User":{"type":"object","properties":{"id":{"type":"string","description":"The user ID"},"name":{"type":"string","description":"The user name"},"email":{"type":"string","format":"email","description":"The user email"}}}}},"paths":{"/users":{"get":{"summary":"Get all users","responses":{"200":{"description":"Successful response","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/User"}}}}}}}}},"x-original-oas-version":"3.0.0","x-scalar-original-document-hash":"9f9099f27952ac0b22b19c0cf5c6fcce84c8417a6887e39daa4ba31756bde3f5"}',
      )

      expect(store.workspace.activeDocument?.info.title).toEqual('A new title which should conflict')
    })

    it('should override conflicting changes made to the active document while we are rebasing with a new origin', async () => {
      const documentName = 'default'
      const store = createWorkspaceStore()
      await store.addDocument({
        name: documentName,
        document: getDocument(),
      })

      store.workspace.activeDocument!.info.title = 'new title'
      await store.saveDocument(documentName)

      store.workspace.activeDocument!.info.version = '2.0'

      const newDocument = {
        ...getDocument(),
        info: { title: 'A new title which should conflict', version: '1.0.1' },
      }

      const result = await store.rebaseDocument({ name: documentName, document: newDocument })

      assert(result)

      // Apply the resolved changes (we choose the incoming changes in this case)
      await result.applyChanges(result.conflicts.flatMap((it) => it[1]))

      // should override conflicts to the active document on rebase to the one from original
      expect(store.workspace.activeDocument?.info.version).toBe('1.0.1')
    })

    it('should log the error if the document we try to rebase does not exists', async () => {
      consoleErrorSpy.mockReset()

      const store = createWorkspaceStore()
      await store.rebaseDocument({
        name: 'some-document',
        document: {
          openapi: '3.1.1',
          info: { title: 'API', description: 'My beautiful API' },
        },
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR]: Specified document is missing or internal corrupted workspace state',
      )
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should load new origin from a url', async () => {
      const fn = vi.fn()

      const store = createWorkspaceStore()

      const fetchDocument = async (): Promise<Response> => {
        fn()
        return new Response(JSON.stringify(getDocument()))
      }

      await store.addDocument({
        name: 'default',
        document: {
          ...getDocument(),
          info: {
            title: 'Some API',
            version: '1.0.0',
          },
        },
      })

      expect(store.workspace.documents.default?.info.title).toBe('Some API')

      const result = await store.rebaseDocument({
        name: 'default',
        url: 'https://api.example.com',
        fetch: fetchDocument,
      })

      assert(result)

      await result.applyChanges([]) // No conflicts to apply

      expect(fn).toHaveBeenCalledTimes(1)
      expect(store.workspace.documents.default?.info.title).toBe('My API')
    })

    it('should rebuild the sidebar when we rebase the document', async () => {
      const store = createWorkspaceStore()

      await store.addDocument({
        name: 'default',
        document: getDocument(),
      })

      expect(store.workspace.activeDocument?.['x-scalar-navigation']).toEqual({
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/users',
            'isDeprecated': false,
            'method': 'get',
            'path': '/users',
            'ref': '#/paths/~1users/get',
            'title': 'Get all users',
            'type': 'operation',
          },
          {
            'children': [
              {
                'id': 'default/model/user',
                'name': 'User',
                'ref': '#/components/schemas/User',
                'title': 'User',
                'type': 'model',
              },
            ],
            'id': 'default/models',
            'title': 'Models',
            'name': 'Models',
            'type': 'models',
          },
        ],
      })

      const result = await store.rebaseDocument({
        name: 'default',
        document: {
          openapi: '3.0.0',
          info: {
            title: 'My API',
            version: '1.0.0',
          },
          paths: {
            '/pets': {
              get: {
                summary: 'Get all pets',
                responses: {
                  '200': {
                    description: 'Successful response',
                  },
                },
              },
            },
          },
        },
      })

      assert(result)
      await result.applyChanges([]) // No conflicts to apply

      expect(store.workspace.activeDocument?.['x-scalar-navigation']).toEqual({
        type: 'document',
        id: 'default',
        title: 'default',
        children: [
          {
            'id': 'default/tag/default/get/pets',
            'isDeprecated': false,
            'method': 'get',
            'path': '/pets',
            'ref': '#/paths/~1pets/get',
            'title': 'Get all pets',
            'type': 'operation',
          },
        ],
      })
    })
  })

  describe('navigation generation', () => {
    it('should prefix navigation id correctly with the document name when providing custom slug function', async () => {
      const store = createWorkspaceStore()

      await store.addDocument({
        name: 'document-1',
        config: {
          'x-scalar-reference-config': {
            generateOperationSlug: () => 'some-id',
            generateTagSlug: () => 'some-tag-id',
          },
        },
        document: {
          openapi: '3.0.0',
          info: {
            title: 'Document 1',
            version: '1.0.0',
          },
          paths: {
            '/users': {
              get: {
                summary: 'Get all users',
                tags: ['users'],
              },
            },
          },
        },
      })

      expect(store.workspace.activeDocument?.['x-scalar-navigation']).toEqual({
        type: 'document',
        id: 'document-1',
        title: 'document-1',
        children: [
          {
            'children': [
              {
                'children': undefined,
                'id': 'document-1/tag/some-tag-id/some-id',
                'isDeprecated': false,
                'method': 'get',
                'path': '/users',
                'ref': '#/paths/~1users/get',
                'title': 'Get all users',
                'type': 'operation',
              },
            ],
            'description': undefined,
            'id': 'document-1/tag/some-tag-id',
            'isGroup': false,
            'isWebhooks': false,
            'name': 'users',
            'title': 'users',
            'type': 'tag',
            'xKeys': {},
          },
        ],
      })
    })
  })
})

// Notes:
// (1*) Currently when we do server side bundle, we can end up with refs that will be pointing to other refs
//      so for now we don't support server side preprocessed documents
