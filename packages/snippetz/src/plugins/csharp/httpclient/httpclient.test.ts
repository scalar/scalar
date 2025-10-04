import { describe, expect, it } from 'vitest'

import { csharpHttpclient } from './httpclient'

describe('csharpHttpclient', () => {
  it('returns a basic GET request', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Get, "https://example.com");

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('returns a POST request', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://example.com");

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles different HTTP methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

    for (const method of methods) {
      const result = csharpHttpclient.generate({
        url: 'https://example.com',
        method: method.toLowerCase(),
      })

      expect(result).toContain(`HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}`)
    }
  })

  it('handles custom HTTP method', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'CUSTOM',
    })

    expect(result).toContain('new HttpMethod("CUSTOM")')
  })

  it('has headers', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
        {
          name: 'X-Custom-Header',
          value: 'custom-value',
        },
      ],
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Get, "https://example.com");
request.Headers.TryAddWithoutValidation("Content-Type", "application/json");
request.Headers.TryAddWithoutValidation("X-Custom-Header", "custom-value");

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles Accept header with MediaTypeWithQualityHeaderValue', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept',
          value: 'application/json',
        },
      ],
    })

    expect(result).toContain('request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));')
  })

  it('handles Authorization header with AuthenticationHeaderValue', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer token123',
        },
      ],
    })

    expect(result).toContain('request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "token123");')
  })

  it('handles Basic auth from configuration', () => {
    const result = csharpHttpclient.generate(
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

    expect(result).toContain('request.Headers.Authorization = new AuthenticationHeaderValue("Basic", "dXNlcjpwYXNz");')
  })

  it('prioritizes explicit Authorization header over configuration auth', () => {
    const result = csharpHttpclient.generate(
      {
        url: 'https://example.com',
        headers: [
          {
            name: 'Authorization',
            value: 'Bearer explicit-token',
          },
        ],
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toContain(
      'request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "explicit-token");',
    )
    expect(result).not.toContain('dXNlcjpwYXNz')
  })

  it('handles cookies', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      cookies: [
        { name: 'sessionId', value: 'abc123' },
        { name: 'theme', value: 'dark' },
      ],
    })

    expect(result).toContain('request.Headers.TryAddWithoutValidation("Cookie", "sessionId=abc123; theme=dark");')
  })

  it('handles query string parameters', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com/api',
      queryString: [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: 'special value' },
        { name: 'param3', value: '123' },
      ],
    })

    expect(result).toContain('"https://example.com/api?param1=value1&param2=special+value&param3=123"')
  })

  it('handles JSON body with raw string literal', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"name":"John","age":30}',
      },
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://example.com");
request.Content = new StringContent(
"""
{
  "name": "John",
  "age": 30
}
""",
System.Text.Encoding.UTF8, "application/json");

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles JSON body with complex nested structure', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"users":[{"id":1,"name":"John","active":true}],"meta":{"count":1}}',
      },
    })

    expect(result).toContain('"""')
    expect(result).toContain('"users"')
    expect(result).toContain('"meta"')
  })

  it('handles invalid JSON gracefully', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: 'invalid json {',
      },
    })

    expect(result).toContain('"""')
    expect(result).toContain('invalid json {')
  })

  it('handles form-urlencoded body with Dictionary', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'email', value: 'user@example.com' },
          { name: 'message', value: 'Hello from HttpClient!' },
          { name: 'category', value: 'feedback' },
        ],
      },
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://example.com");
var formParams = new Dictionary<string, string>
{
  ["email"] = "user@example.com",
  ["message"] = "Hello from HttpClient!",
  ["category"] = "feedback",
};
request.Content = new FormUrlEncodedContent(formParams);

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles form-urlencoded body with duplicate field names using List', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'field', value: 'value1' },
          { name: 'field', value: 'value2' },
        ],
      },
    })

    expect(result).toContain('var formParams = new List<KeyValuePair<string, string>>')
    expect(result).toContain('new("field", "value1"),')
    expect(result).toContain('new("field", "value2"),')
  })

  it('handles multipart form data with files', () => {
    const result = csharpHttpclient.generate({
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

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://example.com");
var content = new MultipartFormDataContent();
content.Add(new StreamContent(File.OpenRead("test.txt")), "file", "test.txt");
content.Add(new StringContent("value"), "field");
request.Content = content;

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles binary data', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`using var client = new HttpClient();

var request = new HttpRequestMessage(HttpMethod.Post, "https://example.com");
var content = new ByteArrayContent(System.Text.Encoding.UTF8.GetBytes("binary content"));
content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
request.Content = content;

using var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
var body = await response.Content.ReadAsStringAsync();`)
  })

  it('handles duplicate headers by keeping the last value', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toContain('request.Headers.TryAddWithoutValidation("X-Custom", "value2");')
    // Should only appear once (last value)
    const matches = result.match(/X-Custom/g)
    expect(matches).toHaveLength(1)
  })

  it('handles headers with empty values', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toContain('request.Headers.TryAddWithoutValidation("X-Empty", "");')
  })

  it('handles raw string literal with quotes', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"message": "He said \\"Hello\\" to me"}',
      },
    })

    expect(result).toContain('"""')
    expect(result).toContain('"He said \\"Hello\\" to me"')
  })

  it('handles raw string literal with triple quotes by using more quotes', () => {
    const result = csharpHttpclient.generate({
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

  it('handles fallback content type', () => {
    const result = csharpHttpclient.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'text/plain',
        text: 'Hello World',
      },
    })

    expect(result).toContain('new StringContent(')
    expect(result).toContain('System.Text.Encoding.UTF8, "text/plain"')
  })

  it('handles complex scenario with all features', () => {
    const result = csharpHttpclient.generate({
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'Accept', value: 'application/json' },
        { name: 'X-API-Version', value: 'v1' },
      ],
      cookies: [{ name: 'session', value: 'abc123' }],
      queryString: [{ name: 'include', value: 'profile' }],
      postData: {
        mimeType: 'application/json',
        text: '{"name":"John","email":"john@example.com"}',
      },
    })

    expect(result).toContain('using var client = new HttpClient();')
    expect(result).toContain('HttpMethod.Post')
    expect(result).toContain('"https://api.example.com/users?include=profile"')
    expect(result).toContain('request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "token123");')
    expect(result).toContain('request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));')
    expect(result).toContain('request.Headers.TryAddWithoutValidation("X-API-Version", "v1");')
    expect(result).toContain('request.Headers.TryAddWithoutValidation("Cookie", "session=abc123");')
    expect(result).toContain('"""')
    expect(result).toContain('"name": "John"')
  })
})
