import { createApiClientModal } from '@/index'

const { client } = await createApiClientModal({
  el: document.getElementById('app'),
  configuration: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
    proxyUrl: 'https://proxy.scalar.com',
  },
})

// Open the API client right-away
client.open()

document.getElementById('button')?.addEventListener('click', () => open())

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
