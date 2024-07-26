<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })

/** Open the popover of the up or down arrows are pressed */
function handleKeydown(e: KeyboardEvent) {
  if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return
  e.preventDefault()
  e.target?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
}
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating
      :isOpen="open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
      <PopoverButton
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
