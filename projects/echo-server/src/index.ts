import { EchoServer } from '@scalar/echo-server'
import 'dotenv/config'

const port = process.env.PORT || 5052

const server = new EchoServer()

server.listen(port, () => {
  console.log('')
  console.log(`🔁 Echo Server listening on http://localhost:${port}`)
  console.log('')
})
