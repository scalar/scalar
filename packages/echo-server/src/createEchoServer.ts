import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

export const createEchoServer = () => {
  const app = express()

  app.use(
    cors({
      origin: '*',
    }),
  )

  app.use(cookieParser())
  app.use(express.json())
  app.disable('x-powered-by')

  // Post request to / are proxied to the target url.
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

  const listen = (port: number | string, callback?: () => void) => {
    return app.listen(port, callback)
  }

  return {
    app,
    listen,
  }
}
