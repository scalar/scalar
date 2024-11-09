<script setup lang="ts">
import { type Icon, ScalarIcon } from '../../'

defineProps<{
  selected?: boolean
  icon: Icon
}>()
</script>
<template>
  <a
    class="relative flex flex-1 items-center justify-center gap-1 rounded border p-3 leading no-underline"
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
