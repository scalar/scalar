<script setup lang="ts">
import type { ScalarFloatingOptions } from '../ScalarFloating'
import { ScalarPopover } from '../ScalarPopover'
import ScalarMenuButton from './ScalarMenuButton.vue'
import ScalarMenuProducts from './ScalarMenuProducts.vue'
import ScalarMenuResources from './ScalarMenuResources.vue'

defineProps<ScalarFloatingOptions>()

type ButtonSlotProps = { open: boolean }
type MenuSlotProps = { close: () => void }

defineSlots<{
  /** Overrides the menu button */
  button?: (p: ButtonSlotProps) => any
  /** Overrides the logo in the menu button */
  logo?: () => any
  /** Overrides the label in the menu button */
  label?: () => any
  /** Overrides the products list */
  products?: (p: MenuSlotProps) => any
  /** Adds items the profile section (e.g. a team picker) */
  profile?: (p: MenuSlotProps) => any
  /** Overrides the resources section */
  sections?: (p: MenuSlotProps) => any
}>()
</script>
<template>
  <ScalarPopover
    v-bind="$props"
    class="max-h-[inherit] w-[280px] max-w-[inherit]">
    <!-- Logo Button to open the popover -->
    <template #default="{ open }">
      <slot
        name="button"
        :open="open">
        <ScalarMenuButton :open="open">
          <template v-if="$slots.logo">
            <slot name="logo" />
          </template>
          <template
            v-if="$slots.label"
            #label>
            <slot name="label" />
          </template>
        </ScalarMenuButton>
      </slot>
    </template>
    <!-- Popover content -->
    <template #popover="{ close }">
      <div class="custom-scroll flex flex-col gap-3 p-2.25 sm:gap-3">
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
      </div>
    </template>
  </ScalarPopover>
</template>
