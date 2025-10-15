import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock the URL constant used by the module under test
vi.mock('@/consts/urls', () => ({
  PROXY_URL: 'https://proxy.example.test',
  UPLOAD_TEMP_API_URL: 'https://example.test/share/upload/apis',
}))

import { uploadTempDocument } from './upload-temp-document'

type MockFetchResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

const mockFetch = (response: MockFetchResponse): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response as unknown as Response),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('uploadTempDocument', () => {
  it('posts the document and returns the temporary url on success', async () => {
    const url = 'https://example.test/temp/url'
    const document = 'my-document-content'

    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ url }),
    })

    const result = await uploadTempDocument(document)
    expect(result).toBe(url)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://proxy.example.test/?scalar_url=https%3A%2F%2Fexample.test%2Fshare%2Fupload%2Fapis',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document }),
      },
    )
  })

  it('throws with status when server responds with non-ok', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad request' }),
    })

    await expect(uploadTempDocument('doc')).rejects.toThrow(
      /Failed to generate temporary link, server responded with 400/,
    )
  })

  it('throws when response body is missing a string url', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({}),
    })

    await expect(uploadTempDocument('doc')).rejects.toThrow(
      'Failed to generate temporary link, invalid response from server',
    )
  })
})
