import type { Context } from 'hono'
import { html } from 'hono/html'
import type { HtmlEscapedString } from 'hono/utils/html'

/**
 * Transform an object into an HTML response with automatic XSS protection.
 * User-controlled values are escaped by Hono's html tagged template.
 */
export function createHtmlResponse(c: Context, data: Record<string, any>) {
  c.header('Content-Type', 'text/html')

  const content = html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>Void</title>
    <style>
      body {
        margin: 2rem;
      }

      * {
        font-family: monospace;
        line-height: 1.4;
        color: #868e96;
      }

      strong {
        color: #495057;
      }

      li {
        list-style-type: none;
        margin: 0.3rem 0;
      }

      ul {
        padding-left: 1rem;
        margin: 0;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    ${createObjectTree(data)}
  </body>
</html>
`

  return c.html(content)
}

/**
 * Loop through object recursively and create a formatted HTML tree.
 * Keys and values are automatically escaped to prevent XSS attacks.
 */
function createObjectTree(data: Record<string, any>): HtmlEscapedString | Promise<HtmlEscapedString> {
  const entries = Object.entries(data)

  return html`${entries.map(([key, value]) =>
    typeof value === 'object' && value !== null
      ? html`<li><strong>${key}:</strong> <ul>${createObjectTree(value)}</ul></li>`
      : html`<li><strong>${key}:</strong> ${String(value ?? '')}</li>`,
  )}`
}
