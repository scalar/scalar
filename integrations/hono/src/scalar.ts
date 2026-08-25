import { renderApiReference } from '@scalar/client-side-rendering'
import type { Context, Env, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'

import type { ApiReferenceConfiguration } from './types'

/**
 * The default configuration for the API Reference.
 */
const DEFAULT_CONFIGURATION: Partial<ApiReferenceConfiguration> = {
  _integration: 'hono',
}

/**
 * The custom theme for Hono
 */
const customTheme = `
.dark-mode {
  color-scheme: dark;
  --scalar-color-1: rgba(255, 255, 245, .86);
  --scalar-color-2: rgba(255, 255, 245, .6);
  --scalar-color-3: rgba(255, 255, 245, .38);
  --scalar-color-disabled: rgba(255, 255, 245, .25);
  --scalar-color-ghost: rgba(255, 255, 245, .25);
  --scalar-color-accent: #e36002;
  --scalar-background-1: #1e1e20;
  --scalar-background-2: #2a2a2a;
  --scalar-background-3: #505053;
  --scalar-background-4: rgba(255, 255, 255, 0.06);
  --scalar-background-accent: #e360021f;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
  --scalar-lifted-brightness: 1.45;
  --scalar-backdrop-brightness: 0.5;

  --scalar-shadow-1: 0 1px 3px 0 rgb(0, 0, 0, 0.1);
  --scalar-shadow-2: rgba(15, 15, 15, 0.2) 0px 3px 6px,
    rgba(15, 15, 15, 0.4) 0px 9px 24px, 0 0 0 1px rgba(255, 255, 255, 0.1);

  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #3dd68c;
  --scalar-color-red: #f66f81;
  --scalar-color-yellow: #f9b44e;
  --scalar-color-blue: #5c73e7;
  --scalar-color-orange: #ff8d4d;
  --scalar-color-purple: #b191f9;
}
/* Sidebar */
.dark-mode .sidebar {
  --scalar-sidebar-background-1: #161618;
  --scalar-sidebar-item-hover-color: var(--scalar-color-accent);
  --scalar-sidebar-item-hover-background: transparent;
  --scalar-sidebar-item-active-background: transparent;
  --scalar-sidebar-border-color: transparent;
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
  --scalar-sidebar-search-background: #252529;
  --scalar-sidebar-search-border-color: transparent;
  --scalar-sidebar-search-color: var(--scalar-color-3);
}
`

type Configuration<E extends Env> =
  | Partial<ApiReferenceConfiguration>
  | ((c: Context<E>) => Partial<ApiReferenceConfiguration> | Promise<Partial<ApiReferenceConfiguration>>)

/**
 * The Hono middleware for the Scalar API Reference.
 */
const scalarMiddleware = <E extends Env>(configOrResolver: Configuration<E>): MiddlewareHandler<E> => {
  return async (c) => {
    let resolvedConfig: Partial<ApiReferenceConfiguration> = {}

    if (typeof configOrResolver === 'function') {
      resolvedConfig = await configOrResolver(c)
    } else {
      resolvedConfig = configOrResolver
    }

    // Merge the defaults
    const configuration = {
      ...DEFAULT_CONFIGURATION,
      ...resolvedConfig,
    }

    // Respond with the HTML document
    const { cdn, pageTitle, nonce, ...config } = configuration
    return c.html(renderApiReference({ config, pageTitle, cdn, nonce }, customTheme))
  }
}

/**
 * An OpenAPI document.
 *
 * Typed loosely as an object on purpose, so it accepts both plain document objects and the typed
 * return values of generators like Zod OpenAPI Hono's `getOpenAPI31Document()`, whose interfaces do
 * not carry an index signature.
 */
type OpenApiDocument = object

/**
 * The configuration for `Scalar.serve`.
 *
 * On top of the universal API Reference configuration, this takes the OpenAPI `document` to render
 * and expose. Because `Scalar.serve` sources the document itself, `content` and `url` are managed for
 * you and are not accepted here.
 */
export type ServeConfiguration<E extends Env> = Omit<Partial<ApiReferenceConfiguration>, 'content' | 'url'> & {
  /**
   * The OpenAPI document to render and serve.
   *
   * Pass the document directly, or a function that returns it. The function receives the Hono
   * `Context`, so it can read `c.env` or `c.req` and build the document per request. This is also how
   * you wire up an `OpenAPIHono` app:
   *
   * @example
   * ```ts
   * app.route('/reference', Scalar.serve({
   *   document: () => app.getOpenAPI31Document({ openapi: '3.1.0', info: { title: 'Example', version: 'v1' } }),
   * }))
   * ```
   */
  document: OpenApiDocument | ((c: Context<E>) => OpenApiDocument | Promise<OpenApiDocument>)
  /**
   * Path, relative to the mount point, where the OpenAPI document is served as JSON.
   *
   * @default '/openapi.json'
   */
  specPath?: string
}

/**
 * Serve the API Reference and its OpenAPI document together as a mountable Hono app.
 *
 * Unlike the `Scalar` middleware — which only renders the reference and expects the document to live
 * somewhere else — this exposes both from a single call, so you do not have to wire up a separate
 * document route and keep its `url` in sync.
 *
 * Mount it with `app.route(...)`:
 *
 * @example
 * ```ts
 * import { Scalar } from '@scalar/hono-api-reference'
 *
 * // Serves the reference at `/reference` and the document at `/reference/openapi.json`
 * app.route('/reference', Scalar.serve({ document: myOpenApiDocument }))
 * ```
 */
const scalarServe = <E extends Env>(options: ServeConfiguration<E>): Hono<E> => {
  const { document, specPath = '/openapi.json', ...rest } = options

  const app = new Hono<E>()

  const resolveDocument = (c: Context<E>): OpenApiDocument | Promise<OpenApiDocument> =>
    typeof document === 'function' ? document(c) : document

  // Expose the OpenAPI document as JSON, so a single call powers both the reference and its source.
  app.get(specPath, async (c) => c.json(await resolveDocument(c)))

  // Render the reference, pointing it at the document we expose above.
  app.get('/', (c) => {
    // Build a root-absolute URL to the document from the current request path. This keeps the
    // reference working wherever it is mounted, and whether or not the request has a trailing slash.
    const url = `${c.req.path.replace(/\/+$/, '')}${specPath}`

    const { cdn, pageTitle, nonce, ...config } = {
      ...DEFAULT_CONFIGURATION,
      ...rest,
      url,
    }

    return c.html(renderApiReference({ config, pageTitle, cdn, nonce }, customTheme))
  })

  return app
}

/**
 * Render the Scalar API Reference in a Hono app.
 *
 * Use `Scalar(...)` as a middleware to render the reference on a route, or `Scalar.serve(...)` to
 * serve the reference and its OpenAPI document together from a single mount.
 */
export const Scalar = Object.assign(scalarMiddleware, { serve: scalarServe })
