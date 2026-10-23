// The OpenAPI document is bundled at build time as a JSON import. Reading it
// from the filesystem is not possible inside the Cloudflare Pages worker.
import galaxyDocument from '@scalar/galaxy/3.1.json'
import { PETSTORE_URL_2_0, PETSTORE_URL_3_1 } from '@scalar/helpers/url/oas-document-fixtures'
import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import { Hono } from 'hono'

import { asyncApiDocument } from './asyncapi-document'
import { upgradeWebSocket } from './upgrade-websocket'

/**
 * Create and configure the mock server application.
 *
 * Both API descriptions are processed once at startup; the REST mock also runs its seeds.
 */
export const createApp = async (): Promise<Hono> => {
  const app = new Hono()
  const events = await createMockServer({ document: asyncApiDocument, upgradeWebSocket })

  // Register sockets before the REST app so its CORS middleware cannot modify upgrade responses.
  app.route('/', events)

  const rest = await createMockServer({
    document: galaxyDocument,
    onRequest: ({ context }) => {
      console.log(`${context.req.method} ${context.req.url}`)
    },
  })
  app.route('/', rest)
  return app
}

/**
 * Path the branch-built `@scalar/api-reference` bundle is served from.
 *
 * The build script copies the ESM entry point and its chunks into `scalar/` in the
 * deploy output; the route below serves them through the Cloudflare Pages
 * `ASSETS` binding, preserving relative imports between modules.
 */
const LOCAL_BUNDLE_PATH = '/scalar/standalone.esm.js'

/**
 * Whether this is a production build.
 *
 * Wrangler's `--define` flag (see the `build` script) replaces this identifier
 * with a literal `true` or `false` at build time, decided by the CI deploy
 * environment. Production loads the published `@scalar/api-reference` ESM bundle
 * from the jsDelivr CDN; staging and PR previews load the bundle built from the
 * current branch instead, so reference UI changes can be reviewed before they
 * are released to npm.
 *
 * The `typeof` guard keeps this safe under Vitest and any other build that does
 * not apply the define — the branch bundle is used by default.
 */
declare const GALAXY_IS_PRODUCTION: boolean
const isProductionBuild = typeof GALAXY_IS_PRODUCTION !== 'undefined' && GALAXY_IS_PRODUCTION

/**
 * The Cloudflare Pages binding that serves files deployed alongside the worker.
 */
type AssetsBinding = { ASSETS: { fetch: (request: Request) => Promise<Response> } }

/**
 * Mount the Scalar API reference UI at the root path.
 *
 * Production loads the published Galaxy document from the registry. Previews
 * use the local mock server document so branch changes can be reviewed together.
 */
export const configureApiReference = (app: Hono): void => {
  // Serve the branch-built ESM entry point and chunks that the build step copied into
  // the deploy output. Production never requests this route — it loads the
  // reference UI from the CDN.
  app.get('/scalar/*', (c) => (c.env as AssetsBinding).ASSETS.fetch(c.req.raw))

  app.get(
    '/',
    Scalar({
      pageTitle: 'Scalar Galaxy',
      sources: [
        {
          title: 'Scalar Galaxy',
          url: isProductionBuild ? 'https://registry.scalar.com/@scalar/apis/galaxy?format=json' : '/openapi.yaml',
        },
        {
          title: 'Scalar Galaxy Events (AsyncAPI)',
          url: '/asyncapi.json',
        },
        {
          title: 'Petstore (OpenAPI 3.1)',
          url: PETSTORE_URL_3_1,
        },
        {
          title: 'Petstore (Swagger 2.0)',
          url: PETSTORE_URL_2_0,
        },
      ],
      theme: 'default',
      proxyUrl: 'https://proxy.scalar.com',
      persistAuth: true,
      // Let Ask AI upload the selected source. A shared agent key would restrict
      // every source to the key's registry documents instead of the displayed API.
      // Staging and PR previews render the reference UI built from this branch;
      // production explicitly loads the published ESM build from jsDelivr.
      bundle: isProductionBuild ? true : LOCAL_BUNDLE_PATH,
    }),
  )
}
