import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Request, Response } from 'express'

export type ApiReferenceOptions = ReferenceConfiguration

/**
 * The custom theme CSS for the API Reference.
 *
 * TODO: Custom Express theme?
 */
export const customThemeCSS = ``

/**
 * The HTML to load the @scalar/api-reference package.
 */
export const ApiReference = (options: ApiReferenceOptions) => {
  return `
    <script
      id="api-reference"
      data-configuration="${JSON.stringify(options)
        .split('"')
        .join('&quot;')}">${
    options.spec?.content ? JSON.stringify(options.spec?.content) : ''
  }</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  `
}

export function apiReference(options: ReferenceConfiguration) {
  return (req: Request, res: Response) => {
    res.send(`
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

        ${options.theme ? null : customThemeCSS}
      </style>
    </head>
    <body>
      ${ApiReference(options)}
    </body>
  </html>
`)
  }
}
