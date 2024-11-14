<script setup lang="ts">
import { type FloatingOptions, ScalarPopover } from '../../'
import ScalarMenuButton from './ScalarMenuButton.vue'
import ScalarMenuProducts from './ScalarMenuProducts.vue'
import ScalarMenuResources from './ScalarMenuResources.vue'

defineProps<Pick<FloatingOptions, 'placement' | 'teleport'>>()
</script>
<template>
  <ScalarPopover
    class="max-h-[inherit] w-[420px] max-w-[inherit]"
    :placement="placement ?? 'bottom-start'"
    :teleport="teleport">
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
      <div class="custom-scroll flex flex-col gap-3 p-3 sm:gap-5 sm:p-4">
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
