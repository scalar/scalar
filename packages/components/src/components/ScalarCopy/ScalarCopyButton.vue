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
        'group/copy-button relative flex items-center justify-center bg-b-1',
        'size-6 p-1.25 -m-1 rounded text-xs',
        copied ? 'text-c-1' : 'text-c-2 hover:text-c-1',
      )
    ">
    <Transition
      mode="out-in"
      enter-active-class="transition-transform"
      enter-from-class="scale-0"
      enter-to-class="scale-100"
      leave-active-class="transition-transform"
      leave-from-class="scale-100"
      leave-to-class="scale-0">
      <component
        :is="icon"
        class="size-full" />
    </Transition>
    <div
      class="group/copy-label absolute flex items-center -inset-y-0.5 bg-inherit rounded"
      :class="{
        'left-full pr-3 mask-r-from-[calc(100%-12px)]': placement === 'right',
        'right-full pl-3 mask-l-from-[calc(100%-12px)]': placement === 'left',
      }">
      <div
        class="flex items-center py-1.5 mask-y-from-[calc(100%-8px)] mask-y-to-100%">
        <Transition
          mode="out-in"
          enter-active-class="transition-transform ease-out"
          enter-from-class="translate-y-1.5"
          enter-to-class="translate-y-0"
          leave-active-class="transition-transform ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="-translate-y-1.5">
          <div
            v-if="copied"
            role="alert"
            class="whitespace-nowrap">
            <slot name="copied">Copied</slot>
          </div>
          <div
            v-else
            class="whitespace-nowrap!"
            :class="{
              'group-hover/copy-button:not-sr-only group-focus-visible/copy-button:not-sr-only sr-only':
                !showLabel && !copied,
            }">
            <slot name="copy">Copy</slot>
          </div>
        </Transition>
      </div>
    </div>
  </button>
</template>
