<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { createApiClientModal } from '@/Modal'

// Initialize
=======
>>>>>>> 85aaec8df (chore: add two different playgrounds for the modal and the embed)
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
=======
=======
<<<<<<< HEAD:packages/api-client/playground/modal/main.ts
>>>>>>> fdb828894 (feat: add new createApiClientEmbed method (wip))
import { createApiClientModal } from '@/Modal'

// Initialize
const { open } = await createApiClientModal(document.getElementById('app'), {
<<<<<<< HEAD
>>>>>>> d86314823 (fix: playground broken)
=======
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
<<<<<<< HEAD:packages/api-client/playground/modal/main.ts
await createApiClientEmbed(document.getElementById('app'), {
>>>>>>> 89318fb7d (feat: add new createApiClientEmbed method (wip)):packages/api-client/playground/main.ts
<<<<<<< HEAD
>>>>>>> fdb828894 (feat: add new createApiClientEmbed method (wip))
=======
=======
// TODO: The ID must not be something else than `scalar-client`, because this adds styles.
await createApiClientEmbed(document.getElementById('scalar-client'), {
>>>>>>> 67f070020 (fix: background not visible):packages/api-client/playground/main.ts
<<<<<<< HEAD
>>>>>>> 1013e3b3c (fix: background not visible)
=======
=======
import { createScalarApiClient } from '@/Modal'

// Initialize
const { open } = await createScalarApiClient(document.getElementById('app'), {
>>>>>>> 1d4e9bcb2 (chore: add two different playgrounds for the modal and the embed)
>>>>>>> 85aaec8df (chore: add two different playgrounds for the modal and the embed)
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 85aaec8df (chore: add two different playgrounds for the modal and the embed)
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
<<<<<<< HEAD
>>>>>>> 362cb0714 (chore: add two different playgrounds for the modal and the embed)
=======
// // Open the API client right-away
// open()

// // Or: Open a specific operation
// // open({
// //   method: 'GET',
// //   path: '/me',
// // })
>>>>>>> fdb828894 (feat: add new createApiClientEmbed method (wip))
=======
>>>>>>> 1d4e9bcb2 (chore: add two different playgrounds for the modal and the embed)
>>>>>>> 85aaec8df (chore: add two different playgrounds for the modal and the embed)
