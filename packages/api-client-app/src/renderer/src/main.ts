import { webHashRouter } from '@scalar/api-client'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'

// Initialize
createApiClientApp(
  document.getElementById('scalar-client'),
  {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    },
    proxyUrl: 'https://proxy.scalar.com',
  },
  true,
  webHashRouter,
)
