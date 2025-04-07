<script setup lang="ts">
import { useWorkspace } from '@scalar/api-client/store'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import { watchDebounced } from '@vueuse/core'
import { useExampleStore } from '#legacy'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useNavState } from '@/hooks'

import { useApiClient } from './useApiClient'

const { configuration } = defineProps<{
  configuration: Partial<ApiClientConfiguration>
}>()

const el = ref<HTMLDivElement | null>(null)

const { client, init } = useApiClient()
const { selectedExampleKey, operationId } = useExampleStore()
const store = useWorkspace()
const { isIntersectionEnabled } = useNavState()

onMounted(() => {
  if (!el.value) {
    return
  }

  // Initialize the client
  init({
    el: el.value,
    configuration,
    store,
  })
})

// Update the config on change
// We temporarily just debounce this but we should switch to the diff from watch mode for updates
watchDebounced(
  () => configuration,
  (_config) => {
    if (_config) {
      // Disable intersection observer in case there's some jumpiness
      isIntersectionEnabled.value = false
      client.value?.updateConfig(_config)

      setTimeout(() => {
        isIntersectionEnabled.value = true
      }, 1000)
    }
  },
  { deep: true, debounce: 300 },
)

watch(selectedExampleKey, (newKey) => {
  if (client.value && newKey && operationId.value) {
    client.value.updateExample(newKey, operationId.value)
  }
})

onBeforeUnmount(() => client.value?.app.unmount())
</script>

<template>
  <div ref="el" />
</template>
