import { describe, expect, it, vi } from 'vitest'

import { fetchSpecFromUrl } from '@scalar/oas-utils/helpers'

import { fetchContent } from './fetch-content'

vi.mock('@scalar/oas-utils/helpers', () => ({
  fetchSpecFromUrl: vi.fn(),
  isValidUrl: (url: string) => url.startsWith('http'),
  prettyPrintJson: (obj: unknown) => JSON.stringify(obj, null, 2),
}))

describe('fetchContent', () => {
  it('fetches content from a URL', async () => {
    const url = 'http://example.com/spec.json'
    const mockContent = '{"openapi": "3.0.0"}'
    vi.mocked(fetchSpecFromUrl).mockResolvedValue(mockContent)

    const result = await fetchContent({ url })
    expect(result).toBe(mockContent)
    expect(fetchSpecFromUrl).toHaveBeenCalledWith(url, undefined)
  })

  it('fetches content from a URL with proxy', async () => {
    const url = 'http://example.com/spec.json'
    const proxyUrl = 'http://proxy.com'
    const mockContent = '{"openapi": "3.0.0"}'
    vi.mocked(fetchSpecFromUrl).mockResolvedValue(mockContent)

    const result = await fetchContent({ url }, proxyUrl)
    expect(result).toBe(mockContent)
    expect(fetchSpecFromUrl).toHaveBeenCalledWith(url, proxyUrl)
  })

  it('fetches content from a local path without proxy', async () => {
    const url = '/local/spec.json'
    const proxyUrl = 'http://proxy.com'
    const mockContent = '{"openapi": "3.0.0"}'
    vi.mocked(fetchSpecFromUrl).mockResolvedValue(mockContent)

    const result = await fetchContent({ url }, proxyUrl)
    expect(result).toBe(mockContent)
    expect(fetchSpecFromUrl).toHaveBeenCalledWith(url)
  })

  it('handles URL fetch errors', async () => {
    const url = 'http://example.com/spec.json'
    vi.mocked(fetchSpecFromUrl).mockRejectedValue(new Error('Fetch failed'))

    const result = await fetchContent({ url })
    expect(result).toBeUndefined()
  })

  it('handles string content directly', async () => {
    const content = '{"openapi": "3.0.0"}'
    const result = await fetchContent({ content })
    expect(result).toBe(content)
  })

  it('handles object content by pretty printing', async () => {
    const content = { openapi: '3.0.0' }
    const result = await fetchContent({ content })
    expect(result).toBe(JSON.stringify(content, null, 2))
  })

  it('handles function content by executing', async () => {
    const content = () => '{"openapi": "3.0.0"}'
    const result = await fetchContent({ content })
    expect(result).toBe(content())
  })

  it('returns undefined for invalid content', async () => {
    const result = await fetchContent({})
    expect(result).toBeUndefined()
  })
})
