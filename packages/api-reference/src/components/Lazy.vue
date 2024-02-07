<script lang="ts" setup>
import { nextTick, ref } from 'vue'

/**
 * Component which loads lazily when the browser is "idle"
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */
const props = withDefaults(
  defineProps<{
    isLazy: boolean
  }>(),
  {
    isLazy: true,
  },
)

function onIdle(cb = () => {}) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(cb)
  } else {
    setTimeout(() => {
      nextTick(cb)
    }, 0)
  }
}

const shouldRender = ref(false)

if (props.isLazy) {
  onIdle(() => {
    console.log('lazy loadin')
    shouldRender.value = true
  })
}
</script>
<template>
  <div>
    <slot v-if="!isLazy || shouldRender" />
  </div>
</template>
