<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })
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
      <PopoverButton as="template">
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
