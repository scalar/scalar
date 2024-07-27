import { createApiClientModal } from '@/layouts/Modal'

const { open } = await createApiClientModal(document.getElementById('app'), {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    // url: 'https://raw.githubusercontent.com/sonallux/spotify-web-api/main/official-spotify-open-api.yml',
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
