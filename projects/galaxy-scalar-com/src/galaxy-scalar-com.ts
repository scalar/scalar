// The OpenAPI document is bundled at build time as a JSON import. Reading it
// from the filesystem is not possible inside the Cloudflare Pages worker.
import galaxyDocument from '@scalar/galaxy/3.1.json'
import { PETSTORE_URL_2_0, PETSTORE_URL_3_1 } from '@scalar/helpers/url/oas-document-fixtures'
import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import type { Hono } from 'hono'

/**
 * Create and configure the mock server application.
 *
 * Creating the mock server is the only async step: it dereferences the document
 * and runs its `x-seed` extensions.
 */
export const createApp = async (): Promise<Hono> =>
  createMockServer({
    document: galaxyDocument,
    onRequest: ({ context }) => {
      console.log(`${context.req.method} ${context.req.url}`)
    },
  })

/**
 * Mount the Scalar API reference UI at the root path.
 *
 * No `baseServerURL` is set: the mock endpoints and the reference UI share the
 * Worker origin, so Scalar resolves the document URL against the current origin.
 */
export const configureApiReference = (app: Hono): void => {
  app.get(
    '/',
    Scalar({
      pageTitle: 'Scalar Galaxy',
      sources: [
        {
          title: 'Scalar Galaxy',
          url: '/openapi.yaml',
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
      agent: {
        key: 'eyJhbGciOiJFZERTQSJ9.eyJ1aWQiOiJKcWpjUkQ0aEZFRGpocGpCNDJEM24iLCJ0ZWFtVWlkIjoiSWxNbm05TXh5LVNhYm1MeEVfaTBMIiwiZXhwIjoxOTI4NTc4NDQ3LCJpYXQiOjE3NzA4OTg0NDd9.URUeP5n-RCTCHk8yJyAwlYZaLgJs0yAnOm6av-QoUD1vAuMd18eaSD3ziJFv9O5Vthcat7ICjJmq-qKe18EjBw',
      },
    }),
  )
}
