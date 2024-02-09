<script lang="ts" setup>
import { nextTick, ref } from 'vue'

/**
 * Component which loads lazily when the browser is "idle"
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */
const props = withDefaults(
  defineProps<{
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
  })
}
</script>
<template>
  <slot v-if="shouldRender" />
</template>
