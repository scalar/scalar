import cors from 'cors'
import Express from 'express'
import { type Server } from 'http'

import { version } from '../package.json'

export const createApiClientProxy = () => {
  const app = Express()

  app.use(
    cors({
      origin: '*',
    }),
  )

  app.use(Express.json())
  app.disable('x-powered-by')

  // Post request to / are proxied to the target url.
  app.post('/', async (req, res) => {
    if (req.method === 'POST') {
      if (req.body.method === undefined || req.body.method.trim() === '') {
        res.status(400)
        res.json({
          error: 'MissingMethod',
          message:
            'Could not find a valid request method. Try adding a JSON object with a `method` to your request.',
        })

        return
      }

      if (req.body.url === undefined || req.body.url.trim() === '') {
        res.status(400)
        res.json({
          error: 'MissingUrl',
          message:
            'Could not find an URL. Try adding a JSON object with an `url` to your request.',
        })

        return
      }

      console.log(`${req.body.method.trim()} ${req.body.url.trim()}`)

      const isGetOrHeadRequest = ['get', 'head'].includes(
        req.body.method.trim().toLowerCase(),
      )
      const body = isGetOrHeadRequest
        ? null
        : req.body.data
          ? JSON.stringify(req.body.data)
          : null

      // Default options are marked with *
      try {
        const response = await fetch(req.body.url.trim(), {
          // *GET, POST, PUT, DELETE, etc.
          method: req.body.method.trim(),
          // no-cors, *cors, same-origin
          mode: 'cors',
          // *default, no-cache, reload, force-cache, only-if-cached
          cache: 'no-cache',
          // include, *same-origin, omit
          credentials: 'include',
          headers: req.body.headers,
          // manual, *follow, error
          redirect: 'follow',
          // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          referrerPolicy: 'no-referrer',
          // body data type must match "Content-Type" header
          body,
        })

        const headers: Record<string, string> = {}

        const proxyHeaders = [...response.headers]
        proxyHeaders.forEach(([key, value]) => {
          if (['access-control-allow-origin'].includes(key.toLowerCase())) {
            return
          }

          headers[key] = value
        })

        const text = await response.text()

        res.status(200)
        res.json({
          statusCode: response.status,
          // TODO: Do we need body?
          // body: …
          data: text,
          headers: {
            ...headers,
            'X-API-Client-Content-Length': text.length,
          },
          // TODO: transform cookie data
          cookies: response.headers.get('cookies'),
        })
      } catch (error) {
        console.error('ERROR', error)
        const data = 'Scalar API Client Proxy Error'
        res.status(500)
        res.json({
          data,
        })
      }

      return
    }
  })

  const listen = (port: number | string, callback?: () => void) => {
    return app.listen(port, callback)
  }

  return {
    app: app as Express.Express,
    listen: listen as (port: number | string, callback?: () => void) => Server,
    /** Current proxy version */
    version,
  }
}
