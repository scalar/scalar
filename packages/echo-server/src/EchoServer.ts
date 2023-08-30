import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

export class EchoServer {
  public app = express()

  constructor() {
    this.app.use(
      cors({
        origin: '*',
      }),
    )

    this.app.use(cookieParser())
    this.app.use(express.json())
    this.app.disable('x-powered-by')

    // Post request to / are proxied to the target url.
    this.app.all('/*', async (req, res) => {
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
  }

  listen(port: number | string, callback?: () => void) {
    return this.app.listen(port, callback)
  }
}
