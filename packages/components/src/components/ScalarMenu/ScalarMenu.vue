<script setup lang="ts">
import type { ScalarFloatingOptions } from '../ScalarFloating'
import { ScalarPopover } from '../ScalarPopover'
import ScalarMenuButton from './ScalarMenuButton.vue'
import ScalarMenuProducts from './ScalarMenuProducts.vue'
import ScalarMenuResources from './ScalarMenuResources.vue'
import type {
  ScalarMenuButtonProps,
  ScalarMenuButtonSlots,
  ScalarMenuSlotProps,
} from './types'

defineProps<ScalarFloatingOptions>()

defineSlots<
  {
    /** Overrides the entire menu button */
    button?: (p: ScalarMenuButtonProps) => any
    /** Overrides the products list */
    products?: (p: ScalarMenuSlotProps) => any
    /** Adds items the profile section (e.g. a team picker) */
    profile?: (p: ScalarMenuSlotProps) => any
    /** Overrides the resources section */
    sections?: (p: ScalarMenuSlotProps) => any
  } & ScalarMenuButtonSlots
>()
</script>
<template>
  <ScalarPopover
    v-bind="$props"
    class="max-h-[inherit] w-[280px] max-w-[inherit]"
    :placement="placement ?? 'bottom-start'">
    <!-- Logo Button to open the popover -->
    <template #default="{ open }">
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
          <template
            v-if="$slots['sr-label']"
            #sr-label>
            <slot name="sr-label" />
          </template>
        </ScalarMenuButton>
      </slot>
    </template>
    <!-- Popover content -->
    <template #popover="{ close }">
      <div class="custom-scroll flex flex-col gap-3 p-2.25">
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
