import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findOpenApiDocumentUrl } from './find-openapi-document-url'

global.fetch = vi.fn()

function createFetchResponse(data: string) {
  return {
    ok: true,
    text: () => new Promise((resolve) => resolve(data)),
  }
}

describe('findOpenApiDocumentUrl', () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns JSON urls', async () => {
    const result = await findOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )
  })

  it('returns YAML urls', async () => {
    const result = await findOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    const otherResult = await findOpenApiDocumentUrl(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
    )

    expect(otherResult).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
    )
  })

  it('finds URLs from sandbox URL', async () => {
    const result = await findOpenApiDocumentUrl(
      'https://sandbox.scalar.com/p/dlw8v',
    )

    expect(result).toBe('https://sandbox.scalar.com/files/dlw8v/openapi.yaml')

    const otherResult = await findOpenApiDocumentUrl(
      'https://sandbox.scalar.com/e/dlw8v',
    )

    expect(otherResult).toBe(
      'https://sandbox.scalar.com/files/dlw8v/openapi.yaml',
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

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

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

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

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

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

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

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

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

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )
  })

  it('finds URLs in redoc JS', async () => {
    const html = `<!DOCTYPE html>
<html>
  <head />
  <body>
    <H1>Redoc in action</H1>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
    <div id="redoc-container"></div>

    <script>
      Redoc.init('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml', {
        "expandResponses": "200,400"
      }, document.getElementById('redoc-container'))
    </script>
  </body>
</html>`

    // @ts-expect-error Mocking types are missing
    fetch.mockResolvedValue(createFetchResponse(html))

    const result = await findOpenApiDocumentUrl('https://example.com/reference')

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )
  })
})
