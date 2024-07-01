import { type Context, Hono } from 'hono'
import { accepts } from 'hono/accepts'
import { cors } from 'hono/cors'
import type { StatusCode } from 'hono/utils/http-status'
import { parse } from 'path'

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

  // HTTP errors
  app.all('/:status{[4-5][0-9][0-9]}', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    const { status: originalStatusCode } = c.req.param()
    const status = parseInt(originalStatusCode, 10) as StatusCode

    c.status(status)

    // HTTP Error list
    const errors: Partial<Record<StatusCode, string>> = {
      '400': 'Bad Request',
      '401': 'Unauthorized',
      '402': 'Payment Required',
      '403': 'Forbidden',
      '404': 'Not Found',
      '406': 'Not Acceptable',
      '407': 'Proxy Authentication Required',
      '408': 'Request Time-out',
      '409': 'Conflict',
      '410': 'Gone',
      '411': 'Length Required',
      '412': 'Precondition Failed',
      '413': 'Request Entity Too Large',
      '414': 'Request-URI Too Long',
      '415': 'Unsupported Media Type',
      '416': 'Requested Range Not Satisfiable',
      '417': 'Expectation Failed',
      '418': 'I’m a teapot',
      '421': 'Unprocessable Entity',
      '422': 'Misdirected Request',
      '423': 'Locked',
      '424': 'Failed Dependency',
      '426': 'Upgrade Required',
      '428': 'Precondition Required',
      '429': 'Too Many Requests',
      '431': 'Request Header Fileds Too Large',
      '451': 'Unavailable For Legal Reasons',
      '500': 'Internal Server Error',
      '501': 'Not Implemented',
      '502': 'Bad Gateway',
      '503': 'Service Unavailable',
      '504': 'Gateway Timeout',
      '505': 'HTTP Version Not Supported',
      '506': 'Variant Also Negotiates',
      '507': 'Insufficient Storage',
      '508': 'Loop Detected',
      '510': 'Not Extended',
      '511': 'Network Authentication Required',
    }

    return c.text(errors?.[status] ?? 'Error')
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
