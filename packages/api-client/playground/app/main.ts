import { createApiClientApp } from '@/layouts/App'

createApiClientApp(document.getElementById('scalar-client'), {
  proxyUrl: 'http://localhost:5051',
})
