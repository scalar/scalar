<script lang="ts">
export const LAZY_LOADED_EVENT = 'LAZY_LOADED_EVENT'

export const createLazyEvent = (id: string) =>
  new CustomEvent(LAZY_LOADED_EVENT, { detail: id })

// Create a listener for the custom event
export const lazyEventListener = (id: string, cb: () => void) =>
  document.addEventListener(LAZY_LOADED_EVENT, (e) => {
    if (id === (e as CustomEvent).detail) cb()
  })
</script>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'

/**
 * Component which loads lazily when the browser is "idle"
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
  if ('requestIdleCallback' in window) {
    setTimeout(() => window.requestIdleCallback(cb), props.lazyTimeout)
  } else {
    setTimeout(() => nextTick(cb), props.lazyTimeout ?? 300)
  }
}

const shouldRender = ref(!props.isLazy)

if (props.isLazy) {
  onIdle(() => {
    shouldRender.value = true

    // Fire off the lazy loaded event
    if (props.id) {
      await nextTick()
      document.dispatchEvent(createLazyEvent(props.id))
    }
  })
}
</script>
<template>
  <slot v-if="shouldRender" />
</template>
