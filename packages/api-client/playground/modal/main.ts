<<<<<<< HEAD
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
<<<<<<< HEAD
await createApiClientEmbed(document.getElementById('app'), {
>>>>>>> 89318fb7d (feat: add new createApiClientEmbed method (wip))
<<<<<<< HEAD:packages/api-client/playground/modal/main.ts
>>>>>>> 68233a3ac (feat: add new createApiClientEmbed method (wip)):packages/api-client/playground/main.ts
=======
=======
// TODO: The ID must not be something else than `scalar-client`, because this adds styles.
await createApiClientEmbed(document.getElementById('scalar-client'), {
>>>>>>> 67f070020 (fix: background not visible)
>>>>>>> 8b495c88b (fix: background not visible):packages/api-client/playground/main.ts
=======
import { createScalarApiClient } from '@/Modal'

// Initialize
const { open } = await createScalarApiClient(document.getElementById('app'), {
>>>>>>> 362cb0714 (chore: add two different playgrounds for the modal and the embed)
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})

<<<<<<< HEAD
// // Open the API client right-away
// open()

// // Or: Open a specific operation
// // open({
// //   method: 'GET',
// //   path: '/me',
// // })
=======
// Open the API client right-away
open()

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
>>>>>>> 362cb0714 (chore: add two different playgrounds for the modal and the embed)
