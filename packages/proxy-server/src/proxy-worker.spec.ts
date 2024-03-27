import { describe, expect, it } from 'vitest'

// Could import any other source file/function here
import proxyServer from '../src'

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

describe('Proxy server', () => {
  it('proxies the call', async () => {
    const request = new IncomingRequest(
      'http://example.com?url=https://api.sampleapis.com/futurama/info',
    )
    const response = await proxyServer.fetch(request)

    expect(response.status).toBe(200)
    const data: unknown[] = await response.json()
    const first = data[0]

    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('creators')
    expect(first).toHaveProperty('synopsis')
    expect(first).toHaveProperty('yearsAired')
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

    expect(response.status).toBeGreaterThan(400)
    expect(await response.text()).toBe('There was an error with the request')
  })
})
