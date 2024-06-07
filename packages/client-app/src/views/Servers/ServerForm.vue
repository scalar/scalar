<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
import type { Server } from '@scalar/oas-utils/entities/workspace/server'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { activeCollection, collectionMutators } = useWorkspace()

const options = [
  {
    label: 'Description',
    key: 'description',
    placeholder: 'The Scalar Galaxy is an example OpenAPI...',
  },
  { label: 'URL', key: 'url', placeholder: 'https://galaxy.scalar.com/api/v1' },
]

const { params } = useRoute()

const activeServer = computed(() =>
  activeCollection.value && params.server === 'default'
    ? activeCollection.value?.spec.servers[0]
    : activeCollection.value?.spec.servers.find(
        ({ uid }) => uid === params.server,
      ),
)

const updateServer = (key: string, value: string) => {
  if (!activeCollection.value) return

  const serverIndex = activeCollection.value?.spec.servers.findIndex(
    ({ uid }) => uid === activeServer.value?.uid,
  )

  collectionMutators.edit(
    activeCollection.value.uid,
    `spec.servers.${serverIndex}.${key as keyof Server}`,
    value,
  )
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
