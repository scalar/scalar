import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'
import { createOpenApiDefinition } from '../utils/create-openapi-definition'

describe('respond-with-authorize-page', () => {
  const document = createOpenApiDefinition({
    openIdConnect: {
      type: 'openIdConnect',
      openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
    },
  })

  it('returns 200 and shows requested scopes when scope query param is present', async () => {
    const server = await createMockServer({ document })
    const response = await server.request(
      '/oauth/authorize?redirect_uri=https://example.com/callback&scope=read%3Aaccount+write%3Aplanets+read%3Aplanets',
    )

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('Requested scopes')
    expect(html).toContain('read:account')
    expect(html).toContain('write:planets')
    expect(html).toContain('read:planets')
    expect(html).toContain('<ul')
    expect(html).toContain('<li>')
  })

  it('parses space-separated scope parameter', async () => {
    const server = await createMockServer({ document })
    const response = await server.request('/oauth/authorize?redirect_uri=https://example.com/callback&scope=read+write')

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('Requested scopes')
    expect(html).toContain('read')
    expect(html).toContain('write')
  })

  it('escapes scope values to prevent XSS', async () => {
    const server = await createMockServer({ document })
    const response = await server.request(
      '/oauth/authorize?redirect_uri=https://example.com/callback&scope=' +
        encodeURIComponent('<script>alert(1)</script>'),
    )

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toMatch(/<script>alert\(1\)<\/script>/)
  })

  it('escapes double quotes in scope values', async () => {
    const server = await createMockServer({ document })
    const response = await server.request(
      '/oauth/authorize?redirect_uri=https://example.com/callback&scope=' +
        encodeURIComponent('" onmouseover="alert(1)'),
    )

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('&quot;')
    expect(html).not.toContain('" onmouseover="alert(1)')
  })

  it('does not show scope section when scope param is missing', async () => {
    const server = await createMockServer({ document })
    const response = await server.request('/oauth/authorize?redirect_uri=https://example.com/callback')

    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).not.toContain('Requested scopes')
  })
})
