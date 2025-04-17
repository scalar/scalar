<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { ref } from 'vue'

import {
  ScalarFloating,
  ScalarFloatingBackdrop,
  type ScalarFloatingOptions,
} from '../ScalarFloating'
import type { ScalarPopoverSlots } from '../ScalarPopover'

defineProps<ScalarFloatingOptions>()

defineSlots<ScalarPopoverSlots>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

/** Expose the popover button so we can close the popup */
const popoverButtonRef = ref<typeof PopoverButton | null>(null)

/** Open the popover of the up or down arrows are pressed */
const handleKeydown = (e: KeyboardEvent) => {
  if (!['ArrowUp', 'ArrowDown'].includes(e.key)) {
    return
  }
  e.preventDefault()
  e.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
}

defineExpose({ popoverButtonRef })
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating v-bind="$props">
      <PopoverButton
        ref="popoverButtonRef"
        as="template"
        @keydown="handleKeydown">
        <slot :open="open" />
      </PopoverButton>
      <template
        v-if="open"
        #floating="{ width }">
        <PopoverPanel
          v-slot="{ close }"
          focus
          :style="{ width }"
          v-bind="
            cx('relative flex flex-col max-h-[inherit] w-40 rounded text-sm')
          ">
          <slot
            :close="close"
            name="popover"
            :open="open" />
          <ScalarFloatingBackdrop />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
