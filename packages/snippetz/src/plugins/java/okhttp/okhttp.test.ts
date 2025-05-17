import { describe, expect, it } from 'vitest'

import { javaOkhttp } from './okhttp'

describe('javaOkhttp', () => {
  it('returns a basic request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .get()
  .build();

Response response = client.newCall(request).execute();`)
  })

  it('returns a POST request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .post(null)
  .build();

Response response = client.newCall(request).execute();`)
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
    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("Content-Type", "application/json")
  .build();

Response response = client.newCall(request).execute();`)
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

MultipartBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), new File("test.txt")))
  .addFormDataPart("field", "value")
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .post(body)
  .build();

Response response = client.newCall(request).execute();`)
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

MediaType mediaType = MediaType.parse("application/octet-stream");
RequestBody body = RequestBody.create(mediaType, "binary content");
Request request = new Request.Builder()
  .url("https://example.com")
  .post(body)
  .build();

Response response = client.newCall(request).execute();`)
  })

  it('handles special characters in URL', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/path%20with%20spaces/[brackets]")
  .get()
  .build();

Response response = client.newCall(request).execute();`)
  })

  it('handles multiple headers with same name', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("X-Custom", "value2")
  .build();

Response response = client.newCall(request).execute();`)
  })

  it('handles headers with empty values', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .get()
  .addHeader("X-Empty", "")
  .build();

Response response = client.newCall(request).execute();`)
  })

  it('handles query string parameters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/api?param1=value1&param2=special%20value&param3=123")
  .get()
  .build();

Response response = client.newCall(request).execute();`)
  })
})
