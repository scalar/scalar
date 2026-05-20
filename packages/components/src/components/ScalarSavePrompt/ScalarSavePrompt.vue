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
import type { LoadingState } from '../ScalarLoading'

defineProps<{
  loader?: LoadingState
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'discard'): void
}>()

const dirty = defineModel<boolean>({ default: false })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <Transition
    enterActiveClass="transition-transform ease-spring duration-400"
    enterFromClass="translate-y-[200%]"
    enterToClass="translate-y-0"
    leaveActiveClass="transition-transform ease-in duration-100"
    leaveFromClass="translate-y-0"
    leaveToClass="translate-y-[200%]">
    <div
      v-if="dirty || loader?.isActive"
      aria-live="polite"
      v-bind="
        cx(
          'flex items-center gap-2',
          'w-content max-w-screen-padded-4 z-context',
          'fixed left-1/2 -translate-x-1/2 bottom-4',
          'bg-b-2 p-4 shadow-lg rounded-xl',
        )
      ">
      <div class="min-w-0 flex-1 text-c-1 text-base font-medium">
        <slot>You have unsaved changes</slot>
      </div>
      <div class="flex -m-2 shrink-0">
        <ScalarButton
          size="sm"
          variant="ghost"
          @click="emit('discard')">
          <template #icon>
            <ScalarIconArrowCounterClockwise
              class="size-full"
              weight="bold" />
          </template>
          <slot name="discard">Undo</slot>
        </ScalarButton>
        <ScalarButton
          :loader
          size="sm"
          @click="emit('save')">
          <template #icon>
            <ScalarIconFloppyDisk
              class="size-full"
              weight="bold" />
          </template>
          <slot name="save">Save</slot>
        </ScalarButton>
      </div>
    </div>
  </Transition>
</template>
