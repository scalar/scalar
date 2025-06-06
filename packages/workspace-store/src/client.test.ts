import { createServerWorkspaceStore } from '@/server'
import { createWorkspaceStore } from '@/client'
import { beforeEach, describe, expect, test } from 'vitest'
import fastify, { type FastifyInstance } from 'fastify'
import { afterEach } from 'node:test'

// Test document
const document = {
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
}

describe('create-workspace-store', () => {
  let server: FastifyInstance

  beforeEach(() => {
    server = fastify({ logger: false })
  })

  afterEach(async () => {
    await server.close()
  })

  test('should correctly update workspace metadata', async () => {
    const store = await createWorkspaceStore({
      meta: {
        'x-scalar-theme': 'default',
        'x-scalar-dark-mode': false,
      },
    })

    store.update('x-scalar-dark-mode', true)
    store.update('x-scalar-theme', 'saturn')

    expect(store.rawWorkspace['x-scalar-dark-mode']).toBe(true)
    expect(store.rawWorkspace['x-scalar-theme']).toBe('saturn')
  })

  test('should correctly update document metadata', async () => {
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
    expect(store.rawWorkspace.documents['default']['x-scalar-active-auth']).toBe(undefined)
    expect(store.rawWorkspace.documents['default']['x-scalar-active-server']).toBe('server-2')

    // Should update a specific document
    store.updateDocument('default', 'x-scalar-active-server', 'server-3')
    store.updateDocument('default', 'x-scalar-active-auth', 'Bearer')
    expect(store.rawWorkspace.documents['default']['x-scalar-active-auth']).toBe('Bearer')
    expect(store.rawWorkspace.documents['default']['x-scalar-active-server']).toBe('server-3')
  })

  test('should correctly get the correct document', async () => {
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
    expect(store.workspace.documents['default'].info?.title).toBe('My API')
  })

  test('should correctly add new documents', async () => {
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
    expect(store.workspace.activeDocument?.info?.title).toBe('My API')
  })

  test('should correctly resolve refs on the fly', async () => {
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

  test('should correctly resolve chunks from the remote server', async () => {
    server.get('/*', (req, res) => {
      const path = req.url
      const contents = serverStore.get(path)

      res.send(contents)
    })

    const PORT = 9988
    await server.listen({ port: PORT })

    const serverStore = createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: `http://localhost:${PORT}`,
      documents: [
        {
          name: 'default',
          document,
        },
      ],
    })

    const store = await createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: serverStore.getWorkspace().documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users'].get).toEqual({
      '$ref': 'http://localhost:9988/default/operations/~1users/get#',
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    // We expect the ref to have been resolved with the correct contents
    expect(store.workspace.activeDocument?.paths?.['/users'].get?.summary).toEqual(document.paths['/users'].get.summary)

    expect(
      (store.workspace.activeDocument?.paths?.['/users'].get as any).responses[200].content['application/json'].schema
        .items,
    ).toEqual(document.components.schemas.User)
  })

  test('should load files form the remote url', async () => {
    const PORT = 9989
    const url = `http://localhost:${PORT}`

    // Send the default document
    server.get('/', (_, reply) => {
      reply.send(document)
    })

    await server.listen({ port: PORT })

    const store = await createWorkspaceStore({
      documents: [
        {
          url: url,
          name: 'default',
        },
      ],
    })

    expect(Object.keys(store.workspace.documents)).toEqual(['default'])
    expect(store.workspace.documents['default'].info?.title).toEqual(document.info.title)

    // Add a new remote file
    await store.addDocument({ name: 'new', url: url })

    expect(Object.keys(store.workspace.documents)).toEqual(['default', 'new'])
    expect(store.workspace.documents['new'].info?.title).toEqual(document.info.title)
  })

  test('should handle circular references when we try to resolve all remote chunks recursively', async () => {
    const document = {
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
    }

    server.get('/*', (req, res) => {
      const path = req.url
      const contents = serverStore.get(path)

      res.send(contents)
    })

    const PORT = 6672
    await server.listen({ port: PORT })

    const serverStore = createServerWorkspaceStore({
      mode: 'ssr',
      baseUrl: `http://localhost:${PORT}`,
      documents: [
        {
          name: 'default',
          document,
        },
      ],
    })

    const store = await createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: serverStore.getWorkspace().documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users'].get).toEqual({
      '$ref': `http://localhost:${PORT}/default/operations/~1users/get#`,
      $global: true,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    expect((store.workspace.activeDocument?.components?.schemas?.['User'] as any)?.type).toBe('object')
  })
})
