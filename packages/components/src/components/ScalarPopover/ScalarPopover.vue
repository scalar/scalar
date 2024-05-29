<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

// eslint-disable-next-line vue/no-unused-properties
defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Popover>
    <ScalarFloating v-bind="$props">
      <PopoverButton as="template">
        <slot />
      </PopoverButton>
      <template #floating="{ width, height }">
        <PopoverPanel
          class="relative flex flex-col p-0.75"
          :style="{ width, height }"
          v-bind="$attrs">
          <slot name="popover" />
          <div
            class="absolute inset-0 -z-1 rounded bg-back-1 shadow-md brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
