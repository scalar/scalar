import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../test/utils/create-mock-context'
import { createZipFileResponse } from './create-zip-file-response'

const getSignature = (bytes: Uint8Array, offset: number): number => {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true)
}

const extractStoredEntry = (bytes: Uint8Array): { content: string; fileName: string } => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const fileNameLength = view.getUint16(26, true)
  const extraFieldLength = view.getUint16(28, true)
  const fileNameOffset = 30
  const contentOffset = fileNameOffset + fileNameLength + extraFieldLength
  const uncompressedSize = view.getUint32(22, true)

  const fileName = new TextDecoder().decode(bytes.slice(fileNameOffset, fileNameOffset + fileNameLength))
  const content = new TextDecoder().decode(bytes.slice(contentOffset, contentOffset + uncompressedSize))

  return {
    fileName,
    content,
  }
}

describe('create-zip-file-response', () => {
  const requestData = {
    method: 'POST',
    path: '/foobar.zip',
    query: {
      foo: 'bar',
    },
  }

  it('sets the content-type header to application/zip', () => {
    const mockContext = createMockContext()

    createZipFileResponse(mockContext as unknown as Context, requestData)

    expect(mockContext._headers['Content-Type']).toBe('application/zip')
  })

  it('calls the body method with content', () => {
    const mockContext = createMockContext()

    createZipFileResponse(mockContext as unknown as Context, requestData)

    expect(mockContext.body).toHaveBeenCalled()
    expect(mockContext._getBodyContent()).not.toBeNull()
  })

  it('returns a valid zip containing request.json', () => {
    const mockContext = createMockContext()

    createZipFileResponse(mockContext as unknown as Context, requestData)

    const zipBytes = mockContext._getBodyContent()
    expect(zipBytes).toBeInstanceOf(Uint8Array)

    const typedZipBytes = zipBytes as Uint8Array
    expect(getSignature(typedZipBytes, 0)).toBe(0x04034b50)
    expect(getSignature(typedZipBytes, typedZipBytes.length - 22)).toBe(0x06054b50)

    const { fileName, content } = extractStoredEntry(typedZipBytes)
    expect(fileName).toBe('request.json')
    expect(content).toBe(JSON.stringify(requestData, null, 2))
  })

  it('sets the header before returning the body', () => {
    const mockContext = createMockContext()
    const callOrder: string[] = []

    mockContext.header.mockImplementation(() => {
      callOrder.push('header')
    })
    mockContext.body.mockImplementation((content: unknown) => {
      callOrder.push('body')
      return content
    })

    createZipFileResponse(mockContext as unknown as Context, requestData)

    expect(callOrder).toEqual(['header', 'body'])
  })
})
