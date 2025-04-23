<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import {
  mutateSecuritySchemeDiff,
  mutateServerDiff,
  parseDiff,
} from '@scalar/api-client/views/Request/libs'
import { serverSchema } from '@scalar/oas-utils/entities/spec'
import type { ApiClientConfiguration } from '@scalar/types/api-reference'
import { watchDebounced } from '@vueuse/core'
import { useExampleStore } from '#legacy'
import microdiff, { type Difference } from 'microdiff'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useNavState } from '@/hooks'

import { useApiClient } from './useApiClient'

const { configuration } = defineProps<{
  configuration: Partial<ApiClientConfiguration>
}>()

const el = ref<HTMLDivElement | null>(null)

const { client, init } = useApiClient()
const { selectedExampleKey, operationId } = useExampleStore()
const activeEntities = useActiveEntities()
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
watchDebounced(
  () => configuration,
  (newConfig, oldConfig) => {
    if (!oldConfig) {
      return
    }

    const diff = microdiff(oldConfig, newConfig)
    const hasContentChanged = diff.some(
      (d) =>
        d.path[0] === 'url' ||
        d.path[0] === 'content' ||
        d.path[1] === 'url' ||
        d.path[1] === 'content',
    )

    // If the content changes then we re-create the whole store
    // TODO: we can easily use live sync for this as well
    if (hasContentChanged) {
      client.value?.updateConfig(newConfig)
    }
    // Or we handle the specific diff changes, just auth and servers for now
    else {
      diff.forEach((diff) => {
        // Servers
        if (diff.path[0] === 'servers') {
          mutateServerDiff(diff, activeEntities, store)
        }
        // Auth - TODO preferredSecurityScheme
        else if (diff.path[0] === 'authentication') {
          mutateSecuritySchemeDiff(diff, activeEntities, store)
        }
        // TODO: baseServerURL
      })
    }

    // Disable intersection observer in case there's some jumpiness
    isIntersectionEnabled.value = false
    setTimeout(() => {
      isIntersectionEnabled.value = true
    }, 1000)
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
