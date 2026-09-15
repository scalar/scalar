import { describe, expect, it } from 'vitest'

import { javaAsynchttp } from './asynchttp'

describe('asynchttp', () => {
  it('returns a basic request', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('returns a POST request', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('has headers', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Content-Type", "application/json")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it("doesn't add empty headers", () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('has JSON body', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"hello\\":\\"world\\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/json")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('has query string', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com?foo=bar&bar=foo")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('joins query string parameters with & when the URL already has a query string', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/api?existing=1&foo=bar")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('quotes a URL whose query string has no other special characters', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/api?param1=value1&param2=value2")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('has cookies', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Cookie", "foo=bar; bar=foo")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it("doesn't add empty cookies", () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('adds basic auth credentials', () => {
    const result = javaAsynchttp.generate(
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Authorization", "Basic dXNlcjpwYXNz")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('omits auth when not provided', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('omits auth when username is missing', () => {
    const result = javaAsynchttp.generate(
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('omits auth when password is missing', () => {
    const result = javaAsynchttp.generate(
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles special characters in auth credentials', () => {
    const result = javaAsynchttp.generate(
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Authorization", "Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles undefined auth object', () => {
    const result = javaAsynchttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data with files', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"file\\"; filename=\\"test.txt\\"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("test.txt")));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"field\\"\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("value".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data content types on string parts', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"user\\"\\r\\nContent-Type: application/json;charset=utf-8\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("{\\"name\\":\\"scalar\\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('pretty-prints JSON multipart parts alongside file parts', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"file\\"; filename=\\"filename\\"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("filename")));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"props\\"\\r\\nContent-Type: application/json\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("{\\"name\\":\\"\\",\\"description\\":\\"\\",\\"created_at\\":null}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com/widget/v1/widgets")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"props\\"\\r\\nContent-Type: application/json\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("not json".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data content types on files', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"file\\"; filename=\\"test.txt\\"\\r\\nContent-Type: text/plain\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("test.txt")));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"field'name\\"\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("value".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"file'name\\"; filename=\\"test.txt\\"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("test.txt")));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"foo\\":\\"bar\\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("special+chars%21%40%23=value".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/x-www-form-urlencoded")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("field%27name=value".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/x-www-form-urlencoded")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles binary data flag', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("binary content".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/octet-stream")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles compressed response', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Accept-Encoding", "gzip, deflate")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles special characters in URL', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/path%20with%20spaces/[brackets]")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles special characters in query parameters', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles empty URL', () => {
    const result = javaAsynchttp.generate({
      url: '',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles extremely long URLs', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/${'a'.repeat(2000)}")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multiple headers with same name', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("X-Custom", "value1")
    .addHeader("X-Custom", "value2")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles headers with empty values', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("X-Empty", "")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"file\\"; filename=\\"\\"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("")));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles JSON body with special characters', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/json")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles cookies with special characters', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com")
    .addHeader("Cookie", "special%3Bcookie=value%20with%20spaces")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('prettifies JSON body', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"nested\\":{\\"array\\":[1,2,3],\\"object\\":{\\"foo\\":\\"bar\\"}},\\"simple\\":\\"value\\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/json")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/path$with$dollars")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com?price=%24100&currency=USD%24")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("GET", "https://example.com/api$v1/prices?amount=%2450.00")
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"a\\":1}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/vnd.api+json")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = javaAsynchttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("{\\"a\\":1}".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "application/json;charset=utf-8")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = javaAsynchttp.generate({
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

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("--scalar-boundary\\r\\nContent-Disposition: form-data; name=\\"props\\"\\r\\nContent-Type: application/vnd.custom+json\\r\\n\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("{\\"a\\":1}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));
body.write("--scalar-boundary--\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://example.com")
    .addHeader("Content-Type", "multipart/form-data; boundary=scalar-boundary")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })

  it('escapes single quotes in JSON body', () => {
    const result = javaAsynchttp.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
body.write("\\"hell'o\\"".getBytes(java.nio.charset.StandardCharsets.UTF_8));

try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {
  Response response = client.prepare("POST", "https://editor.scalar.com/test")
    .addHeader("Content-Type", "application/json")
    .setBody(body.toByteArray())
    .execute()
    .get();
  System.out.println(response.getResponseBody());
}`)
  })
})
