import { describe, expect, it, vi } from 'vitest'

import { getFetch } from './get-fetch'

describe('get-fetch', () => {
  it('returns custom fetch function when provided in config', () => {
    const customFetch = vi.fn(async () => new Response())
    const config = {
      fetch: customFetch,
    }

    const result = getFetch(config)

    expect(result).toBe(customFetch)
  })

  it('returns default fetch with proxy when no custom fetch is provided', async () => {
    const config = {
      proxyUrl: 'https://proxy.scalar.com',
    }

    const result = getFetch(config)

    // Verify it returns a function
    expect(typeof result).toBe('function')

    // Mock global fetch to verify it is called with proxied URL
    const mockResponse = new Response()
    const mockFetch = vi.fn(async () => mockResponse)
    global.fetch = mockFetch

    const testUrl = 'https://api.example.com/data'
    const testInit = { method: 'GET' }
    await result(testUrl, testInit)

    // Verify fetch was called with the proxied URL
    expect(mockFetch).toHaveBeenCalledWith(
      'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fdata',
      testInit,
    )
  })

  it('handles URL objects by converting them to strings before proxying', async () => {
    const config = {
      proxyUrl: 'https://proxy.scalar.com',
    }

    const result = getFetch(config)

    const mockResponse = new Response()
    const mockFetch = vi.fn(async () => mockResponse)
    global.fetch = mockFetch

    const testUrl = new URL('https://api.example.com/data')
    await result(testUrl, undefined)

    // Verify the URL object was converted to string and proxied
    expect(mockFetch).toHaveBeenCalledWith(
      'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fapi.example.com%2Fdata',
      undefined,
    )
  })

  it('returns default fetch without proxy when proxyUrl is not provided', async () => {
    const config = {}

    const result = getFetch(config)

    const mockResponse = new Response()
    const mockFetch = vi.fn(async () => mockResponse)
    global.fetch = mockFetch

    const testUrl = 'https://api.example.com/data'
    const testInit = { method: 'POST' }
    await result(testUrl, testInit)

    // When no proxyUrl is provided, redirectToProxy returns the original URL
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', testInit)
  })
})
