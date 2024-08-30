import { findOpenApiDocument } from '@/transforms/find-openapi-document'
import { describe, expect, it, vi } from 'vitest'

global.fetch = vi.fn()

function createFetchResponse(data: string) {
  return {
    ok: true,
    text: () => new Promise((resolve) => resolve(data)),
  }
}

describe('findOpenApiDocument', () => {
  it('returns JSON urls', async () => {
    const result = await findOpenApiDocument(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    )
  })

  it('returns YAML urls', async () => {
    const result = await findOpenApiDocument(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    expect(result).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    )

    const otherResult = await findOpenApiDocument(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
    )

    expect(otherResult).toBe(
      'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yml',
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

    const result = await findOpenApiDocument('https://example.com/reference')

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

    const result = await findOpenApiDocument('https://example.com/reference')

    expect(result).toBe('https://example.com/openapi.yaml')
  })
})
