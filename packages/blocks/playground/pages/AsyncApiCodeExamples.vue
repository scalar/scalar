<script setup lang="ts">
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

import { createCodeExample } from '../../src/code-example'

const container = useTemplateRef<HTMLDivElement>('container')
const instances: Array<{ destroy: () => void }> = []
onMounted(async () => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'events',
    document: {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1.0.0' },
      servers: { production: { host: 'events.example.com', protocol: 'wss' } },
      channels: {
        updates: {
          address: '/updates',
          messages: {
            user: {
              name: 'User updated',
              examples: [
                { name: 'Ada', payload: { type: 'user.updated', name: 'Ada' } },
                {
                  name: 'Grace',
                  payload: { type: 'user.updated', name: 'Grace' },
                },
              ],
            },
            project: {
              name: 'Project updated',
              examples: [
                {
                  name: 'Launch',
                  payload: { type: 'project.updated', name: 'Launch' },
                },
              ],
            },
          },
        },
      },
      operations: {
        send: { action: 'send', channel: { $ref: '#/channels/updates' } },
        receive: { action: 'receive', channel: { $ref: '#/channels/updates' } },
        authored: {
          'action': 'send',
          'channel': { $ref: '#/channels/updates' },
          'x-codeSamples': [
            {
              lang: 'python',
              label: 'Python SDK',
              source:
                'from events import Client\n\nclient = Client()\nclient.users.update(name="Ada")',
            },
          ],
        },
      },
    },
  })
  for (const operationName of ['send', 'receive', 'authored']) {
    const element = document.createElement('div')
    container.value?.append(element)
    instances.push(createCodeExample(element, { store, operationName }))
  }
})
onBeforeUnmount(() => instances.forEach((instance) => instance.destroy()))
</script>
<template>
  <div
    ref="container"
    class="scalar-app examples" />
</template>

<style scoped>
/* Playground files are outside the library Tailwind source scan. */
.examples {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 1rem;
}
@media (max-width: 1000px) {
  .examples {
    grid-template-columns: 1fr;
  }
}
</style>
