import { createApiClientProxy } from '@scalar/api-client-proxy'
import 'dotenv/config'

const port = process.env.PORT || 5051

const { listen } = createApiClientProxy()

listen(port, () => {
  console.log(`🥤 API Client Proxy listening on http://localhost:${port}`)
})
