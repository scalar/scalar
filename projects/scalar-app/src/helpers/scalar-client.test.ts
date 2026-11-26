import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteRegistryDocument } from './delete-registry-document'
import { deleteRegistryVersion } from './delete-registry-version'
import { fetchRegistryDocument } from './fetch-registry-document'
import { publishRegistryVersion } from './publish-registry-version'
import { scalarClient } from './scalar-client'

const { checkRefresh, getAccessToken } = vi.hoisted(() => ({
  checkRefresh: vi.fn<() => Promise<void>>(),
  getAccessToken: vi.fn<() => string | undefined>(),
}))

vi.mock('@/environment', () => ({ env: { VITE_API_URL: 'https://api.scalar.test' } }))
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ checkRefresh, getAccessToken }),
}))

const document = { openapi: '3.1.0', info: { title: 'Test API', version: '1.0.0' }, paths: {} }

describe('scalar-client', () => {
  beforeEach(() => {
    checkRefresh.mockReset().mockResolvedValue(undefined)
    getAccessToken.mockReset().mockReturnValue('access-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('waits for token refresh before authenticating a registry namespace request', async () => {
    const events: string[] = []
    checkRefresh.mockImplementationOnce(async () => {
      await Promise.resolve()
      events.push('refreshed')
    })
    getAccessToken.mockImplementationOnce(() => {
      events.push('read-token')
      return 'fresh-token'
    })
    const fetch = vi.spyOn(scalarClient, 'fetch').mockResolvedValue(Response.json(['team']))

    const namespaces = await scalarClient.namespaces.list()

    expect(namespaces).toStrictEqual(['team'])
    expect(events).toStrictEqual(['refreshed', 'read-token'])
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options]: [unknown, RequestInit?] = fetch.mock.calls[0]! as [unknown, RequestInit?]
    expect(String(url)).toBe('https://api.scalar.test/v1/namespaces')
    expect(options?.method).toBe('GET')
    expect(new Headers(options?.headers).get('authorization')).toBe('Bearer fresh-token')
  })

  it('fetches the document and version hash using an authenticated SDK request', async () => {
    const fetch = vi.spyOn(scalarClient, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(document), {
        headers: { 'content-type': 'text/plain', 'x-scalar-version-sha': 'version-sha' },
      }),
    )

    const result = await fetchRegistryDocument({ namespace: 'team', slug: 'my-api', version: '1.0.0' })

    expect(result).toStrictEqual({ ok: true, data: { document, versionSha: 'version-sha' } })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options]: [unknown, RequestInit?] = fetch.mock.calls[0]! as [unknown, RequestInit?]
    expect(String(url)).toBe('https://api.scalar.test/v1/apis/team/my-api/version/1.0.0')
    expect(options?.method).toBe('GET')
    expect(new Headers(options?.headers).get('authorization')).toBe('Bearer access-token')
  })

  it('publishes a version while forwarding its concurrency hash in the body', async () => {
    const fetch = vi.spyOn(scalarClient, 'fetch').mockResolvedValue(Response.json({ versionSha: 'new-sha' }))

    const result = await publishRegistryVersion({
      namespace: 'team',
      slug: 'my-api',
      version: '1.0.0',
      document,
      commitHash: 'previous-sha',
    })

    expect(result).toStrictEqual({
      ok: true,
      data: { namespace: 'team', slug: 'my-api', version: '1.0.0', commitHash: 'new-sha' },
    })
    const [url, options]: [unknown, RequestInit?] = fetch.mock.calls[0]! as [unknown, RequestInit?]
    expect(String(url)).toBe('https://api.scalar.test/v1/apis/team/my-api/version')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toStrictEqual({
      version: '1.0.0',
      document: JSON.stringify(document),
      force: true,
      lastKnownVersionSha: 'previous-sha',
    })
  })

  it('deletes the requested document', async () => {
    const fetch = vi.spyOn(scalarClient, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const result = await deleteRegistryDocument({ namespace: 'team', slug: 'my-api' })

    expect(result).toStrictEqual({ ok: true, data: { namespace: 'team', slug: 'my-api' } })
    const [url, options]: [unknown, RequestInit?] = fetch.mock.calls[0]! as [unknown, RequestInit?]
    expect(String(url)).toBe('https://api.scalar.test/v1/apis/team/my-api')
    expect(options?.method).toBe('DELETE')
    expect(options?.body).toBeUndefined()
  })

  it('deletes only the requested version', async () => {
    const fetch = vi.spyOn(scalarClient, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    const result = await deleteRegistryVersion({ namespace: 'team', slug: 'my-api', version: '1.0.0' })

    expect(result).toStrictEqual({ ok: true, data: { namespace: 'team', slug: 'my-api', version: '1.0.0' } })
    const [url, options]: [unknown, RequestInit?] = fetch.mock.calls[0]! as [unknown, RequestInit?]
    expect(String(url)).toBe('https://api.scalar.test/v1/apis/team/my-api/version/1.0.0')
    expect(options?.method).toBe('DELETE')
    expect(options?.body).toBeUndefined()
  })
})
