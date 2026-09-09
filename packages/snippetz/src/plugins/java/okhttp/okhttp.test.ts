import { describe, expect, it } from 'vitest'

import { curlCases } from '@/fixtures/curl-cases'

import { javaOkhttp } from './okhttp'

describe('okhttp', () => {
  it.each(curlCases)('curl: $name', ({ request, configuration }) => {
    expect(javaOkhttp.generate(request, configuration)).toMatchSnapshot()
  })
  it('returns a basic request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toMatchSnapshot()
  })

  it('returns a POST request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toMatchSnapshot()
  })

  it('has headers', () => {
    const result = javaOkhttp.generate({
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
    const result = javaOkhttp.generate({
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

  it('handles binary data', () => {
    const result = javaOkhttp.generate({
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
    const result = javaOkhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toMatchSnapshot()
  })

  it('handles multiple headers with same name', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toMatchSnapshot()
  })

  it('handles headers with empty values', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toMatchSnapshot()
  })

  it('handles query string parameters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toMatchSnapshot()
  })
})
