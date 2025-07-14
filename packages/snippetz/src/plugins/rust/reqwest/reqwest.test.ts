import { describe, expect, it } from 'vitest'

import { rustReqwest } from './reqwest'

describe('rustReqwest', () => {
  it('returns a basic request', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('returns a POST request', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.post("https://example.com");

let response = request.send().await?;`)
  })

  it('has headers', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .header("Content-Type", "application/json");

let response = request.send().await?;`)
  })

  it(`doesn't add empty headers`, () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('has JSON body', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .header("Content-Type", "application/json")
    .json(&serde_json::json!({
        "hello": "world"
    }));

let response = request.send().await?;`)
  })

  it('has query string', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com?foo=bar&bar=foo");

let response = request.send().await?;`)
  })

  it('has cookies', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .header("Cookie", "foo=bar; bar=foo");

let response = request.send().await?;`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('adds basic auth credentials', () => {
    const result = rustReqwest.generate(
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .basic_auth("user", "pass");

let response = request.send().await?;`)
  })

  it('omits auth when not provided', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('omits auth when username is missing', () => {
    const result = rustReqwest.generate(
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('omits auth when password is missing', () => {
    const result = rustReqwest.generate(
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('handles special characters in auth credentials', () => {
    const result = rustReqwest.generate(
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .basic_auth("user@example.com", "pass:word!");

let response = request.send().await?;`)
  })

  it('handles undefined auth object', () => {
    const result = rustReqwest.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('handles multipart form data with files', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .multipart({
        let mut form = reqwest::multipart::Form::new();
        let part = reqwest::multipart::Part::text("")
            .file_name("test.txt");
        form = form.part("file", part);
        form = form.text("field", "value");
            form
        });

let response = request.send().await?;`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .form(&[("special chars!@#", "value")]);

let response = request.send().await?;`)
  })

  it('handles binary data flag', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .body("binary content");

let response = request.send().await?;`)
  })

  it('handles compressed response', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .header("Accept-Encoding", "gzip, deflate");

let response = request.send().await?;`)
  })

  it('handles special characters in URL', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com/path with spaces/[brackets]");

let response = request.send().await?;`)
  })

  it('handles special characters in query parameters', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello world & more',
        },
        {
          name: 'special',
          value: '!@#$%^&*()',
        },
      ],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()");

let response = request.send().await?;`)
  })

  it('handles empty URL', () => {
    const result = rustReqwest.generate({
      url: '',
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("");

let response = request.send().await?;`)
  })

  it('handles extremely long URLs', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com/${'a'.repeat(2000)}");

let response = request.send().await?;`)
  })

  it('handles multiple headers with same name', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .header("X-Custom", "value2");

let response = request.send().await?;`)
  })

  it('handles headers with empty values', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client.get("https://example.com");

let response = request.send().await?;`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .multipart({
        let mut form = reqwest::multipart::Form::new();
        form = form.text("file", "");
            form
        });

let response = request.send().await?;`)
  })

  it('handles JSON body with special characters', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .header("Content-Type", "application/json")
    .json(&serde_json::json!({
        "key": "\\"quotes\\" and \\\\backslashes\\\\",
        "nested": {
            "array": [
                "item1",
                null,
                null
            ]
        }
    }));

let response = request.send().await?;`)
  })

  it('handles cookies with special characters', () => {
    const result = rustReqwest.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .get("https://example.com")
    .header("Cookie", "special%3Bcookie=value%20with%20spaces");

let response = request.send().await?;`)
  })

  it('prettifies JSON body', () => {
    const result = rustReqwest.generate({
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

    expect(result).toBe(`let client = reqwest::Client::new();

let request = client
    .post("https://example.com")
    .header("Content-Type", "application/json")
    .json(&serde_json::json!({
        "nested": {
            "array": [
                1,
                2,
                3
            ],
            "object": {
                "foo": "bar"
            }
        },
        "simple": "value"
    }));

let response = request.send().await?;`)
  })
})
