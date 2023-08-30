import cors from 'cors'
import express from 'express'

export class EchoServer {
  app = express()

  constructor() {
    this.app.use(
      cors({
        origin: '*',
      }),
    )

    this.app.use(express.json())
    this.app.disable('x-powered-by')

    // Post request to / are proxied to the target url.
    this.app.all('/*', async (req, res) => {
      console.log(`${req.method} ${req.path}`)

      res.send({
        headers: req.headers,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
      })
    })
  }

  listen(port: number | string, callback?: () => void) {
    this.app.listen(port, callback)
  }
}
