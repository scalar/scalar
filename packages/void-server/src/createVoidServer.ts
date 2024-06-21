import { type Context, Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'

/**
 * Create a mock server instance
 */
export async function createVoidServer(options?: {
  //
}) {
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

    const blob = new Blob(
      [
        new Uint8Array([
          80, 75, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]).buffer,
      ],
      {
        type: 'application/zip',
      },
    )

    c.header('Content-Type', 'application/zip')
    return c.body(blob.toString())
  })

  // All other requests just respond with a JSON containing all the request data
  app.all('/*', async (c: Context) => {
    console.info(`${c.req.method} ${c.req.path}`)

    let authentication = {}

    const authorizationHeader = c.req.header('Authorization')

    if (authorizationHeader) {
      // if value starts with "Basic "
      if (authorizationHeader.startsWith('Basic ')) {
        const token = authorizationHeader.split(' ')[1]

        authentication = {
          authentication: {
            type: 'http.basic',
            token,
            value: atob(token),
          },
        }
      }

      if (authorizationHeader.startsWith('Bearer ')) {
        const token = authorizationHeader.split(' ')[1]

        authentication = {
          authentication: {
            type: 'http.bearer',
            token,
          },
        }
      }
    }

    const headers = Object.fromEntries(c.req.raw.headers)

    const body = await getBody(c)

    const cookies = getCookie(c)

    return c.json({
      headers,
      ...authentication,
      cookies,
      method: c.req.method,
      path: c.req.path,
      query: c.req.query(),
      body: body,
    })
  })

  return app
}

async function getBody(c: Context) {
  const body = await c.req.text()

  // Try to parse the body as JSON
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}
