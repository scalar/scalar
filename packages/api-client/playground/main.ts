<<<<<<< HEAD
import { createApiClientModal } from '@/Modal'

// Initialize
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
<<<<<<< HEAD
await createApiClientEmbed(document.getElementById('app'), {
>>>>>>> 89318fb7d (feat: add new createApiClientEmbed method (wip))
=======
// TODO: The ID must not be something else than `scalar-client`, because this adds styles.
await createApiClientEmbed(document.getElementById('scalar-client'), {
>>>>>>> 67f070020 (fix: background not visible)
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
