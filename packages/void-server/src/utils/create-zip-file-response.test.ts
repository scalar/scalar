import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../test/utils/create-mock-context'
import { createZipFileResponse } from './create-zip-file-response'

describe('create-zip-file-response', () => {
  it('sets the content-type header to application/zip', () => {
    const mockContext = createMockContext()

    createZipFileResponse(mockContext as unknown as Context)

    expect(mockContext._headers['Content-Type']).toBe('application/zip')
  })

  it('calls the body method with content', () => {
    const mockContext = createMockContext()

    createZipFileResponse(mockContext as unknown as Context)

    expect(mockContext.body).toHaveBeenCalled()
    expect(mockContext._getBodyContent()).not.toBeNull()
  })

  it('sets the header before returning the body', () => {
    const mockContext = createMockContext()
    const callOrder: string[] = []

    mockContext.header.mockImplementation(() => {
      callOrder.push('header')
    })
    mockContext.body.mockImplementation((content: string) => {
      callOrder.push('body')
      return content
    })

    createZipFileResponse(mockContext as unknown as Context)

    expect(callOrder).toEqual(['header', 'body'])
  })
})
