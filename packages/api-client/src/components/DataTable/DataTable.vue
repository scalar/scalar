<script setup lang="ts">
import { useBindCx } from '@scalar/components'

defineProps<{
  columns: (string | undefined)[]
  /** Scroll horizontally */
  scroll?: boolean
}>()
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        scroll ? 'overflow-x-auto custom-scroll' : 'overflow-visible',
        'scalar-data-table bg-b-1',
      )
    ">
    <table
      class="grid auto-rows-auto min-h-8 mb-0"
      :class="{ 'min-w-full w-max': scroll }"
      :style="{
        gridTemplateColumns: columns.map((col) => col || '1fr').join(' '),
      }">
      <caption
        v-if="$slots.caption"
        class="sr-only">
        <slot name="caption" />
      </caption>
      <slot />
    </table>
  </div>
</template>
