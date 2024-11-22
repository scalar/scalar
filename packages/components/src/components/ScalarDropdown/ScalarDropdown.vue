<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'

import { type FloatingOptions, ScalarFloating } from '../ScalarFloating'

withDefaults(
  defineProps<
    Omit<FloatingOptions, 'middleware'> & {
      static?: boolean
      staticOpen?: boolean
    }
  >(),
  { static: false, staticOpen: true },
)

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Menu v-slot="{ open }">
    <ScalarFloating
      :isOpen="static ? staticOpen : (open ?? isOpen)"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :target="target"
      :teleport="teleport">
      <MenuButton
        v-if="!static"
        as="template">
        <slot :open="open" />
      </MenuButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <MenuItems
          v-bind="$attrs"
          class="relative flex max-h-[inherit] w-56 rounded border"
          :static="static"
          :style="{ width }">
          <!-- Scroll container -->
          <div class="custom-scroll min-h-0 flex-1">
            <!-- Menu items -->
            <div
              class="flex flex-col p-0.75"
              :style="{ width }">
              <slot name="items" />
            </div>
            <div
              class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
          </div>
        </MenuItems>
      </template>
    </ScalarFloating>
  </Menu>
</template>
