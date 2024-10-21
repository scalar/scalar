import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolve } from './resolve'

global.fetch = vi.fn()

function createFetchResponse(data: string) {
  return {
    ok: true,
    text: () => new Promise((r) => r(data)),
  }
}

describe('resolve', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns JSON urls', async () => {
    const result = await resolve(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )
  })

  it('returns YAML urls', async () => {
    const result = await resolve(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    const otherResult = await resolve(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
    )

    expect(otherResult).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
    )
  })

  it('finds URLs from sandbox URL', async () => {
    const result = await resolve('https://sandbox.scalar.com/p/GcxDQ')

    expect(result).toBe('https://sandbox.scalar.com/files/GcxDQ/openapi.yaml')

    const otherResult = await resolve('https://sandbox.scalar.com/e/GcxDQ')

    expect(otherResult).toBe(
      'https://sandbox.scalar.com/files/GcxDQ/openapi.yaml',
    )
  })

  it('finds URL in the CDN example', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )
  })

  it('works with single quote data attributes', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url='https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )
  })

  it('returns absolute URLs', async () => {
    const html = `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })

  it('finds URLs in some wrangled configuration object', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Hono API Reference Demo</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>

    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&amp;quot;spec&amp;quot;:{&amp;quot;url&amp;quot;:&amp;quot;/openapi.yaml&amp;quot;},&amp;quot;pageTitle&amp;quot;:&amp;quot;Hono API Reference Demo&amp;quot;}">

    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })

  it('finds URLs in redoc HTML', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  </head>
  <body>
    <redoc spec-url='https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )
  })

  it('finds embedded OpenAPI documents', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <script
      id="api-reference"
      type="application/json"
      data-configuration="{&quot;spec&quot;:{&quot;content&quot;:{&quot;openapi&quot;:&quot;3.0.0&quot;,&quot;paths&quot;:{&quot;/&quot;:{&quot;get&quot;:{&quot;operationId&quot;:&quot;AppController_getHello&quot;,&quot;parameters&quot;:[],&quot;responses&quot;:{&quot;200&quot;:{&quot;description&quot;:&quot;&quot;}}}}},&quot;info&quot;:{&quot;title&quot;:&quot;Cats example&quot;,&quot;description&quot;:&quot;The cats API description&quot;,&quot;version&quot;:&quot;1.0&quot;,&quot;contact&quot;:{}},&quot;tags&quot;:[{&quot;name&quot;:&quot;cats&quot;,&quot;description&quot;:&quot;&quot;}],&quot;servers&quot;:[],&quot;components&quot;:{&quot;schemas&quot;:{}}}}}">{"openapi":"3.0.0","paths":{"/":{"get":{"operationId":"AppController_getHello","parameters":[],"responses":{"200":{"description":""}}}}},"info":{"title":"Cats example","description":"The cats API description","version":"1.0","contact":{}},"tags":[{"name":"cats","description":""}],"servers":[],"components":{"schemas":{}}}</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
    `

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await resolve('https://example.com/reference')

    expect(result).toStrictEqual({
      openapi: '3.0.0',
      paths: {
        '/': {
          get: {
            operationId: 'AppController_getHello',
            parameters: [],
            responses: { '200': { description: '' } },
          },
        },
      },
      info: {
        title: 'Cats example',
        description: 'The cats API description',
        version: '1.0',
        contact: {},
      },
      tags: [{ name: 'cats', description: '' }],
      servers: [],
      components: { schemas: {} },
    })
  })

  it('transforms GitHub URLs to raw file URLs', async () => {
    const result = await resolve(
      'https://github.com/outline/openapi/blob/main/spec3.yml',
    )

    expect(result).toBe(
      'https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml',
    )
  })
})
