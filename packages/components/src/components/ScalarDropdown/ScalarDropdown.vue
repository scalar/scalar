<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import type { Slot } from 'vue'

import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'

defineProps<ScalarFloatingOptions>()

defineSlots<{
  /** The reference element for the element in the #floating slot */
  default(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): Slot
  /** The list of dropdown items */
  items(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): Slot
}>()

defineOptions({ inheritAttrs: false })
</script>
<template>
  <Menu v-slot="{ open }">
    <ScalarFloating
      :middleware="middleware"
      :placement="placement ?? 'bottom-start'"
      :resize="resize"
      :target="target"
      :teleport="teleport">
      <MenuButton as="template">
        <slot :open="open" />
      </MenuButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <MenuItems
          v-bind="$attrs"
          class="relative flex max-h-[inherit] w-56 rounded border"
          :style="{ width }">
          <!-- Scroll container -->
          <div class="custom-scroll min-h-0 flex-1">
            <!-- Menu items -->
            <div
              class="flex flex-col p-0.75"
              :style="{ width }">
              <slot
                name="items"
                :open="open" />
            </div>
            <div
              class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
          </div>
        </MenuItems>
      </template>
    </ScalarFloating>
  </Menu>
</template>
