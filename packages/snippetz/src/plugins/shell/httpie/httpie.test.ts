import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { shellHttpie } from './httpie'

describe('httpie', () => {
  it.each(curlCases)('curl: $name', ({ request, configuration }) => {
    expect(shellHttpie.generate(request, configuration)).toMatchSnapshot()
  })
  it('returns a basic request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
    })

    expect(result).toMatchSnapshot()
  })

  it('returns a POST request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
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

    expect(result).toMatchSnapshot()
  })

  it('handles url-encoded form data with special characters', () => {
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

    expect(result).toMatchSnapshot()
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

    expect(result).toMatchSnapshot()
  })

  it('handles special characters in URL', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toMatchSnapshot()
  })

  it('handles multiple headers with same name', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toMatchSnapshot()
  })

  it('handles headers with empty values', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toMatchSnapshot()
  })

  it('handles query string parameters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toMatchSnapshot()
  })
})
