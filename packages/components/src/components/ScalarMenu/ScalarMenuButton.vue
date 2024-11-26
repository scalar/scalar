<script setup lang="ts">
import { ScalarIcon } from '../../'

defineProps<{
  open?: boolean
}>()
</script>
<template>
  <button
    class="group/button flex items-center gap-1 rounded bg-transparent px-2.5 py-2 hover:bg-b-2"
    type="button">
    <div class="h-5 w-auto">
      <slot><ScalarIcon icon="Logo" /></slot>
    </div>
    <span class="sr-only">
      <slot name="label">{{ open ? 'Close Menu' : 'Open Menu' }}</slot>
    </span>
    <ScalarIcon
      class="text-c-3 group-hover/button:text-c-1"
      :icon="open ? 'ChevronUp' : 'ChevronDown'"
      size="sm"
      thickness="2.5" />
  </button>
</template>
