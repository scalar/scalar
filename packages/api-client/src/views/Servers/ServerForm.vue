<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
import type { Server } from '@scalar/oas-utils/entities/workspace/server'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { activeCollection, servers, serverMutators } = useWorkspace()

const options = [
  { label: 'URL', key: 'url', placeholder: 'https://void.scalar.com/api' },
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

const updateVariable = (key: string, value: any) => {
  if (!activeCollection.value) return
  serverMutators.edit(activeServer.value.uid, `variables.${key}.value`, value)
}

/** Fields for the table */
const variableOptions = computed(() =>
  Object.entries(activeServer.value?.variables ?? {}).map(
    ([key, variable]) => ({
      key,
      label: key,
      placeholder: variable.default ?? variable?.enum?.[0] ?? '',
    }),
  ),
)

/** Values from the workspace, use `default` or `enum[0]` as fallback */
const variablesData = computed(() =>
  Object.entries(activeServer.value.variables ?? {}).reduce<
    Record<string, string>
  >((acc, [key, variable]) => {
    acc[key] = variable.value ?? variable.default ?? variable?.enum?.[0] ?? ''
    return acc
  }, {}),
)
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
