<script setup lang="ts">
import { useBindCx } from '@scalar/components'

defineProps<{
  columns: (string | undefined)[]
  /** Scroll horizontally */
  scroll?: boolean
  /** Presentational table */
  presentational?: boolean
}>()
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        scroll ? 'overflow-x-auto custom-scroll' : 'overflow-visible',
        'scalar-data-table',
      )
    ">
    <table
      class="mb-0 grid min-h-8 auto-rows-auto"
      :class="{ 'w-max min-w-full': scroll }"
      :role="presentational ? 'presentation' : 'table'"
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
