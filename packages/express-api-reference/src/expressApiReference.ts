import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Request, Response } from 'express'

export type ApiReferenceOptions = ReferenceConfiguration

/**
 * The custom theme CSS for the API Reference.
 */
export const customThemeCSS = `
:root {
  --theme-font: 'Inter', var(--system-fonts);
}
/* basic theme */
.light-mode {
  --theme-color-1: #353535;
  --theme-color-2: #555555;
  --theme-color-3: #aeaeae;
  --theme-color-accent: #259dff;

  --theme-background-1: #fff;
  --theme-background-2: #f7f7f7;
  --theme-background-3: #dadada;
  --theme-background-accent: #E0F5FF;

  --theme-border-color: rgba(0, 0, 0, 0.1);
}
.dark-mode {
  --theme-color-1: rgba(255, 255, 255, 0.9);
  --theme-color-2: rgba(255, 255, 255, 0.62);
  --theme-color-3: rgba(255, 255, 255, 0.44);
  --theme-color-accent: #8ab4f8;

  --theme-background-1: #1a1a1a;
  --theme-background-2: #252525;
  --theme-background-3: #323232;
  --theme-background-accent: #8ab4f81f;

  --theme-border-color: rgba(255, 255, 255, 0.1);
}

/* Document Sidebar */
.light-mode .t-doc__sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-accent);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-accent);
  --sidebar-search-background: transparent;
  --sidebar-search-border-color: var(--theme-border-color);
  --sidebar-search-color: var(--theme-color-3);
}

.dark-mode .sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-accent);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-accent);
  --sidebar-search-background: transparent;
  --sidebar-search-border-color: var(--theme-border-color);
  --sidebar-search-color: var(--theme-color-3);
}

/* advanced */
.light-mode {
  --theme-button-1: rgb(49 53 56);
  --theme-button-1-color: #fff;
  --theme-button-1-hover: rgb(28 31 33);

  --theme-color-green: #669900;
  --theme-color-red: #dc4a68;
  --theme-color-yellow: #edbe20;
  --theme-color-blue: #0277aa;
  --theme-color-orange: #fb892c;
  --theme-color-purple: #5203d1;

  --theme-scrollbar-color: rgba(0, 0, 0, 0.18);
  --theme-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --theme-button-1: #f6f6f6;
  --theme-button-1-color: #000;
  --theme-button-1-hover: #e7e7e7;

  --theme-color-green: #00b648;
  --theme-color-red: #dc1b19;
  --theme-color-yellow: #ffc90d;
  --theme-color-blue: #4eb3ec;
  --theme-color-orange: #ff8d4d;
  --theme-color-purple: #b191f9;

  --theme-scrollbar-color: rgba(255, 255, 255, 0.24);
  --theme-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
:root {
  --theme-radius: 3px;
  --theme-radius-lg: 3px;
  --theme-radius-xl: 3px;
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
