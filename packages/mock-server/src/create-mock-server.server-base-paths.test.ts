import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { createMockServer } from './create-mock-server'

const okResponse = (message: string): Record<string, unknown> => ({
  '200': {
    description: 'OK',
    content: { 'application/json': { example: { message } } },
  },
})

const petOperation = {
  parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'integer' } }],
  'x-handler': 'return { petId: req.params.petId }',
  responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } } },
}

describe('create-mock-server.server-base-paths', () => {
  it.each(['https://api.example.com/v1', '//api.example.com/v1', 'HTTPS://api.example.com/v1'])(
    'serves operations under the base path of %s',
    async (url) => {
      const app = await createMockServer({
        document: {
          openapi: '3.1.1',
          info: { title: 'Pets', version: '1.0.0' },
          servers: [{ url }],
          paths: { '/pets/{petId}': { get: petOperation } },
        },
      })

      const response = await app.request('/v1/pets/1')

      expect(response.status).toBe(200)
      expect(await response.json()).toStrictEqual({ petId: '1' })
    },
  )

  it('resolves a relative server URL against the document retrieval URL', async () => {
    const app = await createMockServer({
      origin: 'https://api.example.com/docs/openapi.yaml',
      document: {
        openapi: '3.2.1',
        $self: 'https://api.example.com/identifiers/openapi.yaml',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: './v1' }],
        paths: { '/pets': { get: { responses: okResponse('pets') } } },
      },
    })

    expect((await app.request('/docs/v1/pets')).status).toBe(200)
    expect((await app.request('/v1/pets')).status).toBe(404)
    expect((await app.request('/identifiers/v1/pets')).status).toBe(404)
  })

  it('keeps serving operations at their bare path keys', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: { '/pets/{petId}': { get: petOperation } },
      },
    })

    const response = await app.request('/pets/1')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ petId: '1' })
  })

  it('validates requests under a base path', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: { '/pets/{petId}': { get: petOperation } },
      },
    })

    expect((await app.request('/v1/pets/abc')).status).toBe(422)
  })

  it('serves an OpenAPI 2.0 basePath', async () => {
    const app = await createMockServer({
      document: {
        swagger: '2.0',
        info: { title: 'Pets', version: '1.0.0' },
        host: 'api.example.com',
        basePath: '/api',
        paths: {
          '/pets': {
            get: {
              produces: ['application/json'],
              responses: { '200': { description: 'OK', examples: { 'application/json': { message: 'pets' } } } },
            },
          },
        },
      },
    })

    const response = await app.request('/api/pets')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ message: 'pets' })
  })

  it('serves every enum value of a server variable', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [
          { url: 'https://api.example.com/{version}', variables: { version: { default: 'v1', enum: ['v1', 'v2'] } } },
          { url: '/internal' },
        ],
        paths: { '/pets': { get: { responses: okResponse('pets') } } },
      },
    })

    for (const path of ['/v1/pets', '/v2/pets', '/internal/pets']) {
      expect((await app.request(path)).status).toBe(200)
    }
    expect((await app.request('/v3/pets')).status).toBe(404)
  })

  it('uses the servers of the operation and path item over the servers of the document', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: {
          '/pets': { get: { responses: okResponse('pets') } },
          '/uploads': {
            servers: [{ url: 'https://uploads.example.com/files' }],
            post: { responses: okResponse('uploads') },
          },
          '/reports': {
            get: { servers: [{ url: 'https://reports.example.com/beta' }], responses: okResponse('reports') },
          },
        },
      },
    })

    expect((await app.request('/v1/pets')).status).toBe(200)
    expect((await app.request('/files/uploads', { method: 'POST' })).status).toBe(200)
    expect((await app.request('/v1/uploads', { method: 'POST' })).status).toBe(404)
    expect((await app.request('/beta/reports')).status).toBe(200)
    expect((await app.request('/v1/reports')).status).toBe(404)
  })

  it('honors explicit empty operation and path item server overrides', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: '/v1' }],
        paths: {
          '/pets': { servers: [], get: { responses: okResponse('pets') } },
          '/reports': {
            servers: [{ url: '/internal' }],
            get: { servers: [], responses: okResponse('reports') },
          },
        },
      },
    })

    for (const path of ['/pets', '/reports']) {
      expect((await app.request(path)).status).toBe(200)
    }
    for (const path of ['/v1/pets', '/v1/reports', '/internal/reports']) {
      expect((await app.request(path)).status).toBe(404)
    }
  })

  it('uses servers alongside a path item reference', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: '/v1' }],
        components: { pathItems: { pets: { get: { responses: okResponse('pets') } } } },
        paths: {
          '/pets': { $ref: '#/components/pathItems/pets', servers: [{ url: '/override' }] },
        },
      },
    })

    expect((await app.request('/override/pets')).status).toBe(200)
    expect((await app.request('/v1/pets')).status).toBe(404)
  })

  it.each([
    ['a null variables map', { url: 'https://{host}/v1', variables: null }],
    ['a non-array enum', { url: '/{version}', variables: { version: { enum: 'v1' } } }],
  ])('skips a server with %s', async (_, server) => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [server, { url: '/internal' }],
        paths: { '/pets': { get: { responses: okResponse('pets') } } },
      },
    })

    expect((await app.request('/pets')).status).toBe(200)
    expect((await app.request('/internal/pets')).status).toBe(200)
    expect((await app.request('/v1/pets')).status).toBe(404)
  })

  it('keeps a declared path key ahead of a base path copy that ranks the same', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: {
          '/pets': { get: { responses: okResponse('pets') } },
          '/v1/pets': { get: { responses: okResponse('versioned pets') } },
        },
      },
    })

    expect(await (await app.request('/v1/pets')).json()).toStrictEqual({ message: 'versioned pets' })
  })

  it('answers with the most concrete route across path keys and base paths', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: {
          '/{collection}/{item}': { get: { responses: okResponse('item') } },
          '/{resource}': { get: { responses: okResponse('resource') } },
          '/pets': { get: { responses: okResponse('pets') } },
        },
      },
    })

    expect(await (await app.request('/v1/pets')).json()).toStrictEqual({ message: 'pets' })
    expect(await (await app.request('/v1/cats')).json()).toStrictEqual({ message: 'resource' })
    expect(await (await app.request('/v2/cats')).json()).toStrictEqual({ message: 'item' })
    expect(await (await app.request('/v1')).json()).toStrictEqual({ message: 'resource' })
  })

  it('serves the root path key at the base path', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Status', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: { '/': { get: { responses: okResponse('root') } } },
      },
    })

    expect(await (await app.request('/v1/')).json()).toStrictEqual({ message: 'root' })
    expect(await (await app.request('/')).json()).toStrictEqual({ message: 'root' })
  })

  it('matches pinned query variants under a base path', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Messages', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: {
          '/messages': { get: { responses: okResponse('stable') } },
          '/messages?beta=true': { get: { responses: okResponse('beta') } },
        },
      },
    })

    expect(await (await app.request('/v1/messages?beta=true')).json()).toStrictEqual({ message: 'beta' })
    expect(await (await app.request('/v1/messages')).json()).toStrictEqual({ message: 'stable' })
  })

  it('serves base paths with routing characters verbatim', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1:beta' }],
        paths: { '/pets/{petId}': { get: petOperation } },
      },
    })

    const response = await app.request('/v1:beta/pets/1')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ petId: '1' })
    expect((await app.request('/v1:other/pets/1')).status).toBe(404)
  })

  it('serves a base path that keeps an encoded percent sign', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/100%25' }],
        paths: { '/pets': { get: { responses: okResponse('pets') } } },
      },
    })

    expect(await (await app.request('/100%25/pets')).json()).toStrictEqual({ message: 'pets' })
  })

  it('starts when a server variable resolves to the root', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [
          { url: 'https://api.example.com/{basePath}', variables: { basePath: { default: '/', enum: ['/', 'v1'] } } },
        ],
        paths: { '/pets': { get: { responses: okResponse('pets') } } },
      },
    })

    expect((await app.request('/pets')).status).toBe(200)
    expect((await app.request('/v1/pets')).status).toBe(200)
  })

  it('serves base paths when the app is mounted under a prefix', async () => {
    const mock = await createMockServer({
      document: {
        openapi: '3.1.1',
        info: { title: 'Pets', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: { '/pets/{petId}': { get: petOperation } },
      },
    })
    const app = new Hono().route('/mock', mock)

    const response = await app.request('/mock/v1/pets/1')

    expect(response.status).toBe(200)
    expect(await response.json()).toStrictEqual({ petId: '1' })
  })

  it('serves lowercase additional operations under a base path', async () => {
    const app = await createMockServer({
      document: {
        openapi: '3.2.0',
        info: { title: 'Files', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com/v1' }],
        paths: { '/files': { additionalOperations: { copy: { responses: okResponse('copied') } } } },
      },
    })

    expect(await (await app.request('/v1/files', { method: 'copy' })).json()).toStrictEqual({ message: 'copied' })
  })
})
