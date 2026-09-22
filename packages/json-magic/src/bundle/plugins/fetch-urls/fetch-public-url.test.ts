import type { LookupAddress, LookupAllOptions } from 'node:dns'
import { lookup } from 'node:dns/promises'
import type { LookupFunction } from 'node:net'

import { Agent, Response as UndiciResponse, fetch } from 'undici'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchPublicUrl } from './fetch-public-url'

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }))
vi.mock('undici', async (importOriginal) => ({
  ...(await importOriginal<typeof import('undici')>()),
  Agent: vi.fn(
    class {
      destroy = vi.fn().mockResolvedValue(undefined)
    },
  ),
  fetch: vi.fn(),
}))

const lookupAll = vi.mocked(lookup as (hostname: string, options: LookupAllOptions) => Promise<LookupAddress[]>)

describe('fetch-public-url', () => {
  afterEach(() => vi.resetAllMocks())

  it('pins the connection to the validated answer when DNS changes', async () => {
    lookupAll
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }])
      .mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }])
    vi.mocked(fetch).mockImplementationOnce(async (url, options) => {
      expect(String(url)).toBe('https://api.example.com/schema.json')
      expect(options?.redirect).toBe('error')
      expect(options?.headers).toStrictEqual({ authorization: 'Bearer test' })
      expect(options?.dispatcher).toBe(vi.mocked(Agent).mock.instances[0])
      const connect = vi.mocked(Agent).mock.calls[0][0]?.connect
      if (!connect || typeof connect === 'function' || !('lookup' in connect) || !connect.lookup) {
        throw new Error('A pinned lookup is required')
      }
      const pinnedLookup: LookupFunction = connect.lookup
      const address = await new Promise((resolve, reject) => {
        pinnedLookup('api.example.com', { all: true }, (error, result) => (error ? reject(error) : resolve(result)))
      })
      expect(address).toStrictEqual([{ address: '93.184.216.34', family: 4 }])
      const single = await new Promise((resolve, reject) => {
        pinnedLookup('api.example.com', {}, (error, result, family) =>
          error ? reject(error) : resolve({ address: result, family }),
        )
      })
      expect(single).toStrictEqual({ address: '93.184.216.34', family: 4 })
      return new UndiciResponse('{"type":"string"}')
    })

    const result = await fetchPublicUrl('https://api.example.com/schema.json', { Authorization: 'Bearer test' })

    expect(await result.json()).toStrictEqual({ type: 'string' })
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Agent).mock.instances[0].destroy).toHaveBeenCalledOnce()
  })

  it('blocks a DNS answer containing both public and private addresses before fetching', async () => {
    lookupAll.mockReset().mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ])

    await expect(fetchPublicUrl('https://api.example.com')).rejects.toThrow('private or internal')
    expect(fetch).not.toHaveBeenCalled()
    expect(Agent).not.toHaveBeenCalled()
  })

  it('blocks local NAT64 translation addresses before fetching', async () => {
    await expect(fetchPublicUrl('http://[64:ff9b:1:0:c0:a801:100:0]')).rejects.toThrow('private or internal')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not read error response bodies before rejecting the response', async () => {
    const response = new UndiciResponse('An error body', { status: 500 })
    const readBody = vi.spyOn(response, 'arrayBuffer')
    vi.mocked(fetch).mockResolvedValueOnce(response)

    const result = await fetchPublicUrl('https://93.184.216.34')

    expect(result.status).toBe(500)
    expect(await result.text()).toBe('')
    expect(readBody).not.toHaveBeenCalled()
    expect(vi.mocked(Agent).mock.instances[0].destroy).toHaveBeenCalledOnce()
  })

  it('closes the connection when fetching fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection failed'))

    await expect(fetchPublicUrl('https://93.184.216.34')).rejects.toThrow('Connection failed')
    expect(vi.mocked(Agent).mock.instances[0].destroy).toHaveBeenCalledOnce()
  })
})
