import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Env, MiddlewareHandler } from 'hono'

type ApiReferenceOptions = {
  configuration: ReferenceConfiguration
}

const SwaggerUI = (options: SwaggerUIOptions) => {
  const asset = remoteAssets({ version: options?.version })
  delete options.version

  if (options.manuallySwaggerUIHtml) {
    return options.manuallySwaggerUIHtml(asset)
  }

  const optionsStrings = renderSwaggerUIOptions(options)

  return `
    <div>
      <div id="swagger-ui"></div>
      ${asset.css.map(
        (url) =>
          html`<link
            rel="stylesheet"
            href="${url}" />`,
      )}
      ${asset.js.map(
        (url) =>
          html`<script
            src="${url}"
            crossorigin="anonymous"></script>`,
      )}
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            dom_id: '#swagger-ui',${optionsStrings},
          })
        }
      </script>
    </div>
  `
}
const ApiReference = (options: ApiReferenceOptions) => {
  return `
  <script
  id="api-reference"
  data-url="${options.configuration.spec?.url}"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  `
}

const middleware =
  <E extends Env>(options: ApiReferenceOptions): MiddlewareHandler<E> =>
  async (c) => {
    return c.html(/* html */ `
      <!DOCTYPE html>
      <html>
        <head>
          <title>API Reference</title>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${ApiReference(options)}
        </body>
      </html>
    `)
  }

export { middleware as apiReference, ApiReference }
export type { ApiReferenceOptions }
