import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import {
  createHtmlResponse,
  createJsonResponse,
  createXmlResponse,
  createZipFileResponse,
  getRequestData,
} from './utils'
import { errors } from './utils/constants'

/**
 * Create a mock server instance
 */
export async function createVoidServer() {
  const app = new Hono()

  // CORS headers
  app.use(cors())

  // HTTP errors
  app.all('/:status{[4-5][0-9][0-9]}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const { status: originalStatusCode } = c.req.param()
    const status = parseInt(originalStatusCode, 10) as StatusCode

    c.status(status)

    return c.text(errors?.[status] ?? 'Unknown Error')
  })

  // Return HTML files for all requests ending with .html
  app.all('/:filename{.+\\.html$}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const requestData = await getRequestData(c)

    return createHtmlResponse(c, requestData)
  })

  // Return JSON for all requests ending with .json
  app.all('/:filename{.+\\.json$}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const requestData = await getRequestData(c)

    return createJsonResponse(c, requestData)
  })

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

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
