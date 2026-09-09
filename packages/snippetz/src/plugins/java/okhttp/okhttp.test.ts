import { describe, expect, it } from 'vitest'

import { javaOkhttp } from './okhttp'

describe('okhttp', () => {
  it('curl: returns a basic request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: returns a POST request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", RequestBody.create(null, ""))
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: has headers', () => {
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
  .method("GET", null)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it("curl: doesn't add empty headers", () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: has JSON body', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/json"), "{\\"hello\\":\\"world\\"}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: has query string', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com?foo=bar&bar=foo")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: joins query string parameters with & when the URL already has a query string', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/api?existing=1&foo=bar")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: quotes a URL whose query string has no other special characters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/api?param1=value1&param2=value2")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: has cookies', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("Cookie", "foo=bar; bar=foo")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it("curl: doesn't add empty cookies", () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: adds basic auth credentials', () => {
    const result = javaOkhttp.generate(
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("Authorization", "Basic dXNlcjpwYXNz")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: omits auth when not provided', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: omits auth when username is missing', () => {
    const result = javaOkhttp.generate(
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: omits auth when password is missing', () => {
    const result = javaOkhttp.generate(
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles special characters in auth credentials', () => {
    const result = javaOkhttp.generate(
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("Authorization", "Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles undefined auth object', () => {
    const result = javaOkhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data with files', () => {
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

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), new java.io.File("test.txt")))
  .addFormDataPart("field", "value")
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data content types on string parts', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("user", null, RequestBody.create(MediaType.parse("application/json;charset=utf-8"), "{\\"name\\":\\"scalar\\"}"))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: pretty-prints JSON multipart parts alongside file parts', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "filename", RequestBody.create(MediaType.parse("application/octet-stream"), new java.io.File("filename")))
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/json"), "{\\"name\\":\\"\\",\\"description\\":\\"\\",\\"created_at\\":null}"))
  .build();

Request request = new Request.Builder()
  .url("https://example.com/widget/v1/widgets")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/json"), "not json"))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data content types on files', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("text/plain"), new java.io.File("test.txt")))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data with single quotes in parameter name', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("field'name", "value")
  .addFormDataPart("file'name", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), new java.io.File("test.txt")))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data with JSON payload', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("multipart/form-data"), "{\\"foo\\":\\"bar\\"}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "multipart/form-data")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles url-encoded form data with special characters', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new FormBody.Builder()
  .add("special chars!@#", "value")
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/x-www-form-urlencoded")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles url-encoded form data with single quotes in parameter name', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new FormBody.Builder()
  .add("field'name", "value")
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/x-www-form-urlencoded")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles binary data flag', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/octet-stream"), "binary content");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/octet-stream")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles compressed response', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("Accept-Encoding", "gzip, deflate")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles special characters in URL', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/path%20with%20spaces/[brackets]")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles special characters in query parameters', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles empty URL', () => {
    const result = javaOkhttp.generate({
      url: '',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles extremely long URLs', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/${'a'.repeat(2000)}")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multiple headers with same name', () => {
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
  .method("GET", null)
  .addHeader("X-Custom", "value1")
  .addHeader("X-Custom", "value2")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles headers with empty values', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("X-Empty", "")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles multipart form data with empty file names', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "", RequestBody.create(MediaType.parse("application/octet-stream"), new java.io.File("")))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles JSON body with special characters', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/json"), "{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles cookies with special characters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("Cookie", "special%3Bcookie=value%20with%20spaces")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: prettifies JSON body', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/json"), "{\\"nested\\":{\\"array\\":[1,2,3],\\"object\\":{\\"foo\\":\\"bar\\"}},\\"simple\\":\\"value\\"}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles URLs with dollar sign characters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/path$with$dollars")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles URLs with dollar signs in query parameters', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com?price=%24100&currency=USD%24")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: handles URLs with dollar signs in path and query', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/api$v1/prices?amount=%2450.00")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/vnd.api+json"), "{\\"a\\":1}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/vnd.api+json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/json;charset=utf-8"), "{\\"a\\":1}");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/json;charset=utf-8")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = javaOkhttp.generate({
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

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("props", null, RequestBody.create(MediaType.parse("application/vnd.custom+json"), "{\\"a\\":1}"))
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('curl: escapes single quotes in JSON body', () => {
    const result = javaOkhttp.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

RequestBody body = RequestBody.create(MediaType.parse("application/json"), "\\"hell'o\\"");

Request request = new Request.Builder()
  .url("https://editor.scalar.com/test")
  .method("POST", body)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })
  it('returns a basic request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('returns a POST request', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", RequestBody.create(null, ""))
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
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
  .method("GET", null)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
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

RequestBody body = new MultipartBody.Builder()
  .setType(MultipartBody.FORM)
  .addFormDataPart("file", "test.txt", RequestBody.create(MediaType.parse("application/octet-stream"), new java.io.File("test.txt")))
  .addFormDataPart("field", "value")
  .build();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
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

RequestBody body = RequestBody.create(MediaType.parse("application/octet-stream"), "binary content");

Request request = new Request.Builder()
  .url("https://example.com")
  .method("POST", body)
  .addHeader("Content-Type", "application/octet-stream")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('handles special characters in URL', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/path%20with%20spaces/[brackets]")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
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
  .method("GET", null)
  .addHeader("X-Custom", "value1")
  .addHeader("X-Custom", "value2")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('handles headers with empty values', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("GET", null)
  .addHeader("X-Empty", "")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })

  it('handles query string parameters', () => {
    const result = javaOkhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com/api?param1=value1&param2=special%20value&param3=123")
  .method("GET", null)
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })
  it.each(['GET', 'HEAD'])('omits an empty body for %s requests', (method) => {
    expect(
      javaOkhttp.generate({ url: 'https://example.com', method, postData: { mimeType: 'application/json', text: '' } }),
    ).toBe(`OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
  .url("https://example.com")
  .method("${method}", null)
  .addHeader("Content-Type", "application/json")
  .build();

try (Response response = client.newCall(request).execute()) {
  System.out.println(response.body().string());
}`)
  })
})
