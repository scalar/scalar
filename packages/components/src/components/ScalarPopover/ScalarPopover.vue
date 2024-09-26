<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

// eslint-disable-next-line vue/no-unused-properties
defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating
      v-bind="$props"
      :isOpen="open ?? isOpen"
      :teleport="teleport">
      <PopoverButton as="template">
        <slot />
      </PopoverButton>
      <template #floating="{ width, height }">
        <PopoverPanel
          v-slot="{ close }"
          class="relative flex flex-col p-0.75"
          :style="{ width, height }"
          v-bind="$attrs">
          <slot
            :close="() => close()"
            name="popover" />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
