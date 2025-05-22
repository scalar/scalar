import { describe, expect, it } from 'vitest'

import { shellHttpie } from './httpie'

describe('shellHttpie', () => {
  it('returns a basic request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
    })

    expect(result).toBe('http GET https://example.com')
  })

  it('returns a POST request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe('http POST https://example.com')
  })

  it('has headers', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(`http GET https://example.com \\
  Content-Type:application/json`)
  })

  it('handles multipart form data with files', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
          },
          {
            name: 'field',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(`http --multipart POST https://example.com \\
  file@test.txt \\
  field='value'`)
  })

  it.skip('handles url-encoded form data with special characters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'special chars!@#',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(`http --form POST https://example.com/ \\
  'special chars!@#=value'`)
  })

  it('handles binary data', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`echo 'binary content' |  \\
  http POST https://example.com`)
  })

  it('handles special characters in URL', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`http GET 'https://example.com/path%20with%20spaces/[brackets]'`)
  })

  it('handles multiple headers with same name', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`http GET https://example.com \\
  X-Custom:value2`)
  })

  it('handles headers with empty values', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`http GET https://example.com \\
  X-Empty:''`)
  })

  it('handles query string parameters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`http GET 'https://example.com/api?param1=value1&param2=special%20value&param3=123'`)
  })
})
