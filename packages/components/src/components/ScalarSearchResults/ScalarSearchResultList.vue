<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cx } from '../../cva'

defineProps<{
  // empty?: boolean
  // noResults?: boolean
}>()

defineOptions({ inheritAttrs: false })

/* Extract the classes so they can be merged by `cx` */
const attrs = computed(() => {
  const { class: className, ...rest } = useAttrs()
  return { className: className || '', rest }
})
</script>
<template>
  <ul
    v-bind="attrs.rest"
    :class="cx('flex flex-col', attrs.className)">
    <slot />
  </ul>
</template>
