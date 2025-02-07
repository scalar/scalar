import { beforeAll, describe, expect, it, vi } from 'vitest'

import { useResponseBody } from './useResponseBody'

describe('useResponseBody', () => {
  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'mockedBlobURL')
  })

  it('extracts the correct MimeType from headers', () => {
    const props = {
      data: null,
      headers: [
        { name: 'Content-Type', value: 'application/json', required: true },
      ],
    }
    const { mimeType } = useResponseBody(props)
    expect(mimeType.value.essence).toBe('application/json')
  })

  it('extracts the correct attachment filename from headers', () => {
    const props = {
      data: null,
      headers: [
        {
          name: 'Content-Disposition',
          value: 'attachment; filename="test.txt"',
          required: true,
        },
      ],
    }
    const { attachmentFilename } = useResponseBody(props)
    expect(attachmentFilename.value).toBe('test.txt')
  })

  it('generates a data URL for a Blob', () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    const props = {
      data: blob,
      headers: [{ name: 'Content-Type', value: 'text/plain', required: true }],
    }
    const { dataUrl } = useResponseBody(props)
    expect(dataUrl.value).toBe('mockedBlobURL')
  })

  it('generates a data URL for a string', () => {
    const props = {
      data: 'test string',
      headers: [{ name: 'Content-Type', value: 'text/plain', required: true }],
    }
    const { dataUrl } = useResponseBody(props)
    expect(dataUrl.value).toBe('mockedBlobURL')
  })

  it('generates a data URL for an object', () => {
    const props = {
      data: { key: 'value' },
      headers: [
        { name: 'Content-Type', value: 'application/json', required: true },
      ],
    }
    const { dataUrl } = useResponseBody(props)
    expect(dataUrl.value).toBe('mockedBlobURL')
  })

  it('returns an empty string for unsupported data types', () => {
    const props = {
      data: null,
      headers: [
        { name: 'Content-Type', value: 'application/json', required: true },
      ],
    }
    const { dataUrl } = useResponseBody(props)
    expect(dataUrl.value).toBe('')
  })
})
