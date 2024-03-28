<script lang="ts" setup>
import { nextTick, ref } from 'vue'

import { lazyBus } from './lazyBus'

/**
 * Component which loads lazily when the browser is "idle"
 * Disabled if being rendered from the server
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */
const props = withDefaults(
  defineProps<{
    // Identifier for loaded event, if no ID is passed then no event is dispatched
    id?: string
    // To lazyload or not to lazyload, that is the question
    isLazy?: boolean
    // Amount of time in ms to wait before triggering requestIdleCallback
    lazyTimeout?: number
  }>(),
  {
    isLazy: true,
    lazyTimeout: 0,
  },
)

const onIdle = (cb = () => {}) => {
  if (typeof window === 'undefined') {
    // Do nothing and load on the client only
  } else if ('requestIdleCallback' in window) {
    setTimeout(() => window.requestIdleCallback(cb), props.lazyTimeout)
  } else {
    setTimeout(() => nextTick(cb), props.lazyTimeout ?? 300)
  }
}

const shouldRender = ref(!props.isLazy)

// Fire the event for non-lazy components as well to keep track of loading
if (props.isLazy) {
  onIdle(() => {
    shouldRender.value = true
    if (props.id) nextTick(() => lazyBus.emit({ id: props.id! }))
  })
} else if (props.id) {
  nextTick(() => lazyBus.emit({ id: props.id! }))
}
</script>
<template>
  <slot v-if="shouldRender" />
</template>
