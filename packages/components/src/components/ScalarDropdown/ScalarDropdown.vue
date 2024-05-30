<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

defineProps<Omit<FloatingOptions, 'middleware'>>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Menu>
    <ScalarFloating
      :placement="placement ?? 'bottom-start'"
      :resize="resize">
      <MenuButton as="template">
        <slot />
      </MenuButton>
      <template #floating="{ width }">
        <MenuItems
          class="relative flex w-56 flex-col p-0.75"
          :style="{ width }"
          v-bind="$attrs">
          <slot name="items" />
          <div
            class="absolute inset-0 -z-1 rounded bg-back-1 shadow-md brightness-lifted" />
        </MenuItems>
      </template>
    </ScalarFloating>
  </Menu>
</template>
