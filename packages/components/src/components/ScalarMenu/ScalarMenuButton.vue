<script setup lang="ts">
import { ScalarHeaderButton } from '../ScalarHeader'
import { ScalarIcon } from '../ScalarIcon'

defineProps<{
  open?: boolean
}>()
</script>
<template>
  <ScalarHeaderButton class="gap-0.5 px-2">
    <div class="size-5">
      <slot><ScalarIcon icon="Logo" /></slot>
    </div>
    <span class="sr-only">
      <slot name="label">{{ open ? 'Close Menu' : 'Open Menu' }}</slot>
    </span>
    <ScalarIcon
      class="text-c-3 group-hover/button:text-c-1"
      :icon="open ? 'ChevronUp' : 'ChevronDown'"
      size="md" />
  </ScalarHeaderButton>
</template>
