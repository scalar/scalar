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
</script>
<template>
  <Form
    v-if="activeServer"
    :data="activeServer"
    :onUpdate="updateServer"
    :options="options"
    title="Server" />
</template>
