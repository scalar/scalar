import { describe, expect, it } from 'vitest'

import { kotlinOkhttp } from './okhttp'

describe('kotlinOkhttp', () => {
  it('returns a basic request', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('returns a POST request', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .post(null)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('has headers', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`)
  })

  it(`doesn't add empty headers`, () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('has JSON body', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\\"hello\\":\\"world\\"}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('has query string', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com?foo=bar&bar=foo")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('has cookies', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Cookie", "foo=bar; bar=foo")
  .build()

val response = client.newCall(request).execute()`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('adds basic auth credentials', () => {
    const result = kotlinOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Authorization", Credentials.basic("user", "pass"))
  .build()

val response = client.newCall(request).execute()`)
  })

  it('omits auth when not provided', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('omits auth when username is missing', () => {
    const result = kotlinOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: '',
          password: 'pass',
        },
      },
    )

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('omits auth when password is missing', () => {
    const result = kotlinOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: '',
        },
      },
    )

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles special characters in auth credentials', () => {
    const result = kotlinOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user@example.com',
          password: 'pass:word!',
        },
      },
    )

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Authorization", Credentials.basic("user@example.com", "pass:word!"))
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles undefined auth object', () => {
    const result = kotlinOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles multipart form data with files', () => {
    const result = kotlinOkhttp.generate({
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

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), File("test.txt")))
  .addFormDataPart("field", "value")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: '',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "", RequestBody.create(MediaType.parse("application/octet-stream"), File("")))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles url-encoded form data', () => {
    const result = kotlinOkhttp.generate({
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

    expect(result).toBe(`val client = OkHttpClient()

val body = FormBody.Builder()
  .addEncoded("special chars!@#", "value")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles binary data', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/octet-stream")
val body = RequestBody.create(mediaType, "binary content")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles a custom HTTP method with a body', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'PURGE',
      postData: {
        mimeType: 'application/json',
        text: '{"a":1}',
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\\"a\\":1}")
val request = Request.Builder()
  .url("https://example.com")
  .method("PURGE", body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles special characters in URL', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/path%20with%20spaces/[brackets]")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles multiple headers with same name', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("X-Custom", "value2")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles headers with empty values', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("X-Empty", "")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles cookies with special characters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Cookie", "special%3Bcookie=value%20with%20spaces")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles JSON body with special characters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          key: '"quotes" and \\backslashes\\',
          nested: {
            array: ['item1', null, undefined],
          },
        }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles special characters in query parameters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello%20world%20%26%20more',
        },
        {
          name: 'special',
          value: '!%40%23%24%25%5E%26*()',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles query string parameters embedded in the URL', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/api?param1=value1&param2=special%20value&param3=123")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles empty URL', () => {
    const result = kotlinOkhttp.generate({
      url: '',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles extremely long URLs', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/${'a'.repeat(2000)}")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })
})
