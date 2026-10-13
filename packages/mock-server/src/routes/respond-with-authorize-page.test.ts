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
    expect(html).toContain('Requested Scopes')
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
    expect(html).toContain('Requested Scopes')
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
    expect(html).not.toContain('Requested Scopes')
  })
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,test',
    'file:///tmp/callback',
    'custom://callback',
  ])('rejects unsafe callback %s', async (redirectUri) => {
    const server = await createMockServer({ document })
    const response = await server.request(`/oauth/authorize?${new URLSearchParams({ redirect_uri: redirectUri })}`)

    expect(response.status).toBe(400)
    expect(await response.text()).toContain('Invalid redirect_uri protocol')
  })

  it.each(['code', 'token'])('preserves safe callbacks and state for the %s flow', async (responseType) => {
    const server = await createMockServer({ document })
    const response = await server.request(
      `/oauth/authorize?${new URLSearchParams({
        redirect_uri: 'http://localhost:3000/callback?existing=1&copy=2',
        response_type: responseType,
        state: 'state&with="quotes"',
      })}`,
    )

    expect(response.status).toBe(200)
    const html = await response.text()
    const links = [...html.matchAll(/href="([^"]+)"[^>]+aria-label="(Cancel authorization|Authorize application)"/g)]
    expect(links.length).toBe(2)
    for (const [, href, label] of links) {
      const url = new URL(href!.replaceAll('&amp;', '&'))
      expect(url.origin).toBe('http://localhost:3000')
      expect(url.searchParams.get('existing')).toBe('1')
      expect(url.searchParams.get('copy')).toBe('2')
      const parameters = responseType === 'token' ? new URLSearchParams(url.hash.slice(1)) : url.searchParams
      expect(parameters.get('state')).toBe('state&with="quotes"')
      expect(
        parameters.get(label === 'Cancel authorization' ? 'error' : responseType === 'token' ? 'access_token' : 'code'),
      ).toBe(
        label === 'Cancel authorization'
          ? 'access_denied'
          : responseType === 'token'
            ? 'super-secret-access-token'
            : 'super-secret-token',
      )
    }
    expect(html).toContain('existing=1&amp;copy=2')
  })
})
