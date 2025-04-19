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
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { ScalarFloating, type ScalarFloatingOptions } from '../ScalarFloating'
import ScalarDropdownMenu from './ScalarDropdownMenu.vue'

defineProps<ScalarFloatingOptions>()

defineSlots<{
  /** The reference element for the element in the #floating slot */
  default(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): any
  /** The list of dropdown items */
  items(props: {
    /** Whether or not the dropdown is open */
    open: boolean
  }): any
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <Menu v-slot="{ open }">
    <ScalarFloating
      v-bind="$props"
      :placement="placement ?? 'bottom-start'">
      <MenuButton as="template">
        <slot :open="open" />
      </MenuButton>
      <template #floating="{ width }">
        <!-- Background container -->
        <ScalarDropdownMenu
          :is="MenuItems"
          :style="{ width }"
          v-bind="cx('max-h-[inherit]')">
          <slot
            name="items"
            :open="open" />
        </ScalarDropdownMenu>
      </template>
    </ScalarFloating>
  </Menu>
</template>
