import { ApiClientProxy } from '@scalar/api-client-proxy'
import 'dotenv/config'

const port = process.env.PORT || 5051

const server = new ApiClientProxy()

server.listen(port, () => {
  console.log('')
  console.log(`🥤 API Client Proxy listening on http://localhost:${port}`)
  console.log('')
})
