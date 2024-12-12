<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import type { Server } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { activeCollection } = useActiveEntities()
const { servers, serverMutators } = useWorkspace()

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
      (activeCollection.value && route.params.server === 'default'
        ? activeCollection.value?.servers[0]
        : activeCollection.value?.servers.find(
            (uid) => uid === route.params.server,
          )) ?? ''
    ],
)

const updateServer = (key: string, value: string) => {
  if (!activeCollection.value || !activeServer.value) return
  serverMutators.edit(activeServer.value.uid, key as keyof Server, value)
}

const updateVariable = (key: string, value: any) => {
  if (!activeCollection.value || !activeServer.value) return
  serverMutators.edit(activeServer.value.uid, `variables.${key}.value`, value)
}

/** Fields for the table */
const variableOptions = computed(() =>
  Object.entries(activeServer.value?.variables ?? {}).map(
    ([key, variable]) => ({
      key,
      label: key,
      placeholder: (variable.default ?? variable?.enum?.[0] ?? '').toString(),
    }),
  ),
)

/** Values from the workspace, use `default` or `enum[0]` as fallback */
const variablesData = computed(() =>
  Object.entries(activeServer.value?.variables ?? {}).reduce<
    Record<string, string>
  >((acc, [key, variable]) => {
    acc[key] = (variable.default ?? variable?.enum?.[0] ?? '').toString()
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
