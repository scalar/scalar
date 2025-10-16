import { createApiClientModal } from '@/v2/features/modal/helpers/create-api-client-modal'

console.log('asdjkashdkjs')
const { open } = await createApiClientModal({
  el: document.getElementById('app'),
  workspaceStore: {
    workspace: {
      'x-scalar-active-document': 'default',
    },
  } as any,
})

// Open the API client right-away
open()

document.getElementById('button')?.addEventListener('click', () => open())

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
