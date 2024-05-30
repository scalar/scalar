import type { OpenAPI } from '@scalar/openapi-parser'

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
          data-proxy-url="https://proxy.scalar.com">${JSON.stringify(
            specification,
          )}</script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>`
}
