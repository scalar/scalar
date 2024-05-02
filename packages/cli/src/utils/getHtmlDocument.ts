import type { OpenAPI } from 'openapi-types'

export function getHtmlDocument(
  specification: OpenAPI.Document,
  watch = false,
) {
  return `<!doctype html>
    <html>
      <head>
        <title>Scalar API Reference</title>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
          }
        </style>
        ${
          watch
            ? `
              <script>
                const evtSource = new EventSource('__watcher');
                evtSource.onmessage = (event) => {
                  console.log(\`message: \${event.data}\`);
                  window.location.reload();
                };
              </script>
            `
            : ''
        }
      </head>
      <body>
        <script
          id="api-reference"
          type="application/json"
          data-proxy-url="https://api.scalar.com/request-proxy">${JSON.stringify(
            specification,
          )}</script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>`
}
