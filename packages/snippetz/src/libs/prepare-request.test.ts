import { describe, expect, it } from 'vitest'

import { prepareRequest } from './prepare-request'

describe('prepare-request', () => {
  it('accepts an omitted request', () => {
    expect(prepareRequest()).toStrictEqual({ url: '', method: 'GET', headers: [], body: undefined })
  })

  it('preserves queries, repeated headers, cookies, and basic authentication without mutating the request', () => {
    const request = {
      url: 'https://example.com/?existing=1',
      method: 'patch',
      queryString: [
        { name: 'tag', value: 'one' },
        { name: 'tag', value: 'two%20words' },
      ],
      headers: [
        { name: 'X-Custom', value: 'one' },
        { name: 'X-Custom', value: '' },
      ],
      cookies: [{ name: 'a;b', value: 'c d' }],
    }
    const original = structuredClone(request)
    expect(prepareRequest(request, { auth: { username: 'user', password: 'pass' } })).toStrictEqual({
      url: 'https://example.com?existing=1&tag=one&tag=two%20words',
      method: 'PATCH',
      headers: [
        { name: 'X-Custom', value: 'one' },
        { name: 'X-Custom', value: '' },
        { name: 'Cookie', value: 'a%3Bb=c%20d' },
        { name: 'Authorization', value: 'Basic dXNlcjpwYXNz' },
      ],
      body: undefined,
    })
    expect(request).toStrictEqual(original)
  })

  it('encodes repeated form fields and missing values', () => {
    expect(
      prepareRequest({
        postData: {
          mimeType: 'application/x-www-form-urlencoded',
          params: [{ name: 'a&b', value: 'hello + world' }, { name: 'a&b', value: '' }, { name: 'empty' }],
        },
      }).body,
    ).toStrictEqual([{ text: 'a%26b=hello+%2B+world&a%26b=&empty=' }])
  })

  it('preserves an explicitly empty body and case-insensitive content type overrides', () => {
    expect(
      prepareRequest({
        headers: [{ name: 'content-type', value: 'application/custom' }],
        postData: { mimeType: 'text/plain', text: '' },
      }),
    ).toStrictEqual({
      url: '',
      method: 'GET',
      headers: [{ name: 'content-type', value: 'application/custom' }],
      body: [{ text: '' }],
    })
  })

  it('serializes multipart fields with matching boundaries, content types, and file reads', () => {
    expect(
      prepareRequest({
        headers: [{ name: 'CONTENT-TYPE', value: 'multipart/form-data' }],
        postData: {
          mimeType: 'multipart/form-data',
          params: [
            { name: 'props', value: '{"a":1}', contentType: 'application/vnd.custom+json' },
            { name: 'file', fileName: 'photo.png', contentType: 'image/png' },
          ],
        },
      }),
    ).toStrictEqual({
      url: '',
      method: 'GET',
      headers: [{ name: 'Content-Type', value: 'multipart/form-data; boundary=scalar-boundary' }],
      body: [
        {
          text: '--scalar-boundary\r\nContent-Disposition: form-data; name="props"\r\nContent-Type: application/vnd.custom+json\r\n\r\n',
        },
        { text: '{"a":1}' },
        { text: '\r\n' },
        {
          text: '--scalar-boundary\r\nContent-Disposition: form-data; name="file"; filename="photo.png"\r\nContent-Type: image/png\r\n\r\n',
        },
        { file: 'photo.png' },
        { text: '\r\n' },
        { text: '--scalar-boundary--\r\n' },
      ],
    })
  })

  it('avoids a boundary appearing in a field and escapes disposition names', () => {
    const result = prepareRequest({
      postData: { mimeType: 'multipart/form-data', params: [{ name: 'a"\r\nb', value: 'scalar-boundary' }] },
    })
    expect(result.headers).toStrictEqual([
      { name: 'Content-Type', value: 'multipart/form-data; boundary=scalar-boundary-' },
    ])
    expect(result.body).toStrictEqual([
      { text: '--scalar-boundary-\r\nContent-Disposition: form-data; name="a%22%0D%0Ab"\r\n\r\n' },
      { text: 'scalar-boundary' },
      { text: '\r\n' },
      { text: '--scalar-boundary---\r\n' },
    ])
  })
})
