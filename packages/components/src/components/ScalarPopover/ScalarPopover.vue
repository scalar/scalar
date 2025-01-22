<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

import { useBindCx } from '../../hooks/useBindCx'
import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'
import type { Slots } from './types'

defineProps<ScalarFloatingOptions>()

defineSlots<Slots>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
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
          :middleware="middleware"
          :style="{ width, height }"
          v-bind="cx('relative flex flex-col p-0.75')">
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
