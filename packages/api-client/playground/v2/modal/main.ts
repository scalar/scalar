import { createWorkspaceStore } from '@scalar/workspace-store/client'
import '@/style.css'

import { createApiClientModal } from '@/v2/features/modal/helpers/create-api-client-modal'

const workspaceStore = createWorkspaceStore()
await workspaceStore.addDocument({
  name: 'default',
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  config: {
    'x-scalar-reference-config': {
      settings: {
        proxyUrl: 'https://proxy.scalar.com',
      },
    },
  },
})

await workspaceStore.addDocument({
  name: 'default2',
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  config: {
    'x-scalar-reference-config': {
      settings: {
        proxyUrl: 'https://proxy.scalar.com',
      },
    },
  },
})

const { open } = await createApiClientModal({
  el: document.getElementById('app'),
  workspaceStore,
})

// Open the API client right-away
open()

document.getElementById('button')?.addEventListener('click', () => open())

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
