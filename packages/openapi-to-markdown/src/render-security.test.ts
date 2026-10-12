import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './create-markdown-from-openapi'

const render = async (document: Record<string, unknown>): Promise<string> =>
  await createMarkdownFromOpenApi(
    {
      openapi: '3.1.1',
      info: { title: 'API', version: '1' },
      paths: { '/items': { get: { summary: 'List items', responses: {} } } },
      ...document,
    },
    { operation: { path: '/items', method: 'get' } },
  )

describe('render-security', () => {
  it('leaves authentication out when nothing is declared', async () => {
    const markdown = await render({})
    expect(markdown).not.toContain('Authentication')
    expect(markdown).not.toContain('No authentication required')
  })

  it('says that no authentication is required only for an explicit empty requirement list', async () => {
    expect(await render({ security: [] })).toContain('## Authentication\n\nNo authentication required.\n')
  })

  it('summarizes each security scheme on one line instead of printing its JSON', async () => {
    const markdown = await render({
      security: [{ key: [] }, { bearer: [] }, { oauth: ['read', 'write'] }, { oidc: [] }, { basic: [], mtls: [] }],
      components: {
        securitySchemes: {
          key: { type: 'apiKey', in: 'header', name: 'X-Api-Key', description: 'Your **secret** key.' },
          bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          basic: { type: 'http', scheme: 'basic' },
          oauth: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://auth.example.com/authorize',
                tokenUrl: 'https://auth.example.com/token',
                scopes: { read: 'Read', write: 'Write' },
              },
            },
          },
          oidc: {
            type: 'openIdConnect',
            openIdConnectUrl: 'https://auth.example.com/.well-known/openid-configuration',
          },
          mtls: { type: 'mutualTLS' },
        },
      },
    })
    for (const line of [
      '- **key**: API key in header `X-Api-Key`\n\n  Your **secret** key.',
      '- **bearer**: HTTP bearer (`JWT`)',
      '- **oauth**: OAuth 2.0: authorization code, authorize `https://auth.example.com/authorize`, token `https://auth.example.com/token`, scopes: `read, write`',
      '- **oidc**: OpenID Connect `https://auth.example.com/.well-known/openid-configuration`',
      '- **basic**: HTTP basic\n- **mtls**: Mutual TLS',
    ]) {
      expect(markdown).toContain(line)
    }
    expect(markdown).not.toContain('"type"')
  })
})
