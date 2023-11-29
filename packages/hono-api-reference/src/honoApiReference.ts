import type { ReferenceConfiguration } from '@scalar/api-reference'
import type { Env, MiddlewareHandler } from 'hono'
import { html, raw } from 'hono/html'

export type ApiReferenceOptions = ReferenceConfiguration & {
  pageTitle?: string
}

/**
 * The custom theme CSS for the API Reference.
 */
export const customThemeCSS = `
:root {
  --theme-font: 'Inter', var(--system-fonts);
}

.light-mode {
  color-scheme: light;
  --theme-color-1: #2a2f45;
  --theme-color-2: #757575;
  --theme-color-3: #8e8e8e;
  --theme-color-disabled: #b4b1b1;
  --theme-color-ghost: #a7a7a7;
  --theme-color-accent: #0099ff;
  --theme-background-1: #fff;
  --theme-background-2: #f6f6f6;
  --theme-background-3: #e7e7e7;
  --theme-background-4: rgba(0, 0, 0, 0.06);
  --theme-background-accent: #8ab4f81f;

  --theme-border-color: rgba(0, 0, 0, 0.1);
  --theme-scrollbar-color: rgba(0, 0, 0, 0.18);
  --theme-scrollbar-color-active: rgba(0, 0, 0, 0.36);
  --theme-lifted-brightness: 1;
  --theme-backdrop-brightness: 1;

  --theme-shadow-1: 0 1px 3px 0 rgba(0, 0, 0, 0.11);
  --theme-shadow-2: rgba(0, 0, 0, 0.08) 0px 13px 20px 0px,
    rgba(0, 0, 0, 0.08) 0px 3px 8px 0px, #eeeeed 0px 0 0 1px;

  --theme-button-1: rgb(49 53 56);
  --theme-button-1-color: #fff;
  --theme-button-1-hover: rgb(28 31 33);

  --theme-color-green: #069061;
  --theme-color-red: #ef0006;
  --theme-color-yellow: #edbe20;
  --theme-color-blue: #0082d0;
  --theme-color-orange: #fb892c;
  --theme-color-purple: #5203d1;
}

.dark-mode {
  color-scheme: dark;
  --theme-color-1: rgba(255, 255, 245, .86);
  --theme-color-2: rgba(255, 255, 245, .6);
  --theme-color-3: rgba(255, 255, 245, .38);
  --theme-color-disabled: rgba(255, 255, 245, .25);
  --theme-color-ghost: rgba(255, 255, 245, .25);
  --theme-color-accent: #e36002;
  --theme-background-1: #1e1e20;
  --theme-background-2: #2a2a2a;
  --theme-background-3: #505053;
  --theme-background-4: rgba(255, 255, 255, 0.06);
  --theme-background-accent: #e360021f;

  --theme-border-color: rgba(255, 255, 255, 0.1);
  --theme-scrollbar-color: rgba(255, 255, 255, 0.24);
  --theme-scrollbar-color-active: rgba(255, 255, 255, 0.48);
  --theme-lifted-brightness: 1.45;
  --theme-backdrop-brightness: 0.5;

  --theme-shadow-1: 0 1px 3px 0 rgb(0, 0, 0, 0.1);
  --theme-shadow-2: rgba(15, 15, 15, 0.2) 0px 3px 6px,
    rgba(15, 15, 15, 0.4) 0px 9px 24px, 0 0 0 1px rgba(255, 255, 255, 0.1);

  --theme-button-1: #f6f6f6;
  --theme-button-1-color: #000;
  --theme-button-1-hover: #e7e7e7;

  --theme-color-green: #3dd68c;
  --theme-color-red: #f66f81;
  --theme-color-yellow: #f9b44e;
  --theme-color-blue: #5c73e7;
  --theme-color-orange: #ff8d4d;
  --theme-color-purple: #b191f9;
}
/* Sidebar */
.light-mode .t-doc__sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-accent);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-accent);
  --sidebar-search-background: var(--theme-background-2);
  --sidebar-search-border-color: var(--sidebar-border-color);
  --sidebar-search--color: var(--theme-color-3);
}

.dark-mode .sidebar {
  --sidebar-background-1: #161618;
  --sidebar-item-hover-color: var(--theme-color-accent);
  --sidebar-item-hover-background: transparent;
  --sidebar-item-active-background: transparent;
  --sidebar-border-color: transparent;
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-accent);
  --sidebar-search-background: #252529;
  --sidebar-search-border-color: transparent;
  --sidebar-search--color: var(--theme-color-3);
}
`

/**
 * The HTML to load the @scalar/api-reference JavaScript package.
 */
export const javascript = (configuration: ReferenceConfiguration) => {
  return html`
    <script
      id="api-reference"
      type="application/json"
      data-configuration="${JSON.stringify(configuration)
        .split('"')
        .join('&quot;')}">
      ${raw(
        configuration.spec?.content
          ? typeof configuration.spec?.content === 'function'
            ? JSON.stringify(configuration.spec?.content())
            : JSON.stringify(configuration.spec?.content)
          : '',
      )}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  `
}

/**
 * The middleware for the API Reference.
 */
export const apiReference =
  <E extends Env>(options: ApiReferenceOptions): MiddlewareHandler<E> =>
  async (c) => {
    return c.html(/* html */ `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${options?.pageTitle ?? 'API Reference'}</title>
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
          ${javascript(options)}
        </body>
      </html>
    `)
  }
