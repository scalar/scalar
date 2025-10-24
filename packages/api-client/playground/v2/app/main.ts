import '@/style.css'

import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { createApiClientApp } from '@/v2/features/app'

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

const el = document.getElementById('scalar-client')

/** This isn't in electron but basically fakes the desktop app in the web so its easier to work on */
createApiClientApp(el, workspaceStore, { layout: 'desktop' })
