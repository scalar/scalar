import { createServerWorkspaceStore, WORKSPACE_FILE_NAME } from '@/create-server-workspace-store'
import { createWorkspaceStore } from '@/create-workspace-store'
import { beforeEach, describe, expect, test } from 'vitest'
import fastify, { type FastifyInstance } from 'fastify'
import { afterEach } from 'node:test'
import { cwd } from 'node:process'
import fs from 'node:fs/promises'
import type { Workspace } from '@/schemas/server-workspace'

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

  test('should correctly update workspace metadata', () => {
    const store = createWorkspaceStore({
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

  test('should correctly update document metadata', () => {
    const store = createWorkspaceStore({
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

  test('should correctly get the correct document', () => {
    const store = createWorkspaceStore({
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

  test('should correctly add new documents', () => {
    const store = createWorkspaceStore({
      documents: [],
    })

    store.addDocument(
      {
        openapi: '3.0.0',
        info: { title: 'My API' },
      },
      {
        name: 'default',
      },
    )

    store.update('x-scalar-active-document', 'default')
    expect(store.workspace.activeDocument?.info?.title).toBe('My API')
  })

  test('should correctly resolve refs on the fly', () => {
    const store = createWorkspaceStore({
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
      const path = (req.query as { path: string }).path
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

    const store = createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: serverStore.getWorkspace().documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users'].get).toEqual({
      '$ref': `http://localhost:9988?path=${encodeURIComponent('#/default/operations/~1users/get')}`,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    // We expect the ref to have been resolved with the correct contents
    expect(store.workspace.activeDocument?.paths?.['/users'].get?.summary).toEqual(document.paths['/users'].get.summary)

    // We should resolve the user component chunk
    await store.resolve(['components', 'schemas', 'User'])

    expect(
      (store.workspace.activeDocument?.paths?.['/users'].get as any).responses[200].content['application/json'].schema
        .items,
    ).toEqual(document.components.schemas.User)
  })

  test('should correctly resolve chunks from the file system', { timeout: 500000 }, async () => {
    const randomSeed = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    const path = `temp-${randomSeed()}`

    const serverStore = createServerWorkspaceStore({
      mode: 'static',
      directory: path,
      documents: [
        {
          name: 'default',
          document: document,
        },
      ],
    })

    await serverStore.generateWorkspaceChunks()

    const buildPath = `${cwd()}/${path}`

    // Read the workspace file to get the sparse document
    const workspace = JSON.parse(
      await fs.readFile(`${buildPath}/${WORKSPACE_FILE_NAME}`, { encoding: 'utf-8' }),
    ) as Workspace

    const store = createWorkspaceStore({
      documents: [
        {
          name: 'default',
          document: workspace.documents['default'],
        },
      ],
    })

    // The operation should not be resolved on the fly
    expect(store.workspace.activeDocument?.paths?.['/users'].get).toEqual({
      '$ref': `${path}/chunks/default/operations/~1users/get.json/#`,
    })

    // We resolve the ref
    await store.resolve(['paths', '/users', 'get'])

    // We expect the ref to have been resolved with the correct contents
    expect(store.workspace.activeDocument?.paths?.['/users'].get?.summary).toEqual(document.paths['/users'].get.summary)

    // We should resolve the user component chunk
    await store.resolve(['components', 'schemas', 'User'])

    expect(
      (store.workspace.activeDocument?.paths?.['/users'].get as any).responses[200].content['application/json'].schema
        .items,
    ).toEqual(document.components.schemas.User)

    // clean up generated files
    await fs.rm(`${cwd()}/${path}`, { recursive: true })
  })
})
