import { describe, expect, it } from 'vitest'

import { jsXhr } from './xhr'

describe('xhr', () => {
  it('returns a basic request', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('returns a POST request', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('has headers', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it("doesn't add empty headers", () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('has JSON body', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"hello\\":\\"world\\"}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('has query string', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com?foo=bar&bar=foo");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('joins query string parameters with & when the URL already has a query string', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/api?existing=1&foo=bar");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('quotes a URL whose query string has no other special characters', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/api?param1=value1&param2=value2");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('has cookies', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`// Run on the request origin to set these cookies in the browser.
document.cookie = "foo=bar; path=/";
document.cookie = "bar=foo; path=/";
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it("doesn't add empty cookies", () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('adds basic auth credentials', () => {
    const result = jsXhr.generate(
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Authorization", "Basic dXNlcjpwYXNz");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('omits auth when not provided', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('omits auth when username is missing', () => {
    const result = jsXhr.generate(
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('omits auth when password is missing', () => {
    const result = jsXhr.generate(
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles special characters in auth credentials', () => {
    const result = jsXhr.generate(
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Authorization", "Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles undefined auth object', () => {
    const result = jsXhr.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data with files', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
body.append("file", new File([files[0]], "test.txt", { type: "application/octet-stream" }));
body.append("field", "value");
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data content types on string parts', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
body.append("user", new Blob(["{\\"name\\":\\"scalar\\"}"], { type: "application/json;charset=utf-8" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('pretty-prints JSON multipart parts alongside file parts', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
body.append("file", new File([files[0]], "filename", { type: "application/octet-stream" }));
body.append("props", new Blob(["{\\"name\\":\\"\\",\\"description\\":\\"\\",\\"created_at\\":null}"], { type: "application/json" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com/widget/v1/widgets");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
body.append("props", new Blob(["not json"], { type: "application/json" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data content types on files', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
body.append("file", new File([files[0]], "test.txt", { type: "text/plain" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
body.append("field'name", "value");
body.append("file'name", new File([files[0]], "test.txt", { type: "application/octet-stream" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data with JSON payload', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "multipart/form-data");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"foo\\":\\"bar\\"}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles url-encoded form data with special characters', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new URLSearchParams();
body.append("special chars!@#", "value");
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body.toString());`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new URLSearchParams();
body.append("field'name", "value");
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body.toString());`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles binary data flag', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/octet-stream");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("binary content");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles compressed response', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Accept-Encoding", "gzip, deflate");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles special characters in URL', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/path with spaces/[brackets]");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles special characters in query parameters', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles empty URL', () => {
    const result = jsXhr.generate({
      url: '',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles extremely long URLs', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/${'a'.repeat(2000)}");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multiple headers with same name', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("X-Custom", "value1");
xhr.setRequestHeader("X-Custom", "value2");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles headers with empty values', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("X-Empty", "");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles multipart form data with empty file names', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
body.append("file", new File([files[0]], "", { type: "application/octet-stream" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles JSON body with special characters', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles cookies with special characters', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`// Run on the request origin to set these cookies in the browser.
document.cookie = "special%3Bcookie=value%20with%20spaces; path=/";
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('prettifies JSON body', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"nested\\":{\\"array\\":[1,2,3],\\"object\\":{\\"foo\\":\\"bar\\"}},\\"simple\\":\\"value\\"}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles URLs with dollar sign characters', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/path$with$dollars");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com?price=%24100&currency=USD%24");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = jsXhr.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/api$v1/prices?amount=%2450.00");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/vnd.api+json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"a\\":1}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = jsXhr.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("{\\"a\\":1}");`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = jsXhr.generate({
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

    expect(result).toBe(`const body = new FormData();
body.append("props", new Blob(["{\\"a\\":1}"], { type: "application/vnd.custom+json" }));
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(body);`)
    expect(() => new Function(result)).not.toThrow()
  })

  it('escapes single quotes in JSON body', () => {
    const result = jsXhr.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`const xhr = new XMLHttpRequest();
xhr.open("POST", "https://editor.scalar.com/test");
xhr.withCredentials = true;
xhr.setRequestHeader("Content-Type", "application/json");
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send("\\"hell'o\\"");`)
    expect(() => new Function(result)).not.toThrow()
  })
  it('includes existing browser credentials without HAR cookies', () => {
    expect(jsXhr.generate({ url: 'https://api.example.com/account' })).toBe(`const xhr = new XMLHttpRequest();
xhr.open("GET", "https://api.example.com/account");
xhr.withCredentials = true;
xhr.addEventListener("load", () => console.log(xhr.responseText));
xhr.send(null);`)
  })
})
