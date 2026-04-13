import { createWorkspaceStore } from '@scalar/workspace-store/client'
import '@/style.css'

import { createApiClientModal } from '@/v2/features/modal/helpers/create-api-client-modal'

const workspaceStore = createWorkspaceStore({
  meta: {
    'x-scalar-active-proxy': 'https://proxy.scalar.com',
  },
})
await workspaceStore.addDocument({
  name: 'default',
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

const { open } = createApiClientModal({
  el: document.getElementById('app'),
  workspaceStore,
})

// Open the API client right-away
open()

document.getElementById('button')?.addEventListener('click', () =>
  open({
    path: '/user/signup',
    method: 'post',
  }),
)

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
