import { createApiClientWeb } from '@scalar/api-client/layouts/Web'
import '@scalar/api-client/style.css'
import '@scalar/api-client/tailwind.css'

createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
