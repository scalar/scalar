import { createScalarApiClient } from '@/api-client-modal'

// Initialize
const { open } = await createScalarApiClient(document.getElementById('root'), {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})

// Open the API client right-away
open()

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
