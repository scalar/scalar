<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'
import type { Slots } from './types'

defineProps<ScalarFloatingOptions>()

defineSlots<Slots>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Popover
    v-slot="{ open }"
    as="template">
    <ScalarFloating v-bind="$props">
      <PopoverButton as="template">
        <slot :open="open" />
      </PopoverButton>
      <template #floating="{ width, height }">
        <PopoverPanel
          v-slot="{ close }"
          class="relative flex flex-col p-0.75"
          :style="{ width, height }"
          v-bind="$attrs">
          <slot
            :close="() => close()"
            name="popover"
            :open="open" />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
        </PopoverPanel>
      </template>
    </ScalarFloating>
  </Popover>
</template>
