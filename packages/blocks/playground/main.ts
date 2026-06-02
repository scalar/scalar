import '../src/style.css'

import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClients } from '@scalar/snippetz'
import { createWorkspaceStore } from '@scalar/workspace-store/client'

import { createCodeExample } from '../src/code-example'

const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

/** One block per operation, laid out across a three-column grid. */
const operations: Array<{ path: string; method: HttpMethod; selectedClient: AvailableClients[number] }> = [
  { path: '/users', method: 'get', selectedClient: 'shell/curl' },
  { path: '/users', method: 'post', selectedClient: 'node/undici' },
  { path: '/users/{userId}', method: 'get', selectedClient: 'js/fetch' },
  { path: '/users/{userId}', method: 'patch', selectedClient: 'python/requests' },
  { path: '/users/{userId}', method: 'delete', selectedClient: 'go/native' },
  { path: '/files', method: 'post', selectedClient: 'shell/curl' },
  { path: '/sessions', method: 'post', selectedClient: 'php/curl' },
  { path: '/articles', method: 'post', selectedClient: 'ruby/native' },
  { path: '/webhooks/ping', method: 'put', selectedClient: 'node/fetch' },
]

const grid = document.querySelector('#grid')

for (const { path, method, selectedClient } of operations) {
  const element = document.createElement('div')
  grid?.append(element)

  createCodeExample(element, {
    store,
    path,
    method,
    selectedClient,
    selectedServer: { url: 'https://api.example.com' },
  })
}
