import { normalize, toYaml } from '@scalar/openapi-parser'
import { describe, expect, it } from 'vitest'

import { createMockServer } from '../src/create-mock-server'

describe('openapi.{json|yaml}', () => {
  it('GET /openapi.json (from object)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document,
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('GET /openapi.json (from JSON string)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document: JSON.stringify(document),
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('GET /openapi.json (YAML string)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document: toYaml(document),
    })

    const response = await server.request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  it('GET /openapi.yaml (object)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document,
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(normalize(await response.text())).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/yaml')
  })

  it('GET /openapi.yaml (YAML string)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document: toYaml(document),
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(normalize(await response.text())).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/yaml')
  })

  it('GET /openapi.yaml (JSON string)', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }

    const server = await createMockServer({
      document: JSON.stringify(document),
    })

    const response = await server.request('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(normalize(await response.text())).toMatchObject(document)
    expect(response.headers.get('Content-Type')).toContain('application/yaml')
  })
})
