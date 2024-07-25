import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'

// Initialize
await createApiClientApp(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
