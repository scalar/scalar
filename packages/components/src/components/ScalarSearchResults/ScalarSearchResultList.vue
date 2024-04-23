<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cx } from '../../cva'

defineProps<{
  noResults?: boolean
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
    <slot
      v-if="noResults"
      name="noResults">
      <div class="flex flex-col items-center gap-2 px-3 py-4">
        <div class="rotate-90 text-lg font-bold">:(</div>
        <div class="text-sm font-medium text-fore-2">
          No results found
          <template v-if="$slots.query">for "<slot name="query" />"</template>
        </div>
      </div>
    </slot>
    <slot />
  </ul>
</template>
