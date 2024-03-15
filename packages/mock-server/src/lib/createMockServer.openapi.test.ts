import { describe, expect, it } from 'vitest'

import { createMockServer } from './createMockServer'

describe('openapi.{json|yaml}', () => {
  it('GET /openapi.json (object)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it('GET /openapi.json (JSON string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it.skip('GET /openapi.json (YAML string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it.skip('GET /openapi.yaml (object)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it.skip('GET /openapi.yaml (YAML string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it.skip('GET /openapi.yaml (JSON string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification,
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })
})
