import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
const port = process.env.PORT || 5051

app.use(
  cors({
    origin: '*',
  }),
)

app.use(express.json())

// Post request to / are proxied to the target url.
app.post('/', async (req, res) => {
  if (req.method === 'POST') {
    console.log(`${req.body.method} ${req.body.url}`)

    // Default options are marked with *
    try {
      const response = await fetch(req.body.url, {
        // *GET, POST, PUT, DELETE, etc.
        method: req.body.method,
        // no-cors, *cors, same-origin
        mode: 'no-cors',
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
        body: req.body.data ? JSON.stringify(req.body.data) : null,
      })

      const headers = {}

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
    }

    return
  }
})

// Boot the server
app.listen(port, () => {
  console.log('')
  console.log(`🥤 API Client Proxy listening on http://localhost:${port}`)
  console.log('')
})
