<script setup lang="ts">
import { DropdownMenu } from 'radix-vue/namespaced'
import { ref } from 'vue'

import { ScalarDropdownMenu } from '../ScalarDropdown'
import ScalarMenuButton from './ScalarMenuButton.vue'
import ScalarMenuProducts from './ScalarMenuProducts.vue'
import ScalarMenuResources from './ScalarMenuResources.vue'
import type {
  ScalarMenuButtonProps,
  ScalarMenuButtonSlots,
  ScalarMenuSlotProps,
} from './types'

defineSlots<
  {
    /** Overrides the entire menu button */
    button?(p: ScalarMenuButtonProps): unknown
    /** Overrides the products list */
    products?(p: ScalarMenuSlotProps): unknown
    /** Adds items the profile section (e.g. a team picker) */
    profile?(p: ScalarMenuSlotProps): unknown
    /** Overrides the resources section */
    sections?(p: ScalarMenuSlotProps): unknown
  } & ScalarMenuButtonSlots
>()

defineOptions({ inheritAttrs: false })

/** Whether the menu is open */
const open = ref(false)

/** Close the menu */
function close() {
  open.value = false
}
</script>
<template>
  <DropdownMenu.Root v-model:open="open">
    <DropdownMenu.Trigger asChild>
      <!-- Logo Button to open the popover -->
      <slot
        name="button"
        :open="open">
        <ScalarMenuButton
          class="min-w-0"
          :open="open">
          <template
            v-if="$slots.logo"
            #logo>
            <slot name="logo" />
          </template>
          <template
            v-if="$slots.label"
            #label>
            <slot name="label" />
          </template>
        </ScalarMenuButton>
      </slot>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      align="start"
      :as="ScalarDropdownMenu"
      class="max-h-radix-popper z-context"
      :sideOffset="5"
      v-bind="$attrs">
      <!-- Menu content -->
      <!-- Base Product List (can be overridden by slot) -->
      <slot
        :close="close"
        name="products">
        <ScalarMenuProducts />
      </slot>
      <slot
        :close="close"
        name="profile" />
      <slot
        :close="close"
        name="sections">
        <ScalarMenuResources />
      </slot>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</template>
