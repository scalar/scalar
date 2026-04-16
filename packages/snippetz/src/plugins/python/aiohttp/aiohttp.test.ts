import { describe, expect, it } from 'vitest'

import { pythonAiohttp } from './aiohttp'

describe('pythonAiohttp', () => {
  it('returns a basic request', () => {
    const result = pythonAiohttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.get("https://example.com")`)
  })

  it('returns a POST request', () => {
    const result = pythonAiohttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.post("https://example.com")`)
  })

  it('has headers', () => {
    const result = pythonAiohttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.get("https://example.com",
        headers={
          "Content-Type": "application/json"
        }
    )`)
  })

  it('has query string', () => {
    const result = pythonAiohttp.generate({
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

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.get("https://example.com",
        params={
          "foo": "bar",
          "bar": "foo"
        }
    )`)
  })

  it('preserves repeated query parameters as arrays', () => {
    const result = pythonAiohttp.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'statuses',
          value: 'active',
        },
        {
          name: 'statuses',
          value: 'inactive',
        },
      ],
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.get("https://example.com",
        params={
          "statuses": [
            "active",
            "inactive"
          ]
        }
    )`)
  })

  it('adds session auth and cookies', () => {
    const result = pythonAiohttp.generate(
      {
        url: 'https://example.com',
        cookies: [
          {
            name: 'sessionid',
            value: '123',
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

    expect(result).toBe(`async with aiohttp.ClientSession(
    cookies={
      "sessionid": "123"
    },
    auth=aiohttp.BasicAuth("user", "pass")
) as session:
    await session.get("https://example.com")`)
  })

  it('has JSON body', () => {
    const result = pythonAiohttp.generate({
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
          enabled: true,
          maybe: null,
        }),
      },
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "hello": "world",
          "enabled": True,
          "maybe": None
        }
    )`)
  })

  it('handles multipart form data with files and inline fields', () => {
    const result = pythonAiohttp.generate({
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
          {
            name: 'metadata',
            value: '{"foo":"bar"}',
            contentType: 'application/json',
          },
          {
            name: 'field',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    data = aiohttp.FormData()
    data.add_field("file", open("test.txt", "rb"), filename="test.txt", content_type="text/plain")
    data.add_field("metadata", "{\\"foo\\":\\"bar\\"}", content_type="application/json")
    data.add_field("field", "value")
    await session.post("https://example.com",
        data=data
    )`)
  })

  it('handles url-encoded form data', () => {
    const result = pythonAiohttp.generate({
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

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.post("https://example.com",
        data={
          "special chars!@#": "value"
        }
    )`)
  })

  it('handles special characters in a long URL', () => {
    const result = pythonAiohttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`async with aiohttp.ClientSession() as session:
    await session.get(
        "https://example.com/path with spaces/[brackets]"
    )`)
  })
})
