<script setup lang="ts">
import { type Icon, ScalarIcon } from '../../'

defineProps<{
  selected?: boolean
  icon: Icon
}>()
</script>
<template>
  <a
    class="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded border p-3 leading no-underline xs:flex-row"
    :class="
      selected
        ? 'pointer-events-none border-c-1 bg-b-2'
        : 'cursor-pointer bg-b-1 hover:bg-b-2'
    "
    target="_blank">
    <ScalarIcon
      :icon="icon"
      size="xs"
      thickness="2.5" />
    <span class="font-bold"><slot /></span>
  </a>
</template>
