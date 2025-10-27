<script lang="ts" setup>
/**
 * Lazily renders content when the browser has idle time available.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */

import { useLazyBus } from './lazyBus'

const { id } = defineProps<{
  // Identifier for loaded event, if no ID is passed then no event is dispatched
  id: string
}>()

const { isReady } = useLazyBus(id)
</script>
<template>
  <slot v-if="isReady" />
</template>
