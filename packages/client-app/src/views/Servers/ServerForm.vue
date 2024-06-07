<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
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

const activeServer = computed(() => {
  const server = activeCollection.value?.spec.servers.find(
    ({ uid }) => uid === params.server,
  )

  console.log('========')
  console.log(activeCollection.value?.spec.servers)
  console.log(params.server)

  return { url: server?.url, description: server?.description }
})
const updateServer = (key: string, value: string) => {
  if (!activeCollection.value) return

  const serverIndex = activeCollection.value?.spec.servers.findIndex(
    ({ uid }) => uid === params.server,
  )
  // collectionMutators.edit(
  //   activeCollection.value.uid,
  //   `spec.servers.${serverIndex}.${key}`,
  //   value,
  // )
}
</script>
<template>
  <Form
    :data="activeServer"
    :onUpdate="updateServer"
    :options="options"
    title="Server" />
</template>
