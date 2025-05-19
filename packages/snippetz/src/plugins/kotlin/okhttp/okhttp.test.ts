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

  it('handles query string parameters', () => {
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
})
