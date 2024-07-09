<<<<<<< HEAD
import { createApiClientModal } from '@/Modal'

// Initialize
<<<<<<< HEAD:packages/api-client/playground/modal/main.ts
const { open } = await createApiClientModal(document.getElementById('app'), {
=======
const { open } = await createApiClientModal(document.getElementById('root'), {
=======
// import { createScalarApiClient } from '@/Modal'
// // Initialize
// const { open } = await createScalarApiClient(document.getElementById('root'), {
//   spec: {
//     url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
//   },
//   proxyUrl: 'https://proxy.scalar.com',
// })
// // Open the API client right-away
// open()
// // Or: Open a specific operation
// // open({
// //   method: 'GET',
// //   path: '/me',
// // })
import { createApiClientEmbed } from '@/Embed'

// Initialize
await createApiClientEmbed(document.getElementById('app'), {
>>>>>>> 89318fb7d (feat: add new createApiClientEmbed method (wip))
>>>>>>> 68233a3ac (feat: add new createApiClientEmbed method (wip)):packages/api-client/playground/main.ts
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})

// // Open the API client right-away
// open()

// // Or: Open a specific operation
// // open({
// //   method: 'GET',
// //   path: '/me',
// // })
