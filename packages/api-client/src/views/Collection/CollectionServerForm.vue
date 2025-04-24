<script setup lang="ts">
import type { Server } from '@scalar/oas-utils/entities/spec'
import { REGEX } from '@scalar/oas-utils/helpers'
import { computed, watch } from 'vue'

import Form from '@/components/Form/Form.vue'
import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import type { ServerVariables } from '@/components/Server/types'
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
    placeholder: 'https://void.scalar.com',
    type: 'text',
  },
  {
    label: 'Description',
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

const pathVariables = computed(() => {
  if (!activeServer.value?.url) {
    return []
  }
  return (
    activeServer.value.url.match(REGEX.PATH)?.map((m) => m.slice(1, -1)) ?? []
  )
})

watch(
  pathVariables,
  (newPathVariables) => {
    if (!activeServer.value) {
      return
    }

    const variables = activeServer.value.variables
      ? { ...activeServer.value.variables }
      : {}

    // Removes variables no longer in the server path
    Object.keys(variables).forEach((key) => {
      if (!newPathVariables.includes(key)) {
        delete variables[key]
      }
    })

    // Adds path variables
    newPathVariables.forEach((variable) => {
      if (!variables[variable]) {
        variables[variable] = { default: '' }
      }
    })

    serverMutators.edit(activeServer.value.uid, 'variables', variables)
  },
  { immediate: true },
)

const updateServer = (key: string, value: string) => {
  if (!activeWorkspaceCollections.value || !activeServer.value) {
    return
  }
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}

const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) {
    return
  }

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
</script>

<template>
  <div
    class="divide-0.5 flex w-full flex-col divide-y rounded-b-lg text-sm"
    :class="activeServer?.variables && 'bg-b-1'">
    <template v-if="activeServer">
      <Form
        :data="activeServer"
        :onUpdate="updateServer"
        :options="options" />
      <ServerVariablesForm
        v-if="activeServer.variables"
        :variables="activeServer.variables as ServerVariables"
        @update:variable="updateServerVariable" />
    </template>
  </div>
</template>
