import { createApiClientApp } from '@/App'

// Initialize
await createApiClientApp(document.getElementById('scalar-client'), {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})
