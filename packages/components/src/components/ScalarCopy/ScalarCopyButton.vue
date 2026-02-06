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
  placement?: ScalarCopyPlacement
}>()

defineSlots<ScalarCopySlots>()

/** Whether the copy button has been clicked */
const copied = defineModel<boolean>('copied', { default: false })

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
        'group relative flex items-center justify-center',
        'size-6 p-1.25 -m-1 rounded',
        'font-medium text-xs',
        copied ? 'text-c-1 bg-b-2' : 'text-c-2 hover:text-c-1 hover:bg-b-2',
      )
    ">
    <Transition
      mode="out-in"
      enter-active-class="transition-transform"
      enter-from-class="scale-0"
      enter-to-class="scale3100"
      leave-active-class="transition-transform"
      leave-from-class="scale-100"
      leave-to-class="scale-0">
      <component
        :is="icon"
        class="size-full" />
    </Transition>
    <div
      class="absolute -inset-y-1 px-1.5 p-1 flex items-center mask-y-from-70% mask-y-to-90%"
      :class="{
        'left-full': placement === 'right',
        'right-full': placement === 'left',
      }">
      <Transition
        mode="out-in"
        enter-active-class="transition-transform ease-out"
        enter-from-class="translate-y-4"
        enter-to-class="translate-y-0"
        leave-active-class="transition-transform ease-in"
        leave-from-class="translate-y-0"
        leave-to-class="-translate-y-4">
        <div
          v-if="copied"
          role="alert"
          class="whitespace-nowrap">
          <slot name="copied">Copied to clipboard</slot>
        </div>
        <div
          v-else
          class="whitespace-nowrap!"
          :class="{
            'group-hover:not-sr-only group-focus-visible:not-sr-only sr-only':
              !copied,
          }">
          <slot name="copy">Copy to clipboard</slot>
        </div>
      </Transition>
    </div>
  </button>
</template>
