import '@/style.css'
import { createApiClientApp } from '@/layouts/App'

createApiClientApp(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
