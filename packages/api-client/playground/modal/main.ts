import { createApiClientModal } from '@/index'

const { open } = await createApiClientModal({
  el: document.getElementById('app'),
  configuration: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    proxyUrl: 'https://proxy.scalar.com',
  },
})

// Open the API client right-away
open()

document.getElementById('button')?.addEventListener('click', () => open())

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
