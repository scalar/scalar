import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'

import {
  createHtmlResponse,
  createJsonResponse,
  createXmlResponse,
  createZipFileResponse,
  getRequestData,
} from './utils'

/**
 * Create a mock server instance
 */
export async function createVoidServer() {
  const app = new Hono()

  // CORS headers
  app.use(cors())

  // 404
  app.all('/404', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    c.status(404)

    return c.text('Not Found')
  })

  // Return zip files for all requests ending with .zip
  app.all('/:filename{.+\\.zip$}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    return createZipFileResponse(c)
  })

  // Return HTML files for all requests ending with .html
  app.all('/:filename{.+\\.html$}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    // make sure to not execute another route

    const requestData = await getRequestData(c)

    return createHtmlResponse(c, requestData)
  })

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const requestData = await getRequestData(c)

    const acceptedContentType = accepts(c, {
      header: 'Accept',
      supports: ['application/json', 'application/xml', 'application/zip'],
      default: 'application/json',
    })

    if (acceptedContentType === 'application/html') {
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
