import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { createMockServer } from './create-mock-server'

describe('AsyncAPI document routes', () => {
  it('serves JSON and YAML with request-specific server and authorization URLs without changing the input', async () => {
    const document = {
      asyncapi: '3.0.0',
      info: { title: 'Events', version: '1' },
      servers: {
        production: {
          host: 'original.example',
          protocol: 'wss',
          pathname: '/ws/{version}',
          variables: { version: { enum: ['v1', 'v2'] } },
        },
        broker: { host: 'broker.example', protocol: 'kafka' },
      },
      components: {
        securitySchemes: {
          oauth: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://original.example/oauth/authorize',
                tokenUrl: 'https://original.example/oauth/token',
                availableScopes: {},
              },
            },
          },
        },
      },
    }
    const original = structuredClone(document)
    const app = await createMockServer({ document })
    const response = await app.request('https://preview.example/asyncapi.json')
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.servers.production).toEqual({ ...document.servers.production, host: 'preview.example' })
    expect(json.servers.broker).toEqual(document.servers.broker)
    expect(json.components.securitySchemes.oauth.flows.authorizationCode.tokenUrl).toBe(
      'https://preview.example/oauth/token',
    )
    const yaml = await app.request('https://preview.example/asyncapi.yaml')
    expect(yaml.headers.get('content-type')).toContain('application/yaml')
    expect(parse(await yaml.text())).toEqual(json)
    const local = await (await app.request('http://localhost:8788/asyncapi.json')).json()
    expect(local.servers.production.host).toBe('localhost:8788')
    expect(local.servers.production.protocol).toBe('ws')
    expect(document).toEqual(original)
  })

  it('rebases referenced servers and security schemes without changing references', async () => {
    const app = await createMockServer({
      document: {
        asyncapi: '3.0.0',
        info: { title: 'References', version: '1' },
        servers: { production: { $ref: '#/components/servers/production' } },
        components: {
          servers: {
            production: {
              host: 'original.example',
              protocol: 'wss',
              security: [{ $ref: '#/components/securitySchemes/oauth' }],
            },
          },
          securitySchemes: {
            oauth: {
              type: 'oauth2',
              flows: {
                implicit: { authorizationUrl: 'https://original.example/oauth/authorize', availableScopes: {} },
              },
            },
          },
        },
      },
    })
    const json = await (await app.request('https://preview.example/asyncapi.json')).json()
    expect(json.servers.production).toEqual({ $ref: '#/components/servers/production' })
    expect(json.components.servers.production.host).toBe('preview.example')
    expect(json.components.securitySchemes.oauth.flows.implicit.authorizationUrl).toBe(
      'https://preview.example/oauth/authorize',
    )
  })

  it('serves all enum routes and rejects undeclared values', async () => {
    const app = await createMockServer({
      document: {
        asyncapi: '3.0.0',
        info: { title: 'Events', version: '1' },
        servers: {
          production: {
            host: 'localhost',
            protocol: 'sse',
            pathname: '/{version}',
            variables: { version: { enum: ['v1', 'v2'] } },
          },
        },
        channels: { events: { address: 'planets/{id}', messages: {} } },
      },
    })
    expect((await app.request('/v3/planets/4')).status).toBe(404)
    for (const version of ['v1', 'v2']) {
      const response = await app.request(`/${version}/planets/4`)
      expect(response.status).toBe(200)
      await response.body?.cancel()
    }
  })
})
