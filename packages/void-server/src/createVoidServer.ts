import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import { errors } from '@/utils/constants'
import { createHtmlResponse } from '@/utils/createHtmlResponse'
import { createJsonResponse } from '@/utils/createJsonResponse'
import { createStreamResponse } from '@/utils/createStreamResponse'
import { createXmlResponse } from '@/utils/createXmlResponse'
import { createZipFileResponse } from '@/utils/createZipFileResponse'
import { getRequestData } from '@/utils/getRequestData'
import { logger } from 'hono/logger'

/**
 * Create a mock server instance
 */
export async function createVoidServer() {
  const app = new Hono()

  // Logger
  if (!process.env.CI) {
    app.use(logger())
  }

  // CORS headers
  app.use(cors())

  // HTTP errors
  app.all('/:status{[4-5][0-9][0-9]}', async (c: Context) => {
    const { status: originalStatusCode } = c.req.param()
    const status = Number.parseInt(originalStatusCode ?? '0', 10) as StatusCode

    c.status(status)

    return c.text(errors?.[status] ?? 'Unknown Error')
  })

  // No content
  app.all('/:status{204}', async (c: Context) => {
    return c.body(null, 204)
  })

  // Return content based on the file extension
  app.all('/:filename{.+\\.(html|xml|json|zip)$}', async (c: Context) => {
    const requestData = await getRequestData(c)

    const { filename } = c.req.param()

    if (filename?.endsWith('.html')) {
      return createHtmlResponse(c, requestData)
    }
    if (filename?.endsWith('.xml')) {
      return createXmlResponse(c, requestData)
    }
    if (filename?.endsWith('.zip')) {
      return createZipFileResponse(c)
    }

    return createJsonResponse(c, requestData)
  })

  app.get('/stream', async (c: Context) => {
    return createStreamResponse(c)
  })

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c: Context) => {
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
      return createZipFileResponse(c)
    }

    return createJsonResponse(c, requestData)
  })

  return app
}
