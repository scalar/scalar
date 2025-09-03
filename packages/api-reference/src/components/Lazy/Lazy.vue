<script lang="ts" setup>
/**
 * Lazily renders content when the browser has idle time available.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */

import { computed, onUnmounted } from 'vue'

import { useNavState } from '@/hooks/useNavState'

import {
  hasBeenIdle,
  onAllIdsLoaded,
  registerId,
  shouldLoadId,
  unregisterId,
} from './lib/lazy-loading'

const { id } = defineProps<{
  // Identifier for loaded event, if no ID is passed then no event is dispatched
  id?: string
}>()

/** Use the individual ID's load control flag instead of global idle state */
const readyToRender = computed(() => {
  // Fallback to global state if no ID
  if (!id) {
    return hasBeenIdle()
  }

  // Use ID-specific flag with fallback
  return shouldLoadId(id) ?? hasBeenIdle()
})

// Register the ID in the global state if provided
if (id) {
  registerId(id)
}

// Unregister the ID when the component unmounts to prevent memory leaks
onUnmounted(() => {
  if (id) {
    unregisterId(id)
  }
})

const { isIntersectionEnabled } = useNavState()

onAllIdsLoaded(() => {
  console.log('[LazyLoading] Done.')
  isIntersectionEnabled.value = true
})
</script>

<template>
  <div
    :id="id"
    class="lazy-loading-container"
    :data-id="`#${id}`">
    <!-- {{ readyToRender }} -->
    <slot v-if="readyToRender" />
  </div>
</template>

<style scoped>
.lazy-loading-container {
  outline: 1px solid #1c7ed6;
  border-radius: 4px;
  padding: 10px;
  padding-top: 30px;
  position: relative;
  margin-bottom: 10px;
  min-height: 200px;
}

.lazy-loading-container::before {
  content: attr(data-id);
  color: white;
  background-color: #1c7ed6;
  position: absolute;
  left: 10px;
  top: 0;
  border-radius: 0 0 4px 4px;
  padding: 4px 10px;
  font-size: 12px;
}
</style>
