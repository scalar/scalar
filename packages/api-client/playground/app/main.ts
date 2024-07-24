import { createApiClientApp } from '@/layouts/App'

// Initialize
await createApiClientApp(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
