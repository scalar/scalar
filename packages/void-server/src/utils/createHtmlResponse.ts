import type { Context } from 'hono'

/**
 * Transform an object into an XML response
 */
export function createHtmlResponse(c: Context, data: Record<string, any>) {
  c.header('Content-Type', 'text/html')

  const html = `<!doctype html>
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

  return c.html(html)
}

/**
 * Loop through object recursively and create a JSON string as formatted HTML
 */
function createObjectTree(data: Record<string, any>) {
  let html = ''

  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      const value = data[key]

      if (typeof value === 'object') {
        html += `<li><strong>${key}:</strong> <ul>${createObjectTree(value)}</ul></li>`
      } else {
        html += `<li><strong>${key}:</strong> ${value}</li>`
      }
    }
  }

  return html
}
