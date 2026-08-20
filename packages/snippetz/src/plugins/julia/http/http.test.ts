import { describe, expect, it } from 'vitest'

import { juliaHttp } from './http'

describe('juliaHttp', () => {
  it('returns a basic GET request', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`using HTTP

response = HTTP.get("https://example.com")

println(String(response.body))`)
  })

  it('returns a POST request', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'POST',
    })

    expect(result).toBe(`using HTTP

response = HTTP.post("https://example.com")

println(String(response.body))`)
  })

  it('uses HTTP.request for uncommon methods', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'PURGE',
    })

    expect(result).toBe(`using HTTP

response = HTTP.request("PURGE", "https://example.com")

println(String(response.body))`)
  })

  it('has a single header', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'Authorization', value: 'Bearer token123' }],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com",
    ["Authorization" => "Bearer token123"]
)

println(String(response.body))`)
  })

  it('has headers', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Accept', value: 'text/plain' },
      ],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com",
    [
        "Content-Type" => "application/json",
        "Accept" => "text/plain"
    ]
)

println(String(response.body))`)
  })

  it('deduplicates headers', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'Accept', value: 'text/plain' },
        { name: 'Accept', value: 'application/json' },
      ],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com",
    ["Accept" => "application/json"]
)

println(String(response.body))`)
  })

  it('has query parameters', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      queryString: [
        { name: 'foo', value: 'bar' },
        { name: 'baz', value: 'qux' },
      ],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com";
    query = [
        "foo" => "bar",
        "baz" => "qux"
    ]
)

println(String(response.body))`)
  })

  it('repeats query parameters with the same name', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      queryString: [
        { name: 'tag', value: 'one' },
        { name: 'tag', value: 'two' },
      ],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com";
    query = [
        "tag" => "one",
        "tag" => "two"
    ]
)

println(String(response.body))`)
  })

  it('has cookies', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      cookies: [{ name: 'session', value: 'abc123' }],
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com";
    cookies = Dict("session" => "abc123")
)

println(String(response.body))`)
  })

  it('has basic authentication', () => {
    const result = juliaHttp.generate(
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

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com";
    basicauth = ("user", "pass")
)

println(String(response.body))`)
  })

  it('has a JSON body', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '{"name":"alice","age":30,"active":true,"tags":["a","b"],"address":{"city":"Berlin"},"nickname":null}',
      },
    })

    expect(result).toBe(`using HTTP
using JSON

response = HTTP.post(
    "https://example.com",
    ["Content-Type" => "application/json"],
    JSON.json(Dict(
        "name" => "alice",
        "age" => 30,
        "active" => true,
        "tags" => [
            "a",
            "b"
        ],
        "address" => Dict("city" => "Berlin"),
        "nickname" => nothing
    ))
)

println(String(response.body))`)
  })

  it('sends invalid JSON as a plain string', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{ not json }',
      },
    })

    expect(result).toBe(`using HTTP

response = HTTP.post(
    "https://example.com";
    body = "{ not json }"
)

println(String(response.body))`)
  })

  it('has a form url encoded body', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'foo', value: 'bar' },
          { name: 'baz', value: 'qux' },
        ],
      },
    })

    expect(result).toBe(`using HTTP

response = HTTP.post(
    "https://example.com",
    ["Content-Type" => "application/x-www-form-urlencoded"],
    Dict(
        "foo" => "bar",
        "baz" => "qux"
    )
)

println(String(response.body))`)
  })

  it('has a multipart body with a file', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'multipart/form-data; boundary=----WebKitFormBoundary' }],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          { name: 'file', fileName: 'test.txt', contentType: 'text/plain' },
          { name: 'field', value: 'value' },
        ],
      },
    })

    expect(result).toBe(`using HTTP

response = HTTP.post(
    "https://example.com";
    body = HTTP.Form([
        "file" => HTTP.Multipart("test.txt", open("test.txt"), "text/plain"),
        "field" => "value"
    ])
)

println(String(response.body))`)
  })

  it('has a plain text body', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'PUT',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      postData: {
        mimeType: 'text/plain',
        text: 'Hello "World"',
      },
    })

    expect(result).toBe(`using HTTP

response = HTTP.put(
    "https://example.com",
    ["Content-Type" => "text/plain"],
    "Hello \\"World\\""
)

println(String(response.body))`)
  })

  it('passes the body as a keyword argument for GET requests', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com',
      method: 'GET',
      postData: {
        mimeType: 'text/plain',
        text: 'hello',
      },
    })

    expect(result).toBe(`using HTTP

response = HTTP.get(
    "https://example.com";
    body = "hello"
)

println(String(response.body))`)
  })

  it('combines headers, body, query parameters and cookies', () => {
    const result = juliaHttp.generate({
      url: 'https://example.com/users',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [{ name: 'page', value: '2' }],
      cookies: [{ name: 'session', value: 'abc123' }],
      postData: {
        mimeType: 'application/json',
        text: '{"name":"alice"}',
      },
    })

    expect(result).toBe(`using HTTP
using JSON

response = HTTP.post(
    "https://example.com/users",
    ["Content-Type" => "application/json"],
    JSON.json(Dict("name" => "alice"));
    query = ["page" => "2"],
    cookies = Dict("session" => "abc123")
)

println(String(response.body))`)
  })
})
