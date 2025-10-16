import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiReference } from '../src/ApiReference'

vi.mock('@scalar/core/libs/html-rendering', { spy: true })
vi.mock('../src/custom-theme', () => ({ customTheme: '___customTheme___' }))

const getHtmlDocumentSpy = vi.mocked(getHtmlDocument)

beforeEach(() => {
  getHtmlDocumentSpy.mockReset()
})

describe('ApiReference', () => {
  it('should return a function', () => {
    const handler = ApiReference({})
    expect(handler).toBeInstanceOf(Function)
  })

  it('should return a Response with correct headers and body', async () => {
    getHtmlDocumentSpy.mockReturnValueOnce('___HTMLDoc___')

    const handler = ApiReference({ title: 'Test API' })
    const response = handler()

    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html')

    expect(getHtmlDocumentSpy).toHaveBeenCalledOnce()
    expect(getHtmlDocumentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test API',
        _integration: 'nextjs', // default should be merged in
      }),
      '___customTheme___',
    )

    await expect(response.text()).resolves.toBe('___HTMLDoc___')
  })
})
