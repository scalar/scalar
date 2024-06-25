<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
import type { Server } from '@scalar/oas-utils/entities/workspace/server'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { activeCollection, servers, serverMutators } = useWorkspace()

const options = [
  { label: 'URL', key: 'url', placeholder: 'https://galaxy.scalar.com/api/v1' },
  {
    label: 'Label',
    key: 'description',
    placeholder: 'Production',
  },
]

const route = useRoute()

const activeServer = computed(
  () =>
    servers[
      activeCollection.value && route.params.server === 'default'
        ? activeCollection.value?.spec.serverUids[0]
        : activeCollection.value?.spec.serverUids.find(
            (uid) => uid === route.params.server,
          ) ?? ''
    ],
)

const updateServer = (key: string, value: string) => {
  if (!activeCollection.value) return
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}

const updateVariable = (key: string, value: string) => {
  if (!activeCollection.value) return

  serverMutators.edit(activeServer.value.uid, `variables.${key}`, {
    uid: 'foobar',
    default: '',
    ...activeServer.value.variables?.[key],
    value,
  })
}

const variableOptions = computed(() => {
  const variables = activeServer.value?.variables ?? {}

  const keys = Object.keys(variables)

  return keys.map((key: string) => ({
    key,
    label: key,
    placeholder: variables?.[key]?.default ?? '',
  }))
})

/**
 * Get values from the workspace, use `default` as fallback
 */
const variablesData = computed(() => {
  return Object.keys(activeServer.value.variables ?? {}).reduce(
    (acc, variable) => ({
      ...acc,
      [variable]:
        activeServer.value.variables?.[variable].value ??
        activeServer.value.variables?.[variable].default ??
        '',
    }),
    {},
  )
})
</script>
<template>
  <div class="w-full">
    <template v-if="activeServer">
      <Form
        :data="activeServer"
        :onUpdate="updateServer"
        :options="options"
        title="Server" />

      <Form
        v-if="Object.keys(variablesData).length"
        :data="variablesData"
        :onUpdate="updateVariable"
        :options="variableOptions"
        title="Variables" />
    </template>
  </div>
</template>
