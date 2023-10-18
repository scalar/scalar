import cookieParser from 'cookie-parser'
import cors from 'cors'
import Express from 'express'
import { type Server } from 'http'

export const createEchoServer = () => {
  const app = Express()

  app.use(
    cors({
      origin: '*',
    }),
  )

  app.use(cookieParser())
  app.use(Express.json())
  app.disable('x-powered-by')

  // Post request to / are proxied to the target url.
  app.all('/*', async (req, res) => {
    console.log(`${req.method} ${req.path}`)

    let authentication = {}

    const authorizationHeader = req.headers.authorization

    if (authorizationHeader) {
      // if value starts with "Basic "
      if (authorizationHeader.startsWith('Basic ')) {
        const token = authorizationHeader.split(' ')[1]

        authentication = {
          authentication: {
            type: 'http.basic',
            token,
            value: Buffer.from(token, 'base64').toString('utf8'),
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

    res.send({
      headers: req.headers,
      ...authentication,
      cookies: req.cookies,
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    })
  })

  const listen = (port: number | string, callback?: () => void): Server => {
    return app.listen(port, callback)
  }

  return {
    app: app as Express.Express,
    listen: listen as (port: number | string, callback?: () => void) => Server,
  }
}
