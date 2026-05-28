import '../src/style.css'

import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { createCodeExample } from '../src/operation-code-sample/mount'

const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

createCodeExample('#block', {
  // Data Source
  store,
  // Operation
  path: '/hello',
  method: 'post',
  // Configuration
  selectedClient: 'node/undici',
  selectedServer: {
    url: 'https://api.example.com',
  },
})
