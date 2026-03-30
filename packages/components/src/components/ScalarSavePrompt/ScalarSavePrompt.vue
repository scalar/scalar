<script lang="ts">
/**
 * Scalar save prompt
 *
 * Placeholder shell — wire layout, modal, and actions in the host.
 */
export default {}
</script>
<script setup lang="ts">
import {
  ScalarIconArrowCounterClockwise,
  ScalarIconFloppyDisk,
} from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarButton } from '../ScalarButton'

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'discard'): void
}>()

const dirty = defineModel<boolean>({ default: false })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-if="dirty"
    v-bind="
      cx(
        'flex items-center gap-2',
        'w-full max-w-content  z-context',
        'fixed left-1/2 -translate-x-1/2 bottom-4',
        'dark-mode bg-b-1 p-4 shadow-lg rounded-xl',
      )
    ">
    <div class="min-w-0 flex-1 text-c-1 font-medium">
      <slot>You have unsaved changes</slot>
    </div>
    <div class="flex -m-2">
      <ScalarButton
        size="sm"
        variant="ghost"
        @click="emit('discard')">
        <ScalarIconArrowCounterClockwise
          class="size-3.5 mr-1"
          weight="bold" />
        <slot name="discard">Undo</slot>
      </ScalarButton>
      <ScalarButton
        size="sm"
        @click="emit('save')">
        <ScalarIconFloppyDisk
          class="size-3.5 mr-1"
          weight="bold" />
        <slot name="save">Save</slot>
      </ScalarButton>
    </div>
  </div>
</template>
