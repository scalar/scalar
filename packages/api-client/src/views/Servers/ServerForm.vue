<script setup lang="ts">
import type { Server } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const { activeRouterParams, activeWorkspaceCollections } = useActiveEntities()
const { collections, servers, serverMutators } = useWorkspace()

const options = [
  { label: 'URL', key: 'url', placeholder: 'https://void.scalar.com/api' },
  {
    label: 'Label',
    key: 'description',
    placeholder: 'Production',
  },
]

const activeServer = computed(() => {
  const collection = collections[activeRouterParams.value.collection]
  if (!collection) return

  // If default grab the first server, otherwise match with router param
  const key =
    typeof activeRouterParams.value.servers === 'string' &&
    activeRouterParams.value.servers === 'default'
      ? collection.servers[0]
      : collection.servers.find(
          (uid) => uid === activeRouterParams.value.servers,
        )
  if (!key) return

  return servers[key]
})

const updateServer = (key: string, value: string) => {
  if (!activeWorkspaceCollections.value || !activeServer.value) return
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}
</script>
<template>
  <div class="divide-0.5 flex w-full divide-x">
    <template v-if="activeServer">
      <Form
        :data="activeServer"
        :onUpdate="updateServer"
        :options="options"
        title="Server" />
    </template>
  </div>
</template>
