<script setup lang="ts">
import Form from '@/components/Form/Form.vue'
import { useWorkspace } from '@/store/workspace'
import { computed } from 'vue'

const { servers, activeServerId, serverMutators } = useWorkspace()

const options = [
  { label: 'Name', key: 'name', placeholder: 'Username' },
  { label: 'URL', key: 'url', placeholder: 'https://api.scalar.com/v1' },
]

const activeServer = computed(
  () => servers[activeServerId.value as string] || {},
)
const updateServer = (key: any, value: any) => {
  if (activeServerId.value) {
    serverMutators.edit(activeServerId.value as string, key, value)
  }
}
</script>
<template>
  <Form
    :data="activeServer"
    :onUpdate="updateServer"
    :options="options"
    title="Server" />
</template>
