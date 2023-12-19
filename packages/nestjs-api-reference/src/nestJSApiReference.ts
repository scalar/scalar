import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Request, Response } from 'express'

export type ApiReferenceOptions = ReferenceConfiguration

/**
 * The custom theme CSS for the API Reference.
 */
export const customThemeCSS = `
:root {
  --theme-font: "Inter", var(--system-fonts);
}
/* basic theme */
.light-mode {
  --theme-color-1: #2a2f45;
  --theme-color-2: #757575;
  --theme-color-3: #8e8e8e;
  --theme-color-accent: #e0234d;
  --theme-background-1: #fff;
  --theme-background-2: #f6f6f6;
  --theme-background-3: #e7e7e7;
  --theme-background-accent: #8ab4f81f;
  --theme-border-color: rgba(0, 0, 0, 0.1);
}
.dark-mode {
  --theme-color-1: rgba(255, 255, 255, 1);
  --theme-color-2: #b2bac2;
  --theme-color-3: #6e748b;
  --theme-color-accent: #e0234d;
  --theme-background-1: #11131e;
  --theme-background-2: #1c2132;
  --theme-background-3: #2f354a;
  --theme-background-accent: #8ab4f81f;
  --theme-border-color: rgba(255, 255, 255, 0.1);
}
/* Document Sidebar */
.light-mode .t-doc__sidebar,
.dark-mode .sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-3);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-1);
  --sidebar-search-background: var(--theme-background-2);
  --sidebar-search-border-color: var(--theme-background-2);
  --sidebar-search--color: var(--theme-color-3);
}

/* advanced */
.light-mode {
  --theme-button-1: rgb(49 53 56);
  --theme-button-1-color: #fff;
  --theme-button-1-hover: rgb(28 31 33);
  --theme-color-green: #069061;
  --theme-color-red: #ef0006;
  --theme-color-yellow: #edbe20;
  --theme-color-blue: #0082d0;
  --theme-color-orange: #fb892c;
  --theme-color-purple: #5203d1;
  --theme-scrollbar-color: rgba(0, 0, 0, 0.18);
  --theme-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --theme-button-1: #f6f6f6;
  --theme-button-1-color: #000;
  --theme-button-1-hover: #e7e7e7;
  --theme-color-green: #30beb0;
  --theme-color-red: #e91e63;
  --theme-color-yellow: #ffc90d;
  --theme-color-blue: #2cb6f6;
  --theme-color-orange: #ff5656;
  --theme-color-purple: #6223e0;
  --theme-scrollbar-color: rgba(255, 255, 255, 0.24);
  --theme-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
`

/**
 * The HTML to load the @scalar/api-reference package.
 */
export const ApiReference = (options: ApiReferenceOptions) => {
  return `
    <script
      id="api-reference"
      type="application/json"
      data-configuration="${JSON.stringify(options)
        .split('"')
        .join('&quot;')}">${
        options.spec?.content
          ? typeof options.spec?.content === 'function'
            ? JSON.stringify(options.spec?.content())
            : JSON.stringify(options.spec?.content)
          : ''
      }</script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  `
}

/**
 * The HTML template to render the API Reference.
 */
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
