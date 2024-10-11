import { createApiClientWeb } from '@/layouts/Web'

createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
