<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { ref } from 'vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })

/** Expose the popover button so we can close the popup */
const popoverButtonRef = ref<typeof PopoverButton | null>(null)

/** Open the popover of the up or down arrows are pressed */
const handleKeydown = (e: KeyboardEvent) => {
  if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  e.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
}

defineExpose({ popoverButtonRef })
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :target="target"
      :teleport="teleport">
      <PopoverButton
        ref="popoverButtonRef"
        as="template"
        @keydown="handleKeydown">
        <slot />
      </PopoverButton>
      <template #floating="{ width }">
        <PopoverPanel
          v-slot="{ close }"
          class="relative flex w-40 flex-col rounded border text-sm"
          focus
          :style="{ width }"
          v-bind="$attrs">
          <slot
            :close="close"
            name="popover"
            :open="open" />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-md brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
