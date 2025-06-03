<script lang="ts" setup>
import { createWorkspaceStore } from '@scalar/workspace-store'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import { onCustomEvent } from '@/v2/events'

const store = await createWorkspaceStore()

const root = shallowRef<HTMLElement | null>(null)

onCustomEvent(root, 'scalar-update-sidebar', (event) => {
  console.log('scalar-update-sidebar', event)
})

onCustomEvent(root, 'scalar-update-dark-mode', (event) => {
  store.update('x-scalar-dark-mode', event.data.value)
})

onCustomEvent(root, 'scalar-update-active-document', (event) => {
  console.log('scalar-update-active-document', event)
  store.update('x-scalar-active-document', event.data.value)
})

onMounted(() => {
  // Handle all event listeners
})
</script>
<template>
  <div
    ref="root"
    style="display: contents">
    <slot />
  </div>
</template>
