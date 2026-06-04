import { describe, expect, it } from 'vitest'

import { csharpRestsharp } from './restsharp'

describe('csharpRestsharp', () => {
  it('returns a basic request', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
var response = await client.ExecuteAsync(request);`)
  })

  it('returns a POST request', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
var response = await client.ExecuteAsync(request);`)
  })

  it('handles different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

    for (const method of methods) {
      const result = csharpRestsharp.generate({
        url: 'https://example.com',
        method: method.toLowerCase(),
      })

      expect(result).toContain(`Method.${method.charAt(0) + method.slice(1).toLowerCase()}`)
    }
  })

  it('has headers', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
request.AddHeader("Content-Type", "application/json");
var response = await client.ExecuteAsync(request);`)
  })

  it(`doesn't add empty headers`, () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
var response = await client.ExecuteAsync(request);`)
  })

  it('has JSON body', () => {
    const result = csharpRestsharp.generate({
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddHeader("Content-Type", "application/json");
request.AddStringBody("""
{
  "hello": "world"
}
""", ContentType.Json);
var response = await client.ExecuteAsync(request);`)
  })

  it('has query string', () => {
    const result = csharpRestsharp.generate({
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

    expect(result).toBe(`var client = new RestClient("https://example.com?foo=bar&bar=foo");
var request = new RestRequest("", Method.Get);
var response = await client.ExecuteAsync(request);`)
  })

  it('has cookies', () => {
    const result = csharpRestsharp.generate({
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
request.AddCookie("foo", "bar", "/", "example.com");
request.AddCookie("bar", "foo", "/", "example.com");
var response = await client.ExecuteAsync(request);`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
var response = await client.ExecuteAsync(request);`)
  })

  it('adds basic auth credentials', () => {
    const result = csharpRestsharp.generate(
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
request.AddHeader("Authorization", "Basic dXNlcjpwYXNz");
var response = await client.ExecuteAsync(request);`)
  })

  it('omits auth when not provided', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('Authorization')
  })

  it('omits auth when username is missing', () => {
    const result = csharpRestsharp.generate(
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

    expect(result).not.toContain('Authorization')
  })

  it('omits auth when password is missing', () => {
    const result = csharpRestsharp.generate(
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

    expect(result).not.toContain('Authorization')
  })

  it('handles undefined auth object', () => {
    const result = csharpRestsharp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).not.toContain('Authorization')
  })

  it('handles multipart form data with files', () => {
    const result = csharpRestsharp.generate({
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddFile("file", "test.txt");
request.AddParameter("field", "value");
var response = await client.ExecuteAsync(request);`)
  })

  it('handles multipart form data content types on files', () => {
    const result = csharpRestsharp.generate({
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddFile("file", "test.txt", "text/plain");
var response = await client.ExecuteAsync(request);`)
  })

  it('handles url-encoded form data', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
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

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddParameter("foo", "bar");
var response = await client.ExecuteAsync(request);`)
  })

  it('handles binary data', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddParameter("application/octet-stream", "binary content", ParameterType.RequestBody);
var response = await client.ExecuteAsync(request);`)
  })

  it('handles a plain text body as a raw parameter', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'text/plain',
        text: 'Hello World',
      },
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Post);
request.AddParameter("text/plain", "Hello World", ParameterType.RequestBody);
var response = await client.ExecuteAsync(request);`)
  })

  it('handles multiple headers with same name', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
request.AddHeader("X-Custom", "value1");
request.AddHeader("X-Custom", "value2");
var response = await client.ExecuteAsync(request);`)
  })

  it('handles headers with empty values', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`var client = new RestClient("https://example.com");
var request = new RestRequest("", Method.Get);
request.AddHeader("X-Empty", "");
var response = await client.ExecuteAsync(request);`)
  })

  it('escapes double quotes in header values', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Custom', value: 'say "hello"' }],
    })

    expect(result).toContain('request.AddHeader("X-Custom", "say \\"hello\\"");')
  })

  it('falls back to raw text for invalid JSON bodies', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: 'invalid json {',
      },
    })

    expect(result).toContain(`request.AddStringBody("""
invalid json {
""", ContentType.Json);`)
  })

  it('pretty-prints JSON bodies whose mimeType uses a +json suffix', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toContain(`request.AddStringBody("""
{
  "a": 1
}
""", ContentType.Json);`)
  })

  it('pretty-prints JSON bodies whose mimeType includes a charset parameter', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toContain(`request.AddStringBody("""
{
  "a": 1
}
""", ContentType.Json);`)
  })

  it('grows the raw string delimiter when the body contains triple quotes', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"message": "He said """Hello""" to me"}',
      },
    })

    expect(result).toContain('""""')
    expect(result).toContain('"""Hello"""')
  })

  it('handles special characters in URL', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toContain('var client = new RestClient("https://example.com/path with spaces/[brackets]");')
  })

  it('handles empty URL', () => {
    const result = csharpRestsharp.generate({
      url: '',
    })

    expect(result).toBe(`var client = new RestClient("");
var request = new RestRequest("", Method.Get);
var response = await client.ExecuteAsync(request);`)
  })

  it('handles a custom HTTP method', () => {
    const result = csharpRestsharp.generate({
      url: 'https://example.com',
      method: 'purge',
    })

    expect(result).toContain('var request = new RestRequest("", Method.Purge);')
  })

  it('handles complex scenario with all features', () => {
    const result = csharpRestsharp.generate(
      {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: [{ name: 'Accept', value: 'application/json' }],
        cookies: [{ name: 'session', value: 'abc123' }],
        queryString: [{ name: 'include', value: 'profile' }],
        postData: {
          mimeType: 'application/json',
          text: '{"name":"John"}',
        },
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toBe(`var client = new RestClient("https://api.example.com/users?include=profile");
var request = new RestRequest("", Method.Post);
request.AddHeader("Authorization", "Basic dXNlcjpwYXNz");
request.AddHeader("Accept", "application/json");
request.AddCookie("session", "abc123", "/", "api.example.com");
request.AddStringBody("""
{
  "name": "John"
}
""", ContentType.Json);
var response = await client.ExecuteAsync(request);`)
  })
})
