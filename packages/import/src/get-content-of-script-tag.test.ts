import { describe, expect, it } from 'vitest'

import { getContentOfScriptTag } from './resolve'

describe('getContentOfScriptTag', () => {
  it('returns the content of the script tag', () => {
    const html = '<script id="api-reference">console.log("Hello, world!");</script>'
    expect(getContentOfScriptTag(html)).toBe('console.log("Hello, world!");')
  })

  it('works with single quotes', () => {
    const html = `<script id='api-reference'>console.log("Hello, world!");</script>`
    expect(getContentOfScriptTag(html)).toBe('console.log("Hello, world!");')
  })

  it('ignores HTML characters inside the attributes', () => {
    // HTML tags inside the attributes
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <title>Scalar API Reference</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        <style>
          null
        </style>
      </head>
      <body>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script id="api-reference" type="application/json" data-configuration="foo<br>bar">console.log("Hello, world!");</script>
      </body>
    </html>`

    expect(getContentOfScriptTag(html)).toBe('console.log("Hello, world!");')
  })
})
