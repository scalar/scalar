import type { FormDataParam } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { kotlinOkhttp } from './okhttp'

describe('kotlinOkhttp', () => {
  it('curl case: returns a basic request', () => {
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

  it('curl case: returns a POST request', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .post(RequestBody.create(null, ""))
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: has headers', () => {
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

  it("curl case: doesn't add empty headers", () => {
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

  it('curl case: has JSON body', () => {
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

  it('curl case: has query string', () => {
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

  it('curl case: joins query string parameters with & when the URL already has a query string', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/api?existing=1&foo=bar")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: quotes a URL whose query string has no other special characters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/api?param1=value1&param2=value2")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: has cookies', () => {
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

  it("curl case: doesn't add empty cookies", () => {
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

  it('curl case: adds basic auth credentials', () => {
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

  it('curl case: omits auth when not provided', () => {
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

  it('curl case: omits auth when username is missing', () => {
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

  it('curl case: omits auth when password is missing', () => {
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

  it('curl case: handles special characters in auth credentials', () => {
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

  it('curl case: handles undefined auth object', () => {
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

  it('curl case: handles multipart form data with files', () => {
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

  it('curl case: handles multipart form data content types on string parts', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'user',
            value: '{"name":"scalar"}',
            contentType: 'application/json;charset=utf-8',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("user", null, RequestBody.create(MediaType.parse("application/json;charset=utf-8"), "{\\"name\\":\\"scalar\\"}"))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: pretty-prints JSON multipart parts alongside file parts', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/widget/v1/widgets',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'filename',
          },
          {
            name: 'props',
            value: '{"name":"","description":"","created_at":null}',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "filename", RequestBody.create(MediaType.parse("application/octet-stream"), File("filename")))
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/json"), "{\\"name\\":\\"\\",\\"description\\":\\"\\",\\"created_at\\":null}"))
  .build()

val request = Request.Builder()
  .url("https://example.com/widget/v1/widgets")
  .post(body)
  .addHeader("Content-Type", "multipart/form-data")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: 'not json',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/json"), "not json"))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles multipart form data content types on files', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
            contentType: 'text/plain',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("text/plain"), File("test.txt")))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles multipart form data with single quotes in parameter name', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
          {
            name: "file'name",
            fileName: 'test.txt',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("field'name", "value")
  .addFormDataPart("file'name", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), File("test.txt")))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles multipart form data with JSON payload', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        text: JSON.stringify({
          foo: 'bar',
        }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("multipart/form-data")
val body = RequestBody.create(mediaType, "{\\"foo\\":\\"bar\\"}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .addHeader("Content-Type", "multipart/form-data")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles url-encoded form data with special characters', () => {
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
  .add("special chars!@#", "value")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles url-encoded form data with single quotes in parameter name', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = FormBody.Builder()
  .add("field'name", "value")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles binary data flag', () => {
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

  it('curl case: handles compressed response', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Accept-Encoding", "gzip, deflate")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles special characters in URL', () => {
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

  it('curl case: handles special characters in query parameters', () => {
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

  it('curl case: handles empty URL', () => {
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

  it('curl case: handles extremely long URLs', () => {
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

  it('curl case: handles multiple headers with same name', () => {
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
  .addHeader("X-Custom", "value1")
  .addHeader("X-Custom", "value2")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles headers with empty values', () => {
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

  it('curl case: handles multipart form data with empty file names', () => {
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

  it('curl case: handles JSON body with special characters', () => {
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

  it('curl case: handles cookies with special characters', () => {
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

  it('curl case: prettifies JSON body', () => {
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
          nested: {
            array: [1, 2, 3],
            object: { foo: 'bar' },
          },
          simple: 'value',
        }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\\"nested\\":{\\"array\\":[1,2,3],\\"object\\":{\\"foo\\":\\"bar\\"}},\\"simple\\":\\"value\\"}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles URLs with dollar sign characters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/path\\$with\\$dollars")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles URLs with dollar signs in query parameters', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'price',
          value: '%24100',
        },
        {
          name: 'currency',
          value: 'USD%24',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com?price=%24100&currency=USD%24")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: handles URLs with dollar signs in path and query', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("https://example.com/api\\$v1/prices?amount=%2450.00")
  .get()
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/vnd.api+json")
val body = RequestBody.create(mediaType, "{\\"a\\":1}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json;charset=utf-8")
val body = RequestBody.create(mediaType, "{\\"a\\":1}")
val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: '{"a":1}',
            contentType: 'application/vnd.custom+json',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/vnd.custom+json"), "{\\"a\\":1}"))
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('curl case: escapes single quotes in JSON body', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "\\"hell'o\\"")
val request = Request.Builder()
  .url("https://editor.scalar.com/test")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`)
  })

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
  .post(RequestBody.create(null, ""))
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
  .add("special chars!@#", "value")
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

  it('passes form data through a custom HTTP method', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'PURGE',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'foo',
            value: 'bar',
          },
        ],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = FormBody.Builder()
  .add("foo", "bar")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .method("PURGE", body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('passes an empty form body to the request builder', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = FormBody.Builder()
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('handles form params without a name', () => {
    const result = kotlinOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        // A name is required by the HAR type, but malformed input can omit it at runtime
        params: [{ value: 'bar' } as FormDataParam],
      },
    })

    expect(result).toBe(`val client = OkHttpClient()

val body = FormBody.Builder()
  .add("", "bar")
  .build()

val request = Request.Builder()
  .url("https://example.com")
  .post(body)
  .build()

val response = client.newCall(request).execute()`)
  })

  it('escapes quotes in the URL', () => {
    const result = kotlinOkhttp.generate({
      url: 'say "hi"',
    })

    expect(result).toBe(`val client = OkHttpClient()

val request = Request.Builder()
  .url("say \\"hi\\"")
  .get()
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
  .addHeader("X-Custom", "value1")
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
