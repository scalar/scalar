import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
const port = process.env.PORT || 5052

app.use(
  cors({
    origin: '*',
  }),
)

app.use(express.json())
app.disable('x-powered-by')

// Post request to / are proxied to the target url.
app.all('/', async (req, res) => {
  res.send({
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body,
  })
})

// Boot the server
app.listen(port, () => {
  console.log('')
  console.log(`🔁 Echo Server listening on http://localhost:${port}`)
  console.log('')
})
