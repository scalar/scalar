<script lang="ts" setup>
/**
 * Lazily renders content when the browser has idle time available.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */
import { nextTick, ref } from 'vue'

import { lazyBus } from './lazyBus'

const {
  id,
  isLazy = true,
  lazyTimeout = 0,
  prev = false,
} = defineProps<{
  // Identifier for loaded event, if no ID is passed then no event is dispatched
  id?: string
  // To lazyload or not to lazyload, that is the question
  isLazy?: boolean
  // Amount of time in ms to wait before triggering requestIdleCallback
  lazyTimeout?: number
  // Whether the element is a previous sibling of the current entry
  prev?: boolean
}>()

/**
 * The default timeout for lazy loading
 *
 * Note: For browsers *without* requestIdleCallback support only.
 */
const DEFAULT_LAZY_TIMEOUT = 300

/** We save to our lazyId list if it's a previous sibling or if it's not lazy */
const save = prev || !isLazy

const onIdle = (cb: () => void) => {
  if (typeof window === 'undefined') {
    // SSR: Do nothing and load client-side
  } else if ('requestIdleCallback' in window) {
    setTimeout(() => window.requestIdleCallback(cb), lazyTimeout)
  } else {
    setTimeout(() => {
      nextTick(() => {
        cb()
      }),
        lazyTimeout ?? DEFAULT_LAZY_TIMEOUT
    })
  }
}

const readyToRender = ref(!isLazy)
lazyBus.emit({ loading: id, save })

// Fire the event for non-lazy components as well to keep track of loading
if (isLazy) {
  onIdle(() => {
    readyToRender.value = true

    if (id) {
      nextTick(() => lazyBus.emit({ loaded: id, save }))
    }
  })
} else if (id) {
  nextTick(() => lazyBus.emit({ loaded: id, save }))
}
</script>
<template>
  <div
    :id="id"
    class="lazy-loading-container"
    :data-id="`#${id} ${isLazy ? '⌛' : '⚡'}`">
    <!-- <slot v-if="readyToRender" /> -->
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
  min-height: 400px;
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
