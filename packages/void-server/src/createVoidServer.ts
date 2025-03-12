import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'

import { errors } from '@/utils/constants.ts'
import { createHtmlResponse } from '@/utils/createHtmlResponse.ts'
import { createJsonResponse } from '@/utils/createJsonResponse.ts'
import { createXmlResponse } from '@/utils/createXmlResponse.ts'
import { createZipFileResponse } from '@/utils/createZipFileResponse.ts'
import { getRequestData } from '@/utils/getRequestData.ts'

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
    const status = Number.parseInt(originalStatusCode ?? '0', 10) as StatusCode

    c.status(status)

    return c.text(errors?.[status] ?? 'Unknown Error')
  })

  // No content
  app.all('/:status{204}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    return c.body(null, 204)
  })

  // Return content based on the file extension
  app.all('/:filename{.+\\.(html|xml|json|zip)$}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const requestData = await getRequestData(c)

    const { filename } = c.req.param()

    if (filename?.endsWith('.html')) return createHtmlResponse(c, requestData)
    if (filename?.endsWith('.xml')) return createXmlResponse(c, requestData)
    if (filename?.endsWith('.zip')) return createZipFileResponse(c)

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
