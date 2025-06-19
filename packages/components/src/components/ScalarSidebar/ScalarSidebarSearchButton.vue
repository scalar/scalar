<script setup lang="ts">
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

const { hotKey } = defineProps<{
  hotKey?: string
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    type="button"
    role="search"
    v-bind="
      cx(
        'flex items-center rounded border text-base h-8 gap-1 pl-2 pr-1',
        'bg-sidebar-b-search border-sidebar-border-search text-sidebar-c-search',
      )
    ">
    <ScalarIconMagnifyingGlass class="size-4" />
    <span class="flex-1 text-left leading-none">
      <slot>Search...</slot>
    </span>
    <span
      v-if="$slots.shortcut"
      class="uppercase text-sidebar-c-2 bg-b-2 py-0.75 px-1.25 rounded">
      <span class="sr-only">Keyboard Shortcut:</span>
      <kbd>
        <slot name="shortcut" />
      </kbd>
    </span>
  </button>
</template>
