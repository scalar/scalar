import '@/style.css'

import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { createApiClientApp } from '@/v2/features/app'

const workspaceStore = createWorkspaceStore()
await workspaceStore.addDocument({
  name: 'scalar-galaxy',
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
  name: 'swagger-petstore-3-0',
  url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  config: {
    'x-scalar-reference-config': {
      settings: {
        proxyUrl: 'https://proxy.scalar.com',
      },
    },
  },
})

await workspaceStore.addDocument({
  name: 'drafts',
  document: {
    openapi: '3.2.0',
    info: {
      title: 'Drafts',
      version: '1.0.0',
    },
    paths: {
      '/': {
        get: {
          summary: 'My First Request',
        },
      },
    },
  },
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
createApiClientApp(el, workspaceStore, { layout: 'web' })
