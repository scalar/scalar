<script lang="ts">
/**
 * Scalar dropdown component
 *
 * Uses the headlessui Menu component under the hood
 * @see https://headlessui.com/v1/vue/menu
 *
 * @example
 * <ScalarDropdown>
 *   <ScalarButton>Click Me</ScalarButton>
 *   <template #items>
 *     <ScalarDropdownItem>Item 1</ScalarDropdownItem>
 *     <ScalarDropdownItem>Item 2</ScalarDropdownItem>
 *   </template>
 * </ScalarDropdown>
 */
export default {}
</script>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import type { Slot } from 'vue'

import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'
import ScalarDropdownMenu from './ScalarDropdownMenu.vue'

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
        <ScalarDropdownMenu
          :is="MenuItems"
          v-bind="$attrs"
          class="max-h-[inherit]"
          :style="{ width }">
          <slot
            name="items"
            :open="open" />
        </ScalarDropdownMenu>
      </template>
    </ScalarFloating>
  </Menu>
</template>
