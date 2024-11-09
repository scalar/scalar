<script setup lang="ts">
import { ScalarIcon, ScalarPopover } from '../../'
import ScalarMenuProducts from './ScalarMenuProducts.vue'
import ScalarMenuResources from './ScalarMenuResources.vue'
</script>
<template>
  <ScalarPopover :placement="'bottom-start'">
    <!-- Logo Button to open the popover -->
    <template #default="{ open }">
      <button
        class="group/button -m-1 flex items-center gap-1 rounded bg-transparent px-2.5 py-2 hover:bg-b-2"
        type="button">
        <div class="size-5">
          <slot name="logo"><ScalarIcon icon="Logo" /></slot>
        </div>
        <ScalarIcon
          class="text-c-3 group-hover/button:text-c-1"
          :icon="open ? 'ChevronUp' : 'ChevronDown'"
          size="sm"
          thickness="2.5" />
      </button>
    </template>
    <!-- Popover content -->
    <template #popover="{ close }">
      <div
        class="custom-scroll flex max-h-[calc(100svh-60px)] w-[420px] max-w-[calc(100svw-24px)] flex-col gap-5 px-4 py-4">
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
