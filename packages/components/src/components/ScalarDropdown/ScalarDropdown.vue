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
      :targetRef="targetRef"
      :teleport="teleport">
      <MenuButton
        v-if="!static"
        as="template">
        <slot />
      </MenuButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <div
          v-bind="$attrs"
          class="relative flex max-h-[inherit] w-56 rounded border"
          :style="{ width }">
          <!-- Scroll container -->
          <div class="custom-scroll min-h-0 flex-1">
            <!-- Menu items -->
            <MenuItems
              class="flex flex-col p-0.75"
              v-bind="$attrs"
              :static="static"
              :style="{ width }">
              <slot name="items" />
            </MenuItems>
            <div
              class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
          </div>
        </div>
      </template>
    </ScalarFloating>
  </Menu>
</template>
