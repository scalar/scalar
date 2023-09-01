import { createEchoServer } from '@scalar/echo-server'
import 'dotenv/config'

const port = process.env.PORT || 5052

const { listen } = createEchoServer()

listen(port, () => {
  console.log(`🔁 Echo Server listening on http://localhost:${port}`)
})
