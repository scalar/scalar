<script setup lang="ts">
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    role="search"
    type="button"
    v-bind="
      cx(
        'flex items-center rounded text-base h-8 gap-1 pl-2 pr-1 hover:bg-b-2',
        'bg-sidebar-b-search text-sidebar-c-search',
      )
    ">
    <ScalarIconMagnifyingGlass class="size-4" />
    <span class="flex-1 text-left leading-none">
      <slot>Search...</slot>
    </span>
  </button>
</template>
