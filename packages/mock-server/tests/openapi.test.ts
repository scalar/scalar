import { normalize, toYaml } from '@scalar/openapi-parser'
import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/createMockServer'

describe('openapi.{json|yaml}', () => {
  it('GET /openapi.json (from object)', async () => {
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

  it('GET /openapi.json (from JSON string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification: JSON.stringify(specification),
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it('GET /openapi.json (YAML string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification: toYaml(specification),
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(specification)
  })

  it('GET /openapi.yaml (object)', async () => {
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
    expect(normalize(await response.text())).toMatchObject(specification)
  })

  it('GET /openapi.yaml (YAML string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification: toYaml(specification),
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(normalize(await response.text())).toMatchObject(specification)
  })

  it('GET /openapi.yaml (JSON string)', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      specification: JSON.stringify(specification),
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(normalize(await response.text())).toMatchObject(specification)
  })
})
