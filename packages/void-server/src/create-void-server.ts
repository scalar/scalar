import { Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import type { StatusCode } from 'hono/utils/http-status'

import { errors } from '@/utils/constants'
import { createHtmlResponse } from '@/utils/create-html-response'
import { createJsonResponse } from '@/utils/create-json-response'
import { createStreamResponse } from '@/utils/create-stream-response'
import { createXmlResponse } from '@/utils/create-xml-response'
import { createZipFileResponse } from '@/utils/create-zip-file-response'
import { getRequestData } from '@/utils/get-request-data'

type VoidServerLogger = Parameters<typeof honoLogger>[0]

export type CreateVoidServerOptions = {
  /**
   * Configure request logging.
   *
   * Defaults to the existing behavior: enabled outside CI, disabled in CI.
   * Set to `false` to disable access logs, `true` to force Hono's default
   * logger, or pass a function to customize where log lines are written.
   */
  logger?: boolean | VoidServerLogger
}

/**
 * Create a mock server instance
 */
export function createVoidServer(options: CreateVoidServerOptions = {}) {
  const app = new Hono()

  const logger = options.logger ?? !process.env.CI
  if (logger) {
    app.use(honoLogger(typeof logger === 'function' ? logger : undefined))
  }

  // CORS headers
  app.use(cors())

  // Security headers
  app.use(async (c, next) => {
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
  })

  // HTTP errors
  app.all('/:status{[4-5][0-9][0-9]}', (c) => {
    const { status: originalStatusCode } = c.req.param()
    const status = Number.parseInt(originalStatusCode ?? '0', 10) as StatusCode

    c.status(status)

    return c.text(errors?.[status] ?? 'Unknown Error')
  })

  // No content
  app.all('/:status{204}', (c) => {
    return c.body(null, 204)
  })

  // Return content based on the file extension
  app.all('/:filename{.+\\.(html|xml|json|zip)$}', async (c) => {
    const requestData = await getRequestData(c)

    const { filename } = c.req.param()

    if (filename?.endsWith('.html')) {
      return createHtmlResponse(c, requestData)
    }
    if (filename?.endsWith('.xml')) {
      return createXmlResponse(c, requestData)
    }
    if (filename?.endsWith('.zip')) {
      return createZipFileResponse(c, requestData)
    }

    return createJsonResponse(c, requestData)
  })

  app.get('/stream', (c) => createStreamResponse(c))

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c) => {
    const requestData = await getRequestData(c)

    const acceptedContentType = accepts(c, {
      header: 'Accept',
      supports: ['text/html', 'application/xml', 'application/zip'],
      default: 'application/json',
    })

    if (acceptedContentType === 'text/html') {
      return createHtmlResponse(c, requestData)
    }
    if (acceptedContentType === 'application/xml') {
      return createXmlResponse(c, requestData)
    }
    if (acceptedContentType === 'application/zip') {
      return createZipFileResponse(c, requestData)
    }

    return createJsonResponse(c, requestData)
  })

  return app
}
