import { describe, expect, it, vi } from 'vitest'

import { fetchOAuth2Metadata } from './fetch-oauth2-metadata'

describe('fetch-oauth2-metadata', () => {
  it('fetches the exact metadata URL using the custom fetch', async () => {
    const metadata = { token_endpoint: 'https://auth.example.com/token', grant_types_supported: ['client_credentials'] }
    const customFetch = vi.fn().mockResolvedValue(Response.json(metadata))
    expect(await fetchOAuth2Metadata('https://auth.example.com/custom?version=2', '', customFetch)).toStrictEqual([
      null,
      metadata,
    ])
    expect(customFetch.mock.calls).toStrictEqual([['https://auth.example.com/custom?version=2']])
  })

  it('routes metadata through the configured proxy', async () => {
    const customFetch = vi.fn().mockResolvedValue(Response.json({ token_endpoint: 'https://auth.example.com/token' }))
    await fetchOAuth2Metadata('https://auth.example.com/metadata', 'https://proxy.example.com', customFetch)
    const url = new URL(customFetch.mock.calls[0]?.[0])
    expect(url.origin).toBe('https://proxy.example.com')
    expect(url.searchParams.get('scalar_url')).toBe('https://auth.example.com/metadata')
  })

  it.each(['http://example.com/metadata', '', 'not a URL'])(
    'rejects invalid metadata URL %s before fetching',
    async (url) => {
      const customFetch = vi.fn()
      const [error, data] = await fetchOAuth2Metadata(url, '', customFetch)
      expect(error).toBeInstanceOf(Error)
      expect(data).toBeNull()
      expect(customFetch.mock.calls).toStrictEqual([])
    },
  )

  it.each([{}, null, { token_endpoint: 123 }, { token_endpoint: 'http://example.com/token' }])(
    'rejects invalid metadata %j',
    async (metadata) => {
      const [error, data] = await fetchOAuth2Metadata(
        'https://example.com/metadata',
        '',
        vi.fn().mockResolvedValue(Response.json(metadata)),
      )
      expect(error).toBeInstanceOf(Error)
      expect(data).toBeNull()
    },
  )

  it.each(['localhost', '127.0.0.1', '[::1]'])('accepts HTTP metadata and endpoints on %s', async (host) => {
    const metadata = { token_endpoint: `http://${host}:5052/token` }
    expect(
      await fetchOAuth2Metadata(`http://${host}:5052/metadata`, '', vi.fn().mockResolvedValue(Response.json(metadata))),
    ).toStrictEqual([null, metadata])
  })

  it('coerces metadata like OpenID Connect discovery', async () => {
    const metadata = { token_endpoint: 'https://example.com/token', scopes_supported: 'read' }
    const [, data] = await fetchOAuth2Metadata(
      'https://example.com/metadata',
      '',
      vi.fn().mockResolvedValue(Response.json(metadata)),
    )
    expect(data).toStrictEqual({ token_endpoint: metadata.token_endpoint, scopes_supported: [] })
  })

  it('returns HTTP failures', async () => {
    const [error, data] = await fetchOAuth2Metadata(
      'https://example.com/metadata',
      '',
      vi.fn().mockResolvedValue(new Response('', { status: 404 })),
    )
    expect(error?.message).toBe('Failed to fetch OAuth2 metadata: 404 ')
    expect(data).toBeNull()
  })

  it('returns network failures', async () => {
    const error = new Error('Network failed')
    expect(
      await fetchOAuth2Metadata('https://example.com/metadata', '', vi.fn().mockRejectedValue(error)),
    ).toStrictEqual([error, null])
  })
})
