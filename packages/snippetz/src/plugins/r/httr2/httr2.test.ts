import { describe, expect, it } from 'vitest'

import { rHttr2 } from './httr2'

describe('rHttr2', () => {
  it('returns a basic GET request', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_perform()

resp_body_string(response)`)
  })

  it('returns a POST request', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      method: 'POST',
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_perform()

resp_body_string(response)`)
  })

  it('has headers', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
        {
          name: 'Accept',
          value: 'text/plain',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_headers(
    "Content-Type" = "application/json",
    "Accept" = "text/plain"
  ) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has a single header', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer token123',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_headers("Authorization" = "Bearer token123") |>
  req_perform()

resp_body_string(response)`)
  })

  it('has query string', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'baz',
          value: 'qux',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_url_query(
    "foo" = "bar",
    "baz" = "qux"
  ) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has a single query parameter', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'search',
          value: 'hello',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_url_query("search" = "hello") |>
  req_perform()

resp_body_string(response)`)
  })

  it('preserves repeated query parameters', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'status',
          value: 'active',
        },
        {
          name: 'status',
          value: 'inactive',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_url_query("status" = c("active", "inactive")) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has JSON body', () => {
    const result = rHttr2.generate({
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

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_headers("Content-Type" = "application/json") |>
  req_body_json(list(
    hello = "world"
  )) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has nested JSON body', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      method: 'POST',
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

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_body_json(list(
    nested = list(
      array = list(
        1,
        2,
        3
      ),
      object = list(
        foo = "bar"
      )
    ),
    simple = "value"
  )) |>
  req_perform()

resp_body_string(response)`)
  })

  it('handles JSON with booleans and null', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          active: true,
          deleted: false,
          value: null,
        }),
      },
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_body_json(list(
    active = TRUE,
    deleted = FALSE,
    value = NULL
  )) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has form-encoded body', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'username',
            value: 'admin',
          },
          {
            name: 'password',
            value: 'secret',
          },
        ],
      },
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_body_form(
    "username" = "admin",
    "password" = "secret"
  ) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has multipart form data', () => {
    const result = rHttr2.generate({
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

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_body_multipart(
    file = curl::form_file("test.txt"),
    field = "value"
  ) |>
  req_perform()

resp_body_string(response)`)
  })

  it('has raw body', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_method("POST") |>
  req_body_raw("binary content", type = "application/octet-stream") |>
  req_perform()

resp_body_string(response)`)
  })

  it('has cookies', () => {
    const result = rHttr2.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'session',
          value: 'abc123',
        },
        {
          name: 'theme',
          value: 'dark',
        },
      ],
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_headers("Cookie" = "session=abc123; theme=dark") |>
  req_perform()

resp_body_string(response)`)
  })

  it('adds basic auth credentials', () => {
    const result = rHttr2.generate(
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

    expect(result).toBe(`library(httr2)

response <- request("https://example.com") |>
  req_auth_basic("user", "pass") |>
  req_perform()

resp_body_string(response)`)
  })

  it('combines method, headers, query, and body', () => {
    const result = rHttr2.generate({
      url: 'https://example.com/api',
      method: 'PUT',
      headers: [
        {
          name: 'Authorization',
          value: 'Bearer token',
        },
      ],
      queryString: [
        {
          name: 'version',
          value: '2',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ key: 'value' }),
      },
    })

    expect(result).toBe(`library(httr2)

response <- request("https://example.com/api") |>
  req_method("PUT") |>
  req_headers("Authorization" = "Bearer token") |>
  req_url_query("version" = "2") |>
  req_body_json(list(
    key = "value"
  )) |>
  req_perform()

resp_body_string(response)`)
  })
})
