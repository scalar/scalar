<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineProps<{
  noResults?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <ul
    role="listbox"
    v-bind="cx('flex flex-col')">
    <slot
      v-if="noResults"
      name="noResults">
      <div class="flex flex-col items-center gap-2 px-3 py-4">
        <div class="rotate-90 text-lg font-bold">:(</div>
        <div
          class="text-sm font-medium text-c-2"
          role="alert">
          No results found
        </div>
      </div>
    </slot>
    <slot />
  </ul>
</template>
