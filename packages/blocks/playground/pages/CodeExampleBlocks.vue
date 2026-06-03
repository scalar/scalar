<script setup lang="ts">
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClients } from '@scalar/snippetz'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { createCodeExample } from '../../src/code-example'

/** One block per operation, laid out across a three-column grid. */
const operations: Array<{
  path: string
  method: HttpMethod
  selectedClient: AvailableClients[number]
}> = [
  { path: '/users', method: 'get', selectedClient: 'shell/curl' },
  { path: '/users', method: 'post', selectedClient: 'node/undici' },
  { path: '/users/{userId}', method: 'get', selectedClient: 'js/fetch' },
  {
    path: '/users/{userId}',
    method: 'patch',
    selectedClient: 'python/requests',
  },
  { path: '/users/{userId}', method: 'delete', selectedClient: 'go/native' },
  { path: '/files', method: 'post', selectedClient: 'shell/curl' },
  { path: '/sessions', method: 'post', selectedClient: 'php/curl' },
  { path: '/articles', method: 'post', selectedClient: 'ruby/native' },
  { path: '/webhooks/ping', method: 'put', selectedClient: 'node/fetch' },
]

const grid = ref<HTMLDivElement | null>(null)
const instances: Array<{ destroy: () => void }> = []

onMounted(async () => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'default',
    url: '/openapi.json',
  })

  for (const { path, method, selectedClient } of operations) {
    const element = document.createElement('div')
    grid.value?.append(element)

    instances.push(
      createCodeExample(element, {
        store,
        path,
        method,
        selectedClient,
        selectedServer: { url: 'https://api.example.com' },
      }),
    )
  }
})

// Each block mounts its own Vue app, so tear them down when leaving the page.
onBeforeUnmount(() => {
  instances.forEach((instance) => instance.destroy())
})
</script>

<template>
  <div
    ref="grid"
    class="grid" />
</template>

<style scoped>
/* Masonry-style packing: columns fill top-to-bottom so short blocks do not
   leave the row gaps a fixed grid would. */
.grid {
  column-count: 3;
  column-gap: 1rem;
}

.grid > * {
  break-inside: avoid;
  margin-bottom: 1rem;
}
</style>
