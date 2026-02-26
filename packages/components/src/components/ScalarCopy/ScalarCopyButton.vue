<script lang="ts">
/**
 * Scalar Copy Button component
 *
 * A dumb button with copy animations.
 *
 * If you're looking for a button that copies content to the clipboard,
 * use the ScalarCopy component instead.
 *
 * @example
 *   <ScalarCopyButton @click="handleCopy">
 *     <template #copy>Button label</template>
 *     <template #copied>Copied label</template>
 *   </ScalarCopyButton>
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import type { ScalarIconComponent } from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import ScalarCopyBackdrop from './ScalarCopyBackdrop.vue'
import type { ScalarCopyPlacement, ScalarCopySlots } from './types'

const { placement = 'right' } = defineProps<{
  /** Whether the label should be shown on hover or always */
  showLabel?: boolean
  /** The placement of the copy button */
  placement?: ScalarCopyPlacement
}>()

defineSlots<ScalarCopySlots>()

/** Whether the copy button has been clicked */
const copied = defineModel<boolean>('copied', { default: false })

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

const icon = computed<ScalarIconComponent>(() => {
  return copied.value ? ScalarIconCheck : ScalarIconCopy
})
</script>
<template>
  <button
    type="button"
    v-bind="
      cx(
        'group/copy-button relative z-0 flex items-center justify-center',
        'size-6 p-1.25 -m-1 rounded text-xs bg-b-2',
        copied ? 'text-c-1' : 'text-c-2 hover:text-c-1',
      )
    ">
    <Transition
      enterActiveClass="transition-transform"
      enterFromClass="scale-0"
      enterToClass="scale-100"
      leaveActiveClass="transition-transform"
      leaveFromClass="scale-100"
      leaveToClass="scale-0"
      mode="out-in">
      <component
        :is="icon"
        class="size-full" />
    </Transition>
    <div class="bg-inherit rounded-[inherit] absolute inset-0 -z-1" />
    <div
      class="group/copy-label absolute flex items-center -inset-y-0.5 rounded"
      :class="{
        'left-0 pl-[100%]': placement === 'right',
        'right-0 pr-[100%]': placement === 'left',
      }">
      <div
        aria-hidden="true"
        class="flex items-center py-1.5 mask-y-from-[calc(100%-8px)] mask-y-to-100%">
        <Transition
          enterActiveClass="transition-transform ease-out"
          enterFromClass="translate-y-1.5"
          enterToClass="translate-y-0"
          leaveActiveClass="transition-transform ease-in"
          leaveFromClass="translate-y-0"
          leaveToClass="-translate-y-1.5"
          mode="out-in">
          <div
            v-if="copied"
            class="whitespace-nowrap px-1.5">
            <slot name="copied">Copied</slot>
          </div>
          <div
            v-else
            class="whitespace-nowrap px-1.5"
            :class="{
              'group-hocus/copy-button:block hidden': !showLabel && !copied,
            }">
            <slot name="copy">Copy</slot>
          </div>
        </Transition>
      </div>
      <div
        v-if="copied"
        class="sr-only"
        role="alert">
        <slot name="copied">Copied</slot>
      </div>
      <div
        v-else
        class="sr-only">
        <slot name="copy">Copy</slot>
      </div>
      <slot name="backdrop">
        <ScalarCopyBackdrop />
      </slot>
    </div>
  </button>
</template>
