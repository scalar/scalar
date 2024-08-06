<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

withDefaults(
  defineProps<Omit<FloatingOptions, 'middleware'> & { static?: boolean }>(),
  { static: false },
)

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Menu v-slot="{ open }">
    <ScalarFloating
      :isOpen="static ? true : open ?? isOpen"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :teleport="teleport">
      <MenuButton
        v-if="!static"
        as="template">
        <slot />
      </MenuButton>
      <template #floating="{ width }">
        <MenuItems
          class="relative flex w-56 flex-col p-0.75"
          v-bind="$attrs"
          :static="static"
          :style="{ width }">
          <slot name="items" />
          <div
            class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
        </MenuItems>
      </template>
    </ScalarFloating>
  </Menu>
</template>
