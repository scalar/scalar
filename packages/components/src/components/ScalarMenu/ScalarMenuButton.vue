<script setup lang="ts">
import { ScalarHeaderButton } from '../ScalarHeader'
import { ScalarIcon } from '../ScalarIcon'

defineProps<{
  open?: boolean
}>()
</script>
<template>
  <ScalarHeaderButton>
    <div class="h-5 w-auto">
      <slot><ScalarIcon icon="Logo" /></slot>
    </div>
    <span class="sr-only">
      <slot name="label">{{ open ? 'Close Menu' : 'Open Menu' }}</slot>
    </span>
    <ScalarIcon
      class="text-c-3 group-hover/button:text-c-1"
      :icon="open ? 'ChevronUp' : 'ChevronDown'"
      size="sm" />
  </ScalarHeaderButton>
</template>
