import { describe, expect, it } from 'vitest'

import { shellWget } from './wget'

describe('shellWget', () => {
  it('returns a basic request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('returns a POST request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --output-document \\
  - https://example.com`)
  })

  it('has headers', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Content-Type: application/json' \\
  --output-document \\
  - https://example.com`)
  })

  it.skip('handles multipart form data with files', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-file='test.txt' \\
  --body-data 'field=value' \\
  --output-document \\
  - https://example.com`)
  })

  it.skip('handles url-encoded form data with special characters', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'special%20chars!%40%23=value' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles binary data', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'binary content' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles special characters in URL', () => {
    const result = shellWget.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com/path%20with%20spaces/[brackets]'`)
  })

  it('handles multiple headers with same name', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'X-Custom: value2' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles headers with empty values', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'X-Empty: ' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles query string parameters', () => {
    const result = shellWget.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com/api?param1=value1&param2=special%20value&param3=123'`)
  })
})
