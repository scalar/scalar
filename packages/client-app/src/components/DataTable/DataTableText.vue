<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
  }>(),
  {},
)
</script>
<template>
  <DataTableCell class="relative flex">
    <div
      v-if="$slots.default"
      class="text-c-2 flex items-center pl-2 pr-0 min-w-[100px] border-r">
      <slot />
    </div>
    <span
      v-bind="$attrs"
      autocomplete="off"
      class="text-c-2 focus:text-c-1 min-w-0 flex-1 px-2 py-[5.75px] whitespace-nowrap">
      {{ modelValue }}
    </span>
  </DataTableCell>
</template>
