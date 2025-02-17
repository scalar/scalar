<script setup lang="ts">
import type { Server } from '@scalar/oas-utils/entities/spec'
import { computed, withDefaults } from 'vue'

import Form from '@/components/Form/Form.vue'
import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const props = withDefaults(
  defineProps<{
    collectionId: string | string[]
    serverUid: string | string[]
  }>(),
  {
    collectionId: '',
    serverUid: '',
  },
)

const { activeWorkspaceCollections } = useActiveEntities()
const { servers, serverMutators } = useWorkspace()

const options = [
  {
    label: 'URL',
    key: 'url',
    placeholder: 'https://void.scalar.com/api',
    type: 'text',
  },
  {
    label: 'Label',
    key: 'description',
    placeholder: 'Production',
    type: 'text',
  },
]

const activeServer = computed(() => {
  const activeCollection = activeWorkspaceCollections.value.find(
    (collection) => collection.uid === props.collectionId,
  )
  return servers[
    activeCollection &&
    typeof props.serverUid === 'string' &&
    props.serverUid === 'default'
      ? (activeCollection.servers[0] ?? '')
      : (activeCollection?.servers.find((uid) => uid === props.serverUid) ?? '')
  ]
})

const updateServer = (key: string, value: string) => {
  if (!activeWorkspaceCollections.value || !activeServer.value) return
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}

const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) return

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
</script>

<template>
  <div class="bg-b-1 divide-0.5 flex w-full flex-col divide-y text-sm">
    <template v-if="activeServer">
      <Form
        :data="activeServer"
        :onUpdate="updateServer"
        :options="options" />
      <ServerVariablesForm
        v-if="activeServer.variables"
        :variables="activeServer.variables"
        @update:variable="updateServerVariable"
        class="bg-b-1 text-sm" />
    </template>
  </div>
</template>
