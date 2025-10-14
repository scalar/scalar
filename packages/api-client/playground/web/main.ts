import '@/style.css'

import { createApiClientWeb } from '@/layouts/Web'

void createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})
