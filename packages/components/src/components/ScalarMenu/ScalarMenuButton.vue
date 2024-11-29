<script setup lang="ts">
import { ScalarIcon } from '../../'
import { useBindCx } from '../../hooks/useBindCx'

defineProps<{
  open?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <button
    class=""
    type="button"
    v-bind="
      cx(
        'group/button flex items-center gap-1 rounded bg-transparent px-2.5 py-2 hover:bg-b-2',
      )
    ">
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
  </button>
</template>
