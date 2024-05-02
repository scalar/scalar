import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Request, Response } from 'express'

export type ApiReferenceOptions = ReferenceConfiguration & {
  cdn?: string
}

/**
 * The custom theme CSS for the API Reference.
 */
export const customThemeCSS = `
/* basic theme */
.light-mode {
  --scalar-color-1: #353535;
  --scalar-color-2: #555555;
  --scalar-color-3: #aeaeae;
  --scalar-color-accent: #259dff;

  --scalar-background-1: #fff;
  --scalar-background-2: #f7f7f7;
  --scalar-background-3: #dadada;
  --scalar-background-accent: #E0F5FF;

  --scalar-border-color: rgba(0, 0, 0, 0.1);
}
.dark-mode {
  --scalar-color-1: rgba(255, 255, 255, 0.9);
  --scalar-color-2: rgba(255, 255, 255, 0.62);
  --scalar-color-3: rgba(255, 255, 255, 0.44);
  --scalar-color-accent: #8ab4f8;

  --scalar-background-1: #1a1a1a;
  --scalar-background-2: #252525;
  --scalar-background-3: #323232;
  --scalar-background-accent: #8ab4f81f;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
}

/* Document Sidebar */
.light-mode .t-doc__sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: transparent;
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search-color: var(--scalar-color-3);
}

.dark-mode .sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: transparent;
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search-color: var(--scalar-color-3);
}

/* advanced */
.light-mode {
  --scalar-button-1: rgb(49 53 56);
  --scalar-button-1-color: #fff;
  --scalar-button-1-hover: rgb(28 31 33);

  --scalar-color-green: #669900;
  --scalar-color-red: #dc4a68;
  --scalar-color-yellow: #edbe20;
  --scalar-color-blue: #0277aa;
  --scalar-color-orange: #fb892c;
  --scalar-color-purple: #5203d1;

  --scalar-scrollbar-color: rgba(0, 0, 0, 0.18);
  --scalar-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #00b648;
  --scalar-color-red: #dc1b19;
  --scalar-color-yellow: #ffc90d;
  --scalar-color-blue: #4eb3ec;
  --scalar-color-orange: #ff8d4d;
  --scalar-color-purple: #b191f9;

  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
:root {
  --scalar-radius: 3px;
  --scalar-radius-lg: 3px;
  --scalar-radius-xl: 3px;
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
      <script src="${options.cdn || 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'}"></script>
  `
}

/**
 * The HTML template to render the API Reference.
 */
export function apiReference(options: ApiReferenceOptions) {
  return (req: Request, res: Response) => {
    res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Scalar API Reference</title>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1" />
      <style>
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
