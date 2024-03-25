import { describe, expect, it } from 'vitest'

// Could import any other source file/function here
import proxyServer from '../src'

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

describe('Proxy server', () => {
  it('proxies the call', async () => {
    const request = new IncomingRequest(
      'http://example.com?url=https://petstore3.swagger.io/api/v3/pet/1',
    )
    const response = await proxyServer.fetch(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(Object.keys(data ?? {})).toStrictEqual([
      'id',
      'category',
      'name',
      'photoUrls',
      'tags',
      'status',
    ])
  }, 20000)

  it('fails without a url query param', async () => {
    const request = new IncomingRequest('http://example.com')
    const response = await proxyServer.fetch(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid url query param provided')
  })

  it('fails with an invalid url', async () => {
    const request = new IncomingRequest('http://example.com?url=fakeUrl')
    const response = await proxyServer.fetch(request)

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid url query param provided')
  })
})
