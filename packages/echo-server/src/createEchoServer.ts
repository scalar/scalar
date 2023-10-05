import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import Express from 'express'
import { type Server } from 'http'

import OAuth2Routes from './routes/oauth2'

export const createEchoServer = () => {
  const app = Express()

  app.use(
    cors({
      origin: '*',
    }),
  )

  app.use(bodyParser())
  app.use(cookieParser())
  app.use(Express.json())
  app.disable('x-powered-by')

  app.use('/', OAuth2Routes)

  // Listen to all kinds of requests
  app.all('/*', async (req, res) => {
    console.log(`${req.method} ${req.path}`)

    res.send({
      headers: req.headers,
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
